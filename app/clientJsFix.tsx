import React, { Suspense } from "react";

export function ClientJsFix({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={children}>{children}</Suspense>;
}
