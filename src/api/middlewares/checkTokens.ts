import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../../db/entity/User";
import { getConnection } from "typeorm";
import { createTokens } from "./createTokens";
import HttpStatusCode from "../../shared/statusCodesEnum";
import { nextTick } from "process";
import { Socket } from "dgram";
import { Keg } from "../../db/entity/Keg";
import UnauthorizedException from "../../api/exceptions/UnauthorizedException";
require("dotenv").config();

export async function checkTokens(req: any, res: Response, next: NextFunction) {
  let xAuthToken: any = req.headers["x-auth-token"];
  let xRefreshToken: any = req.headers["x-refresh-token"];
  if (!xRefreshToken || !xAuthToken) {
    return next(new UnauthorizedException());
  }
  try {
    jwt.verify(xAuthToken, process.env.JWT_SECRET || "");
    let decodeduser: any = jwt.decode(xAuthToken);
    req.user = decodeduser.user;
    next();
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      //main auth header is expired. check if refresh token is expired

      try {
        let userFromToken: any = jwt.decode(xAuthToken);
        if (userFromToken.id) {
          const connection = await getConnection();
          const userRepo = connection.getRepository(User);
          const userFromDb = await userRepo.findOne({ id: userFromToken.id });

          if (!userFromDb) {
            return next(new UnauthorizedException());
          }
          jwt.verify(
            xRefreshToken,
            `${process.env.JWT_SECRET}${userFromDb.password}`
          );
          const tokens = await createTokens(userFromDb);
          res.setHeader("x-auth-token", tokens.xAuthToken);
          res.setHeader("x-refresh-token", tokens.xRefreshToken);
          return next();
        } else {
          return next(new UnauthorizedException());
        }
      } catch (e) {
        return next(new UnauthorizedException());
      }
    } else {
      return next(new UnauthorizedException());
    }
  }
}
