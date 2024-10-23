import { Hono } from "hono";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { decode, jwt } from "hono/jwt";
import { fallback_secret } from "./Auth";
import { db } from "../configs/firebase";
import { Order } from "../interfaces/order";
import { sendMail } from "../configs/nodemailer";

const extractEmail = async (c: any) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader.split(" ")[1];
  const decoded = decode(token);
  return decoded?.payload?.email;
};

export class Orders {
  register(app: Hono) {
    app.use("/orders/*", (c, next) => {
      const jwtMiddleware = jwt({
        secret: process.env.HASH_SECRET || fallback_secret,
      });
      return jwtMiddleware(c, next);
    });

    app.post("/orders", async (c) => {
      const { products, userId, delivery_address, totalPrice, status } =
        await c.req.json();
      const order: Order = {
        products,
        userId,
        delivery_address,
        totalPrice,
        status,
        createdAt: Date.now(),
      };

      const orderRef = await addDoc(collection(db, "orders"), { ...order });

      sendMail({
        email: extractEmail(c),
        subject: "Order created",
        text: `Your order is created and will be delivered to ${delivery_address}`,
      });
      return c.json({
        message: "Order created successfully",
        id: orderRef.id,
      });
    });

    app.get("/orders", async (c) => {
      const snapshot = await getDocs(collection(db, "orders"));
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        products: JSON.parse(doc.data().products),
      }));

      return c.json(orders);
    });

    app.get("/orders/:id", async (c) => {
      const { id } = c.req.param();
      const orderRef = doc(db, "orders", id);
      const docSnap = await getDoc(orderRef);

      if (!docSnap.exists()) {
        c.status(404);
        return c.json({ error: "Order not found" });
      }

      return c.json({
        id: docSnap.id,
        ...docSnap.data(),
        products: JSON.parse(docSnap.data().products),
      });
    });

    app.get("/orders/user/:userId", async (c) => {
      const { userId } = c.req.param();
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return c.json({ message: "No orders found for this user" }, 404);
      }

      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        products: JSON.parse(doc.data().products),
      }));

      return c.json(orders);
    });

    app.put("/orders/:id", async (c) => {
      const { id } = c.req.param();
      const updatedData = await c.req.json();
      const orderRef = doc(db, "orders", id);

      const docSnap = await getDoc(orderRef);
      if (!docSnap.exists()) {
        c.status(404);
        return c.json({ error: "Order not found" });
      }

      if (
        updatedData?.status &&
        (updatedData.status == "cancelled" || updatedData.status == "delivered")
      ) {
        sendMail({
          email: extractEmail(c),
          subject: "Info about your order",
          text:
            updatedData?.status === "cancelled"
              ? "Your order is cancelled"
              : updatedData?.status === "delivered"
              ? "Your order is delivered successfully"
              : "",
        });
      }

      await updateDoc(orderRef, { ...updatedData });
      return c.json({ message: "Order updated successfully" });
    });

    app.delete("/orders/:id", async (c) => {
      const { id } = c.req.param();
      const orderRef = doc(db, "orders", id);

      const docSnap = await getDoc(orderRef);
      if (!docSnap.exists()) {
        c.status(404);
        return c.json({ error: "Order not found" });
      }

      await deleteDoc(orderRef);
      return c.json({ message: "Order deleted successfully" });
    });
  }
}
