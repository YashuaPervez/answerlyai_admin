import { Request, Response } from "express";
import { toZonedTime } from "date-fns-tz";

import { getEvents } from "../managers/googleCalendar";
import { processAvailabilitySlots } from "../managers/availabilityManager";

import userConfig from "../userconfg.json";

const TIME_ZONE = userConfig.timezone;

const getDateString = (date: Date, hour: string) => {
  const tzOffset = date.getTimezoneOffset();
  const timezoneOffsetAbs = Math.abs(tzOffset);
  const timezoneSign = tzOffset < 0 ? "-" : "";

  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date
    .getDate()
    .toString()
    .padStart(2, "0")}T${hour}${timezoneSign}${(timezoneOffsetAbs / 60)
    .toString()
    .padStart(2, "0")}:${(timezoneOffsetAbs % 60).toString().padStart(2, "0")}`;
};

const getDayStartISO = (date: Date) => {
  return getDateString(date, "00:00:00");
};
const getDayEndISO = (date: Date) => {
  return getDateString(date, "23:59:59");
};

export async function checkAvailability(
  _req: Request,
  res: Response
): Promise<void> {
  const start = new Date();
  start.setDate(new Date().getDate() + 1);

  const end = new Date();
  end.setDate(new Date().getDate() + 7);

  const startTz = toZonedTime(start, TIME_ZONE);
  const endTz = toZonedTime(end, TIME_ZONE);

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
