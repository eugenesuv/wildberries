// ==================== Themes ====================
export interface AiThemeItem {
    value: string; // machine name, e.g. zodiac, harry-potter
    label: string; // display name
}

export interface AiGenerateThemesRequest {
    // empty object
}

export interface AiGenerateThemesResponse {
    themes: AiThemeItem[];
}

// ==================== Segments ====================
export interface AiSegmentSuggestion {
    name: string;
    categoryName: string;
}

export interface AiGenerateSegmentsRequest {
    theme: string;
    limit?: number; // int32
}

export interface AiGenerateSegmentsResponse {
    segments: AiSegmentSuggestion[];
}

// ==================== Questions ====================
export interface AiOptionSuggestion {
    text: string;
    value: string;
}

export interface AiQuestionSuggestion {
    text: string;
    options: AiOptionSuggestion[];
}

export interface AiGenerateQuestionsRequest {
    theme: string;
}

export interface AiGenerateQuestionsResponse {
    questions: AiQuestionSuggestion[];
}

// ==================== Answer Tree ====================
export interface AiAnswerTreeNode {
    nodeId: string;
    parentNodeId: string;
    label: string;
    value: string;
}

export interface AiGenerateAnswerTreeRequest {
    theme: string;
}

export interface AiGenerateAnswerTreeResponse {
    nodes: AiAnswerTreeNode[];
}

// ==================== Text Generation ====================
export interface AiGetTextRequest {
    params: Record<string, string>; // e.g. theme, segment_name
    segmentId?: number; // int64, optional, для обновления текста сегмента
}

export interface AiGetTextResponse {
    text: string;
}
