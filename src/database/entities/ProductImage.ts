import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./Product";

@Entity("product_images")
export default class ProductImage {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Product, (product) => product.images)
  @JoinColumn({ name: "productId", referencedColumnName: "id" })
  product: Product;

  @Column()
  imageUrl: string;
}
