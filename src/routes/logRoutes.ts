import { Router } from "express";
import { getLogs } from "../controllers/activityLogsController";

const router = Router();

router.get("/", getLogs)
router.get("/:id", getLogs)
router.post("/create", getLogs)
router.put("/:id", getLogs)
router.delete("/:id", getLogs)

export default router   