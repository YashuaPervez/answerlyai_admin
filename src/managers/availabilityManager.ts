import { format, addDays, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { CalendarEvent } from "./googleCalendar";

const TIMEZONE = "America/New_York";
const BUSINESS_HOURS_START = 10;
const BUSINESS_HOURS_END = 17;
const SLOT_DURATION_MINUTES = 30;

interface TimeSlot {
  start: string;
  end: string;
}

interface MergedSlot {
  start: string;
  end: string;
}

type MergedReadable = String;

interface ProcessSlotsParams {
  startDate: string;
  endDate: string;
  events: CalendarEvent[];
}

interface ProcessedSlots {
  availableSlots: {
    [key: string]: MergedReadable[];
  };
}
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function generateTimeSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dateStr = format(date, "yyyy-MM-dd");

  for (let hour = BUSINESS_HOURS_START; hour < BUSINESS_HOURS_END; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_DURATION_MINUTES) {
      const startTimeStr = `${dateStr}T${String(hour).padStart(
        2,
        "0"
      )}:${String(minute).padStart(2, "0")}:00`;
      const endMinute = minute + SLOT_DURATION_MINUTES;
      const endHour = endMinute >= 60 ? hour + 1 : hour;
      const adjustedEndMinute = endMinute >= 60 ? 0 : endMinute;
      const endTimeStr = `${dateStr}T${String(endHour).padStart(
        2,
        "0"
      )}:${String(adjustedEndMinute).padStart(2, "0")}:00`;

      const startUtc = fromZonedTime(startTimeStr, TIMEZONE);
      const endUtc = fromZonedTime(endTimeStr, TIMEZONE);

      slots.push({
        start: formatInTimeZone(startUtc, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        end: formatInTimeZone(endUtc, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      });
    }
  }

  return slots;
}

function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

function filterAvailableSlots(
  slots: TimeSlot[],
  events: CalendarEvent[]
): TimeSlot[] {
  return slots.filter((slot) => {
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);

    const hasOverlap = events.some((event) => {
      if (event.start.date) {
        const eventDate = event.start.date;
        const slotDate = format(toZonedTime(slotStart, TIMEZONE), "yyyy-MM-dd");
        return eventDate === slotDate;
      }

      if (event.start.dateTime && event.end.dateTime) {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        if (event.status === "cancelled") {
          return false;
        }

        if (event.transparency === "transparent") {
          return false;
        }

        return timeRangesOverlap(slotStart, slotEnd, eventStart, eventEnd);
      }

      return false;
    });

    return !hasOverlap;
  });
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatDateKey(dateStr: string): string {
  const date = parseISO(dateStr);

  const dayName = format(date, "EEEE");
  const day = format(date, "d");
  const month = format(date, "MMMM");
  const year = format(date, "yyyy");
  const ordinal = getOrdinalSuffix(parseInt(day));

  return `${dayName}, ${day}${ordinal} ${month} ${year}`;
}

function mergeConsecutiveSlots(slots: TimeSlot[]): MergedReadable[] {
  if (slots.length === 0) return [];

  const merged: MergedSlot[] = [];
  let currentBlock = {
    start: slots[0].start,
    end: slots[0].end,
  };

  for (let i = 1; i < slots.length; i++) {
    const prevEnd = new Date(currentBlock.end);
    const currentStart = new Date(slots[i].start);

    if (currentStart.getTime() === prevEnd.getTime()) {
      currentBlock.end = slots[i].end;
    } else {
      merged.push({ ...currentBlock });
      currentBlock = {
        start: slots[i].start,
        end: slots[i].end,
      };
    }
  }

  merged.push(currentBlock);

  return merged.map((item) => {
    const start = formatInTimeZone(parseISO(item.start), TIMEZONE, "hha");
    const end = formatInTimeZone(parseISO(item.end), TIMEZONE, "hha");

    return `${start} - ${end}`;
  });
}

function groupSlotsByDay(slots: TimeSlot[]): {
  [key: string]: MergedReadable[];
} {
  const grouped: { [key: string]: TimeSlot[] } = {};

  slots.forEach((slot) => {
    const date = formatInTimeZone(parseISO(slot.start), TIMEZONE, "yyyy-MM-dd");
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(slot);
  });

  const result: { [key: string]: MergedReadable[] } = {};
  Object.keys(grouped)
    .sort()
    .forEach((date) => {
      const dateKey = formatDateKey(date);

      result[dateKey] = mergeConsecutiveSlots(grouped[date]);
    });

  return result;
}

export function processAvailabilitySlots(
  params: ProcessSlotsParams
): ProcessedSlots {
  const { startDate, endDate, events } = params;

  const startDateObj = parseISO(startDate);
  const endDateObj = parseISO(endDate);

  const allSlots: TimeSlot[] = [];
  let currentDate = startDateObj;
  let weekdayCount = 0;
  let totalSlots = 0;

  while (currentDate <= endDateObj) {
    if (isWeekday(currentDate)) {
      weekdayCount++;
      const daySlots = generateTimeSlots(currentDate);
      totalSlots += daySlots.length;
      allSlots.push(...daySlots);
    }
    currentDate = addDays(currentDate, 1);
  }

  const availableSlots = filterAvailableSlots(allSlots, events);
  const groupedSlots = groupSlotsByDay(availableSlots);

  return {
    availableSlots: groupedSlots,
  };
}
