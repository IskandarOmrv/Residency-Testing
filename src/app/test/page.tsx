"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DndProvider } from 'react-dnd';
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatTime } from "@/lib/utils";
import type { Question, UserAnswer, TestResult } from "@/lib/types";
import allQuestionsData from "@/data/questions.json";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Flag,
  List,
  Loader2,
  Timer,
} from "lucide-react";
import { Suspense } from "react";
import { useIsMobile } from "@/hooks/use-mobile";


function TestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);


  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [answers, setAnswers] = React.useState<UserAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFinishing, setIsFinishing] = React.useState(false);
  const [timerExpired, setTimerExpired] = React.useState(false);
  
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams]);
  
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
    let timer: NodeJS.Timeout;
    if (timeRemaining !== null && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => (prev !== null ? Math.max(0, prev - 1) : null));
      }, 1000);
    } else if (timeRemaining === 0 && !timerExpired) {
      setTimerExpired(true);
    }
    return () => clearInterval(timer);
  }, [timeRemaining, timerExpired]);

  React.useEffect(() => {
    if (timerExpired) {
      finishTest(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerExpired]);
  
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
      // This is a browser feature, and we can't guarantee it will work perfectly,
      // but it's the standard way to prompt the user before they leave.
      e.preventDefault();
      // Most modern browsers ignore this message and show a generic one.
      e.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleSelectAnswer = (questionId: string, answerIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = question.correctAnswerIndex === answerIndex;

    setAnswers(prev => prev.map(a => a.questionId === questionId ? {...a, selectedAnswerIndex: answerIndex, isCorrect} : a));
  };
  
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
  
  const getOptionClassName = (
    optionIndex: number,
    question: Question,
    answer: UserAnswer | undefined
  ) => {
    const isSelected = answer?.selectedAnswerIndex === optionIndex;
    const isCorrect = question.correctAnswerIndex === optionIndex;
    const isAnswered = answer?.selectedAnswerIndex !== null;

    if (isAnswered) {
      if (isCorrect) {
        return "border-green-500 bg-green-100/50 dark:bg-green-900/20 text-green-800 dark:text-green-300";
      }
      if (isSelected && !isCorrect) {
        return "border-red-500 bg-red-100/50 dark:bg-red-900/20 text-red-800 dark:text-red-300";
      }
    } else if (isSelected) {
      return "border-primary";
    }

    return "cursor-pointer";
  };
  
    const QuestionNavigator = ({ isSheet = false }: { isSheet?: boolean }) => (
    <>
      <div className={cn("p-4 border-b", isSheet ? "" : "md:border-b")}>
        <h3 className="font-bold text-lg">Questions</h3>
        <p className="text-sm text-muted-foreground">{questions.length}-question test</p>
      </div>
      <ScrollArea className={cn(isSheet ? "h-[calc(100vh-89px)]" : "h-32 md:h-[calc(100vh-89px)]")}>
        <div className="p-4 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-4 gap-2">
          {questions.map((_, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn("h-10 w-10 p-0 font-bold", getQuestionNavClass(index))}
              onClick={() => {
                setCurrentQuestionIndex(index);
                if (isSheet) setIsSheetOpen(false);
              }}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </>
  );


  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Question Navigation Sidebar */}
        <aside className="hidden md:block w-full md:w-64 border-b md:border-b-0 md:border-r bg-card">
            <QuestionNavigator />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto">
            <header className="p-2 sm:p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <div className="w-full flex items-center gap-2 sm:gap-4">
                  {isMobile && (
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                          <List className="h-5 w-5" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-full max-w-[280px]">
                        <SheetHeader className="p-4 border-b text-left">
                            <SheetTitle>Questions</SheetTitle>
                        </SheetHeader>
                        <QuestionNavigator isSheet={true} />
                      </SheetContent>
                    </Sheet>
                  )}
                  <div className="w-full">
                      <Progress value={progress} />
                      <p className="text-sm text-muted-foreground mt-1">{Math.round(progress)}% Complete</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-center">
                {timeRemaining !== null && (
                    <div className="flex items-center font-mono text-base sm:text-lg font-semibold text-primary shrink-0">
                        <Timer className="mr-2 h-5 w-5" />
                        {formatTime(timeRemaining)}
                    </div>
                )}
                <Button onClick={() => finishTest(false)} disabled={isFinishing} className="shrink-0" size="sm" >
                    {isFinishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Flag className="mr-2 h-4 w-4" /> Finish Test
                </Button>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-2 sm:p-8">
                {currentQuestion && (
                    <Card className="w-full max-w-3xl animate-in fade-in-50">
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="font-headline text-xl sm:text-2xl">Question {currentQuestionIndex + 1}</CardTitle>
                            <CardDescription className="text-base sm:text-lg pt-2">{currentQuestion.questionText}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                             <RadioGroup
                                key={currentQuestion.id}
                                value={currentAnswer?.selectedAnswerIndex?.toString()}
                                onValueChange={(value) => handleSelectAnswer(currentQuestion.id, Number(value))}
                                className="space-y-2 sm:space-y-4"
                            >
                                {currentQuestion.options.map((option, index) => (
                                    <Label
                                        key={index}
                                        htmlFor={`${currentQuestion.id}-${index}`}
                                        className={cn(
                                            "flex items-center space-x-4 rounded-md border p-3 sm:p-4 text-sm sm:text-base transition-all hover:bg-accent/50",
                                            getOptionClassName(index, currentQuestion, currentAnswer)
                                        )}
                                    >
                                        <RadioGroupItem value={index.toString()} id={`${currentQuestion.id}-${index}`} />
                                        <span>{option}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </CardContent>
                        <CardFooter className="flex justify-between p-4 sm:p-6 pt-0">
                            <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                            </Button>
                            <Button onClick={() => {
                                if (currentAnswer?.selectedAnswerIndex === null) {
                                    handleSelectAnswer(currentQuestion.id, -1);
                                }
                                setCurrentQuestionIndex(p => Math.min(questions.length - 1, p + 1))
                            }}>
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

export default function TestPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DndProvider backend={HTML5Backend}>
        <TestPage />
      </DndProvider>
    </Suspense>
  )
}
