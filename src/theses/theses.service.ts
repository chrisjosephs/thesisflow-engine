import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Thesis, ThesisVisibility } from './thesis.entity.js';
import { UserConfidenceSubmission } from './user-confidence-submission.entity.js';
import { CreateThesisDto } from './dto/create-thesis.dto.js';

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
    const thesis = await this.repo.findOne({
      where: { id },
      relations: { criteria: true, tags: true },
    });
    if (!thesis) throw new NotFoundException('Thesis not found');

    if (thesis.visibility === ThesisVisibility.PRIVATE) {
      if (!requestingUserId || thesis.ownerUserId !== requestingUserId) {
        throw new ForbiddenException('This thesis is private');
      }
    }

    return { ...thesis, community: await this.communityStats(id) };
  }

  create(dto: CreateThesisDto, ownerId: string): Promise<Thesis> {
    return this.repo.save(this.repo.create({ ...dto, ownerUserId: ownerId }));
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
