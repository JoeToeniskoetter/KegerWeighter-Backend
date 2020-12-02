import HttpStatusCode from "./statusCodesEnum";

export type HTTPError = {
  status: HttpStatusCode;
  error: string | { message: string };
};

export enum KegSizes {
  HALF_BARREL = "1/2 Barrel",
  QUARTER_BARREL = "1/4 Barrel",
  PONY_KEG = "Pony Keg",
  EIGHTH_BARREL = "1/8 Barrel",
  SIXTH_BARREL = "1/6 Barrel",
  CORNELIOUS_KEG = "Cornelious Keg",
  FIFTY_LITRE = "50 Litre",
}
