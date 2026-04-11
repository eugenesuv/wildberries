package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"

	"wildberries/internal/entity"
)

const (
	providerStub   = "stub"
	providerGemini = "gemini"
	providerGroq   = "groq"
)

var (
	slugPattern           = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
	answerTreeLabelRegexp = regexp.MustCompile(`^edge:q(\d+):o(\d+)$`)
	answerTreeValueRegexp = regexp.MustCompile(`^(question|segment):(.+)$`)
	segmentTargetRegexp   = regexp.MustCompile(`^segment-(\d+)$`)
)

// Config contains AI provider settings.
type Config struct {
	Provider         string
	GeminiAPIKey     string
	GeminiModel      string
	GeminiAPIBaseURL string
	GroqAPIKey       string
	GroqModel        string
	GroqAPIBaseURL   string
}

type JSONGenerator interface {
	GenerateJSON(ctx context.Context, prompt string) (string, error)
}

// Service handles AI business logic.
type Service struct {
	provider  string
	generator JSONGenerator
}

// New creates a new AI service.
func New(cfg Config) *Service {
	provider := strings.ToLower(strings.TrimSpace(cfg.Provider))
	if provider == "" {
		provider = providerStub
	}

	s := &Service{provider: provider}
	switch provider {
	case providerGemini:
		s.generator = NewGeminiClient(cfg)
	case providerGroq:
		s.generator = NewGroqClient(cfg)
	}
	return s
}

// GenerateThemes generates themes.
func (s *Service) GenerateThemes(ctx context.Context) ([]*entity.ThemeItem, error) {
	if s.provider == providerStub {
		return []*entity.ThemeItem{
			{Value: "zodiac", Label: "Знаки зодиака"},
			{Value: "elements", Label: "Стихии"},
			{Value: "space", Label: "Космос"},
		}, nil
	}

	raw, err := s.generateJSON(ctx, buildThemesPrompt())
	if err != nil {
		return nil, err
	}

	type themeJSON struct {
		Value string `json:"value"`
		Label string `json:"label"`
	}
	type payload struct {
		Themes []themeJSON `json:"themes"`
	}

	var parsed payload
	if err := decodeStrictJSON(raw, &parsed); err != nil {
		return nil, fmt.Errorf("decode themes json: %w", err)
	}
	if len(parsed.Themes) != 3 {
		return nil, fmt.Errorf("themes count must be 3, got %d", len(parsed.Themes))
	}

	seenValues := make(map[string]struct{}, len(parsed.Themes))
	result := make([]*entity.ThemeItem, 0, len(parsed.Themes))
	for i, item := range parsed.Themes {
		value := strings.ToLower(strings.TrimSpace(item.Value))
		label := strings.TrimSpace(item.Label)
		if !slugPattern.MatchString(value) {
			return nil, fmt.Errorf("theme[%d].value must be slug", i)
		}
		if label == "" {
			return nil, fmt.Errorf("theme[%d].label is required", i)
		}
		if _, exists := seenValues[value]; exists {
			return nil, fmt.Errorf("theme[%d].value is duplicated", i)
		}
		seenValues[value] = struct{}{}
		result = append(result, &entity.ThemeItem{Value: value, Label: label})
	}

	return result, nil
}

