import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../lib/db";
import { receipts } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

// mergeParams: true so :recordId from the parent router is accessible here
const router = Router({ mergeParams: true });

// GET /api/records/:recordId/receipts/:fieldRef
router.get("/:fieldRef", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { recordId, fieldRef } = req.params;
  try {
    const rows = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.userId, userId),
          eq(receipts.recordId, recordId),
          eq(receipts.fieldRef, fieldRef),
        ),
      )
      .limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      id: rows[0].id,
      imageData: rows[0].imageData,
      uploadedAt: rows[0].uploadedAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
});

// PUT /api/records/:recordId/receipts/:fieldRef — upsert receipt image
router.put("/:fieldRef", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { recordId, fieldRef } = req.params;
  const { imageData } = req.body; // full data URL: "data:image/jpeg;base64,..."
  try {
    const existing = await db
      .select({ id: receipts.id })
      .from(receipts)
      .where(
        and(
          eq(receipts.userId, userId),
          eq(receipts.recordId, recordId),
          eq(receipts.fieldRef, fieldRef),
        ),
      )
      .limit(1);

    let result;
    if (existing.length > 0) {
      result = await db
        .update(receipts)
        .set({ imageData, uploadedAt: new Date() })
        .where(eq(receipts.id, existing[0].id))
        .returning();
    } else {
      result = await db
        .insert(receipts)
        .values({ userId, recordId, fieldRef, imageData })
        .returning();
    }
    res.json({ id: result[0].id, uploadedAt: result[0].uploadedAt });
  } catch (err) {
    res.status(500).json({ error: "Failed to save receipt" });
  }
});

// DELETE /api/records/:recordId/receipts/:fieldRef
router.delete("/:fieldRef", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { recordId, fieldRef } = req.params;
  try {
    await db
      .delete(receipts)
      .where(
        and(
          eq(receipts.userId, userId),
          eq(receipts.recordId, recordId),
          eq(receipts.fieldRef, fieldRef),
        ),
      );
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete receipt" });
  }
});

export default router;
