import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { AppBaseEntity } from "./AppBase";

export enum ENotificationType {
  CHAT = "chat",
  MAIL = "mail",
  SYSTEM = "system",
  PERSONAL = "personal",
}
@Entity("notifications")
export default class Notification extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  assignee: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ default: false })
  isRead: boolean;

  @Column()
  content: string;

  @Column({
    type: "enum",
    enum: ENotificationType,
    default: ENotificationType.MAIL,
  })
  contentType: string;

  @Column({ nullable: true, type: "jsonb" })
  actions?: object | null;
}
