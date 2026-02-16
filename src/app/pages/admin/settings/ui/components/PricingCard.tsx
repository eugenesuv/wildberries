import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Button } from "@/app/entities/ui/button";
import { Input } from "@/app/entities/ui/input";
import { Label } from "@/app/entities/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/entities/ui/radio-group";
import { ActionSettings } from "../../types";

interface PricingCardProps {
    settings: ActionSettings;
    onSettingsChange: (settings: ActionSettings) => void;
}

export function PricingCard({ settings, onSettingsChange }: PricingCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Модель ценообразования</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <RadioGroup
                    value={settings.pricingModel}
                    onValueChange={(value: "auction" | "fixed") =>
                        onSettingsChange({ ...settings, pricingModel: value })
                    }
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="auction" id="auction" />
                        <Label htmlFor="auction">Аукцион</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fixed" id="fixed" />
                        <Label htmlFor="fixed">Фиксированная цена</Label>
                    </div>
                </RadioGroup>

                {settings.pricingModel === "auction" && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <Label htmlFor="minPrice">Минимальная цена (₽)</Label>
                            <Input
                                id="minPrice"
                                type="number"
                                value={settings.auctionSettings?.minPrice}
                                onChange={(e) =>
                                    onSettingsChange({
                                        ...settings,
                                        auctionSettings: {
                                            ...settings.auctionSettings!,
                                            minPrice: Number(e.target.value),
                                        },
                                    })
                                }
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="bidStep">Шаг ставки (₽)</Label>
                            <Input
                                id="bidStep"
                                type="number"
                                value={settings.auctionSettings?.bidStep}
                                onChange={(e) =>
                                    onSettingsChange({
                                        ...settings,
                                        auctionSettings: {
                                            ...settings.auctionSettings!,
                                            bidStep: Number(e.target.value),
                                        },
                                    })
                                }
                                className="mt-1"
                            />
                        </div>
                    </div>
                )}

                {settings.pricingModel === "fixed" && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <Label>Цены по позициям (1..N)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Array.from({ length: settings.slotCount }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-sm w-10">#{i + 1}</span>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={settings.fixedPriceSettings?.priceByPosition?.[i + 1] ?? ""}
                                        onChange={(e) => {
                                            const price = Number(e.target.value);
                                            const map = {
                                                ...(settings.fixedPriceSettings?.priceByPosition || {}),
                                            };
                                            map[i + 1] = price;
                                            onSettingsChange({
                                                ...settings,
                                                fixedPriceSettings: { priceByPosition: map },
                                            });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
