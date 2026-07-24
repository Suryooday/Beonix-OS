"use client";

import React, { createContext, useContext } from "react";

/* ═══════════════════════════════════════════════════════════════
   APP PROVIDERS — lightweight shell, no scroll hijacking
   ═══════════════════════════════════════════════════════════════ */

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default AppProviders;
