import { NextFunction, Request, Response, Router } from "express";
import { Keg } from "../../db/entity/Keg";
import { getConnection, getRepository } from "typeorm";
import { KegData } from "../../db/entity/KegData";
import { User } from "../../db/entity/User";
import HttpStatusCode from "../../shared/statusCodesEnum";
import { body, validationResult } from "express-validator";
require("dotenv").config();

const router = Router();

const kegSizes = [
  "1/2 Barrel",
  "1/4 Barrel",
  "Pony Keg",
  "1/6 Barrel",
  "1/8 Barrel",
  "50 Litre",
  "Cornelious Keg",
];

const validators = {
  activateKeg: [
    body("location").isLength({ min: 1 }),
    body("kegSize")
      .custom((kegSize, { req }) => kegSizes.some((x) => x === kegSize))
      .withMessage("Invalid Keg Size"),
    body("beerType").isLength({ min: 1 }),
  ],
  updateKeg: [
    body("location").isLength({ min: 1 }).optional(true),
    body("kegSize")
      .optional(true)
      .custom((kegSize, { req }) => kegSizes.some((x) => x === kegSize))
      .withMessage("Invalid Keg Size"),
    body("beerType").optional(true).isLength({ min: 1 }),
  ],
};

async function getKegData(kegId: string) {
  const kdRepo = await getConnection().getRepository(KegData);
  let kd = await kdRepo.findOne({
    where: { kegId },
    order: { date: "DESC" },
  });
  return kd;
}

//Get Kegs
router.get("/kegs", async (req: any, res: Response, next: NextFunction) => {
  const connection = getConnection();
  const kegRepo = connection.getRepository(Keg);

  let data = await kegRepo.find({ where: { userId: req.user.id } });
  let x = await Promise.all(
    data.map(async (keg: any) => {
      let data = await getKegData(keg.id);
      return { ...keg, data };
    })
  );
  res.json(x);
});

//create/active keg
router.post(
  "/kegs/:id",
  validators.activateKeg,
  async (req: any, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { location, beerType, kegSize } = req.body;
    const kegRepo = await getConnection().getRepository(Keg);
    try {
      const keg = await kegRepo.findOne({ where: { id } });
      if (!keg) {
        return next({
          status: HttpStatusCode.BAD_REQUEST,
          error: "keg not found",
        });
      }
      keg.userId = req.user.id;
      let savedKeg = await kegRepo.save({
        ...keg,
        userId: req.user.id,
        location,
        beerType,
        kegSize,
      });
      res.status(HttpStatusCode.CREATED).json(savedKeg);
    } catch (e) {
      console.log(e);
      return next(e);
    }
  }
);

//Update Keg
router.put(
  "/kegs/:id",
  validators.updateKeg,
  async (req: any, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { location, beerType, kegSize } = req.body;
      const { id } = req.params;
      const kegRepo = getConnection().getRepository(Keg);
      const foundKeg = await kegRepo.findOne({ where: { id } });

      if (!foundKeg) {
        return next({ status: 400, error: "No Keg found" });
      }
      foundKeg.kegSize = kegSize || foundKeg.kegSize;
      foundKeg.location = location || foundKeg.location;
      foundKeg.beerType = beerType || foundKeg.beerType;

      let updatedKeg = await kegRepo.save(foundKeg);
      return res.json(updatedKeg);
    } catch (e) {
      return next();
    }
  }
);

export default router;
