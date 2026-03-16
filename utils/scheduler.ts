import { ScheduleResult, ScheduleSlot, ScheduledExam, SubjectStats, AppConfiguration } from '../types';

// Helper to generate infinite sequence of slots based on config
const generateSlot = (globalIndex: number, config: AppConfiguration): ScheduleSlot => {
  const slotsPerWeek = config.slots.length;
  if (slotsPerWeek === 0) {
    return {
      id: globalIndex,
      dayName: 'Sense franges',
      timeRange: 'N/A',
      weekIndex: 0,
      dayIndex: 0,
      slotInDay: 0
    };
  }
  const weekIndex = Math.floor(globalIndex / slotsPerWeek);
  const slotInWeek = globalIndex % slotsPerWeek;
  const configSlot = config.slots[slotInWeek];

  // Count how many slots are in the same day before this one
  let slotInDay = 0;
  for (let i = 0; i < slotInWeek; i++) {
    if (config.slots[i].dayIndex === configSlot.dayIndex) {
      slotInDay++;
    }
  }

  return {
    id: globalIndex,
    dayName: configSlot.dayName,
    timeRange: configSlot.timeRange,
    weekIndex,
    dayIndex: configSlot.dayIndex,
    slotInDay
  };
};

// Check if Subject A and Subject B clash based on config constraints
const isDayIncompatible = (subA: string, subB: string, config: AppConfiguration): boolean => {
  const a = subA.toUpperCase();
  const b = subB.toUpperCase();

  return config.incompatibilities.some(rule => {
    const hasA = rule.subjects.some(s => a.includes(s.toUpperCase()));
    const hasB = rule.subjects.some(s => b.includes(s.toUpperCase()));
    return hasA && hasB;
  });
};

// Core scheduling logic that runs on a specific order of subjects
const runSchedulerAttempt = (orderedSubjects: SubjectStats[], config: AppConfiguration): ScheduleResult => {
  const schedule: ScheduledExam[] = [];
  const unassignable: string[] = [];
  const usedSlots: ScheduleSlot[] = [];

  for (const subject of orderedSubjects) {
    let assigned = false;
    let slotIndex = 0;

    // Try to find a slot (limit search to avoid infinite loops)
    while (!assigned && slotIndex < 200) {
      const currentSlot = generateSlot(slotIndex, config);
      
      // 1. Check for Student Conflicts in this exact slot (Direct Overlap)
      const studentConflict = subject.students.some(studentId => {
        return schedule.some(existingExam => 
          existingExam.slotId === currentSlot.id && 
          existingExam.students.includes(studentId)
        );
      });

      if (studentConflict) {
        slotIndex++;
        continue;
      }

      // 2. Check for Daily Limit
      const currentDayId = `${currentSlot.weekIndex}-${currentSlot.dayIndex}`;
      
      const dailyLimitExceeded = subject.students.some(studentId => {
        let examsToday = 0;
        for (const existingExam of schedule) {
          if (existingExam.students.includes(studentId)) {
              const existingExamSlot = generateSlot(existingExam.slotId, config);
              const existingExamDayId = `${existingExamSlot.weekIndex}-${existingExamSlot.dayIndex}`;
              if (existingExamDayId === currentDayId) {
                examsToday++;
              }
          }
        }
        return examsToday >= config.maxExamsPerDay;
      });

      if (dailyLimitExceeded) {
        slotIndex++;
        continue;
      }

      // 3. Check for Day-Level Hard Constraints
      const uniqueDayId = `${currentSlot.weekIndex}-${currentSlot.dayIndex}`;
      
      const dayConflict = schedule.some(existingExam => {
        const existingSlot = generateSlot(existingExam.slotId, config);
        const existingDayId = `${existingSlot.weekIndex}-${existingSlot.dayIndex}`;

        if (existingDayId === uniqueDayId) {
          return isDayIncompatible(subject.name, existingExam.subject, config);
        }
        return false;
      });

      if (dayConflict) {
        slotIndex++;
        continue;
      }

      // If we got here, it's valid
      schedule.push({
        subject: subject.name,
        slotId: currentSlot.id,
        students: subject.students
      });
      
      if (!usedSlots.some(s => s.id === currentSlot.id)) {
        usedSlots.push(currentSlot);
      }

      assigned = true;
    }

    if (!assigned) {
      unassignable.push(subject.name);
    }
  }

  // Calculate metrics
  const uniqueDays = new Set(schedule.map(s => {
    const slot = generateSlot(s.slotId, config);
    return `${slot.weekIndex}-${slot.dayIndex}`;
  }));

  usedSlots.sort((a, b) => a.id - b.id);

  return {
    schedule,
    totalDays: uniqueDays.size,
    slots: usedSlots,
    unassignable
  };
};

