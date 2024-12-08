import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { AppBaseEntity } from "./AppBase";
import Order from "./Order";
import { Shop } from "./Shop";
import { UserDiscount } from "./UserDiscount";

export enum DiscountStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}
@Entity("discounts")
export default class Discount extends AppBaseEntity {
  @Column()
  description: string;

  @Column({ nullable: true })
  campaign?: string;

  @Column()
  code: string;

  @Column()
  discountPercentage: number;

  @Column({ nullable: true, type: "jsonb" })
  conditions?: object | null;

  @Column({ nullable: true, default: 0 })
  quantity: number;

  @Column({ nullable: true, default: 0 })
  used: number;

  @Column({
    type: "enum",
    enum: DiscountStatus,
    default: DiscountStatus.INACTIVE,
    nullable: true,
  })
  status?: DiscountStatus;

  @Column()
  validUntil: Date;

  @OneToMany(() => Order, (order) => order.paymentMethod)
  orders: Order[];

  @ManyToOne(() => Shop, (shop) => shop.discounts, { nullable: true })
  shop?: Shop;

  @OneToMany(() => UserDiscount, (userDiscount) => userDiscount.discount)
  users: UserDiscount[];
}
