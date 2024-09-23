import {
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import CartDetail from "./CartDetail";

@Entity("carts")
export default class Cart {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => User, (user) => user.cart)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @OneToMany(() => CartDetail, (cartDetail) => cartDetail.cart)
  cartDetails: CartDetail[];
}
