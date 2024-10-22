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
import { db } from "../configs/firebase";

interface GiftPackage {
  products: string;
  userId: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: number;
}

export class GiftPackages {
  public register(app: Hono): void {
    app.post("/gift-packages", async (c) => {
      const { products, userId, quantity, totalPrice, status } =
        await c.req.json();
      const giftPackage: GiftPackage = {
        products,
        userId,
        quantity,
        totalPrice,
        status,
        createdAt: Date.now(),
      };

      const packagesRef = await addDoc(
        collection(db, "gift-packages"),
        giftPackage
      );
      return c.json({
        message: "Gift package created successfully",
        id: packagesRef.id,
      });
    });

    app.get("/gift-packages", async (c) => {
      const snapshot = await getDocs(collection(db, "gift-packages"));
      const packages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return c.json(packages);
    });

    app.get("/gift-packages/:id", async (c) => {
      const { id } = c.req.param();
      const packageRef = doc(db, "gift-packages", id);
      const docSnap = await getDoc(packageRef);

      if (!docSnap.exists()) {
        c.status(404);
        return c.json({ error: "Gift package not found" });
      }

      return c.json({ id: docSnap.id, ...docSnap.data() });
    });

    app.get("/gift-packages/user/:userId", async (c) => {
      const { userId } = c.req.param();
      const giftRef = collection(db, "gift-packages");
      const q = query(giftRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return c.json({ message: "No gift packages found for this user" }, 404);
      }

      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        products: JSON.parse(doc.data().products),
      }));

      return c.json(orders);
    });

    app.put("/gift-packages/:id", async (c) => {
      const { id } = c.req.param();
      const updatedData = await c.req.json();
      const packageRef = doc(db, "gift-packages", id);

      const docSnap = await getDoc(packageRef);
      if (!docSnap.exists()) {
        c.status(404);
        return c.json({ error: "Gift package not found" });
      }

      await updateDoc(packageRef, { ...updatedData });
      return c.json({ message: "Gift package updated successfully" });
    });

    app.delete("/gift-packages/:id", async (c) => {
      const { id } = c.req.param();
      const packageRef = doc(db, "gift-packages", id);

      const docSnap = await getDoc(packageRef);
      if (!docSnap.exists()) {
        c.status(404);
        return c.json({ error: "Gift package not found" });
      }

      await deleteDoc(packageRef);
      return c.json({ message: "Gift package deleted successfully" });
    });
  }
}
