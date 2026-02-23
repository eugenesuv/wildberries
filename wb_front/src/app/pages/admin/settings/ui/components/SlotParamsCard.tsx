import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Input } from "@/app/entities/ui/input";
import { Label } from "@/app/entities/ui/label";
import { ActionSettings } from "../../types";

interface SlotParamsCardProps {
    settings: ActionSettings;
    onSettingsChange: (settings: ActionSettings) => void;
}

export function SlotParamsCard({ settings, onSettingsChange }: SlotParamsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Параметры слотов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="slotCount">Количество позиций на сегмент</Label>
                    <Input
                        id="slotCount"
                        type="number"
                        value={settings.slotCount}
                        onChange={(e) =>
                            onSettingsChange({
                                ...settings,
                                slotCount: Number(e.target.value),
                            })
                        }
                        min={1}
                        max={20}
                        className="mt-1"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="minDiscount">Минимальная скидка (%)</Label>
                        <Input
                            id="minDiscount"
                            type="number"
                            value={settings.minDiscount}
                            onChange={(e) =>
                                onSettingsChange({
                                    ...settings,
                                    minDiscount: Number(e.target.value),
                                })
                            }
                            min={0}
                            max={90}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="maxDiscount">Максимальная скидка (%)</Label>
                        <Input
                            id="maxDiscount"
                            type="number"
                            value={settings.maxDiscount}
                            onChange={(e) =>
                                onSettingsChange({
                                    ...settings,
                                    maxDiscount: Number(e.target.value),
                                })
                            }
                            min={0}
                            max={90}
                            className="mt-1"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
