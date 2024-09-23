import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { AppBaseEntity } from "./AppBase";

@Entity("notifications")
export default class Notification extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  image?: string;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;
}
