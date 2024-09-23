import { Column, Entity, ManyToMany } from "typeorm";
import { AppBaseEntity } from "./AppBase";
import { Product } from "./Product";

@Entity("product_categories")
export default class ProductCategory extends AppBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  image: string;

  @Column()
  description: string;

  @ManyToMany(() => Product, (product) => product.categories)
  products: Product[];
}
