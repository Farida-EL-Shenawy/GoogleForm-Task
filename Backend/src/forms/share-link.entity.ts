import {
  BaseEntity, Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, Index
} from 'typeorm';
import { Form } from './form.entity';

@Entity()
export class ShareLink extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 64 })
  code: string;

  @ManyToOne(() => Form, (f) => f.shareLinks, { onDelete: 'CASCADE', nullable: false })
  form: Form;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'int', nullable: true })
  maxUses: number | null;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
