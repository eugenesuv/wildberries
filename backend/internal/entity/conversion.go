package entity

import "strings"

// ParsePromotionStatus parses API string (e.g. "NOT_READY", "running") to PromotionStatus.
func ParsePromotionStatus(s string) PromotionStatus {
	switch strings.ToUpper(s) {
	case "NOT_READY":
		return PromotionStatusNotReady
	case "READY_TO_START":
		return PromotionStatusReadyToStart
	case "RUNNING":
		return PromotionStatusRunning
	case "PAUSED":
		return PromotionStatusPaused
	case "COMPLETED":
		return PromotionStatusCompleted
	default:
		return PromotionStatusUnspecified
	}
}

// ParseIdentificationMode parses API string (e.g. "questions", "user_profile") to IdentificationMode.
func ParseIdentificationMode(s string) IdentificationMode {
	switch strings.ToLower(s) {
	case "questions":
		return IdentificationModeQuestions
	case "user_profile":
		return IdentificationModeUserProfile
	default:
		return IdentificationModeUnspecified
	}
}

// ParsePricingModel parses API string (e.g. "auction", "fixed") to PricingModel.
func ParsePricingModel(s string) PricingModel {
	switch strings.ToLower(s) {
	case "auction":
		return PricingModelAuction
	case "fixed":
		return PricingModelFixed
	default:
		return PricingModelUnspecified
	}
}

// IdentificationModeAPI returns lowercase string for API (proto) responses.
func (m IdentificationMode) APIString() string {
	switch m {
	case IdentificationModeQuestions:
		return "questions"
	case IdentificationModeUserProfile:
		return "user_profile"
	default:
		return "unspecified"
	}
}

// PricingModelAPI returns lowercase string for API (proto) responses.
func (m PricingModel) APIString() string {
	switch m {
	case PricingModelAuction:
		return "auction"
	case PricingModelFixed:
		return "fixed"
	default:
		return "unspecified"
	}
}
