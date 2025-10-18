"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import type { TestResult } from "@/lib/types";
import { History, ArrowRight, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Suspense } from "react";

function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = React.useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const storedHistory = localStorage.getItem("testprep-history");
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
    setIsLoading(false);
  }, []);

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 50) return "secondary";
    return "destructive";
  };
  
  const clearHistory = () => {
    localStorage.removeItem("testprep-history");
    setHistory([]);
    toast({
      title: "History Cleared",
      description: "Your test history has been successfully deleted.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <History className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <CardTitle className="font-headline text-3xl flex items-center gap-2">
                    <History className="h-7 w-7" /> Test History
                </CardTitle>
                <CardDescription>
                    Review your past performance and track your progress.
                </CardDescription>
            </div>
            {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-4 sm:mt-0">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your entire test history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">You have no completed tests yet.</p>
              <Button onClick={() => router.push("/")}>Start a New Test</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Questions</TableHead>
                    <TableHead className="text-center">Time Taken</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history
                    .sort((a, b) => b.date - a.date)
                    .map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          {new Date(result.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.config.numQuestions}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatTime(result.timeTaken)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getScoreBadgeVariant(result.score)}>
                            {result.score.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/results/${result.id}`}>
                              Review <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function HistoryPageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HistoryPage />
        </Suspense>
    );
}