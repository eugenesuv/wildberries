import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { buyerClient } from "@/app/shared/api/clients/buyer.client";
import { Promotion, TestAnswers, TestQuestion, UserSegment } from "../types";
import { PROMOTIONS, STORAGE_KEYS, TEST_QUESTIONS } from "../constants";
import { getRandomIndex, calculateProgress } from "./helpers";
import { buildSegmentPath, mapCurrentPromotionToCarousel, mapPollToTestQuestions } from "./mappers";

export const useHomePage = () => {
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState<Promotion[]>(PROMOTIONS);
    const [testQuestions, setTestQuestions] = useState<TestQuestion[]>(TEST_QUESTIONS);
    const [showTestModal, setShowTestModal] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<TestAnswers>({});
    const [userSegment, setUserSegment] = useState<UserSegment>(localStorage.getItem(STORAGE_KEYS.USER_SEGMENT));
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);
    const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
    const [currentPromotionId, setCurrentPromotionId] = useState<string | null>(null);
    const [segmentPathById, setSegmentPathById] = useState<Record<string, string>>({});
    const [pendingSegmentPath, setPendingSegmentPath] = useState<string | null>(null);
    const [rememberSegment, setRememberSegment] = useState(true);

    const abIndex = useMemo(() => getRandomIndex(3), []);
    const autoplayRef = useRef<number | null>(null);

    const progress = calculateProgress(currentQuestion, Math.max(testQuestions.length, 1));

    useEffect(() => {
        let mounted = true;

        const loadCurrentPromotion = async () => {
            try {
                const response = await buyerClient.getCurrentPromotion();

                if (!mounted) {
                    return;
                }

                if (!response?.id) {
                    setPromotions([]);
                    setCurrentPromotionId(null);
                    setSegmentPathById({});
                    return;
                }

                setCurrentPromotionId(response.id);
                setPromotions(mapCurrentPromotionToCarousel(response));
                setSegmentPathById(
                    (response.segments || []).reduce<Record<string, string>>((acc, segment) => {
                        acc[segment.id] = buildSegmentPath(response.id, segment.id);
                        return acc;
                    }, {}),
                );
            } catch (error) {
                if (!mounted) {
                    return;
                }

                setHasError("Не удалось загрузить текущую акцию");
                setPromotions(PROMOTIONS);
                setCurrentPromotionId(null);
                setSegmentPathById({});
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

    const handlePromotionClick = async (segment: string) => {
        setIsLoading(true);
        setHasError(null);
        setPendingSegmentPath(segment);

        try {
            if (userSegment) {
                navigateToSegment(segment);
                } else {
                if (!currentPromotionId) {
                    setTestQuestions(TEST_QUESTIONS);
                    setShowTestModal(true);
                    return;
                }

                const response = await buyerClient.startIdentification({ promotionId: currentPromotionId });

                if (response.method === "user_profile" && response.resultSegmentId) {
                    const path = segmentPathById[response.resultSegmentId] || buildSegmentPath(currentPromotionId, response.resultSegmentId);
                    if (rememberSegment) {
                        setUserSegment(response.resultSegmentId);
                        localStorage.setItem(STORAGE_KEYS.USER_SEGMENT, response.resultSegmentId);
                    }
                    navigateToSegment(path);
                    return;
                }

                const mappedQuestions = mapPollToTestQuestions(response.poll);
                setTestQuestions(mappedQuestions.length > 0 ? mappedQuestions : TEST_QUESTIONS);
                setCurrentQuestion(0);
                setAnswers({});
                setShowTestModal(true);
            }
        } catch (e) {
            setHasError("Не удалось загрузить персональные данные");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestAnswer = (value: string) => {
        setAnswers({ ...answers, [currentQuestion]: value });

        if (currentQuestion < testQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handleTestSubmit = async () => {
        setIsLoading(true);
        setHasError(null);

        try {
            if (!currentPromotionId) {
                setShowTestModal(false);
                if (pendingSegmentPath) {
                    navigateToSegment(pendingSegmentPath);
                }
                return;
            }

            let resultSegmentId = "";

            for (let index = 0; index < testQuestions.length; index += 1) {
                const question = testQuestions[index];
                const optionId = answers[index];

                if (!question || !optionId) {
                    continue;
                }

                const response = await buyerClient.answer({
                    promotionId: currentPromotionId,
                    questionId: String(question.id),
                    optionId,
                });

                if (response.resultSegmentId && response.resultSegmentId !== "0") {
                    resultSegmentId = response.resultSegmentId;
                }
            }

            if (!resultSegmentId) {
                const firstKnown = Object.keys(segmentPathById)[0];
                resultSegmentId = firstKnown || "";
            }

            if (rememberSegment && resultSegmentId) {
                setUserSegment(resultSegmentId);
                localStorage.setItem(STORAGE_KEYS.USER_SEGMENT, resultSegmentId);
            }

            setShowTestModal(false);

            if (resultSegmentId) {
                const path = segmentPathById[resultSegmentId] || buildSegmentPath(currentPromotionId, resultSegmentId);
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
        setAnswers({});
        setRememberSegment(true);
    };

    const triggerCarouselNext = () => {
        const evt = new Event("carousel-next");
        window.dispatchEvent(evt);
    };

    const triggerCarouselPrev = () => {
        const evt = new Event("carousel-prev");
        window.dispatchEvent(evt);
    };

    // Автопрокрутка карусели
    useEffect(() => {
        if (isHoveringCarousel) return;

        autoplayRef.current = window.setInterval(triggerCarouselNext, 6000);

        return () => {
            if (autoplayRef.current) {
                window.clearInterval(autoplayRef.current);
            }
        };
    }, [isHoveringCarousel]);

    return {
        // State
        promotions,
        testQuestions,
        showTestModal,
        currentQuestion,
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
        triggerCarouselNext,
        triggerCarouselPrev,
    };
};
