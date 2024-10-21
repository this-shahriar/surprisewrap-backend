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
import { jwt } from "hono/jwt";
import { fallback_secret } from "./Auth";
import { db } from "../configs/firebase";

interface Order {
  products: string;
  userId: string;
  delivery_address: string;
  totalPrice: number;
  status: string;
  createdAt: Date;
}

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
        createdAt: new Date(),
      };

      const orderRef = await addDoc(collection(db, "orders"), { ...order });
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
