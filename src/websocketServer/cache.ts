import { KegStatus, KegUpdate } from "../shared/types";

type Cache = {
  [id: string]: KegUpdate;
};

export const cache: Cache = {};
