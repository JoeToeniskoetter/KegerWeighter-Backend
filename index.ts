import http from "./app";
import { connection } from "./src/db/db";
import { createTestData } from "./src/db/seedData";
http.listen(process.env.PORT || 3000, () => {
  console.log("running");
  connection().then(() => {
    createTestData();
  });
});
