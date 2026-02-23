import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/entities/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/app/entities/ui/radio-group";
import { Label } from "@/app/entities/ui/label";
import { Progress } from "@/app/entities/ui/progress";
import { Button } from "@/app/entities/ui/button";
import { TestQuestion, TestAnswers } from "../../types";

interface SegmentationTestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentQuestion: number;
    answers: TestAnswers;
    questions: TestQuestion[];
    progress: number;
    onAnswer: (value: string) => void;
    onSubmit: () => void;
    onRememberChange: (checked: boolean) => void;
}

export function SegmentationTestModal({
    open,
    onOpenChange,
    currentQuestion,
    answers,
    questions,
    progress,
    onAnswer,
    onSubmit,
    onRememberChange,
}: SegmentationTestModalProps) {
    const currentQ = questions[currentQuestion];
    const isLastQuestion = currentQuestion === questions.length - 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Определим твой знак зодиака</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Прогресс-бар */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>
                                Вопрос {currentQuestion + 1} из {questions.length}
                            </span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Вопрос */}
                    <div className="space-y-4">
                        <h4 className="font-medium">{currentQ.question}</h4>

                        <RadioGroup value={answers[currentQuestion] || ""} onValueChange={onAnswer}>
                            {currentQ.options.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.value} id={option.value} />
                                    <Label htmlFor={option.value} className="cursor-pointer">
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Запомнить выбор */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                            id="remember"
                            type="checkbox"
                            defaultChecked
                            onChange={(e) => onRememberChange(e.target.checked)}
                        />
                        <label htmlFor="remember" className="cursor-pointer">
                            Запомнить мой сегмент
                        </label>
                    </div>

                    {/* Кнопка завершения */}
                    <Button
                        onClick={onSubmit}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                        disabled={!answers[currentQuestion] || !isLastQuestion}
                    >
                        Получить результат
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
