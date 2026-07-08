import { randomUUID } from 'node:crypto';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Thesis, ThesisStatus, ThesisVisibility } from './thesis.entity.js';
import { Criterion, CriterionStatus } from './criterion.entity.js';
import { Tag } from './tag.entity.js';
import { UserConfidenceSubmission } from './user-confidence-submission.entity.js';
import { CreateThesisDto } from './dto/create-thesis.dto.js';
import { CreateCriterionDto } from './dto/create-criterion.dto.js';

export interface CommunityConfidence {
  average: number | null;
  count: number;
  maybeStale: boolean;
}

@Injectable()
export class ThesesService {
  constructor(
    @InjectRepository(Thesis)
    private readonly repo: Repository<Thesis>,
    @InjectRepository(Criterion)
    private readonly criterionRepo: Repository<Criterion>,
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(UserConfidenceSubmission)
    private readonly submissionRepo: Repository<UserConfidenceSubmission>,
  ) {}

  // Decay parameters come from the thesis's monitoring profile — faster monitoring tempo
  // means faster decay, because new evidence is arriving more frequently.
  // Falls back to 30-day half-life / 90-day staleness if no profile is set.
  private async communityStats(thesisId: string): Promise<CommunityConfidence> {
    const raw = await this.submissionRepo.query(
      `
      WITH profile AS (
        SELECT
          COALESCE(mp.community_half_life_days, 30)  AS half_life_days,
          COALESCE(mp.community_stale_days,     90)  AS stale_days
        FROM theses t
        LEFT JOIN monitoring_profiles mp ON mp.id = t.monitoring_profile_id
        WHERE t.id = $1
      ),
      latest_per_user AS (
        SELECT DISTINCT ON (user_id)
          user_id, confidence, created_at
        FROM user_confidence_submissions
        WHERE thesis_id = $1
        ORDER BY user_id, created_at DESC
      ),
      weighted AS (
        SELECT
          s.confidence,
          POWER(2, -EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 86400.0 / p.half_life_days) AS w,
          s.created_at,
          p.stale_days
        FROM latest_per_user s, profile p
      )
      SELECT
        SUM(confidence * w) / NULLIF(SUM(w), 0)  AS weighted_avg,
        COUNT(*)                                   AS count,
        MAX(created_at)                            AS most_recent,
        MIN(stale_days)                            AS stale_days
      FROM weighted
      `,
      [thesisId],
    ) as { weighted_avg: string | null; count: string; most_recent: Date | null; stale_days: string | null }[];

    const row = raw[0];
    const average = row.weighted_avg != null ? parseFloat(row.weighted_avg) : null;
    const count = parseInt(row.count, 10);
    const staleDays = row.stale_days != null ? parseFloat(row.stale_days) : 90;

    const daysSinceLastVote = row.most_recent
      ? (Date.now() - new Date(row.most_recent).getTime()) / 86_400_000
      : Infinity;
    const maybeStale = count > 0 && daysSinceLastVote > staleDays;

    return { average, count, maybeStale };
  }

  private async assertThesisOwner(thesisId: string, userId: string): Promise<Thesis> {
    const thesis = await this.repo.findOne({ where: { id: thesisId } });
    if (!thesis) throw new NotFoundException('Thesis not found');
    if (thesis.ownerUserId !== userId) throw new ForbiddenException('Not your thesis');
    return thesis;
  }

