import { useMemo, useState } from "react";
import { Plus, Sparkles, Trash2, Play } from "lucide-react";
import { Button } from "@/app/entities/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Input } from "@/app/entities/ui/input";
import { Label } from "@/app/entities/ui/label";
import { TestAnswerNode, TestAnswerTargetType, TestQuestion } from "../../types";

interface TestQuestionsCardProps {
    questions: TestQuestion[];
    segments: string[];
    answerTree: TestAnswerNode[];
    startQuestionIndex: number;
    onAddQuestion: () => void;
    onRemoveQuestion: (index: number) => void;
    onUpdateQuestion: (index: number, question: string) => void;
    onUpdateOption: (qIndex: number, optIndex: number, value: string) => void;
    onAddOption: (questionIndex: number) => void;
    onRemoveOption: (questionIndex: number, optionIndex: number) => void;
    onGenerateQuestions: () => void;
    onGenerateAnswerTree: () => void;
    onUpdateAnswerLink: (
        questionIndex: number,
        optionIndex: number,
        targetType: TestAnswerTargetType,
        targetValue: string,
    ) => void;
    onUpdateStartQuestion: (questionIndex: number) => void;
}

const getLinkKey = (questionIndex: number, optionIndex: number) => `${questionIndex}:${optionIndex}`;

const buildFallbackLink = (
    questionIndex: number,
    optionIndex: number,
    questions: TestQuestion[],
    segments: string[],
): TestAnswerNode => {
    const hasNextQuestion = questionIndex < questions.length - 1;
    return {
        id: `${questionIndex}-${optionIndex}`,
        questionIndex,
        optionIndex,
        targetType: hasNextQuestion ? "question" : "segment",
        targetValue: hasNextQuestion ? String(questionIndex + 1) : segments[0] || "",
    };
};

const shortText = (value: string, maxLength = 34) => {
    if (!value) {
        return "";
    }
    if (value.length <= maxLength) {
        return value;
    }
    return `${value.slice(0, maxLength - 3)}...`;
};

