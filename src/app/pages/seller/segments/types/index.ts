export interface Segment {
    id: string;
    name: string;
    category: string;
    status: "available" | "full";
    occupiedSlots: number;
    totalSlots: number;
    reach: number;
}

export interface SegmentStats {
    occupiedSlots: number;
    totalSlots: number;
    reach: number;
}

export type SegmentStatus = "available" | "full";
