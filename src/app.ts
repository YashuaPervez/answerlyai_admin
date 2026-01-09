import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import routes from "./routes";
// import authRouter from './routes/auth';
// import calendarRouter from './routes/calendar';

const app = express();

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
