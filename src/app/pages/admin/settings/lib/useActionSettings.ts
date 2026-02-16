import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ActionSettings, Theme, TestQuestion } from "../types";
import {
    DEFAULT_AUCTION_SETTINGS,
    DEFAULT_FIXED_PRICE_SETTINGS,
    DEFAULT_TEST_QUESTION,
    CATEGORIES,
} from "../constants";
import { generateThemes, generateSegments, generateQuestions, generateAnswerTree } from "./helpers";

export const useActionSettings = () => {
    const navigate = useNavigate();
    const { actionId } = useParams<{ actionId: string }>();
    const isNew = actionId === "new";

    const [settings, setSettings] = useState<ActionSettings>({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        theme: "zodiac",
        categories: {},
        segments: [],
        pricingModel: "auction",
        auctionSettings: DEFAULT_AUCTION_SETTINGS,
        fixedPriceSettings: DEFAULT_FIXED_PRICE_SETTINGS,
        slotCount: 10,
        minDiscount: 10,
        maxDiscount: 50,
        stopFactors: [],
        testQuestions: [DEFAULT_TEST_QUESTION],
        testAnswerTree: [],
        identificationMode: "questions",
    });

    const [aiThemes, setAiThemes] = useState<Theme[]>([]);

    const handleGenerateDescription = () => {
        setSettings({
            ...settings,
            description:
                "Персонализированная акция с подборкой товаров на основе знаков зодиака. Увеличьте вовлечённость покупателей через эмоциональный контекст!",
        });
    };

    const handleGenerateThemes = () => {
        const themes = generateThemes();
        setAiThemes(themes);
        if (themes[0]) {
            setSettings({ ...settings, theme: themes[0].value });
        }
    };

    const handleGenerateSegments = () => {
        const segments = generateSegments(settings.theme);
        const categories: Record<string, string> = {};
        segments.forEach((s, i) => {
            categories[s] = CATEGORIES[i % CATEGORIES.length];
        });
        setSettings({ ...settings, segments, categories });
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
        const newSegment = `Сегмент ${settings.segments.length + 1}`;
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
    };

    const handleUpdateSegment = (oldSegment: string, newSegment: string) => {
        const newSegments = settings.segments.map((s) => (s === oldSegment ? newSegment : s));
        const newCategories = { ...settings.categories };
        if (newCategories[oldSegment]) {
            newCategories[newSegment] = newCategories[oldSegment];
            delete newCategories[oldSegment];
        }
        setSettings({ ...settings, segments: newSegments, categories: newCategories });
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

    const handleGenerateTestQuestions = () => {
        setSettings({
            ...settings,
            testQuestions: generateQuestions(settings.theme),
        });
    };

    const handleGenerateAnswerTree = () => {
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

    const handleSave = () => {
        // Здесь будет логика сохранения
        navigate("/admin/dashboard");
    };

    const handleGoBack = () => {
        navigate("/admin/dashboard");
    };

    return {
        isNew,
        settings,
        setSettings,
        aiThemes,
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
