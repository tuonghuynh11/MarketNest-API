import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { User } from "./User";
import { AppBaseEntity } from "./AppBase";
import Order from "./Order";
import { Product } from "./Product";
import { RefundStatus } from "../../utils/enums";

@Entity("refund_requests")
export default class RefundRequest extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.refundRequests)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @ManyToOne(() => Order, (order) => order.refundRequest)
  @JoinColumn({ name: "orderId", referencedColumnName: "id" })
  order: Order;

  @OneToOne(() => Product)
  @JoinColumn({ name: "productId", referencedColumnName: "id" })
  product: Product;

  @Column({ nullable: true, type: "jsonb" })
  images?: object | null;

  @Column()
  quantity: number;

  @Column()
  price: number;

  @Column()
  refundReason: string;

  @Column({ nullable: true })
  requestDate?: Date;

  @Column({ nullable: true })
  approvalDate?: Date;

  @Column({
    type: "enum",
    enum: RefundStatus,
    default: RefundStatus.PENDING,
  })
  status?: RefundStatus;

  @Column({ nullable: true })
  shopkeeperReply?: string;
}
