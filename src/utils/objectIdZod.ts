import { z } from "zod";

export const objectIdZod = z.string().refine((value) => /^[a-f\d]{24}$/i.test(value), {
  error: "Invalid database id pattern",
});
