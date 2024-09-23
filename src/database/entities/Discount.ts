import { Column, Entity, OneToMany } from "typeorm";
import { AppBaseEntity } from "./AppBase";
import Order from "./Order";

@Entity("discounts")
export default class Discount extends AppBaseEntity {
  @Column()
  description: string;

  @Column()
  code: string;

  @Column()
  discountPercentage: number;

  @Column()
  validUntil: Date;

  @OneToMany(() => Order, (order) => order.paymentMethod)
  orders: Order[];
}
