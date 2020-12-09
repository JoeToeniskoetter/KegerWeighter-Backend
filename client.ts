import * as io from "socket.io-client";
import { KegEvents, KegUpdate } from "./src/shared/types";
// ?x-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoiZW1haWxAZW1haWwuY29tIiwiaWQiOiI2MTgzNzM2ZS1lZmM0LTQwYzUtOWQxYi1iMTliODlhNzZjNGMifSwiaWF0IjoxNjA2ODczNzYxLCJleHAiOjE2MDY5NjAxNjF9.oZ_QU-lWpR68Yrm6Izgfy2D3CCZgoC91KO8W75cIjHc"

const client = io(
  "http://localhost:3000/user/feed?x-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlkIjoiNDQ3MTJjYjEtOTYyMS00MDIxLWJlMWEtNDdmYmY5ZWE3YmZjIn0sImlhdCI6MTYwNzUyNTczMiwiZXhwIjoxNjA3NjEyMTMyfQ.-144FK8HlhxNjU02ZCT3WNzY44tAr0bOnbioAefzDa8"
);
client.on("connect", () => {
  console.log("connected");
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
  console.log(e);
});
client.on("connect_failed", (e: any) => {
  console.log(e);
});
