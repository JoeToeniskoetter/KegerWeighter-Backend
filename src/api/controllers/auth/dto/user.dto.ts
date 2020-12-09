import { IsEmail, IsString, Min, Length, Max } from "class-validator";

export default class CreateUserDto {
  @IsEmail()
  public email!: string;

  @IsString()
  @Length(8, 100)
  public password!: string;
}
