import { Router } from "express";
import { getBots, getBotById, createBot, updateBot, deleteBot } from "../controllers/botController";

const router = Router();

router.get("/", getBots);
router.get("/:id", getBotById);
router.post("/create", createBot);
router.put("/:id", updateBot);
router.delete("/:id", deleteBot);

export default router;