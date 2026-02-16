import { Card, CardContent, CardHeader, CardTitle } from "@/app/entities/ui/card";
import { Checkbox } from "@/app/entities/ui/checkbox";
import { Label } from "@/app/entities/ui/label";
import { STOP_FACTORS } from "../../constants";

interface StopFactorsCardProps {
    selectedFactors: string[];
    onToggleFactor: (factor: string, checked: boolean) => void;
}

export function StopFactorsCard({ selectedFactors, onToggleFactor }: StopFactorsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Стоп-факторы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {STOP_FACTORS.map((factor) => (
                    <div key={factor} className="flex items-center space-x-2">
                        <Checkbox
                            id={factor}
                            checked={selectedFactors.includes(factor)}
                            onCheckedChange={(checked) => onToggleFactor(factor, checked as boolean)}
                        />
                        <Label htmlFor={factor} className="cursor-pointer">
                            {factor}
                        </Label>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
