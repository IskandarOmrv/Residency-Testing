export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswerIndex: number | null;
  isCorrect: boolean | null;
}

export interface TestResult {
  id: string;
  date: number;
  config: {
    numQuestions: number;
    timeLimit: number;
  };
  score: number;
  timeTaken: number; // in seconds
  answers: UserAnswer[];
  questions: Question[];
}
