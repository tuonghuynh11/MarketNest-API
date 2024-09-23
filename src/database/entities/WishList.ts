import {
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./Product";
import { User } from "./User";

@Entity("wishlists")
export default class WishList {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Product, (product) => product.wishLists)
  @JoinColumn({ name: "productId", referencedColumnName: "id" })
  product: Product;

  @ManyToOne(() => User, (user) => user.wishList)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;
}
