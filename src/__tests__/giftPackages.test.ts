import { Hono } from "hono";
import { serve } from "@hono/node-server";
import request from "supertest";
import { GiftPackages } from "../routes/GiftPackages";
import { AuthRoute } from "../routes/Auth";

interface UserObject {
  token: string;
  id: string;
}

const getAuthToken = async (server: any): Promise<UserObject> => {
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

const createGiftPackage = async (
  server: any,
  jwtToken: string,
  userId: string
) => {
  const newGiftPackage = {
    userId: userId,
    products: JSON.stringify(["giftProductId1", "giftProductId2"]),
    quantity: 1,
    totalPrice: 100,
    status: "active",
  };

  const response = await request(server)
    .post("/gift-packages")
    .set("Authorization", `Bearer ${jwtToken}`)
    .send(newGiftPackage);

  return response;
};

const deleteGiftPackage = async (
  server: any,
  packageId: string,
  jwtToken: string
) => {
  const deleteResponse = await request(server)
    .delete(`/gift-packages/${packageId}`)
    .set("Authorization", `Bearer ${jwtToken}`);

  return deleteResponse;
};

describe("GiftPackages", () => {
  const app = new Hono();
  let server: any;
  let jwtToken: string;
  let userId: string;
  let createdArtifacts: string[] = [];

  beforeAll(async () => {
    const authRoute = new AuthRoute();
    const giftPackages = new GiftPackages();

    authRoute.register(app);
    giftPackages.register(app);

    server = serve(app);
    const user = await getAuthToken(server);
    jwtToken = user.token;
    userId = user.id;
  });

  afterAll(async () => {
    await Promise.all(
      createdArtifacts.map(
        async (item) => await deleteGiftPackage(server, item, jwtToken)
      )
    );

    server.close();
  });

  it("should create a new gift package", async () => {
    const response = await createGiftPackage(server, jwtToken, userId);

    if (response?.body?.id) createdArtifacts.push(response.body.id);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Gift package created successfully");
  });

  it("should get all gift packages", async () => {
    const response = await request(server)
      .get("/gift-packages")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should get gift packages by user ID", async () => {
    await createGiftPackage(server, jwtToken, userId);
    const response = await request(server)
      .get(`/gift-packages/user/${userId}`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should delete an existing gift package", async () => {
    const createResponse = await createGiftPackage(server, jwtToken, userId);
    const packageId = createResponse.body.id;
    const deleteResponse = await deleteGiftPackage(server, packageId, jwtToken);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe(
      "Gift package deleted successfully"
    );
  });

  it("should return 404 when trying to delete a non-existent gift package", async () => {
    const deleteResponse = await deleteGiftPackage(
      server,
      "nonExistentPackageId",
      jwtToken
    );

    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body.error).toBe("Gift package not found");
  });
});
