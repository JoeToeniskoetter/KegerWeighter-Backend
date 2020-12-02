import request from "supertest";
import { Connection, getConnection } from "typeorm";
import app from "../../app";
import { connection } from "../../src/db/db";
import { User } from "../../src/db/entity/User";
import { v4 as uuidv4 } from "uuid";

let currConnection: Connection;

beforeAll(async () => {
  currConnection = await connection();
  let userRepo = await currConnection.getRepository(User);
  let foundUser = await userRepo.find({ where: { email: "email@email.com" } });
  await userRepo.remove(foundUser);
});

let resp: request.Response;

afterAll(async () => {
  await currConnection.close();
});

describe("POST /api/register", () => {
  it("It shoud return a user object when correct info provided", async (done) => {
    resp = await request(app)
      .post("/api/auth/register")
      .send({ email: "email@email.com", password: "password" });
    expect(resp.status).toBe(200);
    expect(resp.body).toHaveProperty("email");
    expect(resp.body).toHaveProperty("id");
    done();
  });

  it("It should return an error object when email or password not provided", async (done) => {
    resp = await request(app)
      .post("/api/auth/register")
      .send({ email: "", password: "" });
    expect(resp.status).toBe(400);
    expect(resp.body).toHaveProperty("errors");
    expect(resp.body.errors).toHaveLength(2);
    done();
  });
});

describe("POST /api/auth/login ", () => {
  beforeAll(async () => {
    let tempConnection = getConnection();
    let repo = tempConnection.getRepository(User);

    let testUserToDelete = await repo.find({
      where: { email: "test@email.com" },
    });
    await repo.remove(testUserToDelete);
    let testUser = new User();
    testUser.email = "test@email.com";
    testUser.password = "password";
    testUser.id = uuidv4();
    await repo.save(testUser);
  });
  it("It should respond with a 200 status with good credentials", async (done) => {
    resp = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@email.com", password: "password" });
    expect(resp.status).toBe(200);
    let headers = Object.keys(resp.headers);
    expect(headers).toContain("x-auth-token");
    expect(headers).toContain("x-refresh-token");
    done();
  });
});

describe("POST /api/auth/resetpassword", () => {
  it("should insert a new password reset token when a users requests it with a valid email", async (done) => {
    resp = await request(app).post("/api/auth/resetpassword").send({
      email: "email@email.com",
    });
    expect(resp.status).toBe(200);
    expect(resp.body).toHaveProperty("message");

    let newToken = (
      await currConnection
        .getRepository(User)
        .findOne({ where: { email: "email@email.com" } })
    )?.passwordResetToken;

    expect(newToken).toHaveLength(36);
    done();
  });
  it("should return a status of 200 regardless of email entered", async (done) => {
    resp = await request(app).post(`/api/auth/resetpassword`);
    expect(resp.status).toBe(200);
    expect(resp.body).toHaveProperty("message");
    expect(resp.body.message).toBe("complete");
    done();
  });
  it("should create a new password when providing the correct email and password reset token", async (done) => {
    let user = await currConnection
      .getRepository(User)
      .findOne({ where: { email: "email@email.com" } });
    if (!user) throw new Error("user not found");
    let { password: oldPassword, passwordResetToken } = user;

    resp = await request(app)
      .post(`/api/auth/newpassword?token=${passwordResetToken}`)
      .send({
        newPassword: "passwordNew",
      });

    let updatedUser = await currConnection
      .getRepository(User)
      .findOne({ where: { email: "email@email.com" } });
    if (!updatedUser) throw new Error("user not found");
    let { password: newPassword } = updatedUser;
    expect(resp.status).toBe(200);
    expect(newPassword).not.toBe(oldPassword);

    //try to login with the new password
    resp = await request(app).post("/api/auth/login").send({
      email: "email@email.com",
      password: "passwordNew",
    });
    expect(resp.status).toBe(200);
    let headers = Object.keys(resp.headers);
    expect(headers).toContain("x-auth-token");
    expect(headers).toContain("x-refresh-token");
    done();
  });
});
