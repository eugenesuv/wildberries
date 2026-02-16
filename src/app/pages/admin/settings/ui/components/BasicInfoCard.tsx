import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Button } from "@/app/entities/ui/button";
import { Input } from "@/app/entities/ui/input";
import { Label } from "@/app/entities/ui/label";
import { Textarea } from "@/app/entities/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/entities/ui/select";
import { Sparkles } from "lucide-react";
import { ActionSettings, Theme } from "../../types";
import { THEMES } from "../../constants";

interface BasicInfoCardProps {
    settings: ActionSettings;
    aiThemes: Theme[];
    onSettingsChange: (settings: ActionSettings) => void;
    onGenerateDescription: () => void;
    onGenerateThemes: () => void;
}

export function BasicInfoCard({
    settings,
    aiThemes,
    onSettingsChange,
    onGenerateDescription,
    onGenerateThemes,
}: BasicInfoCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="name">Название акции</Label>
                    <Input
                        id="name"
                        value={settings.name}
                        onChange={(e) => onSettingsChange({ ...settings, name: e.target.value })}
                        placeholder="Гороскопные Скидки - Январь 2026"
                        className="mt-1"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="description">Описание</Label>
                        <Button variant="ghost" size="sm" onClick={onGenerateDescription}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Сгенерировать AI
                        </Button>
                    </div>
                    <Textarea
                        id="description"
                        value={settings.description}
                        onChange={(e) => onSettingsChange({ ...settings, description: e.target.value })}
                        placeholder="Краткое описание акции"
                        rows={3}
                        className="mt-1"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="startDate">Дата начала</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={settings.startDate}
                            onChange={(e) => onSettingsChange({ ...settings, startDate: e.target.value })}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="endDate">Дата окончания</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={settings.endDate}
                            onChange={(e) => onSettingsChange({ ...settings, endDate: e.target.value })}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="theme">Тематика</Label>
                        <Button variant="outline" size="sm" onClick={onGenerateThemes}>
                            <Sparkles className="w-4 h-4 mr-2" /> Сгенерировать (3)
                        </Button>
                    </div>
                    <Select
                        value={settings.theme}
                        onValueChange={(value) => onSettingsChange({ ...settings, theme: value })}
                    >
                        <SelectTrigger id="theme" className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {THEMES.map((theme) => (
                                <SelectItem key={theme.value} value={theme.value}>
                                    {theme.label}
                                </SelectItem>
                            ))}
                            {aiThemes.map((theme) => (
                                <SelectItem key={`ai-${theme.value}`} value={theme.value}>
                                    {theme.label} (AI)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