const applyGroupings = (stats: SubjectStats[], config: AppConfiguration): SubjectStats[] => {
  let currentStats = [...stats];
  
  for (const rule of config.groupings) {
    // Find subjects that match the rule
    const matchingSubjects = currentStats.filter(s => 
      rule.subjects.some(rs => s.name.toUpperCase().includes(rs.toUpperCase()))
    );

    if (matchingSubjects.length <= 1) continue;

    // Remove matching subjects from current list
    currentStats = currentStats.filter(s => 
      !rule.subjects.some(rs => s.name.toUpperCase().includes(rs.toUpperCase()))
    );

    // Combine students
    const allStudents = new Set<string>();
    matchingSubjects.forEach(s => s.students.forEach(student => allStudents.add(student)));

    // Create merged subject
    const combined: SubjectStats = {
      name: matchingSubjects.map(s => s.name).join(' / '),
      count: allStudents.size,
      students: Array.from(allStudents)
    };

    currentStats.push(combined);
  }

  return currentStats;
};

// Modified to return an array of results
export const generateSchedule = (subjectStats: SubjectStats[], config: AppConfiguration): ScheduleResult[] => {
  if (config.slots.length === 0) return [];
  
  // Pre-process to group subjects
  const processedStats = applyGroupings(subjectStats, config);

  // Strategy 1: Sort by Student Count (Descending)
  const byCount = [...processedStats].sort((a, b) => b.count - a.count);
  
  // Strategy 2: Conflict Degree
  const conflictScores = new Map<string, number>();
  processedStats.forEach(subA => {
    let score = 0;
    processedStats.forEach(subB => {
      if (subA.name === subB.name) return;
      const shared = subA.students.filter(s => subB.students.includes(s)).length;
      score += shared;
    });
    conflictScores.set(subA.name, score);
  });
  
  const byConflict = [...processedStats].sort((a, b) => {
    const scoreA = conflictScores.get(a.name) || 0;
    const scoreB = conflictScores.get(b.name) || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.count - a.count;
  });

  let candidates: ScheduleResult[] = [];
  
  candidates.push(runSchedulerAttempt(byCount, config));
  candidates.push(runSchedulerAttempt(byConflict, config));

  // Strategy 3: Random Restarts
  for (let i = 0; i < 500; i++) {
    const shuffled = [...processedStats].sort(() => Math.random() - 0.5);
    candidates.push(runSchedulerAttempt(shuffled, config));
  }

  // Deduplicate candidates based on signature (subject -> slotId)
  const uniqueCandidates: ScheduleResult[] = [];
  const seenSignatures = new Set<string>();

  // Sort candidates first by quality so we keep the best unique ones
  candidates.sort((a, b) => {
    // 1. Fewer unassigned subjects
    if (a.unassignable.length !== b.unassignable.length) {
      return a.unassignable.length - b.unassignable.length;
    }
    // 2. Fewer total days
    if (a.totalDays !== b.totalDays) {
        return a.totalDays - b.totalDays;
    }
    // 3. More compact (lower max slot ID)
    const maxA = a.slots.length > 0 ? a.slots[a.slots.length - 1].id : 0;
    const maxB = b.slots.length > 0 ? b.slots[b.slots.length - 1].id : 0;
    return maxA - maxB;
  });

  for (const cand of candidates) {
      const signature = cand.schedule
        .map(s => `${s.subject}:${s.slotId}`)
        .sort()
        .join('|');
      
      if (!seenSignatures.has(signature)) {
          seenSignatures.add(signature);
          uniqueCandidates.push(cand);
      }

      if (uniqueCandidates.length >= 10) break;
  }

  return uniqueCandidates;
};