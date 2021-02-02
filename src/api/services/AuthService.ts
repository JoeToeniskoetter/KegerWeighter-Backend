import * as jwt from "jsonwebtoken";
import { getRepository, Repository } from "typeorm";
import { User } from "../../db/entity/User";
import CreateUserDto from "../controllers/auth/dto/user.dto";
import EmailInUseException from "../exceptions/EmailInUseException";
import InvalidCredentialsException from "../exceptions/InvalidCredentialsException";
import { v4 as uuidv4 } from "uuid";
import * as admin from "firebase-admin";
import { sendEmail } from "../../api/util/sendEmail";
import { UserTokens } from "../../db/entity/UserTokens";
import { Keg } from "../../db/entity/Keg";
import { messaging } from "firebase-admin";
import fetch from "node-fetch";
require("dotenv").config();

type AuthTokens = {
  xAuthToken: string;
  xRefreshToken: string;
};

class AuthService {
  private userRepo: Repository<User> = getRepository(User);
  private kegRepo: Repository<Keg> = getRepository(Keg);

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
    const foundUser = await this.userRepo.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (!foundUser) {
      console.log("email not found");
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

  public async subscribeToTopics(fcmToken: string, userId: string) {
    const kegsToSubscribe = await this.kegRepo.find({ where: { userId } });

    kegsToSubscribe.forEach(async (keg) => {
      if (keg.subscribed) {
        await messaging().subscribeToTopic(fcmToken, keg.id);
      }
    });
  }

  public async unSubscribeToTopics(fcmToken: string) {
    console.log(process.env.SERVER_KEY);

    //     https://iid.googleapis.com/iid/info/e7I6KSEbyUfeupfmiEa0eF:APA91bHEM0WWRPpUp87KUnhIxqdKc5ChEpQtFdLG5M-xSgvir61VNQreWKe5zFjlFpydrau_abYMnc0bi606JYptK6oQbby7UxrpcuiLLAbQI_Bqdm4KMZ9SK3gmLDox-fdL-0cO0TiE?details=true' \
    // --header 'Authorization: Bearer AAAAXV5N8sM:APA91bGa6C_7bgKgVQhD7OPZ4b0VmvRPh86J1r9cT9Iqyusm4h1uU5cWYv_whWlUV9pbB_y1jvMoZ6xvHE01u-UHx2tmLtryAplF0xMh_jhhJYtjiseC9cw55ztIDXc9ibcRyekSgq2f'

    const result = await fetch(
      `https://iid.googleapis.com/iid/info/${fcmToken}?details=true`,
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.SERVER_KEY}`,
        },
      }
    );
    if (result.ok) {
      const json = await result.json();
      if (json.rel && json.rel.topics) {
        const topics: string[] = Object.keys(json.rel.topics);
        topics.forEach(
          async (topic) =>
            await messaging().unsubscribeFromTopic(fcmToken, topic)
        );
      }
    } else {
      console.log(result);
      throw new Error("An error occured");
    }
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
