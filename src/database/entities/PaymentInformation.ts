import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { AppBaseEntity } from "./AppBase";
import PaymentMethod from "./PaymentMethod";

@Entity("payment_information")
export default class PaymentInformation extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.paymentInformations)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user: User;

  @ManyToOne(
    () => PaymentMethod,
    (paymentMethod) => paymentMethod.paymentInformations
  )
  @JoinColumn({ name: "paymentMethodId", referencedColumnName: "id" })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  bankBranch?: string;

  @Column({ nullable: true })
  bankName?: string;

  @Column({ nullable: true })
  bankAccountName?: string;

  @Column({ nullable: true })
  bankNumber?: string;

  @Column({ nullable: true })
  cardOwnerName?: string;

  @Column({ nullable: true })
  cardNumber?: string;

  @Column({ nullable: true })
  secretNumber?: string;
}
