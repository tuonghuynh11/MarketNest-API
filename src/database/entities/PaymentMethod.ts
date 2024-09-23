import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import PaymentInformation from "./PaymentInformation";
import Order from "./Order";

@Entity("payment_methods")
export default class PaymentMethod {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @OneToMany(
    () => PaymentInformation,
    (paymentInformation) => paymentInformation.paymentMethod
  )
  paymentInformations: PaymentInformation[];

  @OneToMany(() => Order, (order) => order.paymentMethod)
  orders: Order[];
}
