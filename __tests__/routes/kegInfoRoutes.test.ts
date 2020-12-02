import request from "supertest";
import { Connection, getConnection } from "typeorm";
import app from "../../app";
import { createTestData } from "../../src/db/seedData";
import { connection } from "../../src/db/db";

let currConnection: Connection;
let xAuthToken: string;
let xRefreshToken: string;

beforeAll(async (done) => {
  currConnection = await connection();
  await createTestData();

  let initalReq = await request(app).post("/api/auth/login").send({
    email: "test@test.com",
    password: "password",
  });
  xAuthToken = initalReq.headers["x-auth-token"];
  xRefreshToken = initalReq.headers["x-refresh-token"]; // save the token!
  done();
});

let resp: request.Response;

afterAll(async () => {
  await currConnection.close();
});

describe("GET /api/kegs", () => {
  it("Should return an array of kegs", async (done) => {
    resp = await request(app)
      .get("/api/kegs")
      .set("x-auth-token", xAuthToken)
      .set("x-refresh-token", xRefreshToken);
    expect(resp.status).toBe(200);
    expect(resp.body).toHaveLength(2);
    expect(resp.body[0]).toHaveProperty("id");
    expect(resp.body[0]).toHaveProperty("beerType");
    expect(resp.body[0]).toHaveProperty("kegSize");
    expect(resp.body[0]).toHaveProperty("customTare");
    expect(resp.body[0]).toHaveProperty("location");
    expect(resp.body[0]).toHaveProperty("userId");
    //changed array of one to object
    // expect(resp.body[0].data).toHaveLength(1);
    expect(resp.body[0].data).toHaveProperty("id");
    expect(resp.body[0].data).toHaveProperty("kegId");
    expect(resp.body[0].data).toHaveProperty("weight");
    expect(resp.body[0].data).toHaveProperty("temp");
    expect(resp.body[0].data).toHaveProperty("beersLeft");
    expect(resp.body[0].data).toHaveProperty("beersDrank");
    expect(resp.body[0].data).toHaveProperty("percLeft");
    expect(resp.body[0].data).toHaveProperty("date");
    done();
  });

  it("shouldn't return data if an auth token isn't provided", async (done) => {
    let resp = await request(app).get("/api/kegs");
    expect(resp.status).toBe(401);
    expect(resp.body).toHaveProperty("error");
    expect(resp.body.error).toBe("Unauthorized");
    done();
  });
});

describe("/POST /api/keg/:id", () => {
  it("should activate a keg when a user is authenticated and a keg is available", async (done) => {
    let resp = await request(app)
      .post("/api/kegs/test")
      .set("x-auth-token", xAuthToken)
      .set("x-refresh-token", xRefreshToken)
      .send({
        beerType: "coors",
        location: "garage",
        kegSize: "1/2 Barrel",
      });
    expect(resp.status).toBe(201);
    expect(resp.body).toHaveProperty("id");
    expect(resp.body).toHaveProperty("location");
    expect(resp.body).toHaveProperty("kegSize");
    expect(resp.body).toHaveProperty("beerType");
    done();
  });

  it("should deny unauthenticated users from activating kegs", async (done) => {
    resp = await request(app).post("/api/kegs/test").send({
      kegId: "testId",
      beerType: "coors",
      location: "garage",
      kegSize: "1/2 Barrel",
    });
    expect(resp.status).toBe(401);
    expect(resp.body.error).toBe("Unauthorized");
    done();
  });

  it("should throw and error if the following fields are missing [location, beerType, kegSize]", async (done) => {
    resp = await request(app)
      .post("/api/kegs/test")
      .set("x-auth-token", xAuthToken)
      .set("x-refresh-token", xRefreshToken)
      .send({
        beerType: "",
        location: "",
        kegSize: "",
      });

    expect(resp.status).toBe(400);
    expect(resp.body).toHaveProperty("errors");
    expect(resp.body.errors).toHaveLength(3);
    done();
  });

  it("should throw and error if the keg size is not supported", async (done) => {
    resp = await request(app)
      .post("/api/kegs/test")
      .set("x-auth-token", xAuthToken)
      .set("x-refresh-token", xRefreshToken)
      .send({
        beerType: "Coors",
        location: "Kitchen",
        kegSize: "some keg size",
      });

    expect(resp.status).toBe(400);
    expect(resp.body).toHaveProperty("errors");
    expect(resp.body.errors).toHaveLength(1);
    done();
  });

  it("should not throw and error if the keg size supported", async (done) => {
    resp = await request(app)
      .post("/api/kegs/test")
      .set("x-auth-token", xAuthToken)
      .set("x-refresh-token", xRefreshToken)
      .send({
        beerType: "Coors",
        location: "Kitchen",
        kegSize: "1/2 Barrel",
      });

    expect(resp.status).toBe(201);
    expect(resp.body).toHaveProperty("beerType");
    expect(resp.body).toHaveProperty("kegSize");
    expect(resp.body).toHaveProperty("location");
    done();
  });
});

describe("PUT /api/keg/:id", () => {
  it("should only allow authenticated useres to make updates", async (done) => {
    resp = await request(app).put("/api/kegs/test");
    expect(resp.status).toBe(401);
    expect(resp.body).toHaveProperty("error");
    expect(resp.body.error).toBe("Unauthorized");
    done();
  });
  it("should only update fields that are not null", async (done) => {
    resp = await request(app)
      .put("/api/kegs/test")
      .set("x-auth-token", xAuthToken)
      .set("x-refresh-token", xRefreshToken)
      .send({
        beerType: "Coors",
        location: "Kitchen",
        kegSize: "Pony Keg",
      });
    expect(resp.status).toBe(200);
    expect(resp.body).toHaveProperty("id");
    expect(resp.body).toHaveProperty("beerType");
    expect(resp.body).toHaveProperty("location");
    expect(resp.body.location).toBe("Kitchen");
    expect(resp.body.beerType).toBe("Coors");
    expect(resp.body.kegSize).toBe("Pony Keg");
    done();
  });
});
