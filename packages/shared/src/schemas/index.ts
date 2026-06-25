import { z } from "zod";

// Shared Validation Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters")
});

export const createReportSchema = z.object({
  ticker: z.string().min(1, "Ticker symbol is required").toUpperCase(),
  companyName: z.string().min(1, "Company name is required"),
  options: z.object({
    depth: z.enum(["quick", "detailed"]),
    focusAreas: z.array(z.string()).default([])
  }).optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
