import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Unique,
  BeforeInsert,
  OneToMany,
  JoinColumn,
  BeforeUpdate,
} from "typeorm";
import { hash, compare } from "bcrypt";
import { v4 as uuidv4 } from "uuid";

import { Keg } from "./Keg";
import { UserTokens } from "./UserTokens";

@Entity()
@Unique(["email"])
export class User {
  @PrimaryColumn()
  id!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  passwordResetToken!: string;

  @Column({ nullable: true })
  passwordResetTokenExp!: Date;

  @BeforeInsert()
  public async generateId() {
    this.id = uuidv4();
  }

  @BeforeInsert()
  public async hashPassword() {
    this.password = await hash(this.password, 12);
  }

  public async newPassword(password: string): Promise<string> {
    return await hash(password, 12);
  }

  public async hashNewPassword(pw: string) {
    this.password = await hash(pw, 12);
  }

  public async passwordCorrect(providedPassword: string) {
    return await compare(providedPassword, this.password);
  }

  public async generatePasswordResetToken() {
    let oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    this.passwordResetToken = uuidv4();
    this.passwordResetTokenExp = oneDayFromNow;
  }

  @OneToMany(() => Keg, (kegs) => kegs.id)
  kegs!: Keg[];

  @OneToMany(() => UserTokens, (device) => device.userId)
  fcmTokens!: UserTokens[];
}
