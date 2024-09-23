import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ShippingType } from "../../utils/enums";
import Order from "./Order";

@Entity("shipping_methods")
export default class ShippingMethod {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  type: ShippingType;

  @OneToMany(() => Order, (order) => order.paymentMethod)
  orders: Order[];
}
