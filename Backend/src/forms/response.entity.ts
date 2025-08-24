// src/forms/response.entity.ts
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Form } from './form.entity';

type Answer = string | string[];
type StoredResponse = { questionId: number; answer: Answer };

@Entity()
export class Response extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Form, (f) => f.id, { onDelete: 'CASCADE', nullable: false })
  form: Form;

  @Column({ type: 'jsonb' })
  responses: StoredResponse[];

  @Index()
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  guestName: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
