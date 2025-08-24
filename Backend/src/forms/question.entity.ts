import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne } from 'typeorm';
import { Form } from './form.entity';

@Entity()
export class Question extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionText: string;

  @Column()
  questionType: string;

  @Column({ type: 'json', nullable: true })
  options: string[];

  @ManyToOne(() => Form, form => form.questions, { onDelete: 'CASCADE' })
  form: Form;
}
