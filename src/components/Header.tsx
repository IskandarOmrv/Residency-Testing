"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Home, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [showDialog, setShowDialog] = React.useState(false);
  const [targetHref, setTargetHref] = React.useState("");

  const isTestPage = pathname === "/test";

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isTestPage) {
      e.preventDefault();
      setTargetHref(href);
      setShowDialog(true);
    }
  };

  const handleConfirmExit = () => {
    localStorage.removeItem("testprep-session");
    router.push(targetHref);
    setShowDialog(false);
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-headline text-xl font-bold text-primary" onClick={(e) => handleNavClick(e, "/")}>
            <BrainCircuit className="h-7 w-7" />
            <span>Residency Testing</span>
          </Link>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href={item.href} onClick={(e) => handleNavClick(e, item.href)}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
             {navItems.map((item) => (
              <Button
                key={`${item.href}-mobile`}
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="icon"
                asChild
                className="sm:hidden"
              >
                <Link href={item.href} onClick={(e) => handleNavClick(e, item.href)}>
                  <item.icon className="h-5 w-5" />
                   <span className="sr-only">{item.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </header>
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current test progress will be lost and will not be saved to your history. You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Test</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>Leave Test</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
