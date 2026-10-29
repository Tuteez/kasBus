import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-5xl">🏀</p>
      <h1 className="text-2xl font-bold">Puslapis nerastas</h1>
      <p className="text-muted-foreground">Įvykis galėjo būti ištrintas arba nuoroda neteisinga.</p>
      <Button asChild className="h-12 px-6 text-base">
        <Link href="/">Į pradžią</Link>
      </Button>
    </div>
  );
}
