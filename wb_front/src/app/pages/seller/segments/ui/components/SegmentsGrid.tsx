import { Segment } from "../../types";
import { SegmentCard } from "./SegmentCard";

interface SegmentsGridProps {
    segments: Segment[];
    onSegmentClick: (segment: Segment) => void;
}

export function SegmentsGrid({ segments, onSegmentClick }: SegmentsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {segments.map((segment, index) => (
                <SegmentCard key={segment.id} segment={segment} index={index} onClick={onSegmentClick} />
            ))}
        </div>
    );
}
