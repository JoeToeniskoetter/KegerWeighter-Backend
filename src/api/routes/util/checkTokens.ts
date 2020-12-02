import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../../../db/entity/User";
import { getConnection } from "typeorm";
import { createTokens } from "./createTokens";
import HttpStatusCode from "../../../shared/statusCodesEnum";
require("dotenv").config();

export async function checkTokens(req: any, res: Response, next: NextFunction) {
  let xAuthToken: any = req.headers["x-auth-token"];
  let xRefreshToken: any = req.headers["x-refresh-token"];
  if (!xRefreshToken || !xAuthToken) {
    return next({
      status: HttpStatusCode.UNAUTHORIZED,
      error: "Unauthorized",
    });
  }

  try {
    jwt.verify(xAuthToken, process.env.JWT_SECRET || "");
    let decodeduser: any = jwt.decode(xAuthToken);
    req.user = decodeduser.user;
    next();
  } catch (e) {
    if (jwt.TokenExpiredError) {
      //main auth header is expired. check if refresh token is expired

      try {
        let userFromToken: any = jwt.decode(xAuthToken);
        if (userFromToken.id) {
          const connection = await getConnection();
          const userRepo = connection.getRepository(User);
          const userFromDb = await userRepo.findOne({ id: userFromToken.id });

          if (!userFromDb) {
            return next({
              status: HttpStatusCode.UNAUTHORIZED,
              error: "Invalid auth token",
            });
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
          return next({
            status: HttpStatusCode.UNAUTHORIZED,
            error: "Invalid auth token",
          });
        }
      } catch (e) {
        return next({
          status: HttpStatusCode.UNAUTHORIZED,
          error: "Invalid auth token",
        });
      }
    } else {
      return next({
        status: HttpStatusCode.UNAUTHORIZED,
        error: "Invalid auth token",
      });
    }
  }
}
