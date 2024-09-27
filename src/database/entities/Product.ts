import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { AppBaseEntity } from "./AppBase";
import { Shop } from "./Shop";
import WishList from "./WishList";
import CartDetail from "./CartDetail";
import Rating from "./Rating";
import ProductImage from "./ProductImage";
import ProductCategory from "./ProductCategory";
import OrderDetail from "./OrderDetail";

export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
}

@Entity("products")
export class Product extends AppBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  price: number;

  @Column()
  stock: number;

  @Column()
  hashPassword: string;

  @ManyToOne(() => Shop, (shop) => shop.products)
  @JoinColumn({ name: "shopId", referencedColumnName: "id" })
  shop?: Shop;

  @OneToMany(() => WishList, (wishList) => wishList.product)
  wishLists: WishList[];

  @OneToMany(() => CartDetail, (cartDetail) => cartDetail.product)
  cartDetails: CartDetail[];

  @OneToMany(() => Rating, (rating) => rating.product)
  ratings: Rating[];

  @OneToMany(() => ProductImage, (productImage) => productImage.product)
  images: ProductImage[];

  @ManyToMany(
    () => ProductCategory,
    (productCategory) => productCategory.products
  )
  @JoinTable({
    name: "product_category_relations",
    joinColumn: { name: "productId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "categoryId" },
  })
  categories: ProductCategory[];

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.product)
  orderDetails: OrderDetail[];
}