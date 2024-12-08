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

export enum ProductStatus {
  ACTIVE = "Active",
  DISABLED = "Disabled",
  OUT_OF_STOCK = "Out_Of_Stock",
  ADMIN_DISABLED = "Admin_Disabled",
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

  @Column({ default: 0, type: "float" })
  rate: number;

  @Column({
    type: "enum",
    enum: ProductStatus,
    default: ProductStatus.DISABLED,
  })
  status: ProductStatus;

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
