import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Thesis } from './thesis.entity.js';

@Entity('user_confidence_submissions')
export class UserConfidenceSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'thesis_id' })
  thesisId: string;

  @ManyToOne(() => Thesis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thesis_id' })
  thesis: Thesis;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  confidence: number;

  @Column({ type: 'text', nullable: true })
  rationale: string | null;

  @Column({ name: 'thesis_confidence_at_submission', type: 'numeric', precision: 5, scale: 2 })
  thesisConfidenceAtSubmission: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
