export { adminClient } from "./clients/admin.client";
export { aiClient } from "./clients/ai.client";
export { buyerClient } from "./clients/buyer.client";
export { sellerClient } from "./clients/seller.client";

export type { ApiError } from "./base.client";

// Re-export types
export type * from "./types/admin.types";
export type * from "./types/ai.types";
export type * from "./types/buyer.types";
export type * from "./types/seller.types";
