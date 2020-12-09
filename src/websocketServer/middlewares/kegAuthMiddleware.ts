import { Keg } from "../../db/entity/Keg";
import { getConnection } from "typeorm";

export async function checkKegToken(socket: any, next: any) {
  console.log(socket.handshake.query);

  if (!socket.handshake.query["x-keg-token"]) {
    next();
  }

  const kegRepo = getConnection().getRepository(Keg);
  const foundKeg = await kegRepo.findOne({
    where: { id: socket.handshake.query["x-keg-token"] },
  });
  if (foundKeg) {
    // return next(new Error("Unauthorized"));
    socket.keg = foundKeg;
  }
  next();
}
