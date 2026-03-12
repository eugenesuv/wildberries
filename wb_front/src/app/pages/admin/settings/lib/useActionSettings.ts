import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { adminClient } from "@/app/shared/api/clients/admin.client";
import { aiClient } from "@/app/shared/api/clients/ai.client";
import {
    ActionSettings,
    PromotionStatus,
    TestAnswerNode,
    TestAnswerTargetType,
    TestQuestion,
    Theme,
} from "../types";
import {
    CATEGORIES,
    DEFAULT_AUCTION_SETTINGS,
    DEFAULT_FIXED_PRICE_SETTINGS,
    DEFAULT_TEST_QUESTION,
} from "../constants";
import { generateAnswerTree } from "./helpers";

const createEmptyTestQuestion = (): TestQuestion => ({
    question: DEFAULT_TEST_QUESTION.question,
    options: [...DEFAULT_TEST_QUESTION.options],
});

const createDefaultSettings = (): ActionSettings => ({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    theme: "zodiac",
    categories: {},
    segments: [],
    pricingModel: "auction",
    auctionSettings: { ...DEFAULT_AUCTION_SETTINGS },
    fixedPriceSettings: { ...DEFAULT_FIXED_PRICE_SETTINGS, priceByPosition: {} },
    slotCount: 10,
    minDiscount: 10,
    maxDiscount: 50,
    stopFactors: [],
    testQuestions: [createEmptyTestQuestion()],
    testAnswerTree: [],
    testStartQuestionIndex: 0,
    identificationMode: "questions",
});

const toDateInputValue = (value?: string) => (value ? value.slice(0, 10) : "");
const toRFC3339 = (value: string) => (value ? `${value}T00:00:00Z` : "");

const normalizeOptionValue = (value: string, qIndex: number, optIndex: number) => {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9а-яё_]/gi, "");
    return normalized || `q${qIndex + 1}_opt${optIndex + 1}`;
};

const PROMOTION_STATUS_VALUES: PromotionStatus[] = ["NOT_READY", "READY_TO_START", "RUNNING", "PAUSED", "COMPLETED"];

const normalizePromotionStatus = (status?: string): PromotionStatus => {
    if (PROMOTION_STATUS_VALUES.includes(status as PromotionStatus)) {
        return status as PromotionStatus;
    }
    return "NOT_READY";
};

const makeUUID = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    const part = Math.random().toString(16).slice(2, 14).padEnd(12, "0").slice(0, 12);
    return `00000000-0000-4000-8000-${part}`;
};

const ensureUUID = (value: string): string => {
    const trimmed = (value || "").trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(trimmed) ? trimmed : makeUUID();
};

const getLinkKey = (questionIndex: number, optionIndex: number) => `${questionIndex}:${optionIndex}`;

const extractErrorMessage = (error: any, fallback: string): string => {
    const message = error?.message;
    return typeof message === "string" && message.trim() ? message : fallback;
};

const resolveSegmentTarget = (targetValue: string, segments: string[]): string => {
    const normalized = String(targetValue || "").trim();
    if (normalized && segments.includes(normalized)) {
        return normalized;
    }
    const placeholderMatch = /^segment-(\d+)$/i.exec(normalized);
    if (placeholderMatch) {
        const segmentIndex = Number(placeholderMatch[1]) - 1;
        if (Number.isInteger(segmentIndex) && segmentIndex >= 0 && segmentIndex < segments.length) {
            return segments[segmentIndex] || "";
        }
    }
    return "";
};

const clampStartQuestionIndex = (index: number, totalQuestions: number) => {
    if (totalQuestions <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(index, totalQuestions - 1));
};

const buildDefaultLink = (
    questionIndex: number,
    optionIndex: number,
    totalQuestions: number,
    segments: string[],
): TestAnswerNode => {
    const hasNextQuestion = questionIndex < totalQuestions - 1;
    return {
        id: makeUUID(),
        questionIndex,
        optionIndex,
        targetType: hasNextQuestion ? "question" : "segment",
        targetValue: hasNextQuestion ? String(questionIndex + 1) : segments[0] || "",
    };
};

