package entity

// PromotionStatus represents the status of a promotion
type PromotionStatus int32

const (
	PromotionStatusUnspecified PromotionStatus = iota
	PromotionStatusNotReady
	PromotionStatusReadyToStart
	PromotionStatusRunning
	PromotionStatusPaused
	PromotionStatusCompleted
)

// String returns the string representation of PromotionStatus
func (s PromotionStatus) String() string {
	switch s {
	case PromotionStatusUnspecified:
		return "UNSPECIFIED"
	case PromotionStatusNotReady:
		return "NOT_READY"
	case PromotionStatusReadyToStart:
		return "READY_TO_START"
	case PromotionStatusRunning:
		return "RUNNING"
	case PromotionStatusPaused:
		return "PAUSED"
	case PromotionStatusCompleted:
		return "COMPLETED"
	default:
		return "UNKNOWN"
	}
}

// IdentificationMode represents the identification mode for promotions
type IdentificationMode int32

const (
	IdentificationModeUnspecified IdentificationMode = iota
	IdentificationModeQuestions
	IdentificationModeUserProfile
)

// String returns the string representation of IdentificationMode
func (m IdentificationMode) String() string {
	switch m {
	case IdentificationModeUnspecified:
		return "UNSPECIFIED"
	case IdentificationModeQuestions:
		return "QUESTIONS"
	case IdentificationModeUserProfile:
		return "USER_PROFILE"
	default:
		return "UNKNOWN"
	}
}

// PricingModel represents the pricing model for promotions
type PricingModel int32

const (
	PricingModelUnspecified PricingModel = iota
	PricingModelAuction
	PricingModelFixed
)

// String returns the string representation of PricingModel
func (m PricingModel) String() string {
	switch m {
	case PricingModelUnspecified:
		return "UNSPECIFIED"
	case PricingModelAuction:
		return "AUCTION"
	case PricingModelFixed:
		return "FIXED"
	default:
		return "UNKNOWN"
	}
}
