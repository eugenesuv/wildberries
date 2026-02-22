package entity

// AnswerTreeNode represents an answer tree node
type AnswerTreeNode struct {
	NodeID       string `json:"node_id"`
	ParentNodeID string `json:"parent_node_id"`
	Label        string `json:"label"`
	Value        string `json:"value"`
}