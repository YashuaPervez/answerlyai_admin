import { Router } from "express";
import {
  checkAvailability,
  bookAppointment,
} from "../controllers/availability.controller";
import { bookAppointmentSchema } from "../schemas/calendar";
import { validateBody } from "../middlewares/validation";

const router = Router();

router.get("/check-availability", checkAvailability);
router.post(
  "/book-appointment",
  validateBody(bookAppointmentSchema),
  bookAppointment
);

export default router;
