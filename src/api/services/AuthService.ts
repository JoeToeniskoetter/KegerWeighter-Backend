import * as jwt from "jsonwebtoken";
import { getRepository, Repository } from "typeorm";
import { User } from "../../db/entity/User";
import CreateUserDto from "../controllers/auth/dto/user.dto";
import EmailInUseException from "../exceptions/EmailInUseException";
import InvalidCredentialsException from "../exceptions/InvalidCredentialsException";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "../../api/util/sendEmail";
require("dotenv").config();

type AuthTokens = {
  xAuthToken: string;
  xRefreshToken: string;
};

class AuthService {
  private userRepo: Repository<User> = getRepository(User);

  constructor() {}

  public async register(userData: CreateUserDto) {
    let foundUser = await this.userRepo.findOne({
      where: { email: userData.email.toLowerCase() },
    });
    console.log(foundUser);
    if (foundUser) {
      throw new EmailInUseException();
    } else {
      console.log(foundUser);
      const user = new User();
      user.email = userData.email.toLowerCase();
      user.password = userData.password;
      await this.userRepo.save(user);
      const tokens = this.createTokens(user);
      return {
        tokens,
        user,
      };
    }
  }

  public async login(userData: { email: string; password: string }) {
    let foundUser = await this.userRepo.findOne({
      where: { email: userData.email.toLowerCase() },
    });

    console.log(foundUser);
    if (!foundUser) {
      throw new InvalidCredentialsException();
    }

    if (await foundUser.passwordCorrect(userData.password)) {
      const tokens = this.createTokens(foundUser);
      return tokens;
    } else {
      throw new InvalidCredentialsException();
    }
  }

  public async resetPassword(email: string) {
    const foundUser = await this.userRepo.findOne({ where: { email } });
    if (!foundUser) {
      return email;
    }

    foundUser.generatePasswordResetToken();
    await this.userRepo.save(foundUser);
    sendEmail(foundUser.email, foundUser.passwordResetToken);
    return email;
  }

  public async newPassword(passwordResetToken: string, newPassword: string) {
    const record = await this.userRepo.findOne({
      where: { passwordResetToken },
    });
    if (!record) {
      throw new Error("shut up");
    }
    record.password = await record.newPassword(newPassword);
    record.passwordResetToken = null;
    record.passwordResetTokenExp = null;
    this.userRepo.save(record);
  }

  createTokens(user: User): AuthTokens {
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
}

export default AuthService;
