import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity.js';

export enum ThesisStatus {
  ACTIVE   = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  RESOLVED = 'RESOLVED',
}

export enum ThesisVisibility {
  PUBLIC   = 'PUBLIC',
  PRIVATE  = 'PRIVATE',
  UNLISTED = 'UNLISTED',
}

@Entity('theses')
export class Thesis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_user_id' })
  ownerUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  summary: string | null;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ type: 'enum', enum: ThesisStatus, enumName: 'thesis_status', default: ThesisStatus.ACTIVE })
  status: ThesisStatus;

  @Column({ type: 'enum', enum: ThesisVisibility, enumName: 'thesis_visibility', default: ThesisVisibility.PRIVATE })
  visibility: ThesisVisibility;

  @Column({ name: 'current_confidence', type: 'numeric', precision: 5, scale: 2, default: 50 })
  currentConfidence: number;

  @Column({ name: 'confidence_rationale', nullable: true, type: 'text' })
  confidenceRationale: string | null;

  @Column({ name: 'author_stated_confidence', type: 'numeric', precision: 5, scale: 2, nullable: true })
  authorStatedConfidence: number | null;

  @Column({ name: 'ai_stated_confidence', type: 'numeric', precision: 5, scale: 2, nullable: true })
  aiStatedConfidence: number | null;

  @Column({ name: 'ai_stated_rationale', nullable: true, type: 'text' })
  aiStatedRationale: string | null;

  @Column({ name: 'relevance_score', type: 'smallint', nullable: true })
  relevanceScore: number | null;

  @Column({ name: 'original_author', type: 'varchar', nullable: true })
  originalAuthor: string | null;

  @Column({ name: 'original_source', type: 'varchar', nullable: true })
  originalSource: string | null;

  @Column({ name: 'monitoring_profile_id', type: 'uuid', nullable: true })
  monitoringProfileId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
