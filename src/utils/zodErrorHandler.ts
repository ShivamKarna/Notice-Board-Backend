import { ZodError } from "zod";

export const formatZodError = (error: ZodError): string => {
  const errors = error.issues.map((err) => {
    const path = err.path.join(".");
    return `${path}:${err.message}`;
  });
  return errors.join(",");
};

export const getZodErrorDetails = (
  error: ZodError
): Array<{ field: string; message: string }> => {
  return error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
};
