import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Thesis, ThesisStatus } from './thesis.entity.js';

@Injectable()
export class ThesisExpiryScheduler {
  private readonly logger = new Logger(ThesisExpiryScheduler.name);

  constructor(
    @InjectRepository(Thesis)
    private readonly thesisRepo: Repository<Thesis>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async resolveExpiredTheses(): Promise<void> {
    const now = new Date();

    const result = await this.thesisRepo
      .createQueryBuilder()
      .update(Thesis)
      .set({ status: ThesisStatus.RESOLVED })
      .where('status = :status', { status: ThesisStatus.ACTIVE })
      .andWhere('expires_at IS NOT NULL')
      .andWhere('expires_at <= :now', { now })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Resolved ${result.affected} expired thesis/theses`);
    }
  }
}
