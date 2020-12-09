import * as express from "express";
import * as cors from "cors";
import * as helmet from "helmet";
import Controller from "./src/api/controllers/BaseController";
import errorMiddleware from "./src/api/middlewares/errorMiddelware";
import * as morgan from "morgan";

require("dotenv").config();

export class App {
  public app;
  private controllers: Controller[];
  constructor(controllers: Controller[]) {
    this.app = express();
    this.controllers = controllers;
    this.config();
    this.initializeRoutes();
    this.initializeErrorHandler();
  }

  config() {
    console.log("running config");
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(morgan("dev"));
    this.app.use(helmet());
  }

  initializeRoutes() {
    this.controllers.forEach((controller: Controller) => {
      this.app.use("/", controller.router);
    });
  }
  initializeErrorHandler() {
    this.app.use(errorMiddleware);
  }
}
