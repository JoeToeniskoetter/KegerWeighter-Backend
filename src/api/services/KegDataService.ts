import { KegData } from "../../db/entity/KegData";
import { KegNotification } from "../../db/entity/KegNotification";
import { getRepository, Repository } from "typeorm";
import { Keg } from "../../db/entity/Keg";
import ActivateKegDto from "../../api/controllers/keg/dto/keg.dto";
import KegNotFoundException from "../../api/exceptions/KegNotFoundException";
import UpdateKegDto from "api/controllers/keg/dto/updateKeg.dto";
import KegNotificationService from "./KegNotificationService";
import { kegSizeInfo, KegUpdate } from "../../shared/types";
import { queries } from "./queries";

export default class KegDataService {
  private kegRepo: Repository<Keg> = getRepository(Keg);
  private kegDataRepo: Repository<KegData> = getRepository(KegData);
  private kegNotificationRepo: Repository<KegNotification> = getRepository(
    KegNotification
  );
  private notificationService = new KegNotificationService();

  public async getKegs(userId: string) {
    const data = await this.kegRepo.find({ where: { userId } });

    let x = await Promise.all(
      data.map(async (keg: any) => {
        let data = await this.getKegData(keg.id);
        let notifications = await this.getKegNotifications(keg.id);
        return { ...keg, data, notifications };
      })
    );
    return x;
  }

  public async activateKeg(
    kegId: string,
    kegData: ActivateKegDto,
    userId: string
  ) {
    const foundKeg = await this.kegRepo.findOne({
      where: { id: kegId, userId: null },
    });

    if (!foundKeg) {
      throw new KegNotFoundException(kegId);
    }
    return await this.kegRepo.save({ id: kegId, ...kegData, userId });
  }

  public async updateKeg(kegId: string, kegData: UpdateKegDto, userId: string) {
    const foundKeg = await this.kegRepo.findOne({
      where: { id: kegId, userId },
    });

    if (!foundKeg) {
      throw new KegNotFoundException(kegId);
    }

    foundKeg.kegSize = kegData.kegSize || foundKeg.kegSize;
    foundKeg.location = kegData.location || foundKeg.location;
    foundKeg.subscribed = kegData.subscribed;
    foundKeg.beerType = kegData.beerType || foundKeg.beerType;

    const updatedKeg = await this.kegRepo.save(foundKeg);
    const foundKegNotif = await this.kegNotificationRepo.findOne({
      where: { kegId: foundKeg.id },
    });
    if (!foundKegNotif) {
      throw new KegNotFoundException(foundKeg.id);
    }

    if (!updatedKeg.subscribed)
      foundKegNotif.firstPerc = kegData.firstNotif || foundKegNotif.firstPerc;
    foundKegNotif.secondPerc = kegData.secondNotif || foundKegNotif.secondPerc;
    const updateKegNotif = await this.kegNotificationRepo.save(foundKegNotif);
    return {
      ...updatedKeg,
      subscriptions: {
        ...updateKegNotif,
      },
    };
  }

  async getKegSummary(kegId: string, userId: string) {
    return {
      ...(await this.getDailyBeersDrank(kegId, userId)),
      ...(await this.getWeeklyBeersDrank(kegId, userId)),
      ...(await this.getMonthlyData(kegId, userId)),
    };
  }

