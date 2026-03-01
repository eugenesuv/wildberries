package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// GeminiClient describes JSON generation contract for Gemini provider.
type GeminiClient interface {
	GenerateJSON(ctx context.Context, prompt string) (string, error)
}

type geminiClient struct {
	baseURL    string
	apiKey     string
	model      string
	httpClient *http.Client
}

// NewGeminiClient creates Gemini HTTP client.
func NewGeminiClient(cfg Config) GeminiClient {
	baseURL := strings.TrimSpace(cfg.GeminiAPIBaseURL)
	if baseURL == "" {
		baseURL = "https://generativelanguage.googleapis.com"
	}
	return &geminiClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		apiKey:  strings.TrimSpace(cfg.GeminiAPIKey),
		model:   strings.TrimSpace(cfg.GeminiModel),
		httpClient: &http.Client{
			Timeout: 70 * time.Second,
		},
	}
}

func (c *geminiClient) GenerateJSON(ctx context.Context, prompt string) (string, error) {
	if c.apiKey == "" {
		return "", errors.New("gemini api key is not configured")
	}
	if c.model == "" {
		return "", errors.New("gemini model is not configured")
	}

	requestPayload := map[string]any{
		"contents": []map[string]any{
			{
				"role": "user",
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]any{
			"responseMimeType": "application/json",
			"temperature":      0.2,
		},
	}
	body, err := json.Marshal(requestPayload)
	if err != nil {
		return "", fmt.Errorf("marshal gemini request: %w", err)
	}

	endpoint := fmt.Sprintf("%s/v1beta/models/%s:generateContent", c.baseURL, url.PathEscape(c.model))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("build gemini request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request gemini: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", fmt.Errorf("read gemini response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("gemini request failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	type responsePart struct {
		Text string `json:"text"`
	}
	type responseContent struct {
		Parts []responsePart `json:"parts"`
	}
	type candidate struct {
		Content responseContent `json:"content"`
	}
	type generateResponse struct {
		Candidates []candidate `json:"candidates"`
	}

	var parsed generateResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return "", fmt.Errorf("decode gemini envelope: %w", err)
	}
	if len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("gemini response has no candidates")
	}

	text := strings.TrimSpace(parsed.Candidates[0].Content.Parts[0].Text)
	if text == "" {
		return "", errors.New("gemini response text is empty")
	}
	return text, nil
}
