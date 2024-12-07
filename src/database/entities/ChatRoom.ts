import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { AppBaseEntity } from "./AppBase";
import { Shop } from "./Shop";
import ChatDetail from "./ChatDetail";

@Entity("chat_rooms")
export default class ChatRoom extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.chatRooms)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @ManyToOne(() => Shop, (shop) => shop.chatRooms)
  @JoinColumn({ name: "shopId", referencedColumnName: "id" })
  shop: Shop;

  @OneToMany(() => ChatDetail, (chatDetail) => chatDetail.chatRoom)
  chatDetails: ChatDetail[];

  @Column()
  title: string;
}
