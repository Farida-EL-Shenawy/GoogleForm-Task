import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany } from 'typeorm';
import { Question } from './question.entity';
import { ShareLink } from './share-link.entity';

@Entity()
export class Form extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Question, q => q.form)
  questions: Question[];

  @OneToMany(() => ShareLink, s => s.form)
  shareLinks: ShareLink[];
}
