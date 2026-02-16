import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { TestAnswers, UserSegment } from "../types";
import { STORAGE_KEYS } from "../constants";
import { getRandomIndex, determineSegment, calculateProgress } from "./helpers";

export const useHomePage = () => {
    const navigate = useNavigate();
    const [showTestModal, setShowTestModal] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<TestAnswers>({});
    const [userSegment, setUserSegment] = useState<UserSegment>(localStorage.getItem(STORAGE_KEYS.USER_SEGMENT));
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState<string | null>(null);
    const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);

    const abIndex = useMemo(() => getRandomIndex(3), []);
    const autoplayRef = useRef<number | null>(null);

    const progress = calculateProgress(currentQuestion, 3);

    const handlePromotionClick = async (segment: string) => {
        setIsLoading(true);
        setHasError(null);

        try {
            await new Promise((r) => setTimeout(r, 700));

            if (userSegment) {
                navigate(`/promotion/${segment}`);
            } else {
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

        if (currentQuestion < 2) {
            // 3 вопроса всего
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handleTestSubmit = () => {
        const segment = determineSegment(answers);
        setUserSegment(segment);
        localStorage.setItem(STORAGE_KEYS.USER_SEGMENT, segment);
        setShowTestModal(false);
        navigate(`/promotion/${segment}`);
    };

    const handleRememberChange = (checked: boolean) => {
        if (!checked) {
            localStorage.removeItem(STORAGE_KEYS.USER_SEGMENT);
        }
    };

    const handleCloseTestModal = () => {
        setShowTestModal(false);
        setCurrentQuestion(0);
        setAnswers({});
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
