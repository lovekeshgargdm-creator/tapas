"use client";
import { useEffect, useState } from "react";

/** Guards against SSR/CSR hydration mismatches for store-driven UI. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
