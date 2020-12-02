import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { KegData } from "./KegData";
import { User } from "./User";

@Entity()
export class Keg {
  @PrimaryColumn()
  id!: string;

  @Column()
  beerType!: string;

  @Column()
  kegSize!: string;

  @Column({ default: 0 })
  customTare!: number;

  @Column()
  location!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  @Column({ nullable: true })
  userId!: string;

  @OneToMany(() => KegData, (data) => data.kegId)
  data!: KegData[];

  @BeforeInsert()
  public generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
