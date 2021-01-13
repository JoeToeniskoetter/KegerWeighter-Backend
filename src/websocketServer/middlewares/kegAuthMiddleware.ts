import { Keg } from "../../db/entity/Keg";
import { getConnection } from "typeorm";

export async function checkKegToken(socket: any, next: any) {
  console.log(socket.handshake.query);

  if (!socket.handshake.query["x-keg-token"]) {
    return next();
  }

  const [username, password] = socket.handshake.query["x-keg-token"].split(":");

  const kegRepo = getConnection().getRepository(Keg);
  const foundKeg = await kegRepo.findOne({
    where: { id: username },
  });
  if (foundKeg) {
    // return next(new Error("Unauthorized"));
    if (password === foundKeg.password) {
      console.log("correct password")
      socket.keg = foundKeg;
      return next();
    } else {
      return next(new Error("Incorrect Creds"));
    }
  } else {
    return next(new Error("Keg not found"));
  }
}
