import { createConnection } from "typeorm";

export const connection = async () =>
  await createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "",
    database: "test",
    entities: [__dirname + "/entity/*.ts"],
    synchronize: true,
    dropSchema: false,
    logging: true,
  });
