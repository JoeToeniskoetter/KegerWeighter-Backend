// import http from "./app";
// import { connection } from "./src/db/db";
// import { createTestData } from "./src/db/seedData";

// connection().then(() => {
//   // createTestData().then(() => {
//   http.listen(process.env.PORT || 3000, () => {
//     console.log("running");
//     // });
//   });
// });

import { App } from "./app";
import { SocketServer } from "./socketServer";
import AuthController from "./src/api/controllers/auth/AuthController";
import KegController from "./src/api/controllers/keg/KegController";
import { connection } from "./src/db/db";
import { Server } from "http";

connection().then(() => {
  const api = new App([new AuthController(), new KegController()]);
  const server: Server = new Server(api.app);
  const socketServer = new SocketServer(server);

  server.listen(3000, () => {
    console.log("listening");
  });
});
