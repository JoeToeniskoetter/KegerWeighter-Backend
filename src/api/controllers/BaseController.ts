import { Router } from "express";

interface IBaseController {
  path: string;
  initializeRoutes: () => void;
  router: Router;
}

interface Controller {
  path: string;
  router: Router;
  initializeRoutes: () => void;
}

export default Controller;
