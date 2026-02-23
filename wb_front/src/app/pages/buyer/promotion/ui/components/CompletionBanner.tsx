interface CompletionBannerProps {
    isVisible: boolean;
}

export function CompletionBanner({ isVisible }: CompletionBannerProps) {
    if (!isVisible) return null;

    return (
        <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg mb-8">
            Акция завершена. Просмотрите товары из прошлых подборок.
        </div>
    );
}
