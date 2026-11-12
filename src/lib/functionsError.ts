import { FunctionsHttpError } from "@supabase/supabase-js";

export async function extractFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === "string") return body.error;
    } catch {
      // response body wasn't JSON, fall back to the default message
    }
  }
  return fallback;
}
