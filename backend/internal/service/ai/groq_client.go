package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type groqClient struct {
	baseURL    string
	apiKey     string
	model      string
	httpClient *http.Client
}

// NewGroqClient creates Groq HTTP client using the OpenAI-compatible API.
func NewGroqClient(cfg Config) JSONGenerator {
	baseURL := strings.TrimSpace(cfg.GroqAPIBaseURL)
	if baseURL == "" {
		baseURL = "https://api.groq.com/openai/v1"
	}
	return &groqClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		apiKey:  strings.TrimSpace(cfg.GroqAPIKey),
		model:   strings.TrimSpace(cfg.GroqModel),
		httpClient: &http.Client{
			Timeout: 70 * time.Second,
		},
	}
}

func (c *groqClient) GenerateJSON(ctx context.Context, prompt string) (string, error) {
	if c.apiKey == "" {
		return "", errors.New("groq api key is not configured")
	}
	if c.model == "" {
		return "", errors.New("groq model is not configured")
	}

	requestPayload := map[string]any{
		"model": c.model,
		"messages": []map[string]string{
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"temperature": 0.2,
		"response_format": map[string]string{
			"type": "json_object",
		},
	}
	body, err := json.Marshal(requestPayload)
	if err != nil {
		return "", fmt.Errorf("marshal groq request: %w", err)
	}

	endpoint := fmt.Sprintf("%s/chat/completions", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("build groq request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request groq: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", fmt.Errorf("read groq response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("groq request failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	type responseMessage struct {
		Content string `json:"content"`
	}
	type choice struct {
		Message responseMessage `json:"message"`
	}
	type completionResponse struct {
		Choices []choice `json:"choices"`
	}

	var parsed completionResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return "", fmt.Errorf("decode groq envelope: %w", err)
	}
	if len(parsed.Choices) == 0 {
		return "", errors.New("groq response has no choices")
	}

	text := strings.TrimSpace(parsed.Choices[0].Message.Content)
	if text == "" {
		return "", errors.New("groq response text is empty")
	}
	return text, nil
}
