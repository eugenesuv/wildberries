import { Segment } from "../types";

export const getSegmentStatusColor = (occupiedSlots: number, totalSlots: number): string => {
    const percentage = (occupiedSlots / totalSlots) * 100;
    if (percentage === 100) return "bg-red-500";
    if (percentage >= 70) return "bg-orange-500";
    return "bg-green-500";
};

export const getSegmentStatusText = (occupiedSlots: number, totalSlots: number): string => {
    const available = totalSlots - occupiedSlots;
    if (available === 0) return "Все слоты заняты";
    if (available === 1) return "1 слот доступен";
    if (available >= 2 && available <= 4) return `${available} слота доступно`;
    return `${available} слотов доступно`;
};

export const calculateOccupiedPercentage = (occupied: number, total: number): number => {
    return (occupied / total) * 100;
};

export const isSegmentFull = (segment: Segment): boolean => {
    return segment.occupiedSlots === segment.totalSlots;
};

export const formatReach = (reach: number): string => {
    return reach.toLocaleString("ru-RU");
};
