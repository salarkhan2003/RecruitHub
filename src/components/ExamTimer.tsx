import React, { useEffect, useState, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  durationMinutes: number;
  startedAt: string;
  onTimeUp: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({ durationMinutes, startedAt, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState(100);

  const calculateTimeLeft = useCallback(() => {
    if (!durationMinutes || isNaN(durationMinutes)) return 0;
    const startTime = new Date(startedAt).getTime();
    if (isNaN(startTime)) return 0;
    
    const now = new Date().getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const elapsed = now - startTime;
    const remaining = Math.max(0, durationMs - elapsed);
    return Math.floor(remaining / 1000);
  }, [durationMinutes, startedAt]);

  useEffect(() => {
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      const durationMs = durationMinutes * 60 * 1000;
      const currentProgress = durationMs > 0 ? (remaining * 1000 / durationMs) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, currentProgress)));

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, durationMinutes, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2 w-full max-w-xs">
      <div className="flex justify-between items-end">
        <span className="text-sm font-medium text-muted-foreground">Time Remaining</span>
        <span className={cn(
          "text-2xl font-mono font-bold",
          timeLeft < 60 ? "text-destructive animate-pulse" : "text-foreground"
        )}>
          {formatTime(timeLeft)}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};
