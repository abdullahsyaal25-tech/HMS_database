// Laboratory Components - Phase 1
// Shared components for Laboratory UI/UX Redesign

export { LabStatusBadge } from './LabStatusBadge';
export type { LabStatusBadgeProps } from './LabStatusBadge';

export { PriorityBadge } from './PriorityBadge';
export type { PriorityBadgeProps } from './PriorityBadge';

export { ResultValueDisplay } from './ResultValueDisplay';
export type { ResultValueDisplayProps } from './ResultValueDisplay';

export { LabTestCard } from './LabTestCard';
export type { LabTest, LabTestRequest, LabTestCardProps, Action } from './LabTestCard';

export { RequestTimeline } from './RequestTimeline';
export type { TimelineStage, RequestTimelineProps, TimelineStageStatus } from './RequestTimeline';

export { FilterBar } from './FilterBar';
export type {
  FilterConfig,
  FilterState,
  FilterOption,
  FilterType,
  FilterBarProps,
} from './FilterBar';

// New components for 81 lab tests support
export { ParameterBuilder } from './ParameterBuilder';
export { ReferenceRangeBuilder } from './ReferenceRangeBuilder';
export { SampleTypeBadge, SampleTypeSelect, sampleTypes } from './SampleTypeBadge';
export type { SampleType, SampleTypeConfig, SampleTypeBadgeProps } from './SampleTypeBadge';
