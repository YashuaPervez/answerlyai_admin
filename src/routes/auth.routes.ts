import { Router, Request, Response } from "express";
import { google } from "googleapis";

const router = Router();

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:4000/api/auth/google/callback";

router.get("/google", (_req: Request, res: Response) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });

    res.redirect(authUrl);
  } catch (error: any) {
    console.error("Error initiating Google OAuth:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate Google OAuth",
      message: error.message,
    });
  }
});

router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;

    if (!code) {
      res.status(400).json({
        success: false,
        error: "Missing authorization code",
        message: "No code parameter found in callback",
      });
      return;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    res.json({
      success: true,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
    });
  } catch (error: any) {
    console.error("Error in Google OAuth callback:", error);
    res.status(500).json({
      success: false,
      error: "Failed to exchange authorization code",
      message: error.message,
    });
  }
});

export default router;
