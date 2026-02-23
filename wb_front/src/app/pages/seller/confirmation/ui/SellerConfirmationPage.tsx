import { motion } from "motion/react";
import { Card, CardContent } from "@/app/entities/ui/card";
import { useConfirmation } from "../lib/useConfirmation";
import { SuccessIcon } from "./components/SuccessIcon";
import { ApplicationDetails } from "./components/ApplicationDetails";
import { NextSteps } from "./components/NextSteps";
import { ImportantNotice } from "./components/ImportantNotice";
import { ActionButtons } from "./components/ActionButtons";

export function SellerConfirmationPage() {
    const { confirmationData, handleDownloadReceipt, handleNavigateHome, handleNavigateToApplications } =
        useConfirmation();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
            >
                <Card>
                    <CardContent className="p-8 md:p-12">
                        {/* Success Icon */}
                        <div className="text-center mb-8">
                            <SuccessIcon />
                            <h1 className="text-3xl mb-2">Заявка успешно отправлена!</h1>
                            <p className="text-muted-foreground">Ваш товар отправлен на модерацию</p>
                        </div>

                        {/* Информация о заявке */}
                        <div className="space-y-6 mb-8">
                            <ApplicationDetails data={confirmationData} />
                            <NextSteps />
                            <ImportantNotice />
                        </div>

                        {/* Действия */}
                        <ActionButtons
                            onHomeClick={handleNavigateHome}
                            onApplicationsClick={handleNavigateToApplications}
                            onDownloadReceipt={handleDownloadReceipt}
                        />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
