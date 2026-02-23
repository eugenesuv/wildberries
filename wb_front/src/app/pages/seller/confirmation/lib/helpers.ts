export const formatPrice = (price: number): string => {
    return `${price.toLocaleString("ru-RU")} ₽`;
};

export const formatApplicationNumber = (number: string): string => {
    return `#${number}`;
};
