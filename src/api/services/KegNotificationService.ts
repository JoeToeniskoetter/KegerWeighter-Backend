import KegNotFoundException from "../exceptions/KegNotFoundException";
import { getConnection, getRepository } from "typeorm";
import { KegNotification } from "../../db/entity/KegNotification";

class KegNotificationService {
  private kegNotificationRepo = getRepository(KegNotification);

  async checkNotificationsAndSend(kegId: string, percLeft: number) {
    const keg = await this.kegNotificationRepo.findOne({ where: { kegId } });

    if (!keg) {
      throw new KegNotFoundException(kegId);
    }

    const {
      firstNotifComplete,
      firstPerc,
      secondNotifComplete,
      secondPerc,
    } = keg;

    if (percLeft < firstPerc && !firstNotifComplete) {
      //perc is less that first perc and notification hasnt been sent.
      //send notificaiton and update db
      console.log("sending first notification");
      keg.firstNotifComplete = true;
      await this.kegNotificationRepo.save(keg);
      return;
    }

    if (percLeft < secondPerc && !secondNotifComplete) {
      //perc is less that second perc and notification hasnt been sent.
      //send notificaiton and update db
      console.log("sending second notification");
      keg.secondNotifComplete = true;
      await this.kegNotificationRepo.save(keg);
      return;
    }
  }
}

export default KegNotificationService;
