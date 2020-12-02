import { NextFunction, Request, Response, Router } from "express";
import { User } from "../../db/entity/User";
import { EntityManager, getConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
const { body, validationResult } = require("express-validator");
import { createTokens } from "./util/createTokens";
import { sendEmail } from "./util/sendEmail";
require("dotenv").config();

const router = Router();
const JWT_SECRET: string = process.env.JWT_SECRET || "";

const validators = {
  register: [body("email").isEmail(), body("password").isLength({ min: 6 })],
  login: [body("email").isEmail(), body("password").exists()],
  newPassword: [body("newPassword").isLength({ min: 6 })],
};

router.post("/login", validators.login, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  let conn = await getConnection();
  const repo = await conn.getRepository(User);
  const user: User | undefined = await repo.findOne({ where: { email } });

  if (user && (await user.passwordCorrect(password))) {
    const { xAuthToken, xRefreshToken } = createTokens(user);
    res.setHeader("x-auth-token", xAuthToken);
    res.setHeader("x-refresh-token", xRefreshToken);
    res.json({ message: "success" });
  } else {
    res.json({ message: "passwords dont match" });
  }
});

router.post(
  "/register",
  validators.register,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let conn = await getConnection();
      const repo = await conn.getRepository(User);

      //check if user exists
      const foundUser = await repo.findOne({
        where: { email: req.body.email },
      });

      //return error if user exists
      if (foundUser) return next({ message: "Email in use" });

      //create a new user
      const user = new User();
      user.email = req.body.email;
      user.password = req.body.password;
      user.id = uuidv4();
      const saveduser = await repo.save(user);

      //send back new user
      return res.json({ email: saveduser.email, id: saveduser.id });
    } catch (e) {
      console.log(e.message);
      return next(e);
    }
  }
);

async function verifyResetPasswordTokenAndGetUser(
  passwordResetToken: string
): Promise<User | null> {
  const userRepo = await getConnection().getRepository(User);
  let foundUser = await userRepo.findOne({ where: { passwordResetToken } });

  if (!foundUser) {
    return null;
  }

  return foundUser;
}

router.post(
  "/resetpassword",
  async (req: Request, res: Response, next: NextFunction) => {
    let userRepo = getConnection().getRepository(User);

    const { email } = req.body;
    const foundUser = await userRepo.findOne({ where: { email } });
    if (!foundUser) {
      return res.status(200).json({ message: "complete" });
    }

    foundUser.generatePasswordResetToken();
    await userRepo.save(foundUser);
    // sendEmail();
    return res.status(200).json({ message: "complete" });
  }
);

router.post(
  "/newpassword",
  validators.newPassword,
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.query.token) {
      const userRepo = getConnection().getRepository(User);
      const result = await verifyResetPasswordTokenAndGetUser(
        req.query.token as string
      );
      if (result) {
        result.password = await result.newPassword(req.body.newPassword);
        let update = await userRepo.save(result);
        return res.json({ message: "ok" });
      }
    }
    return next();
  }
);

export default router;
