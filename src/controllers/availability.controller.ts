import { Request, Response } from "express";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { addMinutes, getDay, getHours } from "date-fns";

import { getEvents, createEvent } from "../managers/googleCalendar";
import {
  processAvailabilitySlots,
  getDayStartISO,
  getDayEndISO,
  isSlotAvailable,
  BUSINESS_HOURS_START,
  BUSINESS_HOURS_END,
  TIMEZONE,
} from "../managers/availabilityManager";

import type { BookAppointmentPayload } from "../schemas/calendar";

export async function checkAvailability(
  _req: Request,
  res: Response
): Promise<void> {
  const start = new Date();
  start.setDate(new Date().getDate() + 1);

  const end = new Date();
  end.setDate(new Date().getDate() + 7);

  const startTz = toZonedTime(start, TIMEZONE);
  const endTz = toZonedTime(end, TIMEZONE);

  const timeMin = getDayStartISO(startTz);
  const timeMax = getDayEndISO(endTz);

  const events = await getEvents(timeMin, timeMax);

  const processedSlots = processAvailabilitySlots({
    startDate: timeMin,
    endDate: timeMax,
    events,
  });

  res.json({
    success: true,
    availableSlots: processedSlots.availableSlots,
  });
}

export async function bookAppointment(
  req: Request,
  res: Response
): Promise<void> {
  const { date, start, durationMins, title, attendeeEmail, attendeeName } =
    req.body as BookAppointmentPayload;

  const startDateTimeStr = `${date}T${start}:00`;
  const startUtc = fromZonedTime(startDateTimeStr, TIMEZONE);
  const endUtc = addMinutes(startUtc, durationMins);

  const startTz = toZonedTime(startUtc, TIMEZONE);
  const endTz = toZonedTime(endUtc, TIMEZONE);

  // Validate weekday (1-5 = Monday-Friday)
  const dayOfWeek = getDay(startTz);
  if ([0, 6].includes(dayOfWeek)) {
    res.status(400).json({
      success: false,
      message: "Appointments can only be booked on weekdays (Monday-Friday)",
    });
    return;
  }

  // Validate business hours
  const startHour = getHours(startTz);
  const endHour = getHours(endTz);
  const endMinutes = endTz.getMinutes();

  if (
    startHour < BUSINESS_HOURS_START ||
    endHour > BUSINESS_HOURS_END ||
    (endHour === BUSINESS_HOURS_END && endMinutes > 0)
  ) {
    res.status(400).json({
      success: false,
      message: `Appointments must be within business hours (${BUSINESS_HOURS_START}:00 AM - ${BUSINESS_HOURS_END}:00 PM)`,
    });
    return;
  }

  // Check for conflicts with existing events
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;
  const dayStartUtc = fromZonedTime(dayStart, TIMEZONE);
  const dayEndUtc = fromZonedTime(dayEnd, TIMEZONE);

  const events = await getEvents(
    dayStartUtc.toISOString(),
    dayEndUtc.toISOString()
  );

  if (!isSlotAvailable(startUtc, endUtc, events)) {
    res.json({
      success: false,
      message: "Slot not available",
    });
    return;
  }

  // Book the event
  const startDateTime = formatInTimeZone(
    startUtc,
    TIMEZONE,
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );
  const endDateTime = formatInTimeZone(
    endUtc,
    TIMEZONE,
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );

  const event = await createEvent({
    summary: title,
    startDateTime,
    endDateTime,
    attendeeEmail,
    attendeeName,
  });

  res.json({
    success: true,
    message: "Appointment booked successfully",
    event: {
      id: event.id,
      summary: event.summary,
      start: event.start,
      end: event.end,
      htmlLink: event.htmlLink,
    },
  });
}
