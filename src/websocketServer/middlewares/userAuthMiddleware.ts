import * as jwt from "jsonwebtoken";
require("dotenv").config();

export async function checkSocketTokens(socket: any, next: any) {
  let token = socket.handshake.query["x-auth-token"];
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      let decodeduser: any = jwt.decode(token);
      socket.user = decodeduser.user;
      await socket.join(decodeduser.id);
      return next();
    } catch (e) {
      return next(new Error(e));
    }
  }
  return next(new Error("Unauthorized"));
}
