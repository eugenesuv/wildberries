package ai

import (
	"context"

	"wildberries/internal/service/ai"
	desc "wildberries/pkg/ai"
)

// Service handles AI API requests
type Service struct {
	aiService *ai.Service
	desc.UnimplementedAIServiceServer
}

// New creates a new AI service
func New(aiService *ai.Service) *Service {
	return &Service{
		aiService: aiService,
	}
}

// GenerateThemes generates themes
func (s *Service) GenerateThemes(ctx context.Context, req *desc.GenerateThemesRequest) (*desc.GenerateThemesResponse, error) {
	// Call service
	themes, err := s.aiService.GenerateThemes(ctx)
	if err != nil {
		return nil, err
	}

	// Convert entities to response
	responseThemes := make([]*desc.ThemeItem, len(themes))
	for i, theme := range themes {
		responseThemes[i] = &desc.ThemeItem{
			Value: theme.Value,
			Label: theme.Label,
		}
	}

	return &desc.GenerateThemesResponse{
		Themes: responseThemes,
	}, nil
}

// GenerateSegments generates segments
func (s *Service) GenerateSegments(ctx context.Context, req *desc.GenerateSegmentsRequest) (*desc.GenerateSegmentsResponse, error) {
	// Call service
	segments, err := s.aiService.GenerateSegments(ctx, req.Theme, int(req.Limit))
	if err != nil {
		return nil, err
	}

	// Convert entities to response
	responseSegments := make([]*desc.SegmentSuggestion, len(segments))
	for i, segment := range segments {
		responseSegments[i] = &desc.SegmentSuggestion{
			Name:         segment.Name,
			CategoryName: segment.CategoryName,
		}
	}

	return &desc.GenerateSegmentsResponse{
		Segments: responseSegments,
	}, nil
}

// GenerateQuestions generates questions
func (s *Service) GenerateQuestions(ctx context.Context, req *desc.GenerateQuestionsRequest) (*desc.GenerateQuestionsResponse, error) {
	// Call service
	questions, err := s.aiService.GenerateQuestions(ctx, req.Theme)
	if err != nil {
		return nil, err
	}

	// Convert entities to response
	responseQuestions := make([]*desc.QuestionSuggestion, len(questions))
	for i, question := range questions {
		// Convert options
		responseOptions := make([]*desc.OptionSuggestion, len(question.Options))
		for j, option := range question.Options {
			responseOptions[j] = &desc.OptionSuggestion{
				Text:  option.Text,
				Value: option.Value,
			}
		}

		responseQuestions[i] = &desc.QuestionSuggestion{
			Text:    question.Text,
			Options: responseOptions,
		}
	}

	return &desc.GenerateQuestionsResponse{
		Questions: responseQuestions,
	}, nil
}

// GenerateAnswerTree generates answer tree
func (s *Service) GenerateAnswerTree(ctx context.Context, req *desc.GenerateAnswerTreeRequest) (*desc.GenerateAnswerTreeResponse, error) {
	// Call service
	nodes, err := s.aiService.GenerateAnswerTree(ctx, req.Theme)
	if err != nil {
		return nil, err
	}

	// Convert entities to response
	responseNodes := make([]*desc.AnswerTreeNode, len(nodes))
	for i, node := range nodes {
		responseNodes[i] = &desc.AnswerTreeNode{
			NodeId:       node.NodeID,
			ParentNodeId: node.ParentNodeID,
			Label:        node.Label,
			Value:        node.Value,
		}
	}

	return &desc.GenerateAnswerTreeResponse{
		Nodes: responseNodes,
	}, nil
}

// GetText gets text
func (s *Service) GetText(ctx context.Context, req *desc.GetTextRequest) (*desc.GetTextResponse, error) {
	// Convert request params
	params := make(map[string]string)
	for k, v := range req.Params {
		params[k] = v
	}

	// Call service
	text, err := s.aiService.GetText(ctx, params, req.SegmentId)
	if err != nil {
		return nil, err
	}

	return &desc.GetTextResponse{
		Text: text,
	}, nil
}
