import { KegData } from "../../db/entity/KegData";
import * as cron from "node-cron";
import { getRepository, Repository } from "typeorm";
import { KegNotification } from "../../db/entity/KegNotification";
import { User } from "../../db/entity/User";

export class SchedulerService {
  private cron: typeof cron;
  private kegDataRepo: Repository<KegData> = getRepository(KegData);
  private kegNotificationRepo: Repository<KegNotification> = getRepository(
    KegNotification
  );
  private userRepo: Repository<User> = getRepository(User);

  constructor() {
    this.cron = cron;
    this.initSchedule();
  }

  initSchedule() {
    this.cron.schedule("0 0 * * *", () => {
      this.cleanUpData();
      this.resetNotifications();
      this.removeOldPasswordTokens();
    });
  }

  async cleanUpData() {
    let date = new Date();
    let sixMonthsAgo = new Date(date.setMonth(date.getMonth() - 6));
    await this.kegDataRepo
      .createQueryBuilder("keg_data")
      .where('keg_data."createdAt" < :last_date', { last_date: sixMonthsAgo })
      .delete()
      .execute();
  }

  async resetNotifications() {
    const completedNotifications = await this.kegNotificationRepo.find({
      where: { firstNotifComplete: true, secondNotifComplete: true },
    });

    completedNotifications.forEach(async (notification) => {
      const mostRecentDataPoint = await this.mostRecentDataPointPerc(
        notification.kegId
      );

      if (mostRecentDataPoint > notification.secondPerc) {
        await this.kegNotificationRepo.update(
          { firstNotifComplete: false, secondNotifComplete: false },
          notification
        );
      }
    });
  }

  async removeOldPasswordTokens() {
    const today = new Date();
    const usersToUpdate = await this.userRepo
      .createQueryBuilder("user")
      .where('"passwordResetTokenExp" < :today', { today })
      .select()
      .getMany();

    usersToUpdate.forEach(async (user) => {
      await this.userRepo.update(
        { passwordResetTokenExp: null, passwordResetToken: null },
        user
      );
    });
  }

  async mostRecentDataPointPerc(kegId: string) {
    const mostRecentDataPoint = await this.kegDataRepo.findOne({
      where: { id: kegId },
      order: { date: "DESC" },
    });
    return mostRecentDataPoint.percLeft;
  }
}
