import { createConnection } from "typeorm";
import "reflect-metadata";

export const connection = async () =>
  await createConnection({
    url:
      process.env.DATABASE_URL || "postgresql://postgres:@localhost:5432/test",
    type: "postgres",
    entities: [__dirname + "/entity/*.ts"],
    synchronize: true,
    dropSchema: false,
    logging: false,
  });
