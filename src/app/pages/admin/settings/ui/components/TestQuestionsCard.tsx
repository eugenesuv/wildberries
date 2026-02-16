import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Button } from "@/app/entities/ui/button";
import { Input } from "@/app/entities/ui/input";
import { Label } from "@/app/entities/ui/label";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { TestQuestion } from "../../types";

interface TestQuestionsCardProps {
    questions: TestQuestion[];
    answerTree: any[];
    onAddQuestion: () => void;
    onRemoveQuestion: (index: number) => void;
    onUpdateQuestion: (index: number, question: string) => void;
    onUpdateOption: (qIndex: number, optIndex: number, value: string) => void;
    onGenerateQuestions: () => void;
    onGenerateAnswerTree: () => void;
}

export function TestQuestionsCard({
    questions,
    answerTree,
    onAddQuestion,
    onRemoveQuestion,
    onUpdateQuestion,
    onUpdateOption,
    onGenerateQuestions,
    onGenerateAnswerTree,
}: TestQuestionsCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Вопросы для теста</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onGenerateQuestions}>
                            <Sparkles className="w-4 h-4 mr-2" /> Сгенерировать вопросы
                        </Button>
                        <Button variant="outline" size="sm" onClick={onAddQuestion}>
                            <Plus className="w-4 h-4 mr-2" /> Добавить вопрос
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {questions.map((q, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                            <Label>Вопрос {index + 1}</Label>
                            {questions.length > 1 && (
                                <Button variant="ghost" size="icon" onClick={() => onRemoveQuestion(index)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            )}
                        </div>
                        <Input
                            placeholder="Введите вопрос"
                            value={q.question}
                            onChange={(e) => onUpdateQuestion(index, e.target.value)}
                        />
                        {q.options.map((opt, optIndex) => (
                            <Input
                                key={optIndex}
                                placeholder={`Вариант ${optIndex + 1}`}
                                value={opt}
                                onChange={(e) => onUpdateOption(index, optIndex, e.target.value)}
                            />
                        ))}
                    </div>
                ))}

                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <Label>Дерево ответов (AI)</Label>
                        <Button variant="outline" size="sm" onClick={onGenerateAnswerTree}>
                            <Sparkles className="w-4 h-4 mr-2" /> Сгенерировать дерево
                        </Button>
                    </div>
                    <pre className="text-xs bg-gray-50 p-3 rounded max-h-60 overflow-auto">
                        {JSON.stringify(answerTree, null, 2)}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
}
