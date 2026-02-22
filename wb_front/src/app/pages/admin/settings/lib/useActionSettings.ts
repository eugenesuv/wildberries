import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { adminClient } from "@/app/shared/api/clients/admin.client";
import { aiClient } from "@/app/shared/api/clients/ai.client";
import { ActionSettings, Theme, TestQuestion } from "../types";
import {
    DEFAULT_AUCTION_SETTINGS,
    DEFAULT_FIXED_PRICE_SETTINGS,
    DEFAULT_TEST_QUESTION,
    CATEGORIES,
} from "../constants";
import { generateThemes, generateSegments, generateQuestions, generateAnswerTree } from "./helpers";

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
    testQuestions: [{ ...DEFAULT_TEST_QUESTION }],
    testAnswerTree: [],
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

const flattenAnswerTree = (nodes: any[]): Array<{ nodeId: string; parentNodeId: string; label: string; value: string }> => {
    if (!Array.isArray(nodes) || nodes.length === 0) {
        return [];
    }

    if (nodes.every((node) => typeof node === "object" && node && "nodeId" in node)) {
        return nodes.map((node) => ({
            nodeId: String(node.nodeId),
            parentNodeId: String(node.parentNodeId || ""),
            label: String(node.label || ""),
            value: String(node.value || ""),
        }));
    }

    const flat: Array<{ nodeId: string; parentNodeId: string; label: string; value: string }> = [];

    const walk = (list: any[], parentNodeId: string, path: string) => {
        list.forEach((node, index) => {
            const nodeId = `${path}-${index + 1}`;
            flat.push({
                nodeId,
                parentNodeId,
                label: String(node?.label || `Node ${index + 1}`),
                value: String(node?.value || `node_${index + 1}`),
            });
            if (Array.isArray(node?.next) && node.next.length > 0) {
                walk(node.next, nodeId, nodeId);
            }
        });
    };

    walk(nodes, "", "root");
    return flat;
};

