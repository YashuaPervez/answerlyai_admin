import { google } from "googleapis";

import userConfig from "../userconfg.json";

const TIME_ZONE = userConfig.timezone;

export interface CalendarEvent {
  start: {
    date?: string;
    dateTime?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
  };
  status?: string;
  transparency?: string;
}

function createCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/auth/google/callback"
  );

  oauth2Client.setCredentials({
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  oauth2Client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      console.log("New refresh token received. Please update your .env file:");
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    }
    if (tokens.access_token) {
      console.log("New access token received. Please update your .env file:");
      console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
    }
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function getEvents(timeMin: string, timeMax: string) {
  const calendar = createCalendarClient();
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    timeZone: TIME_ZONE,
    orderBy: "startTime",
  });

  return (response.data.items as CalendarEvent[]) || [];
}
