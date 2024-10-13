import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { AppBaseEntity } from "./AppBase";
import { User } from "./User";
import { Product } from "./Product";
import ChatRoom from "./ChatRoom";
import Rating from "./Rating";
import { ShopStatus } from "../../utils/enums";
import Discount from "./Discount";
import Order from "./Order";

@Entity("shops")
export class Shop extends AppBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @OneToOne(() => User)
  @JoinColumn()
  owner: User;

  @OneToMany(() => Product, (product) => product.shop)
  products: Product[];

  @OneToMany(() => ChatRoom, (chatRoom) => chatRoom.user)
  chatRooms?: ChatRoom[];

  @OneToMany(() => Rating, (rating) => rating.shop)
  ratings?: Rating[];

  @OneToMany(() => Discount, (discount) => discount.shop)
  discounts?: Rating[];

  @OneToMany(() => Order, (order) => order.shop)
  orders?: Order[];

  @Column({ type: "enum", enum: ShopStatus, default: ShopStatus.PENDING })
  status: ShopStatus;
}
