import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from "typeorm";
import { Keg } from "./Keg";

@Entity()
export class KegNotification {
  @PrimaryColumn()
  id!: string;

  @OneToOne(() => Keg)
  @JoinColumn({ name: "id" })
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
}
