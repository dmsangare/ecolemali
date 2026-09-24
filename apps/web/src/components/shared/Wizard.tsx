import { ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  content: ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void | Promise<void>;
  isSubmitting?: boolean;
  completeLabel?: string;
  allowStepClick?: boolean;
}

export function Wizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  isSubmitting = false,
  completeLabel = "Terminer",
  allowStepClick = true,
}: WizardProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const handleNext = async () => {
    if (currentStepData.validate) {
      const valid = await currentStepData.validate();
      if (!valid) return;
    }
    if (isLastStep) {
      await onComplete();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) onStepChange(currentStep - 1);
  };

  const handleStepClick = (index: number) => {
    if (!allowStepClick) return;
    if (index < currentStep) {
      onStepChange(index);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = allowStepClick && index < currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center gap-3 group",
                    isClickable && "cursor-pointer"
                  )}
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                      isCompleted &&
                        "bg-primary text-primary-foreground border-primary",
                      isCurrent && "border-primary text-primary bg-primary/10",
                      !isCompleted &&
                        !isCurrent &&
                        "border-muted-foreground/30 text-muted-foreground/50",
                      isClickable && "group-hover:border-primary"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : step.icon ? (
                      step.icon
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Label */}
                  <div className="hidden md:block">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isCurrent
                          ? "text-foreground"
                          : isCompleted
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground/70">
                        {step.description}
                      </p>
                    )}
                  </div>
                </button>

                {/* Separator */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-3 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">{currentStepData.content}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || isSubmitting}
        >
          <ChevronLeft className="h-4 w-4" />
          Precedent
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Etape {currentStep + 1} sur {steps.length}
          </span>
        </div>

        <Button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isLastStep ? (
            isSubmitting ? (
              "Enregistrement..."
            ) : (
              completeLabel
            )
          ) : (
            <>
              Suivant
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
