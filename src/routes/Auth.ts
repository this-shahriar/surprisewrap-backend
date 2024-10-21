import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import { db } from "../configs/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  DocumentData,
} from "firebase/firestore";

export const fallback_secret = "YouR26593seCRet90292kEy";
const JWT_SECRET = process.env.HASH_SECRET || fallback_secret; // Use a secure, environment-specific key

async function hashPassword(password: string): Promise<string> {
  return await sign({ password }, JWT_SECRET, "HS256");
}

async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  const hashedPassword = await sign({ password }, JWT_SECRET, "HS256");
  return hashedPassword === passwordHash;
}

export class AuthRoute {
  public register(app: Hono): void {
    app.post("/register", async (c) => {
      const { username, email, password } = await c.req.json();

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return c.json({ error: "User already exists" }, 400);
      }

      const passwordHash = await hashPassword(password);

      await addDoc(usersRef, {
        username,
        email,
        passwordHash,
        role: "customer",
      });

      return c.json({ message: "User registered successfully" });
    });

    app.post("/login", async (c) => {
      const { email, password } = await c.req.json();

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return c.json({ error: "User not found" }, 400);
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as DocumentData;

      if (!(await verifyPassword(password, userData.passwordHash))) {
        return c.json({ error: "Invalid credentials" }, 400);
      }

      const token = await sign(
        { username: userData.username, email: userData.email },
        JWT_SECRET,
        "HS256"
      );

      return c.json({
        message: "Login successful",
        token,
        userId: userDoc.id,
        role: userData.role,
      });
    });
  }
}
