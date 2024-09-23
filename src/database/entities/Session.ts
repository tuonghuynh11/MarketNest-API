import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity("sessions")
export class Session extends BaseEntity {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @Column()
  email: string;

  @Index()
  @Column()
  accessToken: string;

  @Index()
  @Column()
  refreshToken: string;

  @Column()
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
