import { Hono } from "hono";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { jwt } from "hono/jwt";
import { fallback_secret } from "./Auth";
import { db } from "../configs/firebase";

interface Product {
  name: string;
  price: number;
  image: string;
  currency: string;
  category: string;
  searchKey: string;
}

export class Products {
  register(app: Hono) {
    app.use("/products/*", (c, next) => {
      const jwtMiddleware = jwt({
        secret: process.env.HASH_SECRET || fallback_secret,
      });
      return jwtMiddleware(c, next);
    });

    app.post("/products", async (c) => {
      const { name, price, image, currency, category, searchKey } =
        await c.req.json();
      const product: Product = {
        name,
        price,
        image,
        currency,
        category,
        searchKey,
      };

      const productRef = await addDoc(collection(db, "products"), product);
      return c.json({
        message: "Product created successfully",
        id: productRef.id,
      });
    });

    app.get("/products", async (c) => {
      const snapshot = await getDocs(collection(db, "products"));
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return c.json(products);
    });

    app.get("/products/:id", async (c) => {
      const { id } = c.req.param();
      const productRef = doc(db, "products", id);
      const docSnap = await getDoc(productRef);

      if (!docSnap.exists()) {
        c.status(404);
        return c.json({ error: "Product not found" });
      }

      return c.json({ id: docSnap.id, ...docSnap.data() });
    });

    app.put("/products/:id", async (c) => {
      const { id } = c.req.param();
      const updatedData = await c.req.json();
      const productRef = doc(db, "products", id);

      const docSnap = await getDoc(productRef);
      if (!docSnap.exists()) {
        c.status(404);
        return c.json({ error: "Product not found" });
      }

      await updateDoc(productRef, { ...updatedData });
      return c.json({ message: "Product updated successfully" });
    });

    app.delete("/products/:id", async (c) => {
      const { id } = c.req.param();
      const productRef = doc(db, "products", id);

      const docSnap = await getDoc(productRef);
      if (!docSnap.exists()) {
        c.status(404);
        return c.json({ error: "Product not found" });
      }

      await deleteDoc(productRef);
      return c.json({ message: "Product deleted successfully" });
    });
  }
}
