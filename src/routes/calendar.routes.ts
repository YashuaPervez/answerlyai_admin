import { Router } from "express";
import { checkAvailability } from "../controllers/availability.controller";

const router = Router();

router.get("/check-availability", checkAvailability);

export default router;
