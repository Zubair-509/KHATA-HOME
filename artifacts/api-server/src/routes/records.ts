import { Router } from "express";
import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "../lib/db";
import { monthlyRecords } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

function toClient(row: typeof monthlyRecords.$inferSelect) {
  return {
    id: row.id,
    monthYear: row.monthYear,
    year: row.year,
    status: row.status,
    createdAt: row.createdAt,
    snapshot: row.snapshot,
    groundFloor: row.groundFloor,
    firstFloor: row.firstFloor,
    secondFloor: row.secondFloor,
  };
}

// GET /api/records — list all records, newest first
router.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const rows = await db
      .select()
      .from(monthlyRecords)
      .where(eq(monthlyRecords.userId, userId))
      .orderBy(desc(monthlyRecords.monthYear));
    res.json(rows.map(toClient));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// GET /api/records/years — distinct years, newest first
router.get("/years", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const rows = await db
      .selectDistinct({ year: monthlyRecords.year })
      .from(monthlyRecords)
      .where(eq(monthlyRecords.userId, userId))
      .orderBy(desc(monthlyRecords.year));
    res.json(rows.map((r) => r.year));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch years" });
  }
});

// GET /api/records/year/:year — records for a specific year, oldest first
router.get("/year/:year", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const year = parseInt(req.params.year, 10);
  if (isNaN(year)) {
    res.status(400).json({ error: "Invalid year" });
    return;
  }
  try {
    const rows = await db
      .select()
      .from(monthlyRecords)
      .where(
        and(
          eq(monthlyRecords.userId, userId),
          eq(monthlyRecords.year, year),
        ),
      )
      .orderBy(asc(monthlyRecords.monthYear));
    res.json(rows.map(toClient));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch records for year" });
  }
});

// GET /api/records/month/:monthYear — get by monthYear key (e.g. "2026-06")
router.get("/month/:monthYear", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { monthYear } = req.params;
  try {
    const rows = await db
      .select()
      .from(monthlyRecords)
      .where(
        and(
          eq(monthlyRecords.userId, userId),
          eq(monthlyRecords.monthYear, monthYear),
        ),
      )
      .limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(toClient(rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch record" });
  }
});

// GET /api/records/:id — get by UUID
router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  try {
    const rows = await db
      .select()
      .from(monthlyRecords)
      .where(
        and(eq(monthlyRecords.userId, userId), eq(monthlyRecords.id, id)),
      )
      .limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(toClient(rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch record" });
  }
});

// POST /api/records — create a new monthly record
router.post("/", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { monthYear, year, status, snapshot, groundFloor, firstFloor, secondFloor } =
    req.body;
  try {
    const inserted = await db
      .insert(monthlyRecords)
      .values({
        userId,
        monthYear,
        year,
        status: status ?? "draft",
        snapshot,
        groundFloor,
        firstFloor,
        secondFloor,
      })
      .returning();
    res.status(201).json(toClient(inserted[0]));
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "A record for this month already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create record" });
  }
});

// PUT /api/records/:id — update an existing record
router.put("/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  const { status, snapshot, groundFloor, firstFloor, secondFloor } = req.body;
  try {
    const updated = await db
      .update(monthlyRecords)
      .set({ status, snapshot, groundFloor, firstFloor, secondFloor, updatedAt: new Date() })
      .where(
        and(eq(monthlyRecords.userId, userId), eq(monthlyRecords.id, id)),
      )
      .returning();
    if (updated.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(toClient(updated[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to update record" });
  }
});

// DELETE /api/records/:id — delete a single record
router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  try {
    await db
      .delete(monthlyRecords)
      .where(
        and(eq(monthlyRecords.userId, userId), eq(monthlyRecords.id, id)),
      );
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete record" });
  }
});

export default router;
