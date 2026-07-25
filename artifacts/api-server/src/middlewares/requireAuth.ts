import { type Request, type Response, type NextFunction } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "@workspace/db";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Sync Clerk user into our DB on first visit (lightweight: skip if already present)
  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existing.length === 0) {
      const clerkUser = await clerk.users.getUser(userId);
      await db
        .insert(users)
        .values({
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
          firstName: clerkUser.firstName ?? null,
          lastName: clerkUser.lastName ?? null,
          profileImageUrl: clerkUser.imageUrl ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    }
  } catch (err) {
    // If Clerk fetch fails, insert a minimal stub so FK constraints hold
    await db
      .insert(users)
      .values({ id: userId, updatedAt: new Date() })
      .onConflictDoNothing();
  }

  (req as any).userId = userId;
  next();
}
