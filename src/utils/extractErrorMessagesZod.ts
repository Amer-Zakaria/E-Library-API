import { z } from "zod";

function extractErrorMessagesZod(err: z.ZodError) {
  let returningError = [];
  returningError = err.issues.map(({ path, message }) => ({ path, message }));
  return returningError;
}

export default extractErrorMessagesZod;
