import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface McqQuestionCardProps {
  question: {
    id: string;
    text: string;
    options: string; // JSON string
  };
  selectedOption: number | null;
  onSelect: (optionIndex: number) => void;
  questionNumber: number;
}

export const McqQuestionCard: React.FC<McqQuestionCardProps> = ({
  question,
  selectedOption,
  onSelect,
  questionNumber,
}) => {
  const options = JSON.parse(question.options) as string[];

  return (
    <Card className="w-full border-none shadow-sm bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex gap-3">
          <span className="text-muted-foreground font-mono">Q{questionNumber}</span>
          {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((option, index) => (
          <div
            key={index}
            onClick={() => onSelect(index)}
            className={cn(
              "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-accent/50",
              selectedOption === index
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-transparent bg-background"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold",
              selectedOption === index
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30 text-muted-foreground"
            )}>
              {String.fromCharCode(65 + index)}
            </div>
            <Label className="flex-grow cursor-pointer text-base font-normal">
              {option}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
