interface PageTitleProps {
    title: string;
    subtitle: string;
}

export function PageTitle({ title, subtitle }: PageTitleProps) {
    return (
        <div className="mb-8">
            <h2 className="text-3xl mb-2">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
        </div>
    );
}
