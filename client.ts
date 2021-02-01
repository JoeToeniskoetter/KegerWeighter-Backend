import * as io from "socket.io-client";
import { KegEvents, KegUpdate } from "./src/shared/types";

const client = io("http://localhost:3000/?x-keg-token=username:password", {
  forceNew: true,
});
client.on("connect", () => {
  console.log("connected");
  setInterval(() => {
    let weight = Math.random() * (165 - 30) + 30;
    let temp = Math.random() * (32 - 50) + 32;
    console.log("sending data");
    client.emit(KegEvents.UPDATE, {
      weight,
      temp,
    });
  }, 4500);
});

const client2 = io(
  "http://localhost:3000/?x-keg-token=3FE8D718-21F7-C8F7-D3D3-A9EE26F69C58:password",
  {
    forceNew: true,
  }
);

client2.on("connect", () => {
  console.log("connected");
  setInterval(() => {
    let weight = Math.random() * (165 - 30) + 30;
    let temp = Math.random() * (32 - 50) + 32;
    console.log("sending data");
    client2.emit(KegEvents.UPDATE, {
      weight,
      temp,
    });
  }, 2000);
});

const client3 = io(
  "http://localhost:3000/?x-keg-token=ef9c6a82-7b13-42d6-a898-a8eb0be797e7:password",
  {
    forceNew: true,
  }
);

client3.on("connect", () => {
  console.log("connected");
  setInterval(() => {
    let weight = Math.random() * (165 - 30) + 30;
    let temp = Math.random() * (32 - 50) + 32;
    console.log("sending data");
    client3.emit(KegEvents.UPDATE, {
      weight,
      temp,
    });
  }, 3000);
});

const client4 = io("http://localhost:3000/?x-keg-token=test:password", {
  forceNew: true,
});

client4.on("connect", () => {
  console.log("connected");
  setInterval(() => {
    let weight = Math.random() * (165 - 30) + 30;
    let temp = Math.random() * (32 - 50) + 32;
    console.log("sending data");
    client4.emit(KegEvents.UPDATE, {
      weight,
      temp,
    });
  }, 2500);
});

client.on(KegEvents.UPDATE, (data: any) => {
  console.log("update", data);
});

client.on(KegEvents.CONNECT, (data: any) => {
  console.log("keg.connected", data);
});

client.on(KegEvents.DISCONNECT, (data: any) => {
  console.log("keg disconnected", data);
});

client.on("disconnect", () => {
  console.log("disconnected");
});
client.on("connect_error", (e: any) => {
  console.log(e.message);
});
client.on("connect_failed", (e: any) => {
  console.log(e.message);
});
