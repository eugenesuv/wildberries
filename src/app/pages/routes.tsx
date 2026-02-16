import type { RouteObject } from "react-router";
import { HomePage } from "./buyer/home";
import { PromotionPage } from "./buyer/promotion";
import { SellerActionsPage } from "./seller/actions";
import { SellerSegmentsPage } from "./seller/segments";
import { SellerSlotMarketPage } from "./seller/slots";
import { SellerConfirmationPage } from "./seller/confirmation";
import { AdminDashboardPage } from "./admin/dashboard";
import { AdminSettingsPage } from "./admin/settings";
import { AdminModerationPage } from "./admin/moderation";

export const routesConfig: RouteObject[] = [
    {
        path: "/",
        children: [
            // Роль: Покупатель
            { index: true, Component: HomePage },
            { path: "promotion/:segment", Component: PromotionPage },

            // Роль: Продавец
            { path: "seller/actions", Component: SellerActionsPage },
            { path: "seller/actions/:actionId/segments", Component: SellerSegmentsPage },
            { path: "seller/actions/:actionId/segments/:segment/slots", Component: SellerSlotMarketPage },
            { path: "seller/confirmation", Component: SellerConfirmationPage },

            // Роль: Администратор
            { path: "admin/dashboard", Component: AdminDashboardPage },
            { path: "admin/actions/:actionId/settings", Component: AdminSettingsPage },
            { path: "admin/actions/:actionId/moderation", Component: AdminModerationPage },
        ],
    },
];
