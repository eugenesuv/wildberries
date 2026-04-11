import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Button } from "@/app/entities/ui/button";
import { Input } from "@/app/entities/ui/input";
import { Label } from "@/app/entities/ui/label";
import { Textarea } from "@/app/entities/ui/textarea";
import { Sparkles } from "lucide-react";
import { ActionSettings, Theme } from "../../types";
import { THEMES } from "../../constants";

interface BasicInfoCardProps {
    settings: ActionSettings;
    aiThemes: Theme[];
    onSettingsChange: (settings: ActionSettings) => void;
    onGenerateName: () => void;
    onGenerateDescription: () => void;
    onGenerateThemes: () => void;
    onClearAll: () => void;
}

export function BasicInfoCard({
    settings,
    aiThemes,
    onSettingsChange,
    onGenerateName,
    onGenerateDescription,
    onGenerateThemes,
    onClearAll,
}: BasicInfoCardProps) {
    const [isThemeSuggestionsOpen, setIsThemeSuggestionsOpen] = useState(false);
    const themeSuggestions = useMemo(
        () =>
            [...THEMES, ...aiThemes].filter(
                (theme, index, list) =>
                    list.findIndex(
                        (item) =>
                            item.value.toLowerCase() === theme.value.toLowerCase() ||
                            item.label.toLowerCase() === theme.label.toLowerCase(),
                    ) === index,
            ),
        [aiThemes],
    );
    const normalizedThemeQuery = settings.theme.trim().toLowerCase();
    const filteredThemeSuggestions = themeSuggestions.filter((theme) => {
        if (!normalizedThemeQuery) {
            return true;
        }
        return (
            theme.label.toLowerCase().includes(normalizedThemeQuery) ||
            theme.value.toLowerCase().includes(normalizedThemeQuery)
        );
    });

    const applyTheme = (theme: Theme) => {
        onSettingsChange({ ...settings, theme: theme.label });
        setIsThemeSuggestionsOpen(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="theme">Тематика</Label>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={onClearAll}>
                                Очистить все
                            </Button>
                            <Button variant="outline" size="sm" onClick={onGenerateThemes}>
                                <Sparkles className="w-4 h-4 mr-2" /> Сгенерировать тему
                            </Button>
                        </div>
                    </div>
                    <Input
                        id="theme"
                        className="mt-1"
                        value={settings.theme}
                        onChange={(e) => onSettingsChange({ ...settings, theme: e.target.value })}
                        onFocus={() => setIsThemeSuggestionsOpen(true)}
                        onBlur={() => window.setTimeout(() => setIsThemeSuggestionsOpen(false), 120)}
                        placeholder="Например: знаки зодиака, весеннее обновление, уютный дом"
                    />
                    {isThemeSuggestionsOpen && filteredThemeSuggestions.length > 0 && (
                        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-3xl border bg-background shadow-xl">
                            <div className="max-h-72 overflow-y-auto py-3">
                                {filteredThemeSuggestions.map((theme) => (
                                    <button
                                        key={`${theme.value}-${theme.label}`}
                                        type="button"
                                        className="block w-full px-4 py-3 text-left text-base transition-colors hover:bg-muted"
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            applyTheme(theme);
                                        }}
                                    >
                                        {theme.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                        Можно выбрать подсказку или ввести свою тему вручную.
                    </p>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="name">Название акции</Label>
                        <Button variant="ghost" size="sm" onClick={onGenerateName}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Сгенерировать AI
                        </Button>
                    </div>
                    <Input
                        id="name"
                        value={settings.name}
                        onChange={(e) => onSettingsChange({ ...settings, name: e.target.value })}
                        placeholder="Гороскопные Скидки - Январь 2026"
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
            </CardContent>
        </Card>
    );
}
