import { z } from "zod";

export const bookAppointmentSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  start: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:mm format"),
  durationMins: z
    .number()
    .min(15, `Duration must be at least 15 minutes`)
    .max(90, `Duration must not exceed 90 minutes`),
  title: z.string().min(1, "Title is required"),
  attendeeEmail: z.email("Invalid email format"),
  attendeeName: z.string(),
});

export type BookAppointmentPayload = z.infer<typeof bookAppointmentSchema>;