const normalizeTarget = (
    node: TestAnswerNode,
    questionIndex: number,
    optionIndex: number,
    totalQuestions: number,
    segments: string[],
): TestAnswerNode => {
    const fallback = buildDefaultLink(questionIndex, optionIndex, totalQuestions, segments);
    const targetType: TestAnswerTargetType =
        node.targetType === "segment" || node.targetType === "question" ? node.targetType : fallback.targetType;

    if (targetType === "question") {
        const questionTarget = Number(node.targetValue);
        if (!Number.isInteger(questionTarget) || questionTarget < 0 || questionTarget >= totalQuestions) {
            return {
                ...fallback,
                targetType,
                id: ensureUUID(node.id),
            };
        }
        return {
            id: ensureUUID(node.id),
            questionIndex,
            optionIndex,
            targetType,
            targetValue: String(questionTarget),
        };
    }

    const targetSegment = resolveSegmentTarget(node.targetValue, segments);
    if (!targetSegment) {
        return {
            ...fallback,
            targetType: "segment",
            targetValue: segments[0] || "",
            id: ensureUUID(node.id),
        };
    }

    return {
        id: ensureUUID(node.id),
        questionIndex,
        optionIndex,
        targetType: "segment",
        targetValue: targetSegment,
    };
};

const normalizeAnswerTree = (
    nodes: TestAnswerNode[],
    questions: TestQuestion[],
    segments: string[],
): TestAnswerNode[] => {
    const byKey = new Map<string, TestAnswerNode>();
    nodes.forEach((node) => {
        byKey.set(getLinkKey(node.questionIndex, node.optionIndex), node);
    });

    const normalized: TestAnswerNode[] = [];

    questions.forEach((question, questionIndex) => {
        (question.options || []).forEach((_, optionIndex) => {
            const key = getLinkKey(questionIndex, optionIndex);
            const source = byKey.get(key) || buildDefaultLink(questionIndex, optionIndex, questions.length, segments);
            normalized.push(normalizeTarget(source, questionIndex, optionIndex, questions.length, segments));
        });
    });

    return normalized;
};

const parsePersistedTree = (
    rawNodes: Array<{ id?: string; nodeId?: string; label?: string; value?: string }>,
): { nodes: TestAnswerNode[]; startQuestionIndex: number } => {
    const parsed: TestAnswerNode[] = [];
    let startQuestionIndex = 0;

    rawNodes.forEach((node) => {
        const label = String(node.label || "");
        const value = String(node.value || "");
        const nodeId = String(node.nodeId || node.id || makeUUID());

        if (label === "meta:start") {
            const parsedStart = Number(value);
            if (Number.isInteger(parsedStart) && parsedStart >= 0) {
                startQuestionIndex = parsedStart;
            }
            return;
        }

        const edgeMatch = /^edge:q(\d+):o(\d+)$/i.exec(label);
        if (!edgeMatch) {
            return;
        }

        const payloadMatch = /^(question|segment):(.+)$/i.exec(value);
        if (!payloadMatch) {
            return;
        }

        parsed.push({
            id: nodeId,
            questionIndex: Number(edgeMatch[1]),
            optionIndex: Number(edgeMatch[2]),
            targetType: payloadMatch[1].toLowerCase() as TestAnswerTargetType,
            targetValue: payloadMatch[2],
        });
    });

    return { nodes: parsed, startQuestionIndex };
};

const serializeAnswerTree = (nodes: TestAnswerNode[], startQuestionIndex: number) => {
    const rootId = makeUUID();
    const payload = [
        {
            nodeId: rootId,
            parentNodeId: "",
            label: "meta:start",
            value: String(startQuestionIndex),
        },
    ];

    nodes.forEach((node) => {
        payload.push({
            nodeId: ensureUUID(node.id),
            parentNodeId: rootId,
            label: `edge:q${node.questionIndex}:o${node.optionIndex}`,
            value: `${node.targetType}:${node.targetValue}`,
        });
    });

    return payload;
};

