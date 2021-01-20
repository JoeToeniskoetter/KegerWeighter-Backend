import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { User } from "./User";

@Entity()
export class UserTokens {
  @PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  fcmToken!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  @Column({ nullable: false })
  userId!: string;

  @BeforeInsert()
  updateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
