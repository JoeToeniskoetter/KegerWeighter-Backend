import {
  IsEmail,
  IsString,
  Min,
  Length,
  Max,
  IsIn,
  IsBoolean,
  IsNumber,
} from "class-validator";

const kegSizes = [
  "1/2 Barrel",
  "1/4 Barrel",
  "Pony Keg",
  "1/6 Barrel",
  "1/8 Barrel",
  "50 Litre",
  "Cornelious Keg",
];

export default class UpdateKegDto {
  @IsString()
  @Length(1, 15)
  public beerType!: string;

  @IsString()
  @Length(1, 15)
  public location!: string;

  @IsString()
  @IsIn(kegSizes)
  public kegSize!: string;

  @IsBoolean()
  public subscribed!: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  public firstNotif!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  public secondNotif!: number;
}
