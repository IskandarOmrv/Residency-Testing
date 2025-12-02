"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BrainCircuit } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  numQuestions: z.string().min(1, "Please select the number of questions."),
  timeLimit: z.string(),
  allowNavigation: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

const questionOptions = ["20", "30", "40", "50", "70", "100", "200"];
const timeOptions = [
  { value: "0", label: "No Timer" },
  { value: "0.1", label: "15 Minutes" },
  { value: "30", label: "30 Minutes" },
  { value: "45", label: "45 Minutes" },
  { value: "60", label: "60 Minutes" },
];

export default function HomePage() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numQuestions: "30",
      timeLimit: "0",
      allowNavigation: true,
    },
  });

  const onSubmit = (data: FormData) => {
    const params = new URLSearchParams({
      questions: data.numQuestions,
      time: data.timeLimit,
      navigation: data.allowNavigation.toString(),
    });
    router.push(`/test?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 container mx-auto flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center p-4 md:p-6">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary md:h-16 md:w-16">
              <BrainCircuit className="h-7 w-7 md:h-8 md:w-8" />
            </div>
            <CardTitle className="font-headline text-2xl md:text-3xl">
              Welcome to TestPrep Pro
            </CardTitle>
            <CardDescription>
              Configure your practice test and start your preparation journey.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 p-4 md:p-6 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions</Label>
                <Controller
                  name="numQuestions"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger id="numQuestions">
                        <SelectValue placeholder="Select number of questions" />
                      </SelectTrigger>
                      <SelectContent>
                        {questionOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option} Questions
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.numQuestions && (
                  <p className="text-sm text-destructive">
                    {errors.numQuestions.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit</Label>
                <Controller
                  name="timeLimit"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger id="timeLimit">
                        <SelectValue placeholder="Select time limit" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Controller
                    name="allowNavigation"
                    control={control}
                    render={({ field }) => (
                        <Checkbox 
                            id="allowNavigation"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
                <label
                  htmlFor="allowNavigation"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Allow question navigation
                </label>
              </div>
            </CardContent>
            <CardFooter className="p-4 md:p-6">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
              >
                Start Test
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
