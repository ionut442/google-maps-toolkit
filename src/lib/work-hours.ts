import { z } from "zod";

export const weekDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export type WeekDay = (typeof weekDays)[number];

export const weekDayLabels: Record<WeekDay, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const daySchema = z.discriminatedUnion("status", [
  z.object({ day: z.enum(weekDays), status: z.literal("CLOSED") }).strict(),
  z
    .object({
      day: z.enum(weekDays),
      status: z.literal("OPEN"),
      opensAt: timeSchema,
      closesAt: timeSchema,
    })
    .strict()
    .refine((value) => value.opensAt < value.closesAt, {
      message: "Closing time must be after opening time",
    }),
  z
    .object({ day: z.enum(weekDays), status: z.literal("OPEN_24_HOURS") })
    .strict(),
]);

export const workHoursConfigSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    days: z.array(daySchema).length(7),
  })
  .strict()
  .superRefine((config, ctx) => {
    const days = config.days.map((item) => item.day);
    if (new Set(days).size !== weekDays.length)
      ctx.addIssue({ code: "custom", message: "Configure every day once" });
  });

export type WorkHoursConfig = z.infer<typeof workHoursConfigSchema>;

export const defaultWorkHoursConfig: WorkHoursConfig = {
  label: "Work days & hours",
  days: weekDays.map((day) => ({ day, status: "CLOSED" as const })),
};

export function hasPublicWorkHours(config: WorkHoursConfig) {
  return config.days.some((day) => day.status !== "CLOSED");
}
