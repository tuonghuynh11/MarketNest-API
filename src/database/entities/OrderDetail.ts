import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { AppBaseEntity } from "./AppBase";
import { Product } from "./Product";
import Order from "./Order";

@Entity("order_details")
export default class OrderDetail extends AppBaseEntity {
  @ManyToOne(() => Order, (order) => order.orderDetails)
  @JoinColumn({ name: "orderId", referencedColumnName: "id" })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderDetails)
  @JoinColumn({ name: "productId", referencedColumnName: "id" })
  product: Product;

  @Column()
  quantity: number;

  @Column()
  price: number;
}
