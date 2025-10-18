"use client";

import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 p-4">
      <div className="container mx-auto flex items-center justify-center text-sm text-muted-foreground">
        <a
          href="https://github.com/IskandarOmrv/Residency-Testing"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
          <span>Residency-Testing</span>
        </a>
      </div>
    </footer>
  );
}
