interface ErrorMessageProps {
    error: string | null;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
    if (!error) return null;

    return (
        <div className="container mx-auto px-4 pb-6 -mt-6">
            <div className="bg-white border border-red-200 text-red-700 rounded-lg p-4 text-center">
                {error} — показан общий баннер
            </div>
        </div>
    );
}
