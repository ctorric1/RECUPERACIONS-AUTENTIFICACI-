export interface Student {
  id: string;
  subjects: string[];
}

export interface SubjectStats {
  name: string;
  count: number;
  students: string[];
}

export interface ScheduleSlot {
  id: number;
  dayName: string; // "Dilluns", "Dimarts", "Dijous"
  timeRange: string; // "15:00 - 16:30"
  weekIndex: number;
  dayIndex: number; // 0=Mon, 1=Tue, 2=Thu
  slotInDay: number; // 0 or 1 (for Tuesday)
}

export interface ConfigSlot {
  dayName: string;
  dayIndex: number;
  timeRange: string;
}

export interface IncompatibilityRule {
  subjects: string[]; // e.g. ["MATES", "CASTELLÀ"]
}

export interface GroupingRule {
  subjects: string[]; // e.g. ["MATES", "MATES CS"]
}

export interface AppConfiguration {
  slots: ConfigSlot[];
  incompatibilities: IncompatibilityRule[];
  groupings: GroupingRule[];
  maxExamsPerDay: number;
}

export interface ScheduledExam {
  subject: string;
  slotId: number;
  students: string[];
}

export type ScheduleResult = {
  schedule: ScheduledExam[];
  totalDays: number;
  slots: ScheduleSlot[];
  unassignable: string[];
};