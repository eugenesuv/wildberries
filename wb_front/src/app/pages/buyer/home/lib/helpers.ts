import { TestAnswers } from "../types";

export const getRandomIndex = (max: number): number => {
    return Math.floor(Math.random() * max);
};

export const determineSegment = (answers: TestAnswers): string => {
    // Простая логика определения сегмента на основе ответов
    // В реальности здесь будет более сложная логика
    return "leo";
};

export const calculateProgress = (current: number, total: number): number => {
    return ((current + 1) / total) * 100;
};
