import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Thesis } from './thesis.entity.js';

@Entity('thesis_revisions')
export class ThesisRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'thesis_id' })
  thesisId: string;

  @ManyToOne(() => Thesis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thesis_id' })
  thesis: Thesis;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy: string | null;

  @Column({ type: 'jsonb' })
  changes: Record<string, { from: unknown; to: unknown }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
