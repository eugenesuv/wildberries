import { ArrowLeft, Save } from "lucide-react";
import type { PromotionStatus } from "../../types";
import { Badge } from "@/app/entities/ui/badge";
import { Button } from "@/app/entities/ui/button";

const STATUS_ORDER: PromotionStatus[] = ["NOT_READY", "READY_TO_START", "RUNNING", "PAUSED", "COMPLETED"];

const STATUS_LABELS: Record<PromotionStatus, string> = {
    NOT_READY: "Черновик",
    READY_TO_START: "Готова к запуску",
    RUNNING: "Запущена",
    PAUSED: "На паузе",
    COMPLETED: "Завершена",
};

const STATUS_ACTION_LABELS: Record<PromotionStatus, string> = {
    NOT_READY: "В черновик",
    READY_TO_START: "Подготовить",
    RUNNING: "Запустить",
    PAUSED: "Пауза",
    COMPLETED: "Завершить",
};

const STATUS_BADGE_CLASSNAMES: Record<PromotionStatus, string> = {
    NOT_READY: "border-slate-200 bg-slate-100 text-slate-700",
    READY_TO_START: "border-blue-200 bg-blue-50 text-blue-700",
    RUNNING: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PAUSED: "border-amber-200 bg-amber-50 text-amber-700",
    COMPLETED: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

interface SettingsHeaderProps {
    isNew: boolean;
    currentStatus: PromotionStatus | null;
    isSaving?: boolean;
    isStatusChanging?: boolean;
    onGoBack: () => void;
    onSave: () => void;
    onChangeStatus: (status: PromotionStatus) => void;
}

export function SettingsHeader({
    isNew,
    currentStatus,
    isSaving = false,
    isStatusChanging = false,
    onGoBack,
    onSave,
    onChangeStatus,
}: SettingsHeaderProps) {
    const canChangeStatus = !isNew && Boolean(currentStatus);
    const statusTargets = currentStatus ? STATUS_ORDER.filter((status) => status !== currentStatus) : [];
    const isBusy = isSaving || isStatusChanging;

    return (
        <header className="bg-white border-b sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Button variant="ghost" size="icon" type="button" onClick={onGoBack}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl">{isNew ? "Создание акции" : "Настройки акции"}</h1>
                            <p className="text-sm text-muted-foreground">
                                Настройте параметры персонализированной акции
                            </p>
                        </div>
                    </div>

                    {canChangeStatus && currentStatus && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">Статус</span>
                            <Badge
                                variant="outline"
                                className={STATUS_BADGE_CLASSNAMES[currentStatus]}
                                aria-label={`Текущий статус: ${STATUS_LABELS[currentStatus]}`}
                            >
                                {STATUS_LABELS[currentStatus]}
                            </Badge>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {canChangeStatus &&
                            statusTargets.map((status) => (
                                <Button
                                    key={status}
                                    type="button"
                                    size="sm"
                                    variant={status === "COMPLETED" ? "destructive" : "outline"}
                                    disabled={isBusy}
                                    onClick={() => onChangeStatus(status)}
                                >
                                    {STATUS_ACTION_LABELS[status]}
                                </Button>
                            ))}

                        <Button
                            type="button"
                            className="bg-gradient-to-r from-purple-600 to-indigo-600"
                            onClick={onSave}
                            disabled={isBusy}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Сохранить
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
