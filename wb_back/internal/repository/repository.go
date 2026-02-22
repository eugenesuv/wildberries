package repository

import "context"

// PromotionRow — строка promotion из БД
type PromotionRow struct {
	ID                 int64
	Name               string
	Description        string
	Theme              string
	DateFrom           string
	DateTo             string
	Status             string
	IdentificationMode string
	PricingModel       string
	SlotCount          int
	Discount           int
	MinPrice           *int64
	BidStep            *int64
	StopFactors        []byte // jsonb
	FixedPrices        []byte // jsonb
	CreatedAt          string
	UpdatedAt          string
	DeletedAt          *string
}

// SegmentRow — строка segment
type SegmentRow struct {
	ID           int64
	PromotionID  int64
	Name         string
	CategoryID   *int64
	CategoryName *string
	Color        *string
	OrderIndex   int
	Text         *string
	CreatedAt    string
	UpdatedAt    string
}

// SlotRow — строка slot
type SlotRow struct {
	ID          int64
	PromotionID int64
	SegmentID   int64
	Position    int
	PricingType string
	Price       *int64
	AuctionID   *int64
	Status      string
	SellerID    *int64
	ProductID   *int64
	CreatedAt   string
	UpdatedAt   string
}

// ProductRow — строка product
type ProductRow struct {
	ID           int64
	SellerID     int64
	NmID         int64
	CategoryID   int64
	CategoryName string
	Name         string
	Image        *string
	Price        int64
	Discount     int
	CreatedAt    string
	UpdatedAt    string
	DeletedAt    *string
}

// ModerationRow — строка moderation
type ModerationRow struct {
	ID          int64
	PromotionID int64
	SegmentID   int64
	SlotID      int64
	SellerID    int64
	ProductID   int64
	Discount    int
	StopFactors []byte
	Status      string
	CreatedAt   string
	UpdatedAt   string
	ModeratedAt *string
	ModeratorID *int64
}

// PromotionRepository — операции с promotion
type PromotionRepository interface {
	GetByID(ctx context.Context, id int64) (*PromotionRow, error)
	GetActive(ctx context.Context) (*PromotionRow, error)
	ListAll(ctx context.Context) ([]*PromotionRow, error)
	Create(ctx context.Context, row *PromotionRow) (int64, error)
	Update(ctx context.Context, row *PromotionRow) error
	SoftDelete(ctx context.Context, id int64) error
	SetFixedPrices(ctx context.Context, id int64, prices []byte) error
	SetStatus(ctx context.Context, id int64, status string) error
}

// SegmentRepository — операции с segment
type SegmentRepository interface {
	ByPromotionID(ctx context.Context, promotionID int64) ([]*SegmentRow, error)
	GetByID(ctx context.Context, id int64) (*SegmentRow, error)
	GetByPromoAndSegment(ctx context.Context, promotionID, segmentID int64) (*SegmentRow, error)
	Create(ctx context.Context, row *SegmentRow) (int64, error)
	Update(ctx context.Context, row *SegmentRow) error
	Delete(ctx context.Context, id int64) error
	ShuffleCategories(ctx context.Context, promotionID int64) error
	UpdateText(ctx context.Context, segmentID int64, text string) error
}

// SlotRepository — операции с slot
type SlotRepository interface {
	BySegmentID(ctx context.Context, segmentID int64, onlyOccupied bool) ([]*SlotRow, error)
	ByPromotionID(ctx context.Context, promotionID int64) ([]*SlotRow, error)
	BySellerID(ctx context.Context, sellerID int64, promotionID *int64) ([]*SlotRow, error)
	GetByID(ctx context.Context, id int64) (*SlotRow, error)
	Create(ctx context.Context, row *SlotRow) (int64, error)
	Update(ctx context.Context, row *SlotRow) error
	SetProduct(ctx context.Context, slotID int64, sellerID *int64, productID int64, status string) error
}

// ProductRepository — операции с product
type ProductRepository interface {
	GetByID(ctx context.Context, id int64) (*ProductRow, error)
	GetByIDs(ctx context.Context, ids []int64, filters ProductFilters) ([]*ProductRow, error)
	ListBySeller(ctx context.Context, sellerID int64, categoryID string, page, perPage int) ([]*ProductRow, int, error)
}

type ProductFilters struct {
	Category      string
	OnlyDiscounts bool
	Sort          string
}

// ModerationRepository — операции с moderation
type ModerationRepository interface {
	ListByPromotion(ctx context.Context, promotionID int64, status string) ([]*ModerationRow, error)
	GetByID(ctx context.Context, id int64) (*ModerationRow, error)
	Create(ctx context.Context, row *ModerationRow) (int64, error)
	SetStatus(ctx context.Context, id int64, status string, moderatorID *int64) error
}

// PollQuestionRow, PollOptionRow, PollAnswerTreeRow — для опроса идентификации
type PollQuestionRow struct {
	ID          int64
	PromotionID int64
	Text        string
	OrderIndex  int
}

type PollOptionRow struct {
	ID         int64
	QuestionID int64
	Text       string
	Value      string
	OrderIndex int
}

type PollAnswerTreeRow struct {
	ID           int64
	PromotionID  int64
	NodeID       string
	ParentNodeID *string
	Label        string
	Value        string
}

// PollRepository — вопросы, опции, дерево ответов опроса
type PollRepository interface {
	QuestionsByPromotion(ctx context.Context, promotionID int64) ([]*PollQuestionRow, error)
	OptionsByQuestionIDs(ctx context.Context, questionIDs []int64) ([]*PollOptionRow, error)
	AnswerTreeByPromotion(ctx context.Context, promotionID int64) ([]*PollAnswerTreeRow, error)
	SaveQuestions(ctx context.Context, promotionID int64, questions []PollQuestionInput) error
	SaveAnswerTree(ctx context.Context, promotionID int64, nodes []PollAnswerTreeInput) error
}

type PollQuestionInput struct {
	Text    string
	Options []struct{ Text, Value string }
}

type PollAnswerTreeInput struct {
	NodeID       string
	ParentNodeID string
	Label        string
	Value        string
}

// AuctionRepository — один аукцион на акцию
type AuctionRepository interface {
	GetByPromotionID(ctx context.Context, promotionID int64) (id int64, minPrice, bidStep int64, dateFrom, dateTo string, err error)
	Create(ctx context.Context, promotionID int64, dateFrom, dateTo string, minPrice, bidStep int64) (int64, error)
}

type BetRepository interface {
	Create(ctx context.Context, auctionID, slotID, sellerID, productID int64, bet int64) (int64, error)
	TopBySlot(ctx context.Context, slotID int64) (sellerID, productID int64, bet int64, err error)
	DeleteBySlotAndSeller(ctx context.Context, slotID, sellerID int64) error
}
