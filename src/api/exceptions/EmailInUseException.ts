import HttpException from "./HttpException";

class EmailInUseException extends HttpException {
  constructor() {
    super(400, "Email In Use");
  }
}

export default EmailInUseException;
