import { CheckCircle2, ChevronRight } from 'lucide-react';

interface StepItem {
  title: string;
  description: string;
}

interface RequestStepsTimelineProps {
  currentStep: number;
  steps: StepItem[];
}

export default function RequestStepsTimeline({ currentStep, steps }: RequestStepsTimelineProps) {
  return (
    <div className="flex justify-between items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-6 overflow-x-auto">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center gap-2 shrink-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              idx <= currentStep
                ? 'bg-primary text-white'
                : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-700'
            }`}
          >
            {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
          </div>
          <div className="hidden sm:block">
            <span
              className={`text-xs font-bold block ${
                idx === currentStep ? 'text-primary' : 'text-zinc-400'
              }`}
            >
              {step.title}
            </span>
            <span className="text-[10px] text-zinc-400 block">{step.description}</span>
          </div>
          {idx < steps.length - 1 && (
            <ChevronRight className="w-4 h-4 text-zinc-300 hidden sm:block" />
          )}
        </div>
      ))}
    </div>
  );
}
