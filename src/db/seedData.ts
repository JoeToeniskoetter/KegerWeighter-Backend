import { getConnection } from "typeorm";
import { Keg } from "./entity/Keg";
import { KegData } from "./entity/KegData";
import { User } from "./entity/User";

export async function createTestData() {
  try {
    const currConnection = getConnection();
    // const userRepo = await currConnection.getRepository(User);
    // const newUser = new User();
    // newUser.email = "test@test.com";
    // newUser.password = "password";
    // let savedUser = await userRepo.save(newUser);

    const kegRepo = await currConnection.getRepository(Keg);
    // const newKeg = new Keg();
    // newKeg.location = "Kitchen";
    // newKeg.userId = savedUser.id;
    // newKeg.kegSize = "1/2 Barrel";
    // newKeg.beerType = "Coors";
    // newKeg.subscribed = false;
    // const savedKeg = await kegRepo.save(newKeg);

    const kegDataRepo = await currConnection.getRepository(KegData);
    // const newData = new KegData();
    // newData.kegId = savedKeg.id;
    // newData.percLeft = 100;
    // newData.temp = 36;
    // newData.kegSize = "1/4 Barrel";
    // newData.beersDrank = 0;
    // newData.beersLeft = 165;
    // newData.weight = 165;
    // await kegDataRepo.save(newData);

    for (let i = 0; i < 1000; i++) {
      let newDate = new Date();
      newDate.setDate(newDate.getDate() - i);
      const addData = new KegData();
      addData.kegId = "ef9c6a82-7b13-42d6-a898-a8eb0be797e7";
      addData.percLeft = 100;
      addData.temp = 36;
      addData.kegSize = "1/4 Barrel";
      addData.beersDrank = Math.floor(Math.random() * 10);
      addData.beersLeft = 165;
      addData.weight = 165;
      addData.date = newDate;
      await kegDataRepo.save(addData);
    }

    // const newKeg2 = new Keg();
    // newKeg2.location = "Kitchen";
    // newKeg2.id = "test";
    // newKeg2.kegSize = "1/4 Barrel";
    // newKeg2.beerType = "Coors";
    // await kegRepo.save(newKeg2);
  } catch (e) {}
}
