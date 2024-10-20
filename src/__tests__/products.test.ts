import { Hono } from "hono";
import { serve } from "@hono/node-server";
import request from "supertest";
import { Products } from "../routes/Products";
import { AuthRoute } from "../routes/Auth";

const getAuthToken = async (server: any): Promise<string> => {
  await request(server).post("/register").send({
    username: "testUser",
    email: "test@example.com",
    password: "password123",
  });

  const loginResponse = await request(server).post("/login").send({
    email: "test@example.com",
    password: "password123",
  });

  return loginResponse.body.token;
};

const createProduct = async (server: any, jwtToken: string) => {
  const newProduct = {
    name: "Test Product",
    price: 100,
    image: "https://example.com/image.png",
    currency: "USD",
    category: "Electronics",
    searchKey: "testproduct",
  };

  const response = await request(server)
    .post("/products")
    .set("Authorization", `Bearer ${jwtToken}`) // Set Bearer token
    .send(newProduct);

  return response;
};

const deleteProduct = async (
  server: any,
  productId: string,
  jwtToken: string
) => {
  const deleteResponse = await request(server)
    .delete(`/products/${productId}`)
    .set("Authorization", `Bearer ${jwtToken}`);

  return deleteResponse;
};

describe("Products", () => {
  const app = new Hono();
  let server: any;
  let jwtToken: string;
  let createdArtifacts: string[] = [];

  beforeAll(async () => {
    const authRoute = new AuthRoute();
    const products = new Products();

    authRoute.register(app);
    products.register(app);

    server = serve(app);
    jwtToken = await getAuthToken(server);
  });

  afterAll(async () => {
    await Promise.all(
      createdArtifacts.map(
        async (item) => await deleteProduct(server, item, jwtToken)
      )
    );

    server.close();
  });

  it("should create a new product", async () => {
    const response = await createProduct(server, jwtToken);

    if (response?.body?.id) createdArtifacts.push(response.body.id);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Product created successfully");
  });

  it("should get all products", async () => {
    const response = await request(server)
      .get("/products")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should update an existing product", async () => {
    const createResponse = await createProduct(server, jwtToken);
    if (createResponse?.body?.id) createdArtifacts.push(createResponse.body.id);
    const productId = createResponse.body.id;

    const updateResponse = await request(server)
      .put(`/products/${productId}`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send({
        name: "Updated Product",
        price: 200,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.message).toBe("Product updated successfully");
  });

  it("should delete an existing product", async () => {
    const createResponse = await createProduct(server, jwtToken);
    const productId = createResponse.body.id;
    const deleteResponse = await deleteProduct(server, productId, jwtToken);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe("Product deleted successfully");
  });
});
