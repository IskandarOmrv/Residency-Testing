"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatTime } from "@/lib/utils";
import type { Question, UserAnswer, TestResult } from "@/lib/types";
import allQuestionsData from "@/data/questions.json";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flag,
  Loader2,
  Timer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TestPageWrapper() {
  return (
    <DndProvider backend={HTML5Backend}>
      <TestPage />
    </DndProvider>
  )
}

function TestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [answers, setAnswers] = React.useState<UserAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFinishing, setIsFinishing] = React.useState(false);
  
  const timeLimit = React.useMemo(() => Number(searchParams.get("time") || "0") * 60, [searchParams]);

  React.useEffect(() => {
    const numQuestions = Number(searchParams.get("questions"));
    
    if (isNaN(numQuestions) || numQuestions <= 0) {
      router.replace("/");
      return;
    }

    const sessionData = localStorage.getItem("testprep-session");
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session.config.numQuestions === numQuestions && session.config.timeLimit === timeLimit) {
        setQuestions(session.questions);
        setAnswers(session.answers);
        setCurrentQuestionIndex(session.currentQuestionIndex);
        setSessionId(session.id);
        if(timeLimit > 0) {
            const elapsedTime = (Date.now() - session.startTime) / 1000;
            setTimeRemaining(Math.max(0, timeLimit - elapsedTime));
        }
      } else {
        startNewSession(numQuestions, timeLimit);
      }
    } else {
      startNewSession(numQuestions, timeLimit);
    }
    setIsLoading(false);
  }, [router, searchParams, timeLimit]);
  
  const startNewSession = (numQuestions: number, timeLimit: number) => {
    const shuffled = [...allQuestionsData.questions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, numQuestions);
    const newSessionId = `test_${Date.now()}`;
    const initialAnswers: UserAnswer[] = selectedQuestions.map(q => ({
        questionId: q.id,
        selectedAnswerIndex: null,
        isCorrect: null,
    }));
    
    setQuestions(selectedQuestions);
    setAnswers(initialAnswers);
    setCurrentQuestionIndex(0);
    setSessionId(newSessionId);
    if(timeLimit > 0) setTimeRemaining(timeLimit);
    
    localStorage.setItem("testprep-session", JSON.stringify({
        id: newSessionId,
        questions: selectedQuestions,
        answers: initialAnswers,
        currentQuestionIndex: 0,
        config: { numQuestions, timeLimit },
        startTime: Date.now(),
    }));
  };
  
  React.useEffect(() => {
    if (timeRemaining === null) return;
    
    if (timeRemaining <= 0) {
        finishTest(true);
        return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? Math.max(0, prev - 1) : null));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining]);
  
  React.useEffect(() => {
    if(!isLoading && sessionId) {
      const sessionData = localStorage.getItem("testprep-session");
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.currentQuestionIndex = currentQuestionIndex;
        session.answers = answers;
        localStorage.setItem("testprep-session", JSON.stringify(session));
      }
    }
  }, [currentQuestionIndex, answers, isLoading, sessionId]);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePopState = (e: PopStateEvent) => {
        if (window.confirm('Are you sure you want to leave? Your test progress will be lost.')) {
            localStorage.removeItem("testprep-session");
        } else {
            history.pushState(null, '', location.href);
        }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Initial push to history to detect back button
    history.pushState(null, '', location.href);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  const handleSelectAnswer = (questionId: string, answerIndex: number) => {
    if (isAnswered(questionId)) return;

    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = question.correctAnswerIndex === answerIndex;

    setAnswers(prev => prev.map(a => a.questionId === questionId ? {...a, selectedAnswerIndex: answerIndex, isCorrect} : a));
  };

  const isAnswered = (questionId: string) => {
    const answer = answers.find(a => a.questionId === questionId);
    return answer ? answer.selectedAnswerIndex !== null : false;
  }
  
  const finishTest = (force = false) => {
    if (isFinishing) return;
    setIsFinishing(true);
    const unansweredQuestions = answers.filter(a => a.selectedAnswerIndex === null).length;
    
    if (unansweredQuestions > 0 && !force) {
      document.getElementById('finish-dialog-trigger')?.click();
      setIsFinishing(false);
      return;
    }
    
    const correctCount = answers.filter(a => a.isCorrect).length;
    const score = (correctCount / questions.length) * 100;
    
    const sessionData = JSON.parse(localStorage.getItem("testprep-session") || "{}");
    const timeTaken = timeLimit > 0 ? timeLimit - (timeRemaining || 0) : (Date.now() - sessionData.startTime) / 1000;
    
    const result: TestResult = {
      id: sessionId!,
      date: Date.now(),
      config: { numQuestions: questions.length, timeLimit: timeLimit },
      score,
      timeTaken,
      answers,
      questions,
    };
    
    const history = JSON.parse(localStorage.getItem("testprep-history") || "[]");
    history.push(result);
    localStorage.setItem("testprep-history", JSON.stringify(history));
    
    localStorage.removeItem("testprep-session");
    
    router.push(`/results/${sessionId}`);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);
  const progress = (answers.filter(a => a.selectedAnswerIndex !== null).length / questions.length) * 100;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getQuestionNavClass = (index: number) => {
    const answer = answers[index];
    if (index === currentQuestionIndex) return "bg-primary text-primary-foreground";
    if (answer && answer.selectedAnswerIndex !== null) {
        return answer.isCorrect ? "bg-green-200 dark:bg-green-800" : "bg-red-200 dark:bg-red-800";
    }
    return "bg-muted";
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Question Navigation Sidebar */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-card">
            <div className="p-4 border-b">
                <h3 className="font-bold text-lg">Questions</h3>
                <p className="text-sm text-muted-foreground">{questions.length}-question test</p>
            </div>
            <ScrollArea className="h-32 md:h-[calc(100vh-89px)]">
                <div className="p-4 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-4 gap-2">
                    {questions.map((_, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            className={cn("h-10 w-10 p-0 font-bold", getQuestionNavClass(index))}
                            onClick={() => setCurrentQuestionIndex(index)}
                        >
                            {index + 1}
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto">
            <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <div className="w-full">
                    <Progress value={progress} />
                    <p className="text-sm text-muted-foreground mt-1">{Math.round(progress)}% Complete</p>
                </div>
                <div className="flex items-center gap-4 ml-8">
                {timeRemaining !== null && (
                    <div className="flex items-center font-mono text-lg font-semibold text-primary">
                        <Timer className="mr-2 h-5 w-5" />
                        {formatTime(timeRemaining)}
                    </div>
                )}
                <Button onClick={() => finishTest(false)} disabled={isFinishing}>
                    {isFinishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Flag className="mr-2 h-4 w-4" /> Finish Test
                </Button>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                {currentQuestion && (
                    <Card className="w-full max-w-3xl animate-in fade-in-50">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Question {currentQuestionIndex + 1}</CardTitle>
                            <CardDescription className="text-lg pt-2">{currentQuestion.questionText}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup
                                key={currentQuestion.id}
                                value={currentAnswer?.selectedAnswerIndex !== null ? String(currentAnswer?.selectedAnswerIndex) : undefined}
                                onValueChange={(value) => handleSelectAnswer(currentQuestion.id, Number(value))}
                                disabled={isAnswered(currentQuestion.id)}
                                className="space-y-4"
                            >
                                {currentQuestion.options.map((option, index) => {
                                    const isSelected = currentAnswer?.selectedAnswerIndex === index;
                                    const isCorrect = currentQuestion.correctAnswerIndex === index;
                                    const answered = currentAnswer?.selectedAnswerIndex !== null;

                                    return (
                                        <Label
                                            key={index}
                                            htmlFor={`${currentQuestion.id}-${index}`}
                                            className={cn(
                                                "flex items-center space-x-4 rounded-md border p-4 transition-all hover:bg-accent/50",
                                                answered && isSelected && isCorrect && "border-green-500 bg-green-100/50 dark:bg-green-900/20 text-green-800 dark:text-green-300",
                                                answered && isSelected && !isCorrect && "border-red-500 bg-red-100/50 dark:bg-red-900/20 text-red-800 dark:text-red-300",
                                                !answered && isSelected && "border-primary",
                                                isAnswered(currentQuestion.id) ? "cursor-not-allowed" : "cursor-pointer"
                                            )}
                                        >
                                            <RadioGroupItem value={index.toString()} id={`${currentQuestion.id}-${index}`} />
                                            <span>{option}</span>
                                        </Label>
                                    );
                                })}
                            </RadioGroup>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                            </Button>
                            <Button onClick={() => setCurrentQuestionIndex(p => Math.min(questions.length - 1, p + 1))} disabled={currentQuestionIndex === questions.length - 1}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
            
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <button id="finish-dialog-trigger" className="hidden" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Finish Test?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have unanswered questions. Are you sure you want to finish? Unanswered questions will be marked as incorrect.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsFinishing(false)}>Go Back</AlertDialogCancel>
                    <AlertDialogAction onClick={() => finishTest(true)}>Finish Anyway</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    </div>
  );
}
