import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Role } from "./Role";
import { AppBaseEntity } from "./AppBase";
import WishList from "./WishList";
import Cart from "./Cart";
import ChatRoom from "./ChatRoom";
import ChatDetail from "./ChatDetail";
import Notification from "./Notification";
import Rating from "./Rating";
import Address from "./Address";
import PaymentInformation from "./PaymentInformation";
import Order from "./Order";

export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
}

@Entity("users")
export class User extends AppBaseEntity {
  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  avatar: string;

  @Index()
  @Column()
  username: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column()
  hashPassword: string;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: "roleId", referencedColumnName: "id" })
  role: Role;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ nullable: true })
  activeToken: string;

  @OneToMany(() => WishList, (wishlist) => wishlist.user)
  wishList?: WishList[];

  @OneToOne(() => Cart, (cart) => cart.user)
  cart: Cart;

  @OneToMany(() => ChatRoom, (chatRoom) => chatRoom.user)
  chatRooms?: ChatRoom[];

  @OneToMany(() => ChatDetail, (chatDetail) => chatDetail.sender)
  chatDetails: ChatDetail[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @OneToMany(
    () => PaymentInformation,
    (paymentInformation) => paymentInformation.user
  )
  paymentInformations: PaymentInformation[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
