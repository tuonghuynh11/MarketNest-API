import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import Cart from "./Cart";
import { Product } from "./Product";

@Entity("cart_details")
export default class CartDetail {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Cart, (cart) => cart.cartDetails)
  @JoinColumn({ name: "cartId", referencedColumnName: "id" })
  cart: Cart;

  @ManyToOne(() => Product, (product) => product.cartDetails)
  @JoinColumn({ name: "productId", referencedColumnName: "id" })
  product: Product;

  @Column()
  quantity: number;
}
