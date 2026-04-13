import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { adminClient } from "@/app/shared/api/clients/admin.client";
import { buyerClient } from "@/app/shared/api/clients/buyer.client";
import { Promotion, TestAnswers, TestQuestion, UserSegment } from "../types";
import { STORAGE_KEYS } from "../constants";
import { getRandomIndex, calculateProgress } from "./helpers";
import { buildSegmentPath, mapCurrentPromotionToCarousel, mapPollToTestQuestions } from "./mappers";

import { THEMES } from "./../../../admin/settings/constants/index";

const extractStartQuestionIndex = (answerTree?: Array<{ label?: string; value?: string }>) => {
    const startNode = (answerTree || []).find((node) => String(node?.label || "").trim() === "meta:start");
    const startIndex = Number(startNode?.value || 0);
    return Number.isInteger(startIndex) && startIndex >= 0 ? startIndex : 0;
};

export const useHomePage = () => {
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [promotionTitle, setPromotionTitle] = useState<string>("");
    const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
    const [showTestModal, setShowTestModal] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<TestAnswers>({});
    const [userSegment, setUserSegment] = useState<UserSegment>(localStorage.getItem(STORAGE_KEYS.USER_SEGMENT));
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);
    const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
    const [segmentPathById, setSegmentPathById] = useState<Record<string, string>>({});
    const [startQuestionIndexByPromotionId, setStartQuestionIndexByPromotionId] = useState<Record<number, number>>({});
    const [pendingSegmentPath, setPendingSegmentPath] = useState<string | null>(null);
    const [rememberSegment, setRememberSegment] = useState(true);

    const abIndex = useMemo(() => getRandomIndex(3), []);
    const autoplayRef = useRef<number | null>(null);

    const progress = calculateProgress(currentStep, Math.max(testQuestions.length, 1));

    useEffect(() => {
        let mounted = true;

        const loadCurrentPromotion = async () => {
            try {
                const response = await adminClient.listPromotions();

                if (!mounted) {
                    return;
                }

                if (!response?.promotions) {
                    setPromotions([]);
                    setSelectedPromo(null);
                    setSegmentPathById({});
                    setStartQuestionIndexByPromotionId({});
                    return;
                }

                const prTitle = THEMES.find((t) => t.value === response.theme)?.label || "";
                setPromotionTitle("");

                const detailedPromotions = (
                    await Promise.all(
                        response.promotions.map((promotion) =>
                            adminClient.getPromotion(Number(promotion.id)).catch(() => null),
                        ),
                    )
                ).filter(Boolean);

                if (!mounted) {
                    return;
                }

                setPromotions(mapCurrentPromotionToCarousel(detailedPromotions as any));
                setSegmentPathById(
                    detailedPromotions.reduce<Record<string, string>>((acc, promotion: any) => {
                        (promotion.segments || []).forEach((segment: any) => {
                            acc[segment.id] = buildSegmentPath(promotion.id, segment.id);
                        });
                        return acc;
                    }, {}),
                );
                setStartQuestionIndexByPromotionId(
                    detailedPromotions.reduce<Record<number, number>>((acc, promotion: any) => {
                        acc[Number(promotion.id)] = extractStartQuestionIndex(promotion.poll?.answerTree);
                        return acc;
                    }, {}),
                );
            } catch (error) {
                if (!mounted) {
                    return;
                }

                setHasError("Не удалось загрузить текущую акцию");
                setPromotions([]);
                setSelectedPromo(null);
                setSegmentPathById({});
                setStartQuestionIndexByPromotionId({});
            }
        };

        void loadCurrentPromotion();

        return () => {
            mounted = false;
        };
    }, []);

    const navigateToSegment = (segmentPath: string) => {
        navigate(`/promotion/${segmentPath}`);
    };

    const handlePromotionClick = async (promo: Promotion) => {
        const promotionId = promo?.id || null;
        setSelectedPromo(promo);
        setPromotionTitle(promo?.title || "");

        setIsLoading(true);
        setHasError(null);
        setPendingSegmentPath(promo.segment);

        try {
            if (!promotionId) {
                setTestQuestions([]);
                setCurrentQuestion(0);
                setAnswers({});
                setShowTestModal(true);
                return;
            }

            const response = await buyerClient.startIdentification({ promotionId: promotionId });

            if (response.method === "user_profile" && response.resultSegmentId) {
                const path =
                    segmentPathById[response.resultSegmentId] ||
                    buildSegmentPath(promotionId, response.resultSegmentId);
                if (rememberSegment) {
                    setUserSegment(response.resultSegmentId);
                    localStorage.setItem(STORAGE_KEYS.USER_SEGMENT, response.resultSegmentId);
                }
                navigateToSegment(path);
                return;
            }

            const mappedQuestions = mapPollToTestQuestions(response.poll);
            const rawStartIndex = promotionId ? startQuestionIndexByPromotionId[promotionId] ?? 0 : 0;
            const startIndex =
                mappedQuestions.length > 0
                    ? Math.max(0, Math.min(rawStartIndex, mappedQuestions.length - 1))
                    : 0;
            setTestQuestions(mappedQuestions.length > 0 ? mappedQuestions : []);
            setCurrentQuestion(startIndex);
            setCurrentStep(0);
            setAnswers({});
            setShowTestModal(true);
        } catch (e) {
            setHasError("Не удалось загрузить персональные данные");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestAnswer = (value: string) => {
        setAnswers({ ...answers, [currentQuestion]: value });
    };

    const handleTestSubmit = async () => {
        if (!selectedPromo) return;

        setIsLoading(true);
        setHasError(null);

        try {
            if (!selectedPromo.id) {
                setShowTestModal(false);
                if (pendingSegmentPath) {
                    navigateToSegment(pendingSegmentPath);
                }
                return;
            }

            const question = testQuestions[currentQuestion];
            const optionId = answers[currentQuestion];

            if (!question || !optionId) {
                return;
            }

            const response = await buyerClient.answer({
                promotionId: selectedPromo.id,
                questionId: String(question.id),
                optionId,
            });

            if (response.resultSegmentId && response.resultSegmentId !== "0") {
                const resultSegmentId = response.resultSegmentId;

                if (rememberSegment && resultSegmentId) {
                    setUserSegment(resultSegmentId);
                    localStorage.setItem(STORAGE_KEYS.USER_SEGMENT, resultSegmentId);
                }

                setShowTestModal(false);

                const path = segmentPathById[resultSegmentId] || buildSegmentPath(selectedPromo.id, resultSegmentId);
                navigateToSegment(path);
                return;
            }

            const nextQuestionId = Number(response.nextQuestionId || 0);
            const nextQuestionIndex = testQuestions.findIndex((item) => item.id === nextQuestionId);

            if (nextQuestionId > 0 && nextQuestionIndex >= 0) {
                setCurrentQuestion(nextQuestionIndex);
                setCurrentStep((prev) => prev + 1);
                return;
            }

            const firstKnown = Object.keys(segmentPathById)[0];
            const fallbackSegmentId = firstKnown || "";

            setShowTestModal(false);
            if (fallbackSegmentId) {
                const path = segmentPathById[fallbackSegmentId] || buildSegmentPath(selectedPromo.id, fallbackSegmentId);
                navigateToSegment(path);
                return;
            }

            if (pendingSegmentPath) {
                navigateToSegment(pendingSegmentPath);
            }
        } catch (error) {
            setHasError("Не удалось завершить сегментацию");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRememberChange = (checked: boolean) => {
        setRememberSegment(checked);
        if (!checked) {
            setUserSegment(null);
            localStorage.removeItem(STORAGE_KEYS.USER_SEGMENT);
        }
    };

    const handleCloseTestModal = () => {
        setShowTestModal(false);
        setCurrentQuestion(0);
        setCurrentStep(0);
        setAnswers({});
        setRememberSegment(true);
    };

    return {
        // State
        promotionTitle,
        promotions,
        testQuestions,
        showTestModal,
        currentQuestion,
        currentStep,
        answers,
        userSegment,
        isLoading,
        hasError,
        isHoveringCarousel,
        abIndex,
        progress,

        // Actions
        setShowTestModal,
        setIsHoveringCarousel,
        handlePromotionClick,
        handleTestAnswer,
        handleTestSubmit,
        handleRememberChange,
        handleCloseTestModal,
    };
};
