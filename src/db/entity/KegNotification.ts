import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  BeforeInsert,
} from "typeorm";
import { Keg } from "./Keg";
import { v4 as uuidv4 } from "uuid";

@Entity()
export class KegNotification {
  @PrimaryColumn()
  id!: string;

  @OneToOne(() => Keg)
  @JoinColumn({ name: "kegId" })
  @Column()
  kegId!: string;

  @Column({ default: 25 })
  firstPerc!: number;

  @Column({ default: 10 })
  secondPerc!: number;

  @Column({ default: false })
  firstNotifComplete!: boolean;

  @Column({ default: false })
  secondNotifComplete!: boolean;

  @Column("timestamp", {
    name: "createdAt",
    default: (): string => "now()",
  })
  date?: Date;

  @BeforeInsert()
  public updateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
