import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { AppBaseEntity } from "./AppBase";
import { Product } from "./Product";
import { Shop } from "./Shop";

@Entity("ratings")
export default class Rating extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.ratings)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @ManyToOne(() => Product, (product) => product.ratings)
  @JoinColumn({ name: "productId", referencedColumnName: "id" })
  product: Product;
  @ManyToOne(() => Shop, (shop) => shop.ratings)
  @JoinColumn({ name: "shopId", referencedColumnName: "id" })
  shop: Shop;

  @Column({ type: "float" })
  value: number;

  @Column({ nullable: true })
  comment: string;
}
