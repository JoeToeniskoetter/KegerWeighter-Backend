import KegNotFoundException from "../exceptions/KegNotFoundException";
import { getConnection, getRepository } from "typeorm";
import { KegNotification } from "../../db/entity/KegNotification";
import { Keg } from "../../db/entity/Keg";
import * as admin from "firebase-admin";
import { UserTokens } from "../../db/entity/UserTokens";
require("dotenv").config();

class KegNotificationService {
  private kegNotificationRepo = getRepository(KegNotification);
  private kegRepo = getRepository(Keg);
  private userDeviceRepo = getRepository(UserTokens);
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
    const keg = await this.kegRepo.findOne({ where: { id: kegId } });
    if (!keg) {
      return;
    }
    const userId = keg.userId;
    const deviceTokens = await this.userDeviceRepo.find({ where: { userId } });

    if (deviceTokens.length < 1) {
      return;
    }

    const body = `Your ${keg.kegSize} of ${keg.beerType} is low!`;
    const title = "Your keg is low!";
    const messages: admin.messaging.Message[] = deviceTokens.map(
      (device: UserTokens) => ({
        token: device.fcmToken,
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
          keg: keg.id,
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
      })
    );

    return await this.messaging.sendAll(messages);
  }
}

export default KegNotificationService;
