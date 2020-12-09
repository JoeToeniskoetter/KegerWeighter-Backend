import HttpStatusCode from "../../shared/statusCodesEnum";

class HttpException extends Error {
  status: HttpStatusCode;
  message: string;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export default HttpException;
