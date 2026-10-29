"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ eventId, className }: { eventId: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/event/${eventId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Nukopijuokite nuorodą:", url);
    }
  }

  return (
    <Button type="button" variant="outline" className={className} onClick={copy}>
      {copied ? <Check /> : <Link2 />}
      {copied ? "Nukopijuota!" : "Kopijuoti nuorodą"}
    </Button>
  );
}
