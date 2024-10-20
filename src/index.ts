import { Hono } from "hono";
import dotenv from "dotenv";
import { serve } from "@hono/node-server";
import { AuthRoute } from "./routes/Auth";
import { Products } from "./routes/Products";
import { Orders } from "./routes/Orders";
import { GiftPackages } from "./routes/GiftPackages";
import { cors } from "hono/cors";

dotenv.config();

class Server {
  private app = new Hono();

  constructor(private port: string) {
    this.app.use(cors({ origin: "*" }));
    new AuthRoute().register(this.app);
    new Products().register(this.app);
    new Orders().register(this.app);
    new GiftPackages().register(this.app);
  }

  public start(): void {
    console.log(`Server is running on port ${this.port}`);
    serve({ fetch: this.app.fetch, port: parseInt(this.port) });
  }
}

new Server(process.env.PORT || "4000").start();
