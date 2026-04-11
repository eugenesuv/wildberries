package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"regexp"
	"sort"
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
			{Value: "shopping-zodiac", Label: "Какой ты знак зодиака в шопинге?"},
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
	if len(parsed.Themes) != 1 {
		return nil, fmt.Errorf("themes count must be 1, got %d", len(parsed.Themes))
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

Сгенерируй ровно 1 тему для персонализированной акции на маркетплейсе.
Формат ответа строго:
{
  "themes": [
    { "value": "machine-slug", "label": "Человекочитаемое название" }
  ]
}

Требования:
- Каждая тема должна быть достаточно широкой, чтобы на её основе можно было придумать сегменты, вопросы, название и описание акции.
- Темы должны отличаться по эмоциональному образу и покупательской мотивации.
- Избегай слишком узких, мемных, конфликтных или трудно коммерциализируемых тем.
- Темы должны звучать оригинально, как готовая идея спецпроекта или квиза, а не как абстрактная категория.
- Предпочитай русские формулировки label, которые хочется показать в UI как название акции/квиза.
- "value" уникальный slug в lower-case (латиница/цифры/дефис), например "zodiac".
- "label" непустой, естественный русский текст из 1-4 слов, пригодный для UI.
- Никаких дополнительных полей.

Референсы по уровню оригинальности и формату идеи:
- "Какой ты архетип покупателя?"
- "Кто ты в мире стартапов?"
- "Твоя цифровая вселенная"
- "Какой ты город мира?"
- "Твоя энергия недели"
- "Какой ты герой мифа?"
- "Твой идеальный день"
- "Какой ты тип отдыха?"
- "Твоя скрытая суперсила"
- "Какой ты стиль будущего?"
- "Какой ты знак зодиака в шопинге?"

Важно:
- Не копируй референсы дословно без необходимости.
- Используй их как ориентир по креативности, целостности и маркетинговой привлекательности.
- Верни только одну, самую сильную и цельную идею.
`)
}

func buildSegmentsPrompt(theme string, limit int) string {
	contextBlock := buildFreeformContextBlock(theme)
	return strings.TrimSpace(fmt.Sprintf(`
Верни только валидный JSON, без markdown/code fences. Язык: русский. Контекст: e-commerce акции.

Используй контекст ниже, чтобы придумать сегменты аудитории для акции.

Контекст акции:
%s

Сгенерируй от 1 до %d сегментов аудитории.
Формат ответа строго:
{
  "segments": [
    { "name": "Название сегмента", "category_name": "Категория товаров" }
  ]
}

Требования:
- Не больше %d элементов.
- Сначала выполни внутреннюю последовательность:
  1. Определи ядро темы по названию и описанию акции.
  2. Определи, является ли тема открытой интерпретационной или закрытой/канонической.
  3. Если тема закрытая/каноническая, найди её фиксированный, общеизвестный или логически заданный набор сущностей.
  4. Если тема открытая, только тогда аккуратно придумай авторские сегменты в логике темы.
- Закрытая/каноническая тема = тема, где уже существует конкретный набор сущностей первого порядка: факультеты, герои, знаки, города, архетипы, роли, энергии, типы отдыха, стили, сценарии и т.п.
- Для закрытых тем сегменты должны быть именно сущностями первого порядка из самой темы, а не производными маркетинговыми подкатегориями.
- Если тема "Знаки зодиака", сегменты = сами знаки зодиака.
- Если тема/описание про факультеты Хогвартса, сегменты = факультеты Хогвартса.
- Если тема/описание про героев вселенной Гарри Поттера, сегменты = популярные герои этой вселенной, а не факультеты, артефакты, заклинания, черты характера или рекламные рубрики.
- Если тема про города мира, сегменты = конкретные города.
- Если тема про типы отдыха, сегменты = сами типы отдыха.
- Для аналогичных тем применяй тот же принцип: сегменты = главные сущности темы, а не красивые вариации вокруг неё.
- Если канонический набор слишком большой, выбери релевантное подмножество, но оно должно оставаться точным, узнаваемым и состоять из сущностей первого порядка.
- Приоритет точного смыслового попадания в тему выше креативности. Лучше точный канонический набор, чем красивые, но неверные сегменты "по мотивам".
- Запрещено:
  - придумывать сегменты "по мотивам" вместо сущностей темы;
  - смешивать разные уровни абстракции;
  - подменять канонические сущности рекламными рубриками;
  - делать размытые сегменты, которые нельзя однозначно распознать как элементы исходной темы.
- Для открытых тем сегменты по-прежнему можно генерировать креативно, но они должны логично продолжать тему, быть различимыми, короткими, понятными и коммерчески осмысленными.
- Если в контексте перечислены доступные категории, выбирай "category_name" только из этого списка.
- "name" должен быть коротким, понятным в интерфейсе, различимым и не дублировать соседние сегменты по смыслу.
- "category_name" должна быть конкретной товарной категорией маркетплейса. Она описывает товары, но не заменяет сущность темы.
- "name" = сущность темы. "category_name" = товарная категория.
- Уникальные "name".
- Поля непустые.
- Никаких дополнительных полей.

Примеры уровня сегментации:
- Для "Какой ты архетип покупателя?": "Импульсивный охотник", "Рациональный стратег", "Эстет-коллекционер", "Экономный оптимизатор".
- Для "Кто ты в мире стартапов?": "Визионер", "Хакер", "Операционный маг", "Инвестор", "Продуктовый гик", "Маркетинговый алхимик".
- Для "Твоя цифровая вселенная": "Cyberpunk", "Minimal Tech", "Retro Wave", "AI Native", "Digital Nomad", "Creator Economy", "Gamer Core", "Zen Tech".
- Для "Какой ты город мира?": "Токио", "Париж", "Берлин", "Сеул", "Амстердам", "Лондон".
- Для "Твоя энергия недели": "Энергия роста", "Энергия отдыха", "Энергия денег", "Энергия общения", "Энергия фокуса".
- Для "Какой ты герой мифа?": "Воин", "Маг", "Трикстер", "Хранитель", "Искатель".

Важно:
- Не обязательно повторять эти примеры буквально.
- Нужно выдавать сегменты того же качества: яркие, различимые, с понятным характером и коммерческим смыслом.
- Но если контекст явно задаёт канонический набор сегментов, приоритет у точного попадания в этот набор, а не у произвольной креативности.
`, contextBlock, limit, limit))
}

func buildQuestionsPrompt(theme string) string {
	contextBlock := buildFreeformContextBlock(theme)
	return strings.TrimSpace(fmt.Sprintf(`
Верни только валидный JSON, без markdown/code fences. Язык: русский. Контекст: e-commerce акции.

Используй контекст ниже, чтобы собрать сегментирующий опрос для акции.

Контекст акции:
%s

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
- Перед генерацией вопросов определи, какие точные сегменты заданы темой и описанием акции. Вопросы должны вести именно к ним, а не к производным состояниям рядом с темой.
- Вопросы должны помогать различать покупателей по разным осям: мотивация, сценарий покупки, предпочтения, категорийный интерес.
- Если в контексте уже есть сегменты, вопросы должны помогать развести пользователей именно по этим сегментам.
- В сумме вопросы и варианты должны давать материал для дерева, в котором каждый сегмент из контекста получит хотя бы один сценарий пользователя.
- Не задавай декоративные, слишком абстрактные или дублирующие друг друга вопросы.
- Каждый вариант должен быть реалистичным, взаимоисключающим и коротким.
- Вопросы не должны в лоб называть итоговые сегменты, но должны мягко вести к ним через выбор поведения, вкуса, ритма жизни, мотивации или сценария покупки.
- Хороший вопрос звучит как нормальный пользовательский выбор, а не как формальная анкета.
- Если сегменты канонические и относятся к закрытой теме, вопросы должны различать именно их смысловые отличия.
- Вопросы должны работать на одном уровне абстракции с сегментами и не уводить в посторонние маркетинговые интерпретации.
- Все тексты непустые.
- "value" — непустое machine-friendly значение в lower-case latin/underscore.
- Никаких дополнительных полей.

Примеры хороших направлений для вопросов:
- про стиль покупки: "Что чаще всего цепляет вас в товаре первым?"
- про мотивацию: "Какой результат от покупки радует вас сильнее всего?"
- про сценарий: "Как выглядит ваш идеальный способ провести выходной?"
- про визуальный вкус: "Какой вайб вам ближе?"
- про поведение: "Когда вы видите интересную новинку, что делаете?"
- про отдых/лайфстайл: "Какой формат перезагрузки вам ближе?"

Примеры тональности ответов:
- "Схватить сразу, пока горит"
- "Сравнить и выбрать лучшее"
- "Найти что-то редкое и красивое"
- "Взять максимум пользы за бюджет"
- "Технологично и функционально"
- "Уютно и эстетично"

Важно:
- Не копируй примеры буквально, если они не подходят теме.
- Используй их как ориентир, чтобы вопросы были живыми, небанальными и действительно помогали маршрутизировать пользователя в подходящий сегмент.
- Если сегменты канонические и хорошо известные, вопросы должны раскрывать различия между ними через характер, стиль, выбор, мотивацию или поведение.
- Пример: если сегменты = факультеты Хогвартса, вопросы должны разделять смелость/амбицию/мудрость/лояльность, а не спрашивать напрямую "какой вы факультет?".
- Пример: если сегменты = герои вселенной Гарри Поттера, вопросы должны разводить пользователя по типу поведения и ценностям, которые приближают к этим героям.
- Пример: если сегменты = знаки зодиака, вопросы должны вести к архетипам знаков, а не к выдуманным производным вроде "обувная удача" или "зодиакальные девушки".
- Запрещено уводить вопросы в более расплывчатую или более рекламную плоскость, чем исходная тема.
`, contextBlock))
}

func buildAnswerTreePrompt(theme string) string {
	contextBlock := buildFreeformContextBlock(theme)
	return strings.TrimSpace(fmt.Sprintf(`
Верни только валидный JSON, без markdown/code fences. Язык: русский. Контекст: e-commerce акции.

Используй контекст ниже, чтобы построить дерево переходов для сегментирующего опроса.

Контекст акции:
%s

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
- Если в контексте перечислены итоговые сегменты как segment-1..segment-N, используй только эти target values.
- Каждый итоговый сегмент из контекста должен встретиться хотя бы в одном переходе к segment:segment-<n>.
- Разрешено завершать сценарий сегментом раньше последнего вопроса, если это нужно для покрытия всех сегментов.
- Переходы должны опираться на реальные смысловые различия между сегментами темы. Не делай случайное распределение.
- Если сегменты относятся к закрытой/канонической теме, дерево должно сохранять тот же уровень точности и не подменять их производными интерпретациями.
- Дерево должно быть логичным по смыслу ответов, а не случайным.
- Для 4x3 структуры должно быть 1 + 12 узлов.
- Никаких дополнительных полей.
`, contextBlock))
}

func buildTextPrompt(params map[string]string, segmentID int64, target string) string {
	contextBlock := buildTextContextBlock(params, segmentID)
	return strings.TrimSpace(fmt.Sprintf(`
Верни только валидный JSON, без markdown/code fences. Язык: русский. Контекст: e-commerce акции.

Используй контекст ниже, чтобы сгенерировать текст для акции.

Контекст акции:
%s

Target: %q.

Формат ответа строго:
{
  "text": "..."
}

Правила:
- Пиши естественным русским языком, без markdown, эмодзи и без кавычек вокруг всего текста.
- Если target="promotion_name": короткое и запоминающееся название акции (3-6 слов, до 60 символов), в котором чувствуется тема и покупательская выгода.
- Если target="promotion_description": краткое описание акции (1-2 предложения), которое объясняет механику/ценность акции и опирается на тему, сегменты и категории, если они переданы.
- Для других target верни нейтральный маркетинговый текст акции с опорой на переданный контекст.
- Никаких дополнительных полей.
`, contextBlock, target))
}

func buildFreeformContextBlock(raw string) string {
	lines := make([]string, 0)
	for _, line := range strings.Split(strings.TrimSpace(raw), "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		if strings.HasPrefix(trimmed, "- ") {
			lines = append(lines, trimmed)
			continue
		}
		lines = append(lines, "- "+trimmed)
	}
	if len(lines) == 0 {
		return "- Выбранная тема: универсальная e-commerce акция"
	}
	return strings.Join(lines, "\n")
}

func buildTextContextBlock(params map[string]string, segmentID int64) string {
	lines := make([]string, 0, len(params)+2)

	themeValue := strings.TrimSpace(params["theme"])
	themeLabel := strings.TrimSpace(params["theme_label"])
	switch {
	case themeLabel != "" && themeValue != "" && themeLabel != themeValue:
		lines = append(lines, fmt.Sprintf("- Выбранная тема: %s (slug: %s)", themeLabel, themeValue))
	case themeLabel != "":
		lines = append(lines, fmt.Sprintf("- Выбранная тема: %s", themeLabel))
	case themeValue != "":
		lines = append(lines, fmt.Sprintf("- Выбранная тема: %s", themeValue))
	}

	orderedKeys := []struct {
		key   string
		label string
	}{
		{key: "promotion_name", label: "Название акции"},
		{key: "promotion_description", label: "Описание акции"},
		{key: "segments", label: "Сегменты акции"},
		{key: "questions", label: "Текущие вопросы"},
		{key: "pricing_model", label: "Модель ценообразования"},
		{key: "identification_mode", label: "Идентификация"},
		{key: "slot_count", label: "Количество слотов"},
		{key: "discount_range", label: "Диапазон скидок"},
	}
	for _, item := range orderedKeys {
		value := strings.TrimSpace(params[item.key])
		if value == "" {
			continue
		}
		lines = append(lines, fmt.Sprintf("- %s: %s", item.label, value))
	}

	excluded := map[string]struct{}{
		"theme":               {},
		"theme_label":         {},
		"promotion_name":      {},
		"promotion_description": {},
		"segments":            {},
		"questions":           {},
		"pricing_model":       {},
		"identification_mode": {},
		"slot_count":          {},
		"discount_range":      {},
		"target":              {},
	}

	otherKeys := make([]string, 0)
	for key := range params {
		if _, skip := excluded[key]; skip {
			continue
		}
		otherKeys = append(otherKeys, key)
	}
	sort.Strings(otherKeys)
	for _, key := range otherKeys {
		value := strings.TrimSpace(params[key])
		if value == "" {
			continue
		}
		lines = append(lines, fmt.Sprintf("- %s: %s", key, value))
	}

	if segmentID > 0 {
		lines = append(lines, fmt.Sprintf("- Segment ID: %d", segmentID))
	}
	if len(lines) == 0 {
		return "- Выбранная тема: универсальная e-commerce акция"
	}
	return strings.Join(lines, "\n")
}
