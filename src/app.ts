import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import routes from "./routes";
// import authRouter from './routes/auth';
// import calendarRouter from './routes/calendar';

const app = express();

// Handle pre-parsed body from serverless-offline (comes as Buffer or string, not stream)
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (Buffer.isBuffer(req.body)) {
    req.body = JSON.parse(req.body.toString("utf8"));
  } else if (typeof req.body === "string" && req.body.length > 0) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // Not JSON, leave as is
    }
  }
  next();
});

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome to Answerly");
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: "An unexpected error occurred",
  });
});

export default app;
