export const LIMITS = {
  age: 100,
  heightCm: 260,
  heightFt: 8,
  heightIn: 11,
  weightKg: 500,
  weightLbs: 1100,
  chestCm: 200,
  waistCm: 200,
  hipsCm: 200,
  armsCm: 100,
  thighsCm: 150,
  calvesCm: 100,
  neckCm: 80,
  reps: 500,
  setWeight: 500,
  durationSec: 7200,
};

export function clampNumericInput(
  raw: string,
  max: number,
  options: { decimal?: boolean; onLimit?: (reason: "max" | "negative") => void } = {},
) {
  const hadMinus = raw.includes("-");
  const cleaned = raw.replace(options.decimal ? /[^\d.]/g : /\D/g, "");
  if (hadMinus) options.onLimit?.("negative");
  if (!cleaned) return "";
  const normalized = options.decimal
    ? cleaned.split(".").slice(0, 2).join(".")
    : cleaned;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return "";
  if (parsed > max) {
    options.onLimit?.("max");
    return String(max);
  }
  return normalized;
}