  async insertNewKegData(update: KegUpdate) {
    const { weight, temp, id } = update;
    const relatedKeg = await this.kegRepo.findOne({
      where: { id },
    });

    if (!relatedKeg) {
      console.log("No related keg");
      return;
    }

    //steps needed
    /*
    1. if keg is too heavy for is current size, update custom tare
    2. calculate beersLeft,beersDrank,percLeft
    3. check notifications
    */

    //find the most recent entry for this keg
    const latestDataPoint = await this.kegDataRepo.findOne({
      where: { kegId: id },
      order: { date: "DESC" },
    });

    //get baseline values for all kegs
    let { full, tare, net_weight } = kegSizeInfo[relatedKeg.kegSize];

    //update tare weight if needed
    if (weight > full) {
      let customTare = weight - full;
      relatedKeg.customTare = customTare;
      const result = await this.kegRepo.save(relatedKeg);
    } else if (weight < tare + relatedKeg.customTare) {
      let customTare = 0;
      relatedKeg.customTare = customTare;
      const result = await this.kegRepo.save(relatedKeg);
    }

    //percent left
    const percLeft: number = Math.round(
      ((weight - (tare + relatedKeg.customTare)) / net_weight) * 100
    );

    //beers left
    const beersLeft: number = Math.round(
      ((weight - (tare + relatedKeg.customTare)) * 16) / 12.6
    );

    let beersDrank: number = 0;
    if (!latestDataPoint) {
      beersDrank = 0;
    } else {
      beersDrank =
        latestDataPoint.beersLeft - beersLeft < 0
          ? 0
          : latestDataPoint.beersLeft - beersLeft;
    }

    const dataPoint = new KegData();
    dataPoint.kegId = id;
    dataPoint.kegSize = relatedKeg.kegSize;
    dataPoint.percLeft = percLeft;
    dataPoint.temp = temp;
    dataPoint.weight = weight;
    dataPoint.beersDrank = beersDrank;
    dataPoint.beersLeft = beersLeft;
    this.notificationService.checkNotificationsAndSend(id, percLeft);
    return await this.kegDataRepo.save(dataPoint);
  }

  async getKegData(kegId: string) {
    let kd = await this.kegDataRepo.findOne({
      where: { kegId },
      order: { date: "DESC" },
    });
    return kd;
  }

  async getKegNotifications(kegId: string) {
    let kn = await this.kegNotificationRepo.findOne({ where: { kegId } });
    return kn;
  }

  async getDailyBeersDrank(kegId: string, userId: string) {
    let weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    type DailyBeers = {
      dailyBeers: [{ beersDrank: number }];
    };

    const dailyData: DailyBeers = await this.kegDataRepo.query(
      queries.dailyDataQuery,
      [kegId, userId]
    );
    const dailyBeers = await this.kegDataRepo.query(
      `select SUM("beersDrank") as beersDrank from "public".keg_data 
      JOIN "public".keg ON "public".keg_data."kegId" = "public".keg.id
        AND keg."userId" = $1
    WHERE
      "kegId" = $2
      and CAST("createdAt" as DATE)= CURRENT_DATE`,
      [userId, kegId]
    );

    return { dailyBeers: dailyBeers[0], dailyData };
  }
  async getWeeklyBeersDrank(kegId: string, userId: string) {
    const weeklyData = await this.kegDataRepo.query(queries.weeklyDataQuery, [
      userId,
      kegId,
    ]);

    const weeklyBeers = await this.kegDataRepo.query(
      `select SUM("beersDrank") as beersDrank from 
      "public".keg_data 
      JOIN "public".keg ON "public".keg_data."kegId" = "public".keg.id
        AND keg."userId" = $1
      WHERE "kegId" = $2
      and "createdAt" BETWEEN now() - INTERVAL '1w' and now()
      `,
      [userId, kegId]
    );

    return { weeklyBeers: weeklyBeers[0], weeklyData };
  }

  async getMonthlyData(kegId: string, userId: string) {
    const monthlyData = await this.kegDataRepo.query(queries.monthlyDataQuery, [
      userId,
      kegId,
    ]);

    const monthlyBeers = await this.kegDataRepo.query(
      `select SUM("beersDrank") as beersDrank from "public".keg_data 
      JOIN "public".keg ON "public".keg_data."kegId" = "public".keg.id
        AND keg."userId" = $1
      WHERE
      "kegId" = $2
      and "createdAt" BETWEEN now() - INTERVAL '1month' and now()
      `,
      [userId, kegId]
    );
    return { monthlyBeers: monthlyBeers[0], monthlyData };
  }
}
