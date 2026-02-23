export interface ApplicationDetails {
    id: string;
    status: ApplicationStatus;
    promotionName: string;
    segment: string;
    position: number;
    price: number;
}

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ConfirmationData {
    applicationNumber: string;
    status: ApplicationStatus;
    promotionName: string;
    segment: string;
    position: number;
    price: number;
}
