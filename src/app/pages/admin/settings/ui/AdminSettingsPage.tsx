import { motion } from "motion/react";
import { useActionSettings } from "../lib/useActionSettings";
import { SettingsHeader } from "./components/SettingsHeader";
import { BasicInfoCard } from "./components/BasicInfoCard";
import { SegmentsCard } from "./components/SegmentsCard";
import { PricingCard } from "./components/PricingCard";
import { SlotParamsCard } from "./components/SlotParamsCard";
import { StopFactorsCard } from "./components/StopFactorsCard";
import { IdentificationCard } from "./components/IdentificationCard";
import { TestQuestionsCard } from "./components/TestQuestionsCard";

export function AdminSettingsPage() {
    const {
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
    } = useActionSettings();

    return (
        <div className="min-h-screen bg-gray-50">
            <SettingsHeader isNew={isNew} onGoBack={handleGoBack} onSave={handleSave} />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <BasicInfoCard
                        settings={settings}
                        aiThemes={aiThemes}
                        onSettingsChange={setSettings}
                        onGenerateDescription={handleGenerateDescription}
                        onGenerateThemes={handleGenerateThemes}
                    />

                    <SegmentsCard
                        settings={settings}
                        onSettingsChange={setSettings}
                        onGenerateSegments={handleGenerateSegments}
                        onShuffleCategories={handleShuffleCategories}
                        onAddSegment={handleAddSegment}
                        onRemoveSegment={handleRemoveSegment}
                        onUpdateSegment={handleUpdateSegment}
                        onUpdateCategory={handleUpdateCategory}
                    />

                    <PricingCard settings={settings} onSettingsChange={setSettings} />

                    <SlotParamsCard settings={settings} onSettingsChange={setSettings} />

                    <StopFactorsCard selectedFactors={settings.stopFactors} onToggleFactor={handleToggleStopFactor} />

                    <IdentificationCard settings={settings} onSettingsChange={setSettings} />

                    {settings.identificationMode === "questions" && (
                        <TestQuestionsCard
                            questions={settings.testQuestions}
                            answerTree={settings.testAnswerTree}
                            onAddQuestion={handleAddTestQuestion}
                            onRemoveQuestion={handleRemoveTestQuestion}
                            onUpdateQuestion={handleUpdateTestQuestion}
                            onUpdateOption={handleUpdateTestOption}
                            onGenerateQuestions={handleGenerateTestQuestions}
                            onGenerateAnswerTree={handleGenerateAnswerTree}
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
