import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { AppBaseEntity } from "./AppBase";
import PaymentMethod from "./PaymentMethod";
import ShippingMethod from "./ShippingMethod";
import Address from "./Address";
import Discount from "./Discount";
import { OrderStatus, RefundStatus } from "../../utils/enums";
import OrderDetail from "./OrderDetail";
import { Shop } from "./Shop";

@Entity("orders")
export default class Order extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.orders)
  @JoinColumn({ name: "paymentMethodId", referencedColumnName: "id" })
  paymentMethod: PaymentMethod;

  @ManyToOne(() => ShippingMethod, (shippingMethod) => shippingMethod.orders)
  @JoinColumn({ name: "shippingMethodId", referencedColumnName: "id" })
  shippingMethod: ShippingMethod;

  @ManyToOne(() => Address, (address) => address.orders)
  @JoinColumn({ name: "addressId", referencedColumnName: "id" })
  address: Address;

  @ManyToOne(() => Shop, (shop) => shop.orders)
  @JoinColumn({ name: "shopId", referencedColumnName: "id" })
  shop: Shop;

  @Column()
  shippingFee: number;

  @Column()
  totalAmount: number;

  @ManyToOne(() => Discount, (discount) => discount.orders)
  @JoinColumn({ name: "discountId", referencedColumnName: "id" })
  discount: Discount;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.WAITING_VERIFY,
  })
  orderStatus: OrderStatus;

  @Column({ type: "enum", enum: RefundStatus, nullable: true })
  refundStatus: RefundStatus;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
  orderDetails: OrderDetail[];
}
