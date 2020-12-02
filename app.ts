import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./src/api/routes/authRoutes";
import io, { Server, Socket } from "socket.io";
import { connection } from "./src/db/db";
import { checkTokens } from "./src/api/routes/util/checkTokens";
import kegInfoRoutes from "./src/api/routes/kegRoutes";
import { HTTPError } from "./src/shared/types";
const app = express();
const http = require("http").createServer(app);

require("dotenv").config();

// const socketServer = io(http);
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use("/api/auth", authRoutes);

//auth required
// app.use(checkTokens);
app.use("/api", checkTokens, kegInfoRoutes);
app.use(errorHandler);

app.get("*", (req: Request, res: Response, next: NextFunction) => {
  return res.status(404).json({ message: "not found" });
});

// let customNamespace = socketServer.of("/feed");
// customNamespace.on("connection", (soc: Socket) => {
//   console.log("socket connected");
//   soc.emit("test");
//   soc.on("disconnect", () => {
//     console.log("user disconnected");
//   });
//   soc.on("event", (data) => {
//     console.log("I got data. will running another function", data.count);
//   });
// });

function errorHandler(
  err: HTTPError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err.status) {
    return res.status(err.status).json({ error: err.error });
  } else {
    return res.status(500).json({ error: "internal server error" });
  }
}

export default http;
