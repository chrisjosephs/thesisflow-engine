import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Thesis } from './thesis.entity.js';
import { Criterion } from './criterion.entity.js';
import { Tag } from './tag.entity.js';
import { ThesisRevision } from './thesis-revision.entity.js';
import { ThesesController } from './theses.controller.js';
import { ThesesService } from './theses.service.js';
import { ThesisExpiryScheduler } from './thesis-expiry.scheduler.js';

@Module({
  imports: [TypeOrmModule.forFeature([Thesis, Criterion, Tag, ThesisRevision])],
  controllers: [ThesesController],
  providers: [ThesesService, ThesisExpiryScheduler],
})
export class ThesesModule {}
