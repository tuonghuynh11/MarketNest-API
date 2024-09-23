import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import Order from "./Order";

@Entity("addresses")
export default class Address {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.addresses)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @Column({ nullable: true })
  street?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  postalCode?: string;

  @OneToMany(() => Order, (order) => order.paymentMethod)
  orders: Order[];
}
