import { Router, type IRouter } from "express";
import agentRouter from "./agent";
import healthRouter from "./health";
import spendRouter from "./spend";

const router: IRouter = Router();

router.use(agentRouter);
router.use(healthRouter);
router.use(spendRouter);

export default router;