const withNormalizedTree = (settings: ActionSettings): ActionSettings => {
    const testAnswerTree = normalizeAnswerTree(settings.testAnswerTree || [], settings.testQuestions || [], settings.segments || []);
    const testStartQuestionIndex = clampStartQuestionIndex(
        settings.testStartQuestionIndex || 0,
        settings.testQuestions?.length || 0,
    );
    return {
        ...settings,
        testAnswerTree,
        testStartQuestionIndex,
    };
};

interface LoadedPromotionState {
    nextSettings: ActionSettings;
    nextSegmentIdsByName: Record<string, number>;
    nextOriginalSegmentIds: number[];
    promotionStatus: PromotionStatus;
}

const fetchPromotionState = async (promotionId: number): Promise<LoadedPromotionState> => {
    const [promotion, auctionParams] = await Promise.all([
        adminClient.getPromotion(promotionId),
        adminClient.getAuctionParams(promotionId).catch(() => ({})),
    ]);

    const segments = [...(promotion.segments || [])].sort((a, b) => a.orderIndex - b.orderIndex);
    const segmentNames = segments.map((segment) => segment.name);
    const categories = segments.reduce<Record<string, string>>((acc, segment) => {
        acc[segment.name] = segment.categoryName;
        return acc;
    }, {});
    const idsByName = segments.reduce<Record<string, number>>((acc, segment) => {
        acc[segment.name] = Number(segment.id);
        return acc;
    }, {});

    const fixedPriceMap = Object.entries(promotion.fixedPrices || {}).reduce<Record<number, number>>((acc, [position, price]) => {
        acc[Number(position)] = Number(price);
        return acc;
    }, {});

    const pollQuestions: TestQuestion[] =
        promotion.poll?.questions?.map((question) => ({
            question: question.text,
            options: (question.options || []).map((option) => option.text),
        })) || [];

    const parsedTree = parsePersistedTree((promotion.poll?.answerTree || []) as any[]);
    const fallbackTree = pollQuestions.length > 0 ? generateAnswerTree() : [];

    const nextSettings = withNormalizedTree({
        name: promotion.name || "",
        description: promotion.description || "",
        startDate: toDateInputValue(promotion.dateFrom),
        endDate: toDateInputValue(promotion.dateTo),
        theme: promotion.theme || "zodiac",
        categories,
        segments: segmentNames,
        pricingModel: (promotion.pricingModel as ActionSettings["pricingModel"]) || "auction",
        auctionSettings: {
            minPrice: Number((auctionParams as any)?.minPrice || DEFAULT_AUCTION_SETTINGS.minPrice),
            bidStep: Number((auctionParams as any)?.bidStep || DEFAULT_AUCTION_SETTINGS.bidStep),
            durationHours: Number((auctionParams as any)?.durationHours || DEFAULT_AUCTION_SETTINGS.durationHours),
            durationMinutes: Number(
                (auctionParams as any)?.durationMinutes ||
                    ((auctionParams as any)?.durationHours ? Number((auctionParams as any)?.durationHours) * 60 : 0) ||
                    DEFAULT_AUCTION_SETTINGS.durationMinutes,
            ),
        },
        fixedPriceSettings: { priceByPosition: fixedPriceMap },
        slotCount: Number(promotion.slotCount || 10),
        minDiscount: Number((promotion as any).discount || 0),
        maxDiscount: Number((promotion as any).discount || 0),
        stopFactors: promotion.stopFactors || [],
        testQuestions: pollQuestions.length > 0 ? pollQuestions : [createEmptyTestQuestion()],
        testAnswerTree: parsedTree.nodes.length > 0 ? parsedTree.nodes : fallbackTree,
        testStartQuestionIndex: parsedTree.startQuestionIndex || 0,
        identificationMode: (promotion.identificationMode as ActionSettings["identificationMode"]) || "questions",
    });

    return {
        nextSettings,
        nextSegmentIdsByName: idsByName,
        nextOriginalSegmentIds: Object.values(idsByName),
        promotionStatus: normalizePromotionStatus(promotion.status),
    };
};

