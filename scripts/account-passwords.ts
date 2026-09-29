import { randomInt } from "node:crypto";

export const accountNames = ["admin", "staff1", "staff2", "staff3", "staff4"];
export const passwordKeys = [
  "ADMIN_PASSWORD",
  "STAFF_1_PASSWORD",
  "STAFF_2_PASSWORD",
  "STAFF_3_PASSWORD",
  "STAFF_4_PASSWORD",
];
export function validAccountPasswords(values: (string | undefined)[]) {
  return (
    values.length === 5 &&
    values.every((p) => p && p.length >= 12 && !p.includes("REPLACE_")) &&
    new Set(values).size === 5
  );
}
export function generateAccountPasswords() {
  // Twelve lowercase letters/digits, without visually confusing 0/O/1/l/I.
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const values = new Set<string>();
  while (values.size < 5) {
    const value = Array.from(
      { length: 12 },
      () => alphabet[randomInt(alphabet.length)],
    ).join("");
    if (/[a-z]/.test(value) && /[2-9]/.test(value)) values.add(value);
  }
  return [...values];
}
export function replaceAccountPasswords(text: string, values: string[]) {
  if (!validAccountPasswords(values))
    throw new Error(
      "Five unique passwords of at least 12 characters are required.",
    );
  for (let i = 0; i < passwordKeys.length; i++) {
    const key = passwordKeys[i];
    text = text.replace(
      new RegExp(
        `^[ \\t]*(?:export[ \\t]+)?${key}[ \\t]*=.*(?:\\r?\\n|$)`,
        "gm",
      ),
      "",
    );
    text += `\n${key}=${JSON.stringify(values[i])}\n`;
  }
  return text;
}
