import { Request, Response, NextFunction } from "express";
import { z, ZodType } from "zod";

type ValidationError = {
  field: string;
  message: string;
};

type ValidationErrorResponse = {
  success: false;
  message: string;
  errors: ValidationError[];
};

const formatZodErrors = (error: z.ZodError): ValidationError[] => {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
};

export const validateBody = <T extends ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ValidationErrorResponse = {
          success: false,
          message: "Validation error",
          errors: formatZodErrors(error),
        };
        res.status(400).json(response);
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

export const validateSearchParam = <T extends ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ValidationErrorResponse = {
          success: false,
          message: "Validation error",
          errors: formatZodErrors(error),
        };
        res.status(400).json(response);
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

export const validatePath = <T extends ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ValidationErrorResponse = {
          success: false,
          message: "Validation error",
          errors: formatZodErrors(error),
        };
        res.status(400).json(response);
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};
