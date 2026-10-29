"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Įvyko klaida</h1>
      <p className="text-muted-foreground">Nepavyko įkelti duomenų. Patikrinkite ryšį ir bandykite dar kartą.</p>
      <Button onClick={reset} className="h-12 px-6 text-base">
        Bandyti dar kartą
      </Button>
    </div>
  );
}
