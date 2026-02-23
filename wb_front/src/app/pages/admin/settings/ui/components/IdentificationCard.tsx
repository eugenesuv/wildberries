import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Label } from "@/app/entities/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/entities/ui/radio-group";
import { ActionSettings } from "../../types";

interface IdentificationCardProps {
    settings: ActionSettings;
    onSettingsChange: (settings: ActionSettings) => void;
}

export function IdentificationCard({ settings, onSettingsChange }: IdentificationCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Идентификация пользователя</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <RadioGroup
                    value={settings.identificationMode}
                    onValueChange={(v: "questions" | "user_profile") =>
                        onSettingsChange({ ...settings, identificationMode: v })
                    }
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="questions" id="id-questions" />
                        <Label htmlFor="id-questions">Тест-вопросы</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="user_profile" id="id-profile" />
                        <Label htmlFor="id-profile">
                            По данным профиля (дата рождения, возраст, пол, город и т.п.)
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
    );
}
