import { Router, type IRouter } from "express";
import healthRouter from "./health";
import settingsRouter from "./settings";
import recordsRouter from "./records";
import receiptsRouter from "./receipts";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/settings", settingsRouter);
router.use("/records", recordsRouter);

// Receipts are nested under records; mergeParams in receiptsRouter exposes :recordId
router.use("/records/:recordId/receipts", receiptsRouter);

export default router;
