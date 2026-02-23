interface InfoBannerProps {
    title: string;
    description: string;
    variant?: "blue" | "green";
}

export function InfoBanner({ title, description, variant = "blue" }: InfoBannerProps) {
    const bgColor = variant === "blue" ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200";

    return (
        <div className={`${bgColor} border rounded-lg p-4`}>
            <h3 className="font-medium mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
