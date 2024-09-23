import { Column, Entity, OneToMany } from "typeorm";
import { User } from "./User";
import { AppBaseEntity } from "./AppBase";

@Entity("roles")
export class Role extends AppBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
