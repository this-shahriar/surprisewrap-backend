import { Hono } from "hono";
import { serve } from "@hono/node-server";
import request from "supertest";
import { Orders } from "../routes/Orders";
import { AuthRoute } from "../routes/Auth";

interface userObject {
  token: string;
  id: string;
}

const getAuthToken = async (server: any): Promise<userObject> => {
  await request(server).post("/register").send({
    username: "testUser",
    email: "test@example.com",
    password: "password123",
  });

  const loginResponse = await request(server).post("/login").send({
    email: "test@example.com",
    password: "password123",
  });

  return { token: loginResponse.body.token, id: loginResponse.body.userId };
};

const createOrder = async (server: any, jwtToken: string, userId: string) => {
  const newOrder = {
    userId: userId,
    products: JSON.stringify(["productId1", "productId2"]),
    quantity: 1,
    totalPrice: 100,
    status: "paused",
  };

  const response = await request(server)
    .post("/orders")
    .set("Authorization", `Bearer ${jwtToken}`)
    .send(newOrder);

  return response;
};

const deleteOrder = async (server: any, orderId: string, jwtToken: string) => {
  const deleteResponse = await request(server)
    .delete(`/orders/${orderId}`)
    .set("Authorization", `Bearer ${jwtToken}`);

  return deleteResponse;
};

describe("Orders", () => {
  const app = new Hono();
  let server: any;
  let jwtToken: string;
  let userId: string;
  let createdArtifacts: string[] = [];

  beforeAll(async () => {
    const authRoute = new AuthRoute();
    const orders = new Orders();

    authRoute.register(app);
    orders.register(app);

    server = serve(app);
    const user = await getAuthToken(server);
    jwtToken = user.token;
    userId = user.id;
  });

  afterAll(async () => {
    await Promise.all(
      createdArtifacts.map(
        async (item) => await deleteOrder(server, item, jwtToken)
      )
    );

    server.close();
  });

  it("should create a new order", async () => {
    const response = await createOrder(server, jwtToken, userId);

    if (response?.body?.id) createdArtifacts.push(response.body.id);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Order created successfully");
  });

  it("should get all orders", async () => {
    const response = await request(server)
      .get("/orders")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should get orders by user ID", async () => {
    await createOrder(server, jwtToken, userId);
    const response = await request(server)
      .get(`/orders/user/${userId}`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should delete an existing order", async () => {
    const createResponse = await createOrder(server, jwtToken, userId);
    const orderId = createResponse.body.id;
    const deleteResponse = await deleteOrder(server, orderId, jwtToken);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe("Order deleted successfully");
  });
});