export function TestQuestionsCard({
    questions,
    segments,
    answerTree,
    startQuestionIndex,
    onAddQuestion,
    onRemoveQuestion,
    onUpdateQuestion,
    onUpdateOption,
    onAddOption,
    onRemoveOption,
    onGenerateQuestions,
    onGenerateAnswerTree,
    onUpdateAnswerLink,
    onUpdateStartQuestion,
}: TestQuestionsCardProps) {
    const [previewQuestionIndex, setPreviewQuestionIndex] = useState<number | null>(null);
    const [previewResult, setPreviewResult] = useState<string>("");
    const [previewTrace, setPreviewTrace] = useState<string[]>([]);

    const linksByKey = useMemo(() => {
        const map = new Map<string, TestAnswerNode>();
        answerTree.forEach((node) => {
            map.set(getLinkKey(node.questionIndex, node.optionIndex), node);
        });
        return map;
    }, [answerTree]);

    const resolveLink = (questionIndex: number, optionIndex: number) => {
        return (
            linksByKey.get(getLinkKey(questionIndex, optionIndex)) ||
            buildFallbackLink(questionIndex, optionIndex, questions, segments)
        );
    };

    const validationIssues = useMemo(() => {
        const issues: string[] = [];

        if (questions.length === 0) {
            issues.push("Добавьте хотя бы один вопрос.");
            return issues;
        }

        if (startQuestionIndex < 0 || startQuestionIndex >= questions.length) {
            issues.push("Стартовый вопрос указан некорректно.");
        }

        if (segments.length === 0) {
            issues.push("Для финальных результатов не хватает сегментов акции.");
        }

        questions.forEach((question, qIndex) => {
            if (!question.question.trim()) {
                issues.push(`Вопрос ${qIndex + 1} не заполнен.`);
            }
            if ((question.options || []).length < 2) {
                issues.push(`У вопроса ${qIndex + 1} должно быть минимум 2 варианта ответа.`);
            }

            question.options.forEach((option, oIndex) => {
                if (!option.trim()) {
                    issues.push(`Вопрос ${qIndex + 1}, вариант ${oIndex + 1} пустой.`);
                }

                const link = resolveLink(qIndex, oIndex);
                if (link.targetType === "question") {
                    const targetQuestion = Number(link.targetValue);
                    if (!Number.isInteger(targetQuestion) || targetQuestion < 0 || targetQuestion >= questions.length) {
                        issues.push(`Вопрос ${qIndex + 1}, вариант ${oIndex + 1}: некорректный переход к вопросу.`);
                    }
                } else if (!link.targetValue || !segments.includes(link.targetValue)) {
                    issues.push(`Вопрос ${qIndex + 1}, вариант ${oIndex + 1}: выберите итоговый сегмент.`);
                }
            });
        });

        const visited = new Set<number>();
        const queue: number[] = [];
        if (startQuestionIndex >= 0 && startQuestionIndex < questions.length) {
            queue.push(startQuestionIndex);
        }

        while (queue.length > 0) {
            const current = queue.shift() as number;
            if (visited.has(current)) {
                continue;
            }
            visited.add(current);
            const currentQuestion = questions[current];
            if (!currentQuestion) {
                continue;
            }
            currentQuestion.options.forEach((_, optionIndex) => {
                const link = resolveLink(current, optionIndex);
                if (link.targetType === "question") {
                    const target = Number(link.targetValue);
                    if (!visited.has(target) && Number.isInteger(target) && target >= 0 && target < questions.length) {
                        queue.push(target);
                    }
                }
            });
        }

        const unreachable = questions
            .map((_, index) => index)
            .filter((questionIndex) => !visited.has(questionIndex));
        if (unreachable.length > 0) {
            const labels = unreachable.map((index) => `#${index + 1}`).join(", ");
            issues.push(`Есть недостижимые вопросы: ${labels}.`);
        }

        return issues;
    }, [questions, segments, startQuestionIndex, linksByKey]);

    const graphModel = useMemo(() => {
        const questionNodeWidth = 240;
        const questionNodeHeight = 62;
        const segmentNodeWidth = 220;
        const segmentNodeHeight = 56;
        const questionX = 80;
        const segmentX = 640;
        const questionStep = 130;
        const segmentStep = 110;
        const topPadding = 44;

        const questionNodes = questions.map((question, index) => ({
            id: `q-${index}`,
            index,
            x: questionX,
            y: topPadding + index * questionStep,
            width: questionNodeWidth,
            height: questionNodeHeight,
            label: question.question || `Вопрос ${index + 1}`,
            isStart: index === startQuestionIndex,
        }));

        const segmentNodes = segments.map((segment, index) => ({
            id: `s-${index}`,
            index,
            x: segmentX,
            y: topPadding + index * segmentStep,
            width: segmentNodeWidth,
            height: segmentNodeHeight,
            label: segment || `Сегмент ${index + 1}`,
        }));

        const segmentIndexByName = new Map<string, number>();
        segments.forEach((segment, index) => segmentIndexByName.set(segment, index));

        const edges: Array<{
            id: string;
            fromX: number;
            fromY: number;
            toX: number;
            toY: number;
            label: string;
            targetType: TestAnswerTargetType;
        }> = [];

        questions.forEach((question, questionIndex) => {
            question.options.forEach((option, optionIndex) => {
                const sourceNode = questionNodes[questionIndex];
                if (!sourceNode) {
                    return;
                }

                const link =
                    linksByKey.get(getLinkKey(questionIndex, optionIndex)) ||
                    buildFallbackLink(questionIndex, optionIndex, questions, segments);

                let targetX = 0;
                let targetY = 0;

                if (link.targetType === "question") {
                    const targetQuestionIndex = Number(link.targetValue);
                    const targetNode = questionNodes[targetQuestionIndex];
                    if (!Number.isInteger(targetQuestionIndex) || !targetNode) {
                        return;
                    }
                    targetX = targetNode.x;
                    targetY = targetNode.y + targetNode.height / 2;
                } else {
                    const targetSegmentIndex = segmentIndexByName.get(link.targetValue);
                    if (targetSegmentIndex === undefined) {
                        return;
                    }
                    const targetNode = segmentNodes[targetSegmentIndex];
                    if (!targetNode) {
                        return;
                    }
                    targetX = targetNode.x;
                    targetY = targetNode.y + targetNode.height / 2;
                }

                edges.push({
                    id: `e-${questionIndex}-${optionIndex}`,
                    fromX: sourceNode.x + sourceNode.width,
                    fromY: sourceNode.y + 18 + optionIndex * 14,
                    toX: targetX,
                    toY: targetY,
                    label: option || `Вариант ${optionIndex + 1}`,
                    targetType: link.targetType,
                });
            });
        });

        const contentHeight = Math.max(
            topPadding + questionNodes.length * questionStep + 40,
            topPadding + segmentNodes.length * segmentStep + 40,
            260,
        );

        return {
            width: 940,
            height: contentHeight,
            questionNodes,
            segmentNodes,
            edges,
        };
    }, [linksByKey, questions, segments, startQuestionIndex]);

    const runPreview = () => {
        if (questions.length === 0) {
            return;
        }
        setPreviewQuestionIndex(Math.max(0, Math.min(startQuestionIndex, questions.length - 1)));
        setPreviewResult("");
        setPreviewTrace([]);
    };

    const handlePreviewAnswer = (questionIndex: number, optionIndex: number) => {
        const question = questions[questionIndex];
        if (!question) {
            return;
        }
        const option = question.options[optionIndex] || `Вариант ${optionIndex + 1}`;
        const link = resolveLink(questionIndex, optionIndex);
        setPreviewTrace((prev) => [...prev, `В${questionIndex + 1}: ${option}`]);

        if (link.targetType === "segment") {
            setPreviewResult(link.targetValue || "Сегмент не выбран");
            setPreviewQuestionIndex(null);
            return;
        }

        const nextQuestion = Number(link.targetValue);
        if (Number.isInteger(nextQuestion) && nextQuestion >= 0 && nextQuestion < questions.length) {
            setPreviewQuestionIndex(nextQuestion);
            return;
        }

        setPreviewResult("Некорректный переход");
        setPreviewQuestionIndex(null);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle>Тест и дерево решений</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onGenerateQuestions}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Сгенерировать вопросы
                        </Button>
                        <Button variant="outline" size="sm" onClick={onGenerateAnswerTree}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Черновик дерева
                        </Button>
                        <Button variant="outline" size="sm" onClick={onAddQuestion}>
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить вопрос
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="rounded-lg border bg-slate-50 p-4">
                    <Label className="mb-2 block">Стартовый вопрос</Label>
                    <select
                        className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                        value={String(startQuestionIndex)}
                        onChange={(e) => onUpdateStartQuestion(Number(e.target.value))}
                    >
                        {questions.map((question, index) => (
                            <option key={index} value={index}>
                                {`Вопрос ${index + 1}: ${question.question || "без текста"}`}
                            </option>
                        ))}
                    </select>
                </div>

                {questions.map((question, qIndex) => (
                    <div key={qIndex} className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <Label>{`Вопрос ${qIndex + 1}`}</Label>
                            {questions.length > 1 && (
                                <Button variant="ghost" size="icon" onClick={() => onRemoveQuestion(qIndex)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            )}
                        </div>

                        <Input
                            placeholder="Текст вопроса"
                            value={question.question}
                            onChange={(e) => onUpdateQuestion(qIndex, e.target.value)}
                        />

                        <div className="mt-4 space-y-3">
                            {question.options.map((option, oIndex) => {
                                const link = resolveLink(qIndex, oIndex);
                                return (
                                    <div key={oIndex} className="rounded-md border bg-slate-50 p-3">
                                        <div className="grid gap-2 md:grid-cols-[1.2fr_0.8fr_1fr_auto]">
                                            <Input
                                                placeholder={`Вариант ${oIndex + 1}`}
                                                value={option}
                                                onChange={(e) => onUpdateOption(qIndex, oIndex, e.target.value)}
                                            />

                                            <select
                                                className="rounded-md border bg-white px-3 py-2 text-sm"
                                                value={link.targetType}
                                                onChange={(e) => {
                                                    const nextType = e.target.value as TestAnswerTargetType;
                                                    const fallbackValue =
                                                        nextType === "question"
                                                            ? String(Math.min(qIndex + 1, Math.max(questions.length - 1, 0)))
                                                            : segments[0] || "";
                                                    onUpdateAnswerLink(qIndex, oIndex, nextType, fallbackValue);
                                                }}
                                            >
                                                <option value="question">Следующий вопрос</option>
                                                <option value="segment">Итоговый сегмент</option>
                                            </select>

                                            {link.targetType === "question" ? (
                                                <select
                                                    className="rounded-md border bg-white px-3 py-2 text-sm"
                                                    value={link.targetValue}
                                                    onChange={(e) =>
                                                        onUpdateAnswerLink(qIndex, oIndex, "question", e.target.value)
                                                    }
                                                >
                                                    {questions.map((_, targetIndex) => (
                                                        <option key={targetIndex} value={targetIndex}>
                                                            {`Вопрос ${targetIndex + 1}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <select
                                                    className="rounded-md border bg-white px-3 py-2 text-sm"
                                                    value={link.targetValue}
                                                    onChange={(e) =>
                                                        onUpdateAnswerLink(qIndex, oIndex, "segment", e.target.value)
                                                    }
                                                >
                                                    {segments.length === 0 && (
                                                        <option value="">Сначала добавьте сегменты</option>
                                                    )}
                                                    {segments.map((segment) => (
                                                        <option key={segment} value={segment}>
                                                            {segment}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={question.options.length <= 2}
                                                onClick={() => onRemoveOption(qIndex, oIndex)}
                                                title="Удалить вариант"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            <div>
                                <Button type="button" variant="outline" size="sm" onClick={() => onAddOption(qIndex)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Добавить вариант
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="rounded-lg border bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <Label>Проверка схемы</Label>
                        <span className="text-xs text-muted-foreground">{`Ошибок: ${validationIssues.length}`}</span>
                    </div>
                    {validationIssues.length === 0 ? (
                        <p className="text-sm text-emerald-700">Схема валидна: можно запускать и сохранять.</p>
                    ) : (
                        <ul className="list-disc space-y-1 pl-5 text-sm text-red-600">
                            {validationIssues.map((issue) => (
                                <li key={issue}>{issue}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-lg border bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <Label>Граф связей</Label>
                        <span className="text-xs text-muted-foreground">{`Связей: ${graphModel.edges.length}`}</span>
                    </div>
                    <div className="overflow-auto rounded-md border bg-slate-50">
                        <svg width={graphModel.width} height={graphModel.height} className="min-w-[900px]">
                            <defs>
                                <marker
                                    id="arrow-head"
                                    markerWidth="8"
                                    markerHeight="8"
                                    refX="7"
                                    refY="4"
                                    orient="auto"
                                >
                                    <path d="M0,0 L8,4 L0,8 z" fill="#64748b" />
                                </marker>
                            </defs>

                            {graphModel.edges.map((edge) => {
                                const controlOffset = 130;
                                const path = `M ${edge.fromX} ${edge.fromY} C ${edge.fromX + controlOffset} ${edge.fromY}, ${edge.toX - controlOffset} ${edge.toY}, ${edge.toX} ${edge.toY}`;
                                const labelX = (edge.fromX + edge.toX) / 2;
                                const labelY = (edge.fromY + edge.toY) / 2;
                                return (
                                    <g key={edge.id}>
                                        <path
                                            d={path}
                                            fill="none"
                                            stroke={edge.targetType === "segment" ? "#059669" : "#475569"}
                                            strokeWidth={1.8}
                                            markerEnd="url(#arrow-head)"
                                        />
                                        <text x={labelX} y={labelY - 4} fontSize="10" fill="#334155" textAnchor="middle">
                                            {shortText(edge.label, 20)}
                                        </text>
                                    </g>
                                );
                            })}

                            {graphModel.questionNodes.map((node) => (
                                <g key={node.id}>
                                    <rect
                                        x={node.x}
                                        y={node.y}
                                        width={node.width}
                                        height={node.height}
                                        rx={10}
                                        fill={node.isStart ? "#dbeafe" : "#e2e8f0"}
                                        stroke={node.isStart ? "#2563eb" : "#94a3b8"}
                                        strokeWidth={node.isStart ? 2 : 1.2}
                                    />
                                    <text x={node.x + 10} y={node.y + 20} fontSize="11" fill="#0f172a">
                                        {`Q${node.index + 1}${node.isStart ? " (start)" : ""}`}
                                    </text>
                                    <text x={node.x + 10} y={node.y + 39} fontSize="11" fill="#1e293b">
                                        {shortText(node.label, 31)}
                                    </text>
                                </g>
                            ))}

                            {graphModel.segmentNodes.map((node) => (
                                <g key={node.id}>
                                    <rect
                                        x={node.x}
                                        y={node.y}
                                        width={node.width}
                                        height={node.height}
                                        rx={10}
                                        fill="#dcfce7"
                                        stroke="#16a34a"
                                        strokeWidth={1.2}
                                    />
                                    <text x={node.x + 10} y={node.y + 21} fontSize="11" fill="#14532d">
                                        {`SEG ${node.index + 1}`}
                                    </text>
                                    <text x={node.x + 10} y={node.y + 39} fontSize="11" fill="#166534">
                                        {shortText(node.label, 29)}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Серые/синие узлы — вопросы, зеленые — итоговые сегменты. Стрелки подписаны вариантами ответов.
                    </p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <Label>Прогон теста</Label>
                        <Button variant="outline" size="sm" onClick={runPreview}>
                            <Play className="mr-2 h-4 w-4" />
                            Начать прогон
                        </Button>
                    </div>

                    {previewQuestionIndex !== null && questions[previewQuestionIndex] ? (
                        <div className="space-y-3">
                            <p className="font-medium">{questions[previewQuestionIndex].question || "Вопрос без текста"}</p>
                            <div className="flex flex-wrap gap-2">
                                {questions[previewQuestionIndex].options.map((option, optionIndex) => (
                                    <Button
                                        key={optionIndex}
                                        type="button"
                                        variant="secondary"
                                        onClick={() => handlePreviewAnswer(previewQuestionIndex, optionIndex)}
                                    >
                                        {option || `Вариант ${optionIndex + 1}`}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Нажмите «Начать прогон», чтобы проверить прохождение пользователя.
                        </p>
                    )}

                    {previewTrace.length > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">{`Путь: ${previewTrace.join(" -> ")}`}</p>
                    )}

                    {previewResult && (
                        <p className="mt-2 text-sm font-semibold text-emerald-700">{`Итог: ${previewResult}`}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
