import HttpException from "./HttpException";

class InvalidCredentialsException extends HttpException {
  constructor() {
    super(400, "Invalid Credentials");
  }
}

export default InvalidCredentialsException;