// GenerateSegments generates segments.
func (s *Service) GenerateSegments(ctx context.Context, theme string, limit int) ([]*entity.SegmentSuggestion, error) {
	if limit <= 0 {
		limit = 12
	}
	if limit > 30 {
		limit = 30
	}

	if s.provider == providerStub {
		return stubSegments(theme, limit), nil
	}

	raw, err := s.generateJSON(ctx, buildSegmentsPrompt(theme, limit))
	if err != nil {
		return nil, err
	}

	type segmentJSON struct {
		Name            string `json:"name"`
		CategoryName    string `json:"category_name"`
		CategoryNameAlt string `json:"categoryName"`
	}
	type payload struct {
		Segments []segmentJSON `json:"segments"`
	}

	var parsed payload
	if err := decodeStrictJSON(raw, &parsed); err != nil {
		return nil, fmt.Errorf("decode segments json: %w", err)
	}
	if len(parsed.Segments) == 0 {
		return nil, errors.New("segments must not be empty")
	}
	if len(parsed.Segments) > limit {
		return nil, fmt.Errorf("segments count must be <= %d, got %d", limit, len(parsed.Segments))
	}

	seen := make(map[string]struct{}, len(parsed.Segments))
	result := make([]*entity.SegmentSuggestion, 0, len(parsed.Segments))
	for i, item := range parsed.Segments {
		name := strings.TrimSpace(item.Name)
		category := strings.TrimSpace(item.CategoryName)
		if category == "" {
			category = strings.TrimSpace(item.CategoryNameAlt)
		}
		if name == "" {
			return nil, fmt.Errorf("segment[%d].name is required", i)
		}
		if category == "" {
			return nil, fmt.Errorf("segment[%d].category_name is required", i)
		}
		normalized := strings.ToLower(name)
		if _, exists := seen[normalized]; exists {
			return nil, fmt.Errorf("segment[%d].name is duplicated", i)
		}
		seen[normalized] = struct{}{}
		result = append(result, &entity.SegmentSuggestion{Name: name, CategoryName: category})
	}

	return result, nil
}

// GenerateQuestions generates questions.
func (s *Service) GenerateQuestions(ctx context.Context, theme string) ([]*entity.QuestionSuggestion, error) {
	if s.provider == providerStub {
		return stubQuestions(theme), nil
	}

	raw, err := s.generateJSON(ctx, buildQuestionsPrompt(theme))
	if err != nil {
		return nil, err
	}

	type optionJSON struct {
		Text  string `json:"text"`
		Value string `json:"value"`
	}
	type questionJSON struct {
		Text    string       `json:"text"`
		Options []optionJSON `json:"options"`
	}
	type payload struct {
		Questions []questionJSON `json:"questions"`
	}

	var parsed payload
	if err := decodeStrictJSON(raw, &parsed); err != nil {
		return nil, fmt.Errorf("decode questions json: %w", err)
	}
	if len(parsed.Questions) != 4 {
		return nil, fmt.Errorf("questions count must be 4, got %d", len(parsed.Questions))
	}

	result := make([]*entity.QuestionSuggestion, 0, len(parsed.Questions))
	for i, q := range parsed.Questions {
		text := strings.TrimSpace(q.Text)
		if text == "" {
			return nil, fmt.Errorf("question[%d].text is required", i)
		}
		if len(q.Options) != 3 {
			return nil, fmt.Errorf("question[%d].options count must be 3, got %d", i, len(q.Options))
		}
		options := make([]*entity.OptionSuggestion, 0, len(q.Options))
		for j, opt := range q.Options {
			optText := strings.TrimSpace(opt.Text)
			optValue := strings.ToLower(strings.TrimSpace(opt.Value))
			if optText == "" {
				return nil, fmt.Errorf("question[%d].options[%d].text is required", i, j)
			}
			if optValue == "" {
				return nil, fmt.Errorf("question[%d].options[%d].value is required", i, j)
			}
			options = append(options, &entity.OptionSuggestion{Text: optText, Value: optValue})
		}
		result = append(result, &entity.QuestionSuggestion{Text: text, Options: options})
	}

	return result, nil
}

