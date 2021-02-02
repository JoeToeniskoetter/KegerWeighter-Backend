import { NextFunction, Router, Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";
import { User } from "../../../db/entity/User";
import InvalidCredentialsException from "../../exceptions/InvalidCredentialsException";
import Controller from "../BaseController";
import validationMiddleware from "../../middlewares/validationMiddleware";
import CreateUserDto from "./dto/user.dto";
import AuthService from "../../services/AuthService";
import { checkTokens } from "../../../api/middlewares/checkTokens";

class AuthController implements Controller {
  public path = "/api/auth";
  public router = Router();
  private authService = new AuthService();

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    //login route
    this.router.post(this.path.concat("/login"), this.login);
    this.router.post(
      this.path.concat("/register"),
      validationMiddleware(CreateUserDto),
      this.register
    );
    this.router.post(this.path.concat("/resetpassword"), this.resetPassword);
    this.router.post(this.path.concat("/newpassword"), this.newPassword);
    this.router.post(
      this.path.concat("/subscribe"),
      checkTokens,
      this.subscribe
    );
    this.router.post(
      this.path.concat("/unsubscribe"),
      checkTokens,
      this.unsubscribe
    );
  }

  public register = async (req: Request, res: Response, next: NextFunction) => {
    const userData: CreateUserDto = req.body;
    try {
      let {
        tokens: { xAuthToken, xRefreshToken },
        user: { email, id },
      } = await this.authService.register(userData);
      res.setHeader("x-auth-token", xAuthToken);
      res.setHeader("x-refresh-token", xRefreshToken);
      res.json({
        email,
        id,
      });
    } catch (e) {
      next(e);
    }
  };
  public login = async (req: any, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new InvalidCredentialsException());
    }

    try {
      let { xAuthToken, xRefreshToken } = await this.authService.login({
        email,
        password,
      });
      res.setHeader("x-auth-token", xAuthToken);
      res.setHeader("x-refresh-token", xRefreshToken);
      res.json({ message: "ok" });
    } catch (e) {
      next(e);
    }
  };

  public subscribe = async (req: any, res: Response, next: NextFunction) => {
    console.log(req.user);

    if (!req.body.fcmToken) {
      return next(new InvalidCredentialsException());
    }

    try {
      const result = await this.authService.subscribeToTopics(
        req.body.fcmToken,
        req.user.id
      );
      res.json({ message: "ok" });
    } catch (e) {
      return res.json({ message: "ok" });
    }
  };

  public unsubscribe = async (req: any, res: Response, next: NextFunction) => {
    if (!req.body.fcmToken) {
      return next(new InvalidCredentialsException());
    }

    try {
      const result = await this.authService.unSubscribeToTopics(
        req.body.fcmToken
      );
      return res.json({ message: "ok" });
    } catch (e) {
      console.log("e");
      return next(e);
    }
  };

  async verifyResetPasswordTokenAndGetUser(
    passwordResetToken: string
  ): Promise<User | null> {
    const userRepo = await getConnection().getRepository(User);
    let foundUser = await userRepo.findOne({ where: { passwordResetToken } });

    if (!foundUser) {
      return null;
    }

    return foundUser;
  }

  public resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const email = req.body.email;
    console.log(req.body);

    if (!email) {
      next();
    }
    try {
      await this.authService.resetPassword(email);
      res.json({ message: "ok" });
    } catch (e) {
      next(e);
    }
  };

  public newPassword = async (req: any, res: Response, next: NextFunction) => {
    if (req.query.token && req.body.newPassword) {
      try {
        const result = await this.authService.newPassword(
          req.query.token,
          req.body.newPassword
        );
        res.json({ message: "ok" });
      } catch (e) {
        next(e);
      }
    }
    return next();
  };
}

export default AuthController;
