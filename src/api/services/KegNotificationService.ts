import KegNotFoundException from "../exceptions/KegNotFoundException";
import { getRepository } from "typeorm";
import { KegNotification } from "../../db/entity/KegNotification";
import { Keg } from "../../db/entity/Keg";
import * as admin from "firebase-admin";
import { KegData } from "../../db/entity/KegData";
require("dotenv").config();

class KegNotificationService {
  private kegNotificationRepo = getRepository(KegNotification);
  private kegRepo = getRepository(Keg);
  private kegDataRepo = getRepository(KegData);
  private messaging = admin.messaging();

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
      this.sendNotifications(keg.kegId);
      keg.firstNotifComplete = true;
      await this.kegNotificationRepo.save(keg);
      return;
    }

    if (percLeft < secondPerc && !secondNotifComplete) {
      //perc is less that second perc and notification hasnt been sent.
      //send notificaiton and update db
      this.sendNotifications(keg.kegId);
      console.log("sending second notification");
      keg.secondNotifComplete = true;
      await this.kegNotificationRepo.save(keg);
      return;
    }
  }

  async sendNotifications(kegId: string) {
    const keg = await this.kegRepo.findOne({
      where: { id: kegId },
    });

    if (!keg) {
      return;
    }
    const data = await this.kegDataRepo.findOne({
      where: { kegId: keg.id },
      order: { date: "DESC" },
    });
    const messageData = {
      ...keg,
      data,
    };

    const body = `You have ${messageData.data.beersLeft} beers left in your ${messageData.kegSize} of ${messageData.beerType}`;
    const title = "Your keg is low!";
    const message: admin.messaging.Message = {
      topic: kegId,
      notification: {
        title,
        body,
      },
      android: {
        notification: {
          body: `Your ${keg.kegSize} of ${keg.beerType} is low!`,
        },
        priority: "high",
      },
      data: {
        keg: JSON.stringify(messageData),
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            contentAvailable: true,
            alert: { body, title },
          },
        },
      },
    };

    return await this.messaging.send(message);
  }
}

export default KegNotificationService;
