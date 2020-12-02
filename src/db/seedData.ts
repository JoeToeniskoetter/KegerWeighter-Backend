import { getConnection } from "typeorm";
import { Keg } from "./entity/Keg";
import { KegData } from "./entity/KegData";
import { User } from "./entity/User";

export async function createTestData() {
  try {
    const currConnection = getConnection();
    const userRepo = await currConnection.getRepository(User);
    const newUser = new User();
    newUser.email = "test@test.com";
    newUser.password = "password";
    let savedUser = await userRepo.save(newUser);

    const kegRepo = await currConnection.getRepository(Keg);
    const newKeg = new Keg();
    newKeg.location = "Kitchen";
    newKeg.userId = savedUser.id;
    newKeg.kegSize = "1/2 Barrel";
    newKeg.beerType = "Coors";
    const savedKeg = await kegRepo.save(newKeg);

    const kegDataRepo = await currConnection.getRepository(KegData);
    const newData = new KegData();
    newData.kegId = savedKeg.id;
    newData.percLeft = 100;
    newData.temp = 36;
    newData.kegSize = "1/4 Barrel";
    newData.beersDrank = 0;
    newData.beersLeft = 165;
    newData.weight = 165;
    await kegDataRepo.save(newData);

    const newKeg2 = new Keg();
    newKeg2.location = "Kitchen";
    newKeg2.id = "TEST";
    newKeg2.kegSize = "1/4 Barrel";
    newKeg2.beerType = "Coors";
    await kegRepo.save(newKeg2);
  } catch (e) {}
}
