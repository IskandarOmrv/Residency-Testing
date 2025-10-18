"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { formatTime, cn } from "@/lib/utils";
import type { TestResult, UserAnswer } from "@/lib/types";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Target,
  Clock,
  HelpCircle,
} from "lucide-react";

const COLORS = {
  correct: "hsl(var(--chart-2))",
  incorrect: "hsl(var(--destructive))",
  unanswered: "hsl(var(--muted))",
};

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [result, setResult] = React.useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof params.testId === "string") {
      const storedHistory = localStorage.getItem("testprep-history");
      if (storedHistory) {
        const history: TestResult[] = JSON.parse(storedHistory);
        const foundResult = history.find((r) => r.id === params.testId);
        setResult(foundResult || null);
      }
    }
    setIsLoading(false);
  }, [params.testId]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Result Not Found</CardTitle>
                <CardDescription>
                    The test result you are looking for does not exist or has been deleted.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button onClick={() => router.push("/history")} className="w-full">
                    Go to History
                </Button>
            </CardFooter>
        </Card>
      </div>
    );
  }
  
  const correctAnswers = result.answers.filter((a) => a.isCorrect).length;
  const incorrectAnswers = result.answers.filter((a) => a.isCorrect === false).length;
  const unanswered = result.config.numQuestions - correctAnswers - incorrectAnswers;

  const chartData = [
    { name: "Correct", value: correctAnswers },
    { name: "Incorrect", value: incorrectAnswers },
    { name: "Unanswered", value: unanswered },
  ];
  
  const getOptionClassName = (
    optionIndex: number,
    correctIndex: number,
    selectedIndex: number | null
  ) => {
    if (selectedIndex === null) {
      if (optionIndex === correctIndex) return "bg-green-100 dark:bg-green-900/30 border-green-500";
      return "";
    }
    if (optionIndex === correctIndex) return "bg-green-100 dark:bg-green-900/30 border-green-500";
    if (optionIndex === selectedIndex) return "bg-red-100 dark:bg-red-900/30 border-red-500";
    return "";
  };


  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Test Results</CardTitle>
          <CardDescription>
            Completed on {new Date(result.date).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <p className="text-6xl font-bold text-primary">{result.score.toFixed(1)}%</p>
            </div>
            <Progress value={result.score} className="w-full h-3" />
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg bg-card p-3 border">
                    <Target className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="font-bold text-lg">{correctAnswers}</p>
                    <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="rounded-lg bg-card p-3 border">
                    <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                    <p className="font-bold text-lg">{incorrectAnswers}</p>
                    <p className="text-sm text-muted-foreground">Incorrect</p>
                </div>
                <div className="rounded-lg bg-card p-3 border">
                    <HelpCircle className="h-6 w-6 text-gray-500 mx-auto mb-1" />
                    <p className="font-bold text-lg">{unanswered}</p>
                    <p className="text-sm text-muted-foreground">Unanswered</p>
                </div>
                <div className="rounded-lg bg-card p-3 border">
                    <Clock className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                    <p className="font-bold text-lg">{formatTime(result.timeTaken)}</p>
                    <p className="text-sm text-muted-foreground">Time Taken</p>
                </div>
            </div>
          </div>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
            <Button onClick={() => router.push("/")}>Take a New Test</Button>
            <Button variant="outline" onClick={() => router.push("/history")}>View All History</Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Question Review</CardTitle>
          <CardDescription>
            Review each question and your answer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {result.questions.map((q, index) => {
              const userAnswer = result.answers.find(a => a.questionId === q.id);
              return (
                <AccordionItem value={`item-${index}`} key={q.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      {userAnswer?.isCorrect === true && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
                      {userAnswer?.isCorrect === false && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
                      {userAnswer?.isCorrect === null && <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                      <span>Question {index + 1}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="font-semibold">{q.questionText}</p>
                    <div className="space-y-2">
                      {q.options.map((option, i) => (
                        <div key={i} className={cn("p-3 border rounded-md transition-colors", getOptionClassName(i, q.correctAnswerIndex, userAnswer?.selectedAnswerIndex ?? null))}>
                          {option}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                       <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-md">
                          <p className="font-semibold text-blue-800 dark:text-blue-300">Explanation</p>
                          <p className="text-sm text-blue-700 dark:text-blue-400">{q.explanation}</p>
                       </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
