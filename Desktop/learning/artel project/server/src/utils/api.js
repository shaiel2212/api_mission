import crypto from "crypto";

export function createTraceId() {
  return crypto.randomUUID();
}

export function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json({ status: "success", ...data });
}

export function fail(res, statusCode, code, message, details, traceId = createTraceId()) {
  const body = {
    status: "error",
    code,
    message,
    traceId,
  };

  if (details !== undefined) {
    body.details = details;
  }

  return res.status(statusCode).json(body);
}

export function maskPhone(value) {
  const str = String(value || "");
  if (str.length < 4) {
    return "***";
  }
  return `${"*".repeat(Math.max(0, str.length - 4))}${str.slice(-4)}`;
}
