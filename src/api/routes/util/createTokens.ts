import jwt from "jsonwebtoken";
import { User } from "../../../db/entity/User";
require("dotenv").config();

type AuthTokens = {
  xAuthToken: string;
  xRefreshToken: string;
};

export function createTokens(user: User): AuthTokens {
  const reducedUser = { email: user.email, id: user.id };
  const xAuthToken = jwt.sign(
    { user: reducedUser },
    process.env.JWT_SECRET || "",
    {
      expiresIn: "1d",
    }
  );
  const xRefreshToken = jwt.sign(
    { user: reducedUser },
    `${process.env.JWT_SECRET}${user.password}`,
    {
      expiresIn: "7d",
    }
  );

  return { xAuthToken, xRefreshToken };
}
