import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Thesis } from './thesis.entity.js';

export enum CriterionType {
  SUPPORT      = 'SUPPORT',
  FALSIFY      = 'FALSIFY',
  WATCH_SIGNAL = 'WATCH_SIGNAL',
}

export enum CriterionStatus {
  ACTIVE        = 'active',
  CONFIRMED     = 'confirmed',
  NOT_TRIGGERED = 'not_triggered',
  REMOVED       = 'removed',
}

@Entity('criteria')
export class Criterion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'logical_id' })
  logicalId: string;

  @Column({ name: 'thesis_id' })
  thesisId: string;

  @ManyToOne(() => Thesis, (t) => t.criteria, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thesis_id' })
  thesis: Thesis;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  rationale: string | null;

  @Column({ type: 'enum', enum: CriterionType, enumName: 'criterion_type' })
  type: CriterionType;

  @Column({ type: 'smallint', nullable: true })
  weight: number | null;

  @Column({ name: 'impact_if_confirmed', type: 'numeric', precision: 5, scale: 2, nullable: true })
  impactIfConfirmed: number | null;

  @Column({ name: 'current_fulfillment', type: 'numeric', precision: 5, scale: 2, default: 0 })
  currentFulfillment: number;

  @Column({
    type: 'enum',
    enum: CriterionStatus,
    enumName: 'criteria_status',
    default: CriterionStatus.ACTIVE,
  })
  status: CriterionStatus;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'retired_at', type: 'timestamptz', nullable: true })
  retiredAt: Date | null;

  @Column({ name: 'retired_reason', type: 'text', nullable: true })
  retiredReason: string | null;
}
