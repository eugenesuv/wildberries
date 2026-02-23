import { ApiClient } from "../base.client";
import { API_BASE_URL } from "../config";
import type {
    AiGenerateThemesResponse,
    AiGenerateSegmentsRequest,
    AiGenerateSegmentsResponse,
    AiGenerateQuestionsRequest,
    AiGenerateQuestionsResponse,
    AiGenerateAnswerTreeRequest,
    AiGenerateAnswerTreeResponse,
    AiGetTextRequest,
    AiGetTextResponse,
} from "../types/ai.types";

class AIClient extends ApiClient {
    constructor() {
        super(API_BASE_URL, "AI");
    }

    async generateThemes(): Promise<AiGenerateThemesResponse> {
        return this.post("/ai/themes", {});
    }

    async generateSegments(data: AiGenerateSegmentsRequest): Promise<AiGenerateSegmentsResponse> {
        return this.post("/ai/segments", data);
    }

    async generateQuestions(data: AiGenerateQuestionsRequest): Promise<AiGenerateQuestionsResponse> {
        return this.post("/ai/questions", data);
    }

    async generateAnswerTree(data: AiGenerateAnswerTreeRequest): Promise<AiGenerateAnswerTreeResponse> {
        return this.post("/ai/answer-tree", data);
    }

    async getText(data: AiGetTextRequest): Promise<AiGetTextResponse> {
        return this.post("/ai/get-text", data);
    }
}

export const aiClient = new AIClient();
