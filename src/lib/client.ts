import { appPath } from "./base-path";

export async function api<T = Record<string, unknown>>(
  url: string,
  data?: unknown,
): Promise<T> {
  const response = await fetch(appPath(url), {
    method: data === undefined ? "GET" : "POST",
    headers:
      data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  if (response.status === 401) {
    window.location.assign(appPath("/login"));
    throw new Error("انتهت الجلسة. يرجى تسجيل الدخول.");
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "تعذر إتمام العملية.");
  return result;
}