  async findPublic(): Promise<(Thesis & { community: CommunityConfidence })[]> {
    const theses = await this.repo.find({
      where: { visibility: ThesisVisibility.PUBLIC },
      relations: { tags: true },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      theses.map(async (t) => ({ ...t, community: await this.communityStats(t.id) })),
    );
  }

  async findByOwner(userId: string): Promise<(Thesis & { community: CommunityConfidence })[]> {
    const theses = await this.repo.find({
      where: { ownerUserId: userId },
      relations: { tags: true },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      theses.map(async (t) => ({ ...t, community: await this.communityStats(t.id) })),
    );
  }

  async findOne(id: string, requestingUserId?: string): Promise<Thesis & { community: CommunityConfidence }> {
    // Join criteria with condition so only active (non-retired) versions are loaded.
    const thesis = await this.repo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.tags', 'tag')
      .leftJoinAndSelect('t.criteria', 'criterion', 'criterion.retired_at IS NULL')
      .where('t.id = :id', { id })
      .getOne();

    if (!thesis) throw new NotFoundException('Thesis not found');

    if (thesis.visibility === ThesisVisibility.PRIVATE) {
      if (!requestingUserId || thesis.ownerUserId !== requestingUserId) {
        throw new ForbiddenException('This thesis is private');
      }
    }

    return { ...thesis, community: await this.communityStats(id) };
  }

  async create(dto: CreateThesisDto, ownerId: string): Promise<Thesis> {
    const { criteria: criteriaDto = [], tags: tagNames = [], publish, monitoringProfileName, ...thesisData } = dto;

    let monitoringProfileId: string | null = null;
    if (monitoringProfileName) {
      const row = await this.repo.query(
        `SELECT id FROM monitoring_profiles WHERE name = $1 LIMIT 1`,
        [monitoringProfileName],
      ) as { id: string }[];
      monitoringProfileId = row[0]?.id ?? null;
    }

    const tags = await Promise.all(
      tagNames.map(async (raw) => {
        const name = raw.trim().toLowerCase();
        const existing = await this.tagRepo.findOne({ where: { name } });
        return existing ?? await this.tagRepo.save(this.tagRepo.create({ name }));
      }),
    );

    const thesis = await this.repo.save(
      this.repo.create({
        ...thesisData,
        ownerUserId: ownerId,
        status: publish ? ThesisStatus.ACTIVE : ThesisStatus.DRAFT,
        monitoringProfileId,
        tags,
      }),
    );

    if (criteriaDto.length > 0) {
      await this.criterionRepo.save(
        criteriaDto.map((c) => {
          const logicalId = randomUUID();
          return this.criterionRepo.create({ ...c, thesisId: thesis.id, logicalId });
        }),
      );
    }

    return this.repo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.tags', 'tag')
      .leftJoinAndSelect('t.criteria', 'criterion', 'criterion.retired_at IS NULL')
      .where('t.id = :id', { id: thesis.id })
      .getOneOrFail();
  }

  async addCriterion(thesisId: string, ownerId: string, dto: CreateCriterionDto): Promise<Criterion> {
    await this.assertThesisOwner(thesisId, ownerId);
    const logicalId = randomUUID();
    return this.criterionRepo.save(
      this.criterionRepo.create({ ...dto, thesisId, logicalId }),
    );
  }

  async editCriterion(
    thesisId: string,
    ownerId: string,
    logicalId: string,
    dto: CreateCriterionDto,
  ): Promise<Criterion> {
    await this.assertThesisOwner(thesisId, ownerId);

    const current = await this.criterionRepo.findOne({
      where: { thesisId, logicalId, retiredAt: IsNull() },
    });
    if (!current) throw new NotFoundException('Criterion not found');

    await this.criterionRepo.update(current.id, {
      retiredAt: new Date(),
      retiredReason: 'edited',
    });

    return this.criterionRepo.save(
      this.criterionRepo.create({ ...dto, thesisId, logicalId }),
    );
  }

  async retireCriterion(thesisId: string, ownerId: string, logicalId: string): Promise<void> {
    await this.assertThesisOwner(thesisId, ownerId);

    const current = await this.criterionRepo.findOne({
      where: { thesisId, logicalId, retiredAt: IsNull() },
    });
    if (!current) throw new NotFoundException('Criterion not found');

    await this.criterionRepo.update(current.id, {
      status: CriterionStatus.REMOVED,
      retiredAt: new Date(),
      retiredReason: 'removed',
    });
  }

  async triggerCriterion(
    thesisId: string,
    ownerId: string,
    logicalId: string,
    outcome: 'confirmed' | 'not_triggered',
  ): Promise<Criterion> {
    await this.assertThesisOwner(thesisId, ownerId);

    const current = await this.criterionRepo.findOne({
      where: { thesisId, logicalId, retiredAt: IsNull() },
    });
    if (!current) throw new NotFoundException('Criterion not found');

    const status = outcome === 'confirmed' ? CriterionStatus.CONFIRMED : CriterionStatus.NOT_TRIGGERED;
    await this.criterionRepo.update(current.id, {
      status,
      retiredAt: new Date(),
      retiredReason: 'triggered',
    });

    return this.criterionRepo.findOneOrFail({ where: { id: current.id } });
  }

  async getCriterionHistory(thesisId: string, logicalId: string): Promise<Criterion[]> {
    return this.criterionRepo.find({
      where: { thesisId, logicalId },
      order: { createdAt: 'ASC' },
    });
  }

  async addConfidence(
    thesisId: string,
    userId: string,
    confidence: number,
    rationale?: string,
  ): Promise<UserConfidenceSubmission> {
    const thesis = await this.repo.findOne({ where: { id: thesisId }, select: { id: true, currentConfidence: true } });
    if (!thesis) throw new NotFoundException('Thesis not found');

    return this.submissionRepo.save(
      this.submissionRepo.create({
        thesisId,
        userId,
        confidence,
        rationale: rationale ?? null,
        thesisConfidenceAtSubmission: Number(thesis.currentConfidence),
      }),
    );
  }
}
