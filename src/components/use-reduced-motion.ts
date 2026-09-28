"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/** Keep server HTML and the first hydrated render identical. */
export function useAccessibleReducedMotion() {
  const preference = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated && preference === true;
}
