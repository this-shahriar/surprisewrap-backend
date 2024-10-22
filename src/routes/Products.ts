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
import { Product } from "../interfaces/product";

export class Products {
  register(app: Hono) {
    const jwtMiddleware = jwt({
      secret: process.env.HASH_SECRET || fallback_secret,
    });

    app.post("/products", jwtMiddleware, async (c) => {
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
      const { search, category, order } = c.req.query();
      const productRef = collection(db, "products");
      const snapshot = await getDocs(productRef);

      let products = snapshot.docs.map((doc): any => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter((product) =>
          product?.searchKey.toLowerCase().includes(searchLower)
        );
      }

      if (category) {
        products = products.filter((product) => product?.category == category);
      }

      if (order) {
        if (order == "lth")
          products = products.sort((a, b) => a?.price - b?.price);
        else if (order == "htl")
          products = products.sort((a, b) => b?.price - a.price);
      }

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

    app.put("/products/:id", jwtMiddleware, async (c) => {
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

    app.delete("/products/:id", jwtMiddleware, async (c) => {
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
