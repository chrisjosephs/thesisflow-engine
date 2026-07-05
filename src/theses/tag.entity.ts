import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Thesis } from './thesis.entity.js';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Thesis, (t) => t.tags)
  theses: Thesis[];
}
