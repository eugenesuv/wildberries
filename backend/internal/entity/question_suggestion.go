package entity

// QuestionSuggestion represents a question suggestion
type QuestionSuggestion struct {
	Text  string        `json:"text"`
	Options []*OptionSuggestion `json:"options"`
}

// OptionSuggestion represents an option suggestion
type OptionSuggestion struct {
	Text  string `json:"text"`
	Value string `json:"value"`
}