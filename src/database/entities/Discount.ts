import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { AppBaseEntity } from "./AppBase";
import Order from "./Order";
import { Shop } from "./Shop";

@Entity("discounts")
export default class Discount extends AppBaseEntity {
  @Column()
  description: string;

  @Column()
  code: string;

  @Column()
  discountPercentage: number;

  @Column({ nullable: true })
  quantity?: number;

  @Column()
  validUntil: Date;

  @OneToMany(() => Order, (order) => order.paymentMethod)
  orders: Order[];

  @ManyToOne(() => Shop, (shop) => shop.discounts)
  shop: Shop;
}
