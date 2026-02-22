import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Button } from "@/app/entities/ui/button";
import { Input } from "@/app/entities/ui/input";
import { Label } from "@/app/entities/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/entities/ui/select";
import { Plus, Shuffle, Sparkles, Trash2 } from "lucide-react";
import { ActionSettings } from "../../types";
import { CATEGORIES } from "../../constants";

interface SegmentsCardProps {
    settings: ActionSettings;
    onSettingsChange: (settings: ActionSettings) => void;
    onGenerateSegments: () => void;
    onShuffleCategories: () => void;
    onAddSegment: () => void;
    onRemoveSegment: (segment: string) => void;
    onUpdateSegment: (oldSegment: string, newSegment: string) => void;
    onUpdateCategory: (segment: string, category: string) => void;
}

export function SegmentsCard({
    settings,
    onSettingsChange,
    onGenerateSegments,
    onShuffleCategories,
    onAddSegment,
    onRemoveSegment,
    onUpdateSegment,
    onUpdateCategory,
}: SegmentsCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Сегменты и категории</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onGenerateSegments}>
                            <Sparkles className="w-4 h-4 mr-2" /> Сгенерировать (AI)
                        </Button>
                        <Button variant="outline" size="sm" onClick={onShuffleCategories}>
                            <Shuffle className="w-4 h-4 mr-2" /> Перемешать
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {settings.segments.length === 0 && (
                    <div className="text-sm text-muted-foreground">Сегментов нет. Добавьте первый сегмент.</div>
                )}
                <div className="space-y-3">
                    {settings.segments.map((seg) => (
                        <div key={seg} className="flex items-center gap-2">
                            <Input
                                value={seg}
                                onChange={(e) => onUpdateSegment(seg, e.target.value)}
                                className="w-56"
                                placeholder="Название сегмента"
                            />
                            <Select
                                value={settings.categories[seg] || ""}
                                onValueChange={(value) => onUpdateCategory(seg, value)}
                            >
                                <SelectTrigger className="min-w-[200px]">
                                    <SelectValue placeholder="Категория" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => onRemoveSegment(seg)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
                <Button variant="outline" onClick={onAddSegment}>
                    <Plus className="w-4 h-4 mr-2" /> Добавить сегмент
                </Button>
            </CardContent>
        </Card>
    );
}
