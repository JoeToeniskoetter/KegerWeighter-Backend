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

export type Cache = {
  [id: string]: KegUpdate;
};

export type KegStatus = {
  data: KegUpdate;
  connected: boolean;
};

export type KegUpdate = {
  weight: number;
  temp: number;
  id: string;
};

export enum KegEvents {
  UPDATE = "keg.update",
  DISCONNECT = "keg.disconnect",
  CONNECT = "keg.connect",
}

type KegSizeInfo = {
  [key: string]: {
    beers: number;
    tare: number;
    full: number;
    net_weight: number;
  };
};

export const kegSizeInfo: KegSizeInfo = {
  "1/4 Barrel": { beers: 82, tare: 22, full: 87, net_weight: 65 },
  "1/2 Barrel": { beers: 165, tare: 30, full: 165, net_weight: 135 },
  "1/6 Barrel": { beers: 55, tare: 16.5, full: 58, net_weight: 41.5 },
  "Cornelious Keg": { beers: 53, tare: 9, full: 55, net_weight: 46 },
  "Pony Keg": { beers: 82, tare: 22, full: 87, net_weight: 65 },
  "50 Litre": { beers: 140, tare: 28, full: 130, net_weight: 102 },
};