// GenerateAnswerTree generates answer tree.
func (s *Service) GenerateAnswerTree(ctx context.Context, theme string) ([]*entity.AnswerTreeNode, error) {
	if s.provider == providerStub {
		return stubAnswerTree(), nil
	}

	raw, err := s.generateJSON(ctx, buildAnswerTreePrompt(theme))
	if err != nil {
		return nil, err
	}

	type nodeJSON struct {
		NodeID          string `json:"node_id"`
		NodeIDAlt       string `json:"nodeId"`
		ParentNodeID    string `json:"parent_node_id"`
		ParentNodeIDAlt string `json:"parentNodeId"`
		Label           string `json:"label"`
		Value           string `json:"value"`
	}
	type payload struct {
		Nodes []nodeJSON `json:"nodes"`
	}

	var parsed payload
	if err := decodeStrictJSON(raw, &parsed); err != nil {
		return nil, fmt.Errorf("decode answer-tree json: %w", err)
	}
	if len(parsed.Nodes) == 0 {
		return nil, errors.New("answer-tree nodes must not be empty")
	}

	hasMeta := false
	hasEdge := false
	edges := make(map[string]struct{}, len(parsed.Nodes))
	ids := make(map[string]struct{}, len(parsed.Nodes))

	result := make([]*entity.AnswerTreeNode, 0, len(parsed.Nodes))
	for i, n := range parsed.Nodes {
		nodeID := strings.TrimSpace(n.NodeID)
		if nodeID == "" {
			nodeID = strings.TrimSpace(n.NodeIDAlt)
		}
		if nodeID == "" {
			return nil, fmt.Errorf("node[%d].node_id is required", i)
		}
		if _, exists := ids[nodeID]; exists {
			return nil, fmt.Errorf("node[%d].node_id is duplicated", i)
		}
		ids[nodeID] = struct{}{}

		parentNodeID := strings.TrimSpace(n.ParentNodeID)
		if parentNodeID == "" {
			parentNodeID = strings.TrimSpace(n.ParentNodeIDAlt)
		}
		label := strings.TrimSpace(n.Label)
		value := strings.TrimSpace(n.Value)
		if label == "" {
			return nil, fmt.Errorf("node[%d].label is required", i)
		}
		if value == "" {
			return nil, fmt.Errorf("node[%d].value is required", i)
		}

		if label == "meta:start" {
			hasMeta = true
			if _, err := strconv.Atoi(value); err != nil {
				return nil, fmt.Errorf("node[%d].value must be integer for meta:start", i)
			}
		} else {
			match := answerTreeLabelRegexp.FindStringSubmatch(label)
			if len(match) != 3 {
				return nil, fmt.Errorf("node[%d].label must match edge:q<idx>:o<idx>", i)
			}
			if _, exists := edges[label]; exists {
				return nil, fmt.Errorf("node[%d].label is duplicated", i)
			}
			edges[label] = struct{}{}

			valueMatch := answerTreeValueRegexp.FindStringSubmatch(value)
			if len(valueMatch) != 3 {
				return nil, fmt.Errorf("node[%d].value must match question:<idx> or segment:segment-<n>", i)
			}
			if valueMatch[1] == "question" {
				if _, err := strconv.Atoi(valueMatch[2]); err != nil {
					return nil, fmt.Errorf("node[%d].value has invalid question target", i)
				}
			} else if !segmentTargetRegexp.MatchString(valueMatch[2]) {
				return nil, fmt.Errorf("node[%d].value has invalid segment target", i)
			}

			hasEdge = true
		}

		result = append(result, &entity.AnswerTreeNode{
			NodeID:       nodeID,
			ParentNodeID: parentNodeID,
			Label:        label,
			Value:        value,
		})
	}

	if !hasMeta {
		return nil, errors.New(`answer-tree must contain node with label "meta:start"`)
	}
	if !hasEdge {
		return nil, errors.New("answer-tree must contain edge nodes")
	}

	return result, nil
}

// GetText gets text.
func (s *Service) GetText(ctx context.Context, params map[string]string, segmentID int64) (string, error) {
	target := strings.ToLower(strings.TrimSpace(params["target"]))
	if target == "" {
		target = "promotion_description"
	}

	if s.provider == providerStub {
		return stubText(target), nil
	}

	raw, err := s.generateJSON(ctx, buildTextPrompt(params, segmentID, target))
	if err != nil {
		return "", err
	}

	type payload struct {
		Text string `json:"text"`
	}

	var parsed payload
	if err := decodeStrictJSON(raw, &parsed); err != nil {
		return "", fmt.Errorf("decode text json: %w", err)
	}
	text := strings.TrimSpace(parsed.Text)
	if text == "" {
		return "", errors.New("text must not be empty")
	}
	return text, nil
}

func (s *Service) generateJSON(ctx context.Context, prompt string) (string, error) {
	if s.provider != providerGemini && s.provider != providerGroq {
		return "", fmt.Errorf("unsupported ai provider: %s", s.provider)
	}
	if s.generator == nil {
		return "", fmt.Errorf("%s provider is not configured", s.provider)
	}
	return s.generator.GenerateJSON(ctx, prompt)
}

