import { plainToClass } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { NextFunction, Request, RequestHandler, Response } from "express";
import HttpException from "../exceptions/HttpException";

function validationMiddleware<T>(type: any): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    validate(plainToClass(type, req.body)).then((errors: ValidationError[]) => {
      if (errors.length > 0) {
        const message = errors
          .map((error: ValidationError) =>
            Object.values(error.constraints || {})
          )
          .join(", ");
        next(new HttpException(400, message));
      } else {
        return next();
      }
    });
  };
}

export default validationMiddleware;
