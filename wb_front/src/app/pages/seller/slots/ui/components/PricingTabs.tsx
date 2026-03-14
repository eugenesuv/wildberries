import { TabsList, TabsTrigger } from "@/app/entities/ui/tabs";
import { Gavel, DollarSign } from "lucide-react";
import { PricingType } from "../../types";

interface PricingTabsProps {
    activeTab: PricingType;
    showAuction: boolean;
    showFixed: boolean;
    onTabChange: (tab: PricingType) => void;
}

export function PricingTabs({ activeTab, showAuction, showFixed, onTabChange }: PricingTabsProps) {
    const tabsCount = Number(showAuction) + Number(showFixed);
    const tabsClass = tabsCount <= 1 ? "grid-cols-1" : "grid-cols-2";

    return (
        <TabsList className={`grid w-full max-w-md ${tabsClass}`}>
            {showAuction && (
                <TabsTrigger
                    value="auction"
                    className="flex items-center gap-2"
                    onClick={() => onTabChange("auction")}
                    data-state={activeTab === "auction" ? "active" : ""}
                >
                    <Gavel className="w-4 h-4" />
                    Аукцион
                </TabsTrigger>
            )}
            {showFixed && (
                <TabsTrigger
                    value="fixed"
                    className="flex items-center gap-2"
                    onClick={() => onTabChange("fixed")}
                    data-state={activeTab === "fixed" ? "active" : ""}
                >
                    <DollarSign className="w-4 h-4" />
                    Фиксированная цена
                </TabsTrigger>
            )}
        </TabsList>
    );
}
