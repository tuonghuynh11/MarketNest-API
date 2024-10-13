import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { AppBaseEntity } from "./AppBase";

@Entity("app_reports")
export default class AppReport extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.appReportsSender)
  @JoinColumn({ name: "senderId", referencedColumnName: "id" })
  sender: User;

  @ManyToOne(() => User, (user) => user.appReportsReceiver)
  @JoinColumn({ name: "receiverId", referencedColumnName: "id" })
  receiver: User;

  @Column()
  title?: string;

  @Column()
  body: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ default: false })
  isRead: boolean;
}
