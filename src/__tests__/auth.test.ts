import { Hono } from "hono";
import { serve } from "@hono/node-server";
import request from "supertest";
import { AuthRoute } from "../routes/Auth";
import { collection, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../configs/firebase";

describe("AuthRoute", () => {
  const app = new Hono();
  let server: any;

  beforeAll(() => {
    const authRoute = new AuthRoute();
    authRoute.register(app);

    server = serve(app);
  });

  afterAll(async () => {
    const productsSnapshot = await getDocs(collection(db, "users"));
    const deletePromises = productsSnapshot.docs
      .filter((item) => item?.data()?.username?.toLowerCase() === "testuser")
      .map((doc) => deleteDoc(doc.ref));

    await Promise.all(deletePromises);

    server.close();
  });

  it("should register a new user", async () => {
    const response = await request(server)
      .post("/register")
      .send({
        username: "testuser",
        email: `test.${Date.now().toString()}@example.com`,
        password: "password123",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User registered successfully");
  });

  it("should not register an existing user", async () => {
    const payload = {
      username: "testuser",
      email: `test.${Date.now().toString()}@example.com`,
      password: "password123",
    };

    await request(server).post("/register").send(payload);
    const response = await request(server).post("/register").send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("User already exists");
  });

  it("should login an existing user", async () => {
    await request(server).post("/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "password123",
    });

    const response = await request(server).post("/login").send({
      email: "testuser@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBeDefined();
  });

  it("should not login with incorrect password", async () => {
    await request(server).post("/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "password123",
    });

    const response = await request(server).post("/login").send({
      email: "testuser@example.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid credentials");
  });

  it("should not login with non-existing user", async () => {
    const response = await request(server).post("/login").send({
      email: "nonexisting@example.com",
      password: "password123",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("User not found");
  });
});