export const useActionSettings = () => {
    const navigate = useNavigate();
    const { actionId } = useParams<{ actionId: string }>();
    const isNew = actionId === "new";

    const [settings, setSettings] = useState<ActionSettings>(createDefaultSettings);
    const [aiThemes, setAiThemes] = useState<Theme[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isStatusChanging, setIsStatusChanging] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);
    const [segmentIdsByName, setSegmentIdsByName] = useState<Record<string, number>>({});
    const [originalSegmentIds, setOriginalSegmentIds] = useState<number[]>([]);
    const [promotionStatus, setPromotionStatus] = useState<PromotionStatus | null>(null);

    const setNormalizedSettings = (updater: ActionSettings | ((prev: ActionSettings) => ActionSettings)) => {
        setSettings((prev) => {
            const next = typeof updater === "function" ? (updater as (prev: ActionSettings) => ActionSettings)(prev) : updater;
            return withNormalizedTree(next);
        });
    };

    const applyLoadedPromotionState = (loadedState: LoadedPromotionState) => {
        setSettings(loadedState.nextSettings);
        setSegmentIdsByName(loadedState.nextSegmentIdsByName);
        setOriginalSegmentIds(loadedState.nextOriginalSegmentIds);
        setPromotionStatus(loadedState.promotionStatus);
    };

    useEffect(() => {
        if (isNew || !actionId) {
            setPromotionStatus(null);
            return;
        }

        let mounted = true;

        const loadPromotion = async () => {
            setIsLoading(true);
            setHasError(null);
            try {
                const loadedState = await fetchPromotionState(Number(actionId));
                if (!mounted) {
                    return;
                }
                applyLoadedPromotionState(loadedState);
            } catch (error) {
                if (!mounted) {
                    return;
                }
                setPromotionStatus(null);
                setHasError("Не удалось загрузить настройки акции");
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadPromotion();

        return () => {
            mounted = false;
        };
    }, [actionId, isNew]);

    const handleChangeStatus = async (nextStatus: PromotionStatus) => {
        if (isNew || !actionId) {
            return;
        }

        setIsStatusChanging(true);
        setHasError(null);

        try {
            const promotionId = Number(actionId);
            await adminClient.changeStatus(promotionId, nextStatus);
            const loadedState = await fetchPromotionState(promotionId);
            applyLoadedPromotionState(loadedState);
        } catch (error: any) {
            setHasError(error?.message || "Не удалось изменить статус акции");
        } finally {
            setIsStatusChanging(false);
        }
    };

    const handleGenerateDescription = async () => {
        setHasError(null);
        try {
            const resp = await aiClient.getText({
                params: { theme: settings.theme, target: "promotion_description" },
            });
            const text = resp?.text?.trim();
            if (!text) {
                throw new Error("AI не вернул описание акции");
            }
            setNormalizedSettings((prev) => ({ ...prev, description: text }));
        } catch (error: any) {
            setHasError(extractErrorMessage(error, "Не удалось сгенерировать описание акции"));
        }
    };

    const handleGenerateName = async () => {
        setHasError(null);
        try {
            const resp = await aiClient.getText({
                params: { theme: settings.theme, target: "promotion_name" },
            });
            const text = resp?.text?.trim();
            if (!text) {
                throw new Error("AI не вернул название акции");
            }
            setNormalizedSettings((prev) => ({ ...prev, name: text }));
        } catch (error: any) {
            setHasError(extractErrorMessage(error, "Не удалось сгенерировать название акции"));
        }
    };

    const handleGenerateThemes = async () => {
        setHasError(null);
        try {
            const resp = await aiClient.generateThemes();
            const themes = (resp.themes || []).map((theme) => ({ value: theme.value, label: theme.label }));
            if (themes.length === 0) {
                throw new Error("AI не вернул темы акции");
            }
            setAiThemes(themes);
            setNormalizedSettings((prev) => ({ ...prev, theme: themes[0].value }));
        } catch (error: any) {
            setHasError(extractErrorMessage(error, "Не удалось сгенерировать темы акции"));
        }
    };

    const handleGenerateSegments = async () => {
        setHasError(null);
        try {
            const resp = await aiClient.generateSegments({ theme: settings.theme, limit: 12 });
            const suggestions = resp.segments || [];
            if (suggestions.length === 0) {
                throw new Error("AI не вернул сегменты акции");
            }
            const categories: Record<string, string> = {};
            const segments = suggestions.map((segment, index) => {
                categories[segment.name] = segment.categoryName || CATEGORIES[index % CATEGORIES.length];
                return segment.name;
            });
            setNormalizedSettings((prev) => ({ ...prev, segments, categories }));
        } catch (error: any) {
            setHasError(extractErrorMessage(error, "Не удалось сгенерировать сегменты акции"));
        }
    };

    const handleShuffleCategories = () => {
        const segments = settings.segments;
        const cats = segments.map((s) => settings.categories[s]).filter(Boolean) as string[];
        if (cats.length <= 1) {
            return;
        }

        const shuffled = [...cats];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const newCategories: Record<string, string> = {};
        segments.forEach((s, i) => {
            newCategories[s] = shuffled[i % shuffled.length] || "";
        });
        setNormalizedSettings((prev) => ({ ...prev, categories: newCategories }));
    };

    const handleAddSegment = () => {
        setNormalizedSettings((prev) => {
            let index = prev.segments.length + 1;
            let newSegment = `Сегмент ${index}`;
            while (prev.segments.includes(newSegment)) {
                index += 1;
                newSegment = `Сегмент ${index}`;
            }
            return {
                ...prev,
                segments: [...prev.segments, newSegment],
            };
        });
    };

    const handleRemoveSegment = (segmentToRemove: string) => {
        setNormalizedSettings((prev) => {
            const newSegments = prev.segments.filter((s) => s !== segmentToRemove);
            const newCategories = { ...prev.categories };
            delete newCategories[segmentToRemove];
            return { ...prev, segments: newSegments, categories: newCategories };
        });
        setSegmentIdsByName((prev) => {
            const next = { ...prev };
            delete next[segmentToRemove];
            return next;
        });
    };

    const handleUpdateSegment = (oldSegment: string, newSegment: string) => {
        const trimmed = newSegment;
        setNormalizedSettings((prev) => {
            const newSegments = prev.segments.map((s) => (s === oldSegment ? trimmed : s));
            const newCategories = { ...prev.categories };
            if (newCategories[oldSegment]) {
                newCategories[trimmed] = newCategories[oldSegment];
                if (trimmed !== oldSegment) {
                    delete newCategories[oldSegment];
                }
            }
            return { ...prev, segments: newSegments, categories: newCategories };
        });

        if (trimmed !== oldSegment) {
            setSegmentIdsByName((prev) => {
                if (!(oldSegment in prev)) {
                    return prev;
                }
                const next = { ...prev };
                next[trimmed] = next[oldSegment];
                delete next[oldSegment];
                return next;
            });
        }
    };

    const handleUpdateCategory = (segment: string, category: string) => {
        setNormalizedSettings((prev) => ({
            ...prev,
            categories: { ...prev.categories, [segment]: category },
        }));
    };

    const handleAddTestQuestion = () => {
        setNormalizedSettings((prev) => ({
            ...prev,
            testQuestions: [...prev.testQuestions, createEmptyTestQuestion()],
        }));
    };

    const handleRemoveTestQuestion = (index: number) => {
        setNormalizedSettings((prev) => {
            const testQuestions = prev.testQuestions.filter((_, i) => i !== index);
            return { ...prev, testQuestions };
        });
    };

    const handleUpdateTestQuestion = (index: number, question: string) => {
        setNormalizedSettings((prev) => {
            const testQuestions = [...prev.testQuestions];
            if (!testQuestions[index]) {
                return prev;
            }
            testQuestions[index].question = question;
            return { ...prev, testQuestions };
        });
    };

    const handleUpdateTestOption = (qIndex: number, optIndex: number, value: string) => {
        setNormalizedSettings((prev) => {
            const testQuestions = [...prev.testQuestions];
            if (
                !testQuestions[qIndex] ||
                optIndex < 0 ||
                optIndex >= (testQuestions[qIndex].options || []).length
            ) {
                return prev;
            }
            testQuestions[qIndex].options[optIndex] = value;
            return { ...prev, testQuestions };
        });
    };

    const handleAddTestOption = (questionIndex: number) => {
        setNormalizedSettings((prev) => {
            const testQuestions = [...prev.testQuestions];
            if (!testQuestions[questionIndex]) {
                return prev;
            }
            testQuestions[questionIndex].options = [...(testQuestions[questionIndex].options || []), ""];
            return { ...prev, testQuestions };
        });
    };

    const handleRemoveTestOption = (questionIndex: number, optionIndex: number) => {
        setNormalizedSettings((prev) => {
            const testQuestions = [...prev.testQuestions];
            const question = testQuestions[questionIndex];
            if (!question) {
                return prev;
            }
            const options = [...(question.options || [])];
            if (options.length <= 2 || optionIndex < 0 || optionIndex >= options.length) {
                return prev;
            }
            options.splice(optionIndex, 1);
            question.options = options;
            return { ...prev, testQuestions };
        });
    };

    const handleGenerateTestQuestions = async () => {
        setHasError(null);
        try {
            const resp = await aiClient.generateQuestions({ theme: settings.theme });
            const questions =
                (resp.questions || []).map((q) => ({
                    question: q.text,
                    options: (q.options || []).map((option) => option.text),
                })) || [];
            if (questions.length === 0) {
                throw new Error("AI не вернул тест-вопросы");
            }
            setNormalizedSettings((prev) => ({
                ...prev,
                testQuestions: questions,
                testAnswerTree: generateAnswerTree(),
                testStartQuestionIndex: 0,
            }));
        } catch (error: any) {
            setHasError(extractErrorMessage(error, "Не удалось сгенерировать тест-вопросы"));
        }
    };

    const handleGenerateAnswerTree = async () => {
        setHasError(null);
        try {
            const resp = await aiClient.generateAnswerTree({ theme: settings.theme });
            const parsed = parsePersistedTree((resp.nodes || []) as any[]);
            if (parsed.nodes.length === 0) {
                throw new Error("AI не вернул дерево ответов");
            }
            setNormalizedSettings((prev) => ({
                ...prev,
                testAnswerTree: parsed.nodes,
                testStartQuestionIndex: parsed.startQuestionIndex,
            }));
        } catch (error: any) {
            setHasError(extractErrorMessage(error, "Не удалось сгенерировать дерево ответов"));
        }
    };

    const handleUpdateAnswerLink = (
        questionIndex: number,
        optionIndex: number,
        targetType: TestAnswerTargetType,
        targetValue: string,
    ) => {
        setNormalizedSettings((prev) => {
            const key = getLinkKey(questionIndex, optionIndex);
            const linksMap = new Map<string, TestAnswerNode>();
            prev.testAnswerTree.forEach((node) => {
                linksMap.set(getLinkKey(node.questionIndex, node.optionIndex), node);
            });

            const existing = linksMap.get(key) || buildDefaultLink(questionIndex, optionIndex, prev.testQuestions.length, prev.segments);
            linksMap.set(key, {
                ...existing,
                targetType,
                targetValue,
            });

            return { ...prev, testAnswerTree: Array.from(linksMap.values()) };
        });
    };

    const handleUpdateTestStartQuestion = (questionIndex: number) => {
        setNormalizedSettings((prev) => ({
            ...prev,
            testStartQuestionIndex: questionIndex,
        }));
    };

    const handleToggleStopFactor = (factor: string, checked: boolean) => {
        setNormalizedSettings((prev) => ({
            ...prev,
            stopFactors: checked ? [...prev.stopFactors, factor] : prev.stopFactors.filter((f) => f !== factor),
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setHasError(null);

        try {
            let promotionId = isNew ? 0 : Number(actionId);

            const promotionPayload = {
                name: settings.name,
                description: settings.description,
                theme: settings.theme,
                dateFrom: toRFC3339(settings.startDate),
                dateTo: toRFC3339(settings.endDate),
                identificationMode: settings.identificationMode,
                pricingModel: settings.pricingModel,
                slotCount: settings.slotCount,
                discount: settings.minDiscount,
                stopFactors: settings.stopFactors,
            };

            if (isNew) {
                const created = await adminClient.createPromotion(promotionPayload as any);
                promotionId = Number(created.id);
            } else if (promotionId) {
                await adminClient.updatePromotion(promotionId, promotionPayload as any);
            }

            if (!promotionId) {
                throw new Error("promotion id is empty");
            }

            const nextIdsByName = { ...segmentIdsByName };
            const retainedIds = new Set<number>();

            for (let index = 0; index < settings.segments.length; index += 1) {
                const segmentName = settings.segments[index];
                const categoryName = settings.categories[segmentName] || "";
                const orderIndex = index + 1;
                const existingId = nextIdsByName[segmentName];

                if (existingId) {
                    await adminClient.updateSegment(promotionId, existingId, {
                        name: segmentName,
                        categoryName,
                        orderIndex,
                    });
                    retainedIds.add(existingId);
                    continue;
                }

                const createdSegment = await adminClient.createSegment(promotionId, {
                    name: segmentName,
                    categoryName,
                    orderIndex,
                });
                const createdId = Number(createdSegment.id);
                if (createdId) {
                    nextIdsByName[segmentName] = createdId;
                    retainedIds.add(createdId);
                }
            }

            for (const previousId of originalSegmentIds) {
                if (!retainedIds.has(previousId)) {
                    await adminClient.deleteSegment(promotionId, previousId);
                }
            }

            setSegmentIdsByName(nextIdsByName);
            setOriginalSegmentIds(Array.from(retainedIds));

            if (settings.pricingModel === "fixed") {
                const prices = Object.entries(settings.fixedPriceSettings?.priceByPosition || {})
                    .map(([position, price]) => ({ position: Number(position), price: String(Number(price || 0)) }))
                    .filter((entry) => entry.position > 0 && Number(entry.price) > 0);
                await adminClient.setFixedPrices(promotionId, prices);
            }

            if (settings.pricingModel === "auction") {
                await adminClient.setAuctionParams(promotionId, {
                    minPrice: Number(settings.auctionSettings?.minPrice || 0),
                    bidStep: Number(settings.auctionSettings?.bidStep || 0),
                    durationHours: Number(settings.auctionSettings?.durationHours || DEFAULT_AUCTION_SETTINGS.durationHours),
                    durationMinutes: Number(settings.auctionSettings?.durationMinutes || 0),
                });
            }

            if (settings.identificationMode === "questions") {
                const questionsPayload = settings.testQuestions
                    .filter((question) => question.question.trim())
                    .map((question, qIndex) => ({
                        text: question.question,
                        options: question.options
                            .filter((option) => option.trim())
                            .map((option, optIndex) => ({
                                text: option,
                                value: normalizeOptionValue(option, qIndex, optIndex),
                            })),
                    }))
                    .filter((question) => question.options.length > 0);

                await adminClient.setPollQuestions(promotionId, questionsPayload);

                const normalizedTree = normalizeAnswerTree(
                    settings.testAnswerTree,
                    settings.testQuestions,
                    settings.segments,
                );
                const answerTreeNodes = serializeAnswerTree(
                    normalizedTree,
                    clampStartQuestionIndex(settings.testStartQuestionIndex, settings.testQuestions.length),
                );
                await adminClient.setAnswerTree(promotionId, answerTreeNodes);
            }

            navigate("/admin/dashboard");
        } catch (error: any) {
            setHasError(error?.message || "Не удалось сохранить настройки акции");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoBack = () => {
        navigate("/admin/dashboard");
    };

    return {
        isNew,
        settings,
        setSettings: setNormalizedSettings,
        aiThemes,
        isLoading,
        isSaving,
        isStatusChanging,
        hasError,
        promotionStatus,
        handleGenerateName,
        handleGenerateDescription,
        handleGenerateThemes,
        handleGenerateSegments,
        handleShuffleCategories,
        handleAddSegment,
        handleRemoveSegment,
        handleUpdateSegment,
        handleUpdateCategory,
        handleAddTestQuestion,
        handleRemoveTestQuestion,
        handleUpdateTestQuestion,
        handleUpdateTestOption,
        handleAddTestOption,
        handleRemoveTestOption,
        handleGenerateTestQuestions,
        handleGenerateAnswerTree,
        handleUpdateAnswerLink,
        handleUpdateTestStartQuestion,
        handleToggleStopFactor,
        handleSave,
        handleChangeStatus,
        handleGoBack,
    };
};
