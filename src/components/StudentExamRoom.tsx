import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ExamTimer } from './ExamTimer';
import { McqQuestionCard } from './McqQuestionCard';
import { useAuthStore } from '@/lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Send, Flag, Info, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentExamRoomProps {
  test: any;
  onExit: () => void;
}

export const StudentExamRoom: React.FC<StudentExamRoomProps> = ({ test, onExit }) => {
  const { user } = useAuthStore();
  const [submission, setSubmission] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [resultsSummary, setResultsSummary] = useState<any>(null);

  useEffect(() => {
    startTest();
  }, []);

  const startTest = async () => {
    const res = await fetch('/api/submissions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, testId: test.id }),
    });
    const data = await res.json();
    setSubmission(data);
    setAnswers(JSON.parse(data.answers));
  };

  const handleSelectOption = async (optionIndex: number) => {
    if (isFinished) return;
    
    const questionId = test.questions[currentQuestionIndex].id;
    const newAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(newAnswers);

    // Save to backend
    await fetch('/api/submissions/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId: submission.id,
        questionId,
        selectedOption: optionIndex,
      }),
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting || isFinished) return;
    setIsSubmitting(true);
    
    const res = await fetch('/api/submissions/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: submission.id }),
    });
    
    if (res.ok) {
      const data = await res.json();
      setResultsSummary(data);
      setIsFinished(true);
    }
    setIsSubmitting(false);
  };

  const toggleFlag = (questionId: string) => {
    const newFlags = new Set(flaggedQuestions);
    if (newFlags.has(questionId)) {
      newFlags.delete(questionId);
    } else {
      newFlags.add(questionId);
    }
    setFlaggedQuestions(newFlags);
  };

  if (showInstructions) {
    return (
      <div className="container mx-auto max-w-2xl min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          <Card className="border-none shadow-2xl overflow-hidden">
            <div className="bg-primary p-8 text-primary-foreground text-center space-y-2">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">{test.title}</h1>
              <p className="opacity-90">Please read the instructions carefully before starting.</p>
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <Timer className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Duration</p>
                    <p className="font-semibold">{test.duration} Minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Questions</p>
                    <p className="font-semibold">{test.questions?.length || 0} MCQs</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg">Exam Rules:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    The assessment will auto-submit when the timer reaches zero.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Do not refresh the page or close the browser tab during the exam.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    You can flag questions to review them later before submitting.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Ensure you have a stable internet connection.
                  </li>
                </ul>
              </div>

              <Button onClick={() => setShowInstructions(false)} size="lg" className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20">
                I'm Ready, Start Assessment
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!submission) return <div className="flex items-center justify-center h-screen">Loading assessment...</div>;

  if (isFinished) {
    return (
      <div className="container mx-auto max-w-3xl min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full space-y-6"
        >
          <Card className="text-center p-12 space-y-6 border-none shadow-xl">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-14 h-14" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Assessment Completed</h1>
              <p className="text-muted-foreground text-lg">Thank you for completing the assessment!</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Info className="w-6 h-6" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-semibold text-slate-700">What's next?</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Your responses have been securely submitted. The recruiter will review your performance and contact you directly if you are shortlisted for the next round.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={onExit} size="lg" className="w-full h-14 text-lg font-bold">Return to Dashboard</Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = test.questions?.[currentQuestionIndex];
  const progress = test.questions?.length ? ((currentQuestionIndex + 1) / test.questions.length) * 100 : 0;

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <p className="text-destructive font-medium">No questions found for this assessment.</p>
        <Button onClick={onExit}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4">
        <div className="container mx-auto flex justify-between items-center max-w-5xl">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">{test.title}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              <span>Student: {user?.name}</span>
              <span>•</span>
              <span>Question {currentQuestionIndex + 1} of {test.questions.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-1">
              {test.questions.map((_: any, i: number) => (
                <div 
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentQuestionIndex ? "bg-primary w-4" : 
                    answers[test.questions[i].id] !== undefined ? "bg-primary/40" : "bg-slate-200",
                    flaggedQuestions.has(test.questions[i].id) && "bg-orange-500"
                  )}
                />
              ))}
            </div>
            <ExamTimer 
              durationMinutes={test.duration} 
              startedAt={submission.startedAt} 
              onTimeUp={handleSubmit} 
            />
          </div>
        </div>
        <Progress value={progress} className="h-1 absolute bottom-0 left-0 rounded-none" />
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto max-w-3xl p-6 py-12">
        <div className="mb-6 flex justify-between items-center">
          <Badge variant="outline" className="px-3 py-1 text-sm font-medium bg-white">
            Question {currentQuestionIndex + 1} of {test.questions.length}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "gap-2 h-8",
              flaggedQuestions.has(currentQuestion.id) ? "text-orange-600 bg-orange-50" : "text-muted-foreground"
            )}
            onClick={() => toggleFlag(currentQuestion.id)}
          >
            <Flag className={cn("w-4 h-4", flaggedQuestions.has(currentQuestion.id) && "fill-current")} />
            {flaggedQuestions.has(currentQuestion.id) ? 'Flagged for Review' : 'Flag for Review'}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <McqQuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              selectedOption={answers[currentQuestion.id] ?? null}
              onSelect={handleSelectOption}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="ghost"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          
          {currentQuestionIndex === test.questions.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="gap-2 px-8 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Submitting...' : <><Send className="w-4 h-4" /> Finish Assessment</>}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1))}
              className="gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="p-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <AlertCircle className="w-3 h-3" />
          <span>Secure Exam Environment Active. Do not refresh or close this tab.</span>
        </div>
      </footer>
    </div>
  );
};
