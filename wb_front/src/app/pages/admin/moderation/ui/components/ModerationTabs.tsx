import { Tabs, TabsList, TabsTrigger } from "@/app/entities/ui/tabs";
import { ModerationTab } from "../../types";
import { MODERATION_TABS } from "../../constants";

interface ModerationTabsProps {
    activeTab: ModerationTab;
    onTabChange: (tab: ModerationTab) => void;
    counts: {
        all: number;
        pending: number;
        approved: number;
        rejected: number;
    };
}

export function ModerationTabs({ activeTab, onTabChange, counts }: ModerationTabsProps) {
    return (
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ModerationTab)} className="space-y-6">
            <TabsList>
                {MODERATION_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label} ({counts[tab.value]})
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
