import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { settings } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const DEFAULT_SPLIT = { ground: 1, first: 1, second: 1 };

function toClient(row: typeof settings.$inferSelect) {
  return {
    id: row.id,
    tenant1stFloorName: row.tenant1stFloorName,
    tenant2ndFloorName: row.tenant2ndFloorName,
    defaultRent1st: Number(row.defaultRent1st),
    defaultRent2nd: Number(row.defaultRent2nd),
    ssgcSplitRatio: row.ssgcSplitRatio as {
      ground: number;
      first: number;
      second: number;
    },
    motorSplitRatio: row.motorSplitRatio as {
      ground: number;
      first: number;
      second: number;
    },
    onboarded: row.onboarded,
  };
}

// GET /api/settings — fetch (or auto-create default) settings for the user
router.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);

    if (rows.length > 0) {
      res.json(toClient(rows[0]));
      return;
    }

    // First-time user — create default settings
    const inserted = await db
      .insert(settings)
      .values({
        userId,
        ssgcSplitRatio: DEFAULT_SPLIT,
        motorSplitRatio: DEFAULT_SPLIT,
      })
      .returning();
    res.json(toClient(inserted[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /api/settings — create or update user settings
router.put("/", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const {
    tenant1stFloorName,
    tenant2ndFloorName,
    defaultRent1st,
    defaultRent2nd,
    ssgcSplitRatio,
    motorSplitRatio,
    onboarded,
  } = req.body;

  try {
    const patch = {
      userId,
      tenant1stFloorName,
      tenant2ndFloorName,
      defaultRent1st: String(defaultRent1st ?? 0),
      defaultRent2nd: String(defaultRent2nd ?? 0),
      ssgcSplitRatio: ssgcSplitRatio ?? DEFAULT_SPLIT,
      motorSplitRatio: motorSplitRatio ?? DEFAULT_SPLIT,
      onboarded: onboarded ?? false,
      updatedAt: new Date(),
    };

    const existing = await db
      .select({ id: settings.id })
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);

    let result;
    if (existing.length > 0) {
      result = await db
        .update(settings)
        .set(patch)
        .where(eq(settings.userId, userId))
        .returning();
    } else {
      result = await db.insert(settings).values(patch).returning();
    }

    res.json(toClient(result[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
