import { Server } from "http";
import { checkKegToken } from "./src/websocketServer/middlewares/kegAuthMiddleware";
import { checkSocketTokens } from "./src/websocketServer/middlewares/userAuthMiddleware";
import { KegEvents, KegUpdate } from "./src/shared/types";
import * as io from "socket.io";
import KegDataService from "./src/api/services/KegDataService";

export class SocketServer {
  private io: io.Server;
  private userFeedNameSpace: io.Namespace;
  private kegDataService = new KegDataService();

  constructor(server: Server) {
    this.io = io.listen(server);
    this.userFeedNameSpace = this.io.of("/user/feed");
    this.initEventListeners();
  }

  initEventListeners() {
    this.io.use(checkKegToken);
    this.userFeedNameSpace.use(checkSocketTokens);
    this.userFeedNameSpace.on("connection", this.onUserConnect);
    this.io.on("connection", this.onKegConnect);
  }

  public onUserConnect = async (socket: any) => {
    await socket.join(socket.user.id);
    socket.on("connect_error", (err: any) => console.log(err));
    socket.on("connect_failed", (err: any) => console.log(err));
  };

  public onKegConnect = (socket: any) => {
    if (!socket.keg) {
      // socket.disconnect();
      return;
    }

    //keg connected, let the user know
    this.io
      .of("/user/feed")
      .to(socket.keg.userId)
      .emit(KegEvents.CONNECT, { id: socket.keg.id });

    //if keg sends an update, let the user know
    this.onKegUpdate(socket);

    //if keg disconnects, let the user know
    this.onKegDisconnnect(socket);
  };

  public onKegUpdate = (socket: any) => {
    socket.on(KegEvents.UPDATE, async (data: KegUpdate) => {
      let kegId = socket.keg.id;
      if (!data.weight && !data.temp) {
        return;
      }
      try {
        const newData = await this.kegDataService.insertNewKegData({
          id: kegId,
          weight: Math.round(Number(data.weight)),
          temp: Math.round(Number(data.temp)),
        });

        if (!newData) {
          return;
        }
        return this.io
          .of("/user/feed")
          .to(socket.keg.userId)
          .emit(`${KegEvents.UPDATE}.${socket.keg.id}`, newData);
      } catch (e) {
        console.log(e);
      }
    });
  };
  onKegDisconnnect(socket: any) {
    this.io
      .of("/user/feed")
      .to(socket.keg.userId)
      .emit(KegEvents.DISCONNECT, { id: socket.keg.id });
  }
}
