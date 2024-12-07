import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import Discount from "./Discount";

@Entity("users_discounts")
export class UserDiscount {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (employee) => employee.discounts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @ManyToOne(() => Discount, (discount) => discount.users)
  @JoinColumn({ name: "discountId", referencedColumnName: "id" })
  discount: Discount;

  @Column({ default: false })
  used: boolean;
}