func decodeStrictJSON(raw string, dst any) error {
	dec := json.NewDecoder(strings.NewReader(raw))
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return err
	}
	if err := dec.Decode(&struct{}{}); err != io.EOF {
		return errors.New("multiple json values in response")
	}
	return nil
}

func stubSegments(theme string, limit int) []*entity.SegmentSuggestion {
	base := []string{"Любители новинок", "Рациональные покупатели", "Охотники за выгодой", "Премиум-аудитория"}
	if strings.TrimSpace(theme) != "" {
		base = []string{
			fmt.Sprintf("%s: трендсеттеры", theme),
			fmt.Sprintf("%s: практики", theme),
			fmt.Sprintf("%s: максимизаторы скидок", theme),
			fmt.Sprintf("%s: лояльные фанаты", theme),
		}
	}
	categories := []string{"Электроника", "Дом и кухня", "Красота", "Одежда"}
	result := make([]*entity.SegmentSuggestion, 0, limit)
	for i := 0; i < len(base) && i < limit; i++ {
		result = append(result, &entity.SegmentSuggestion{Name: base[i], CategoryName: categories[i%len(categories)]})
	}
	return result
}

func stubQuestions(theme string) []*entity.QuestionSuggestion {
	prefix := strings.TrimSpace(theme)
	if prefix == "" {
		prefix = "Тема"
	}
	return []*entity.QuestionSuggestion{
		{
			Text: fmt.Sprintf("%s: что для вас важнее при выборе товара?", prefix),
			Options: []*entity.OptionSuggestion{
				{Text: "Максимальная выгода", Value: "max_discount"},
				{Text: "Качество и бренд", Value: "quality_brand"},
				{Text: "Быстрая доставка", Value: "fast_delivery"},
			},
		},
		{
			Text: "Какой формат покупки вам ближе?",
			Options: []*entity.OptionSuggestion{
				{Text: "Редкие, но крупные заказы", Value: "big_orders"},
				{Text: "Регулярные покупки", Value: "regular_orders"},
				{Text: "Импульсные покупки", Value: "impulse_orders"},
			},
		},
		{
			Text: "На какую категорию вы обращаете внимание в первую очередь?",
			Options: []*entity.OptionSuggestion{
				{Text: "Электроника", Value: "electronics"},
				{Text: "Дом и уют", Value: "home_comfort"},
				{Text: "Красота и уход", Value: "beauty_care"},
			},
		},
		{
			Text: "Что лучше мотивирует участвовать в акции?",
			Options: []*entity.OptionSuggestion{
				{Text: "Эксклюзивный ассортимент", Value: "exclusive_range"},
				{Text: "Ограниченные предложения", Value: "limited_time"},
				{Text: "Персональные подборки", Value: "personal_selection"},
			},
		},
	}
}

func stubAnswerTree() []*entity.AnswerTreeNode {
	nodes := []*entity.AnswerTreeNode{
		{NodeID: "meta-start", ParentNodeID: "", Label: "meta:start", Value: "0"},
	}
	for q := 0; q < 4; q++ {
		for o := 0; o < 3; o++ {
			value := fmt.Sprintf("segment:segment-%d", o+1)
			if q < 3 {
				value = fmt.Sprintf("question:%d", q+1)
			}
			nodes = append(nodes, &entity.AnswerTreeNode{
				NodeID:       fmt.Sprintf("edge-q%d-o%d", q, o),
				ParentNodeID: "meta-start",
				Label:        fmt.Sprintf("edge:q%d:o%d", q, o),
				Value:        value,
			})
		}
	}
	return nodes
}

func stubText(target string) string {
	switch target {
	case "promotion_name":
		return "Персональные Скидки Недели"
	case "promotion_description":
		return "Персонализированная акция с подборкой релевантных товаров и выгодных предложений для разных сегментов покупателей."
	default:
		return "Текст акции сгенерирован в тестовом stub-режиме."
	}
}

