import { useHomePage } from "../lib/useHomePage";
import { PROMOTIONS, TEST_QUESTIONS } from "../constants";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { PromotionCarousel } from "./components/PromotionCarousel";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { ErrorMessage } from "./components/ErrorMessage";
import { SegmentationTestModal } from "./components/SegmentationTestModal";

export function HomePage() {
    const {
        showTestModal,
        currentQuestion,
        answers,
        isLoading,
        hasError,
        isHoveringCarousel,
        abIndex,
        progress,
        setShowTestModal,
        setIsHoveringCarousel,
        handlePromotionClick,
        handleTestAnswer,
        handleTestSubmit,
        handleRememberChange,
        handleCloseTestModal,
        triggerCarouselNext,
        triggerCarouselPrev,
    } = useHomePage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            <Header onNavigate={(path) => (window.location.href = path)} />

            <section className="container mx-auto px-4 py-12">
                <HeroSection />

                <PromotionCarousel
                    promotions={PROMOTIONS}
                    abIndex={abIndex}
                    isHovering={isHoveringCarousel}
                    onHoverChange={setIsHoveringCarousel}
                    onPromotionClick={handlePromotionClick}
                    onNext={triggerCarouselNext}
                    onPrev={triggerCarouselPrev}
                />
            </section>

            <LoadingOverlay isLoading={isLoading} />
            <ErrorMessage error={hasError} />

            <SegmentationTestModal
                open={showTestModal}
                onOpenChange={handleCloseTestModal}
                currentQuestion={currentQuestion}
                answers={answers}
                questions={TEST_QUESTIONS}
                progress={progress}
                onAnswer={handleTestAnswer}
                onSubmit={handleTestSubmit}
                onRememberChange={handleRememberChange}
            />
        </div>
    );
}
