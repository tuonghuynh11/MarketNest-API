import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { AppBaseEntity } from "./AppBase";
import ChatRoom from "./ChatRoom";

@Entity("chat_details")
export default class ChatDetail extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.chatDetails)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  sender: User;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.chatDetails)
  @JoinColumn({ name: "chatRoomId", referencedColumnName: "id" })
  chatRoom: ChatRoom;

  @Column({ nullable: true })
  image?: string;

  @Column()
  message: string;
}
