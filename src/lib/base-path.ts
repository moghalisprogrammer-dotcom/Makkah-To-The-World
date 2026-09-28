const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";

export const basePath =
  configuredBasePath === "/" ? "" : configuredBasePath.replace(/\/+$/, "");

export function appPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (!basePath || path === basePath || path.startsWith(`${basePath}/`))
    return path;
  return `${basePath}${path}`;
}
