/**
 * מנרמל מספר ישראלי לרצף ספרות (0XXXXXXXXX) לצורכי בדיקה/שליחה.
 */
export function normalizeIsraeliPhoneDigits(input: string): string {
  let d = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (d.startsWith("972")) {
    d = "0" + d.slice(3);
  }
  d = d.replace(/\D/g, "");
  if (d.length === 9 && d[0] === "5") {
    d = "0" + d;
  }
  return d;
}

/** בדיקה סבירה לטלפון ישראלי (נייח / נייד) אחרי נרמול. */
export function isPlausibleIsraeliPhone(input: string): boolean {
  const d = normalizeIsraeliPhoneDigits(input);
  if (d.length < 9 || d.length > 10) {
    return false;
  }
  if (!d.startsWith("0")) {
    return false;
  }
  return /^0[2-9]\d{7,8}$/.test(d);
}
