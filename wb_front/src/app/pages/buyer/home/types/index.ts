export interface Promotion {
    id: number;
    segment: string;
    title: string;
    subtitleVariants: string[];
    gradient: string;
}

export interface TestQuestion {
    id: number;
    question: string;
    options: TestOption[];
}

export interface TestOption {
    value: string;
    label: string;
}

export interface TestAnswers {
    [key: number]: string;
}

export type UserSegment = string | null;
