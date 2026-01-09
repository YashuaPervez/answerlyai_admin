import { Router } from "express";
import authRouter from "./auth.routes";
import calendarRouter from "./calendar.routes";

const routes = [
  {
    prefix: "auth",
    router: authRouter,
  },
  {
    prefix: "calendar",
    router: calendarRouter,
  },
];

const router = Router();

routes.forEach((route) => {
  router.use(`/${route.prefix}`, route.router);
});

export default router;
