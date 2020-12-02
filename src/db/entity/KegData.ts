import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { KegSizes } from "../../shared/types";

import { Keg } from "./Keg";

@Entity()
export class KegData {
  @PrimaryColumn()
  id!: string;

  @ManyToOne(() => Keg)
  @JoinColumn({ name: "kegId" })
  @Column()
  kegId!: string;

  @Column()
  weight!: number;

  @Column()
  temp!: number;

  @Column()
  beersLeft!: number;

  @Column()
  beersDrank!: number;

  @Column()
  percLeft!: number;

  @Column()
  kegSize!: string;

  @Column("timestamp", {
    name: "createdAt",
    default: (): string => "now()",
  })
  date?: Date;

  @BeforeInsert()
  public generateId() {
    this.id = uuidv4();
  }
}