export const useActionSettings = () => {
    const navigate = useNavigate();
    const { actionId } = useParams<{ actionId: string }>();
    const isNew = actionId === "new";

    const [settings, setSettings] = useState<ActionSettings>(createDefaultSettings);
    const [aiThemes, setAiThemes] = useState<Theme[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);
    const [segmentIdsByName, setSegmentIdsByName] = useState<Record<string, number>>({});
    const [originalSegmentIds, setOriginalSegmentIds] = useState<number[]>([]);

    useEffect(() => {
        if (isNew || !actionId) {
            return;
        }

        let mounted = true;

        const loadPromotion = async () => {
            setIsLoading(true);
            setHasError(null);

            try {
                const [promotion, auctionParams] = await Promise.all([
                    adminClient.getPromotion(Number(actionId)),
                    adminClient.getAuctionParams(Number(actionId)).catch(() => ({})),
                ]);

                if (!mounted) {
                    return;
                }

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

                const fixedPriceMap = Object.entries(promotion.fixedPrices || {}).reduce<Record<number, number>>(
                    (acc, [position, price]) => {
                        acc[Number(position)] = Number(price);
                        return acc;
                    },
                    {},
                );

                const pollQuestions: TestQuestion[] =
                    promotion.poll?.questions?.map((question) => ({
                        question: question.text,
                        options: (question.options || []).map((option) => option.text),
                    })) || [];

                setSettings({
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
                    },
                    fixedPriceSettings: { priceByPosition: fixedPriceMap },
                    slotCount: Number(promotion.slotCount || 10),
                    minDiscount: Number((promotion as any).discount || 0),
                    maxDiscount: Number((promotion as any).discount || 0),
                    stopFactors: promotion.stopFactors || [],
                    testQuestions: pollQuestions.length > 0 ? pollQuestions : [{ ...DEFAULT_TEST_QUESTION }],
                    testAnswerTree: ((promotion.poll?.answerTree || []) as any) ?? [],
                    identificationMode:
                        (promotion.identificationMode as ActionSettings["identificationMode"]) || "questions",
                });

                setSegmentIdsByName(idsByName);
                setOriginalSegmentIds(Object.values(idsByName));
            } catch (error) {
                if (!mounted) {
                    return;
                }
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

    const handleGenerateDescription = async () => {
        try {
            const resp = await aiClient.getText({ params: { theme: settings.theme } });
            if (resp?.text) {
                setSettings((prev) => ({ ...prev, description: resp.text }));
                return;
            }
        } catch (error) {
            // fallback below
        }

        setSettings((prev) => ({
            ...prev,
            description:
                "Персонализированная акция с подборкой товаров на основе сегментации покупателей. Увеличьте вовлечённость через тематическую подачу и релевантные товары.",
        }));
    };

    const handleGenerateThemes = async () => {
        try {
            const resp = await aiClient.generateThemes();
            const themes = (resp.themes || []).map((theme) => ({ value: theme.value, label: theme.label }));
            if (themes.length > 0) {
                setAiThemes(themes);
                setSettings((prev) => ({ ...prev, theme: themes[0].value }));
                return;
            }
        } catch (error) {
            // fallback below
        }

        const themes = generateThemes();
        setAiThemes(themes);
        if (themes[0]) {
            setSettings((prev) => ({ ...prev, theme: themes[0].value }));
        }
    };

    const handleGenerateSegments = async () => {
        try {
            const resp = await aiClient.generateSegments({ theme: settings.theme, limit: 12 });
            const suggestions = resp.segments || [];
            if (suggestions.length > 0) {
                const categories: Record<string, string> = {};
                const segments = suggestions.map((segment, index) => {
                    categories[segment.name] = segment.categoryName || CATEGORIES[index % CATEGORIES.length];
                    return segment.name;
                });
                setSettings((prev) => ({ ...prev, segments, categories }));
                return;
            }
        } catch (error) {
            // fallback below
        }

        const segments = generateSegments(settings.theme);
        const categories: Record<string, string> = {};
        segments.forEach((segment, index) => {
            categories[segment] = CATEGORIES[index % CATEGORIES.length];
        });
        setSettings((prev) => ({ ...prev, segments, categories }));
    };

    const handleShuffleCategories = () => {
        const segments = settings.segments;
        const cats = segments.map((s) => settings.categories[s]).filter(Boolean) as string[];
        if (cats.length <= 1) return;

        const shuffled = [...cats];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const newCategories: Record<string, string> = {};
        segments.forEach((s, i) => {
            newCategories[s] = shuffled[i % shuffled.length] || "";
        });
        setSettings({ ...settings, categories: newCategories });
    };

    const handleAddSegment = () => {
        let index = settings.segments.length + 1;
        let newSegment = `Сегмент ${index}`;
        while (settings.segments.includes(newSegment)) {
            index += 1;
            newSegment = `Сегмент ${index}`;
        }

        setSettings({
            ...settings,
            segments: [...settings.segments, newSegment],
        });
    };

    const handleRemoveSegment = (segmentToRemove: string) => {
        const newSegments = settings.segments.filter((s) => s !== segmentToRemove);
        const newCategories = { ...settings.categories };
        delete newCategories[segmentToRemove];
        setSettings({ ...settings, segments: newSegments, categories: newCategories });
        setSegmentIdsByName((prev) => {
            const next = { ...prev };
            delete next[segmentToRemove];
            return next;
        });
    };

    const handleUpdateSegment = (oldSegment: string, newSegment: string) => {
        const trimmed = newSegment;
        const newSegments = settings.segments.map((s) => (s === oldSegment ? trimmed : s));
        const newCategories = { ...settings.categories };
        if (newCategories[oldSegment]) {
            newCategories[trimmed] = newCategories[oldSegment];
            if (trimmed !== oldSegment) {
                delete newCategories[oldSegment];
            }
        }
        setSettings({ ...settings, segments: newSegments, categories: newCategories });
        if (trimmed !== oldSegment) {
            setSegmentIdsByName((prev) => {
                if (!(oldSegment in prev)) return prev;
                const next = { ...prev };
                next[trimmed] = next[oldSegment];
                delete next[oldSegment];
                return next;
            });
        }
    };

    const handleUpdateCategory = (segment: string, category: string) => {
        setSettings({
            ...settings,
            categories: { ...settings.categories, [segment]: category },
        });
    };

    const handleAddTestQuestion = () => {
        setSettings({
            ...settings,
            testQuestions: [...settings.testQuestions, { ...DEFAULT_TEST_QUESTION }],
        });
    };

    const handleRemoveTestQuestion = (index: number) => {
        setSettings({
            ...settings,
            testQuestions: settings.testQuestions.filter((_, i) => i !== index),
        });
    };

    const handleUpdateTestQuestion = (index: number, question: string) => {
        const newQuestions = [...settings.testQuestions];
        newQuestions[index].question = question;
        setSettings({ ...settings, testQuestions: newQuestions });
    };

    const handleUpdateTestOption = (qIndex: number, optIndex: number, value: string) => {
        const newQuestions = [...settings.testQuestions];
        newQuestions[qIndex].options[optIndex] = value;
        setSettings({ ...settings, testQuestions: newQuestions });
    };

    const handleGenerateTestQuestions = async () => {
        try {
            const resp = await aiClient.generateQuestions({ theme: settings.theme });
            const questions =
                (resp.questions || []).map((q) => ({
                    question: q.text,
                    options: (q.options || []).map((option) => option.text),
                })) || [];
            if (questions.length > 0) {
                setSettings({ ...settings, testQuestions: questions });
                return;
            }
        } catch (error) {
            // fallback below
        }

        setSettings({
            ...settings,
            testQuestions: generateQuestions(settings.theme),
        });
    };

    const handleGenerateAnswerTree = async () => {
        try {
            const resp = await aiClient.generateAnswerTree({ theme: settings.theme });
            if ((resp.nodes || []).length > 0) {
                setSettings({ ...settings, testAnswerTree: resp.nodes as any });
                return;
            }
        } catch (error) {
            // fallback below
        }

        setSettings({
            ...settings,
            testAnswerTree: generateAnswerTree(),
        });
    };

    const handleToggleStopFactor = (factor: string, checked: boolean) => {
        if (checked) {
            setSettings({
                ...settings,
                stopFactors: [...settings.stopFactors, factor],
            });
        } else {
            setSettings({
                ...settings,
                stopFactors: settings.stopFactors.filter((f) => f !== factor),
            });
        }
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
                discount: settings.minDiscount, // compatibility mode: UI min/max -> backend single discount
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

                const answerTreeNodes = flattenAnswerTree(settings.testAnswerTree as any[]);
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
        setSettings,
        aiThemes,
        isLoading,
        isSaving,
        hasError,
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
        handleGenerateTestQuestions,
        handleGenerateAnswerTree,
        handleToggleStopFactor,
        handleSave,
        handleGoBack,
    };
};
