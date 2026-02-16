import { NEXT_STEPS } from "../../constants";

export function NextSteps() {
    return (
        <div className="space-y-3">
            <h3 className="font-medium">Что дальше?</h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                {NEXT_STEPS.map((step, index) => (
                    <li key={index}>{step}</li>
                ))}
            </ol>
        </div>
    );
}
