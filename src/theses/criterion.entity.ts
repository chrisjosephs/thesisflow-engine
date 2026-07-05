import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Thesis } from './thesis.entity.js';

export enum CriterionType {
  SUPPORT      = 'SUPPORT',
  FALSIFY      = 'FALSIFY',
  WATCH_SIGNAL = 'WATCH_SIGNAL',
}

@Entity('criteria')
export class Criterion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ name: 'impact_if_confirmed', type: 'smallint', nullable: true })
  impactIfConfirmed: number | null;

  @Column({ name: 'current_fulfillment', type: 'numeric', precision: 5, scale: 2, default: 0 })
  currentFulfillment: number;
}
