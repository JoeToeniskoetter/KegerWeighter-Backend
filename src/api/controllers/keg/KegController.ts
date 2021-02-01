import { NextFunction, Router, Response, Request } from "express";
import { getConnection } from "typeorm";
import { Keg } from "../../../db/entity/Keg";
import { KegData } from "../../../db/entity/KegData";
import { KegNotification } from "../../../db/entity/KegNotification";
import ActivateKegDto from "./dto/keg.dto";
import Controller from "../BaseController";
import validationMiddleware from "../../middlewares/validationMiddleware";
import KegDataService from "../../../api/services/KegDataService";
import { checkTokens } from "../../middlewares/checkTokens";
import UpdateKegDto from "./dto/updateKeg.dto";
import KegNotificationService from "../../../api/services/KegNotificationService";

class KegController implements Controller {
  public path: string = "/api/kegs";
  public router: Router = Router();
  private kegDataService = new KegDataService();
  private kegNofiticationService = new KegNotificationService();

  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {
    // this.router.post(this.path.concat("/notify"), this.testNotifications);
    this.router.post(
      this.path.concat("/:id"),
      checkTokens,
      validationMiddleware(ActivateKegDto),
      this.activateKeg
    );
    this.router.get(this.path, checkTokens, this.getKegs);
    this.router.put(
      this.path.concat("/:id"),
      checkTokens,
      validationMiddleware(UpdateKegDto),
      this.updateKeg
    );
    this.router.get(
      this.path.concat("/:id/summary"),
      checkTokens,
      this.getKegSummary
    );
  }

  //Get Kegs
  public getKegs = async (req: any, res: Response, next: NextFunction) => {
    try {
      res.json(await this.kegDataService.getKegs(req.user.id));
    } catch (e) {
      next(e);
    }
  };

  public activateKeg = async (req: any, res: Response, next: NextFunction) => {
    const kegData: ActivateKegDto = req.body;
    const kegId: string = req.params.id;
    try {
      res.json(
        await this.kegDataService.activateKeg(kegId, kegData, req.user.id)
      );
    } catch (e) {
      next(e);
    }
  };
  public updateKeg = async (req: any, res: Response, next: NextFunction) => {
    const kegData: UpdateKegDto = req.body;
    const kegId: string = req.params.id;

    try {
      res.json(
        await this.kegDataService.updateKeg(kegId, kegData, req.user.id)
      );
    } catch (e) {
      next(e);
    }
  };

  public testNotifications = async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    await this.kegNofiticationService.sendNotifications(req.body.kegId);
    res.json({ message: "ok" });
  };
  public getKegSummary = async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    try {
      res.json(
        await this.kegDataService.getKegSummary(req.params.id, req.user.id)
      );
    } catch (e) {
      next(e);
    }
  };
}

export default KegController;
