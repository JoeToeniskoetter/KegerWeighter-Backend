import HttpException from "./HttpException";

import HttpStatusCode from "../../shared/statusCodesEnum";

class KegNotFoundException extends HttpException {
  constructor(id: string) {
    super(HttpStatusCode.NOT_FOUND, `KegerWeighter with id ${id} not found`);
  }
}

export default KegNotFoundException;