func buildThemesPrompt() string {
	return strings.TrimSpace(`
Верни только валидный JSON, без markdown/code fences. Язык: русский. Контекст: e-commerce акции.

Сгенерируй ровно 3 темы для персонализированной акции.
Формат ответа строго:
{
  "themes": [
    { "value": "machine-slug", "label": "Человекочитаемое название" }
  ]
}

Требования:
- "value" уникальный slug в lower-case (латиница/цифры/дефис), например "zodiac".
- "label" непустой, естественный русский текст.
- Никаких дополнительных полей.
`)
}

func buildSegmentsPrompt(theme string, limit int) string {
	theme = strings.TrimSpace(theme)
	if theme == "" {
		theme = "универсальная"
	}
	return strings.TrimSpace(fmt.Sprintf(`
Верни только валидный JSON, без markdown/code fences. Язык: русский. Контекст: e-commerce акции.

Тема акции: %q.
Сгенерируй от 1 до %d сегментов аудитории.
Формат ответа строго:
{
  "segments": [
    { "name": "Название сегмента", "category_name": "Категория товаров" }
  ]
}

Требования:
- Не больше %d элементов.
- Уникальные "name".
- Поля непустые.
- Никаких дополнительных полей.
`, theme, limit, limit))
}

func buildQuestionsPrompt(theme string) string {
	theme = strings.TrimSpace(theme)
	if theme == "" {
		theme = "универсальная"
	}
	return strings.TrimSpace(fmt.Sprintf(`
Верни только валидный JSON, без markdown/code fences. Язык: русский. Контекст: e-commerce акции.

Тема акции: %q.
Сгенерируй структуру для опроса сегментации: ровно 4 вопроса и у каждого ровно 3 варианта ответа.
Формат ответа строго:
{
  "questions": [
    {
      "text": "Текст вопроса",
      "options": [
        { "text": "Текст варианта", "value": "machine_value" }
      ]
    }
  ]
}

Требования:
- Ровно 4 вопроса.
- У каждого вопроса ровно 3 варианта.
- Все тексты непустые.
- "value" — непустое machine-friendly значение.
- Никаких дополнительных полей.
`, theme))
}

func buildAnswerTreePrompt(theme string) string {
	theme = strings.TrimSpace(theme)
	if theme == "" {
		theme = "универсальная"
	}
	return strings.TrimSpace(fmt.Sprintf(`
Верни только валидный JSON, без markdown/code fences. Язык: русский. Контекст: e-commerce акции.

Тема акции: %q.
Построй дерево ответов для 4 вопросов и 3 вариантов на вопрос.
Формат ответа строго:
{
  "nodes": [
    { "node_id": "meta-start", "parent_node_id": "", "label": "meta:start", "value": "0" },
    { "node_id": "edge-q0-o0", "parent_node_id": "meta-start", "label": "edge:q0:o0", "value": "question:1" }
  ]
}

Правила:
- Обязательно 1 meta-узел: label="meta:start", value — индекс стартового вопроса (обычно "0").
- Для каждого перехода: label строго "edge:q<questionIndex>:o<optionIndex>".
- value строго:
  - "question:<idx>" для перехода к следующему вопросу
  - "segment:segment-<n>" для финального сегмента
- Для 4x3 структуры должно быть 1 + 12 узлов.
- Никаких дополнительных полей.
`, theme))
}

func buildTextPrompt(params map[string]string, segmentID int64, target string) string {
	theme := strings.TrimSpace(params["theme"])
	if theme == "" {
		theme = "универсальная"
	}
	return strings.TrimSpace(fmt.Sprintf(`
Верни только валидный JSON, без markdown/code fences. Язык: русский. Контекст: e-commerce акции.

Тема акции: %q.
Target: %q.
Segment ID: %d.

Формат ответа строго:
{
  "text": "..."
}

Правила:
- Если target="promotion_name": короткое привлекательное название акции (до 60 символов, без кавычек/эмодзи).
- Если target="promotion_description": краткое описание акции (1-2 предложения).
- Для других target верни нейтральный маркетинговый текст акции.
- Никаких дополнительных полей.
`, theme, target, segmentID))
}
