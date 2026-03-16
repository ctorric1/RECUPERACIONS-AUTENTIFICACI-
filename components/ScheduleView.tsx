import React, { useMemo } from 'react';
import { ScheduleResult, ScheduledExam, ScheduleSlot } from '../types';

interface ScheduleViewProps {
  result: ScheduleResult;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ result }) => {
  const { schedule, slots } = result;

  // Group by week -> day -> slot
  const organizedSchedule = useMemo(() => {
    const weeks: Record<number, Record<number, ScheduledExam[]>> = {};

    slots.forEach(slot => {
      if (!weeks[slot.weekIndex]) weeks[slot.weekIndex] = {};
      
      const examsInSlot = schedule.filter(e => e.slotId === slot.id);
      
      if (examsInSlot.length > 0) {
        if (!weeks[slot.weekIndex][slot.dayIndex]) {
          weeks[slot.weekIndex][slot.dayIndex] = [];
        }
      }
    });

    return weeks;
  }, [schedule, slots]);

  const getDayLabel = (dayIndex: number) => {
    switch (dayIndex) {
      case 0: return 'Dilluns';
      case 1: return 'Dimarts';
      case 2: return 'Dimecres';
      case 3: return 'Dijous';
      case 4: return 'Divendres';
      default: return 'Dia desconegut';
    }
  };

  // Helper to get exams for a specific day sorted by time
  const getExamsForDay = (weekIndex: number, dayIndex: number) => {
    // Find all slots for this week+day
    const relevantSlots = slots.filter(s => s.weekIndex === weekIndex && s.dayIndex === dayIndex);
    
    // Sort slots by id to ensure time order
    relevantSlots.sort((a, b) => a.id - b.id);

    // Map slots to content
    return relevantSlots.map(slot => {
      const exams = schedule.filter(e => e.slotId === slot.id);
      return {
        slot,
        exams
      };
    }).filter(group => group.exams.length > 0);
  };

  if (schedule.length === 0) {
    return (
        <div className="p-8 text-center text-slate-500 bg-white rounded shadow">
            No s'han trobat exàmens per programar amb les dades actuals.
        </div>
    )
  }

  return (
    <div className="space-y-8">
      {Object.entries(organizedSchedule).map(([weekIdxStr, days]) => {
        const weekIdx = parseInt(weekIdxStr);
        // Ensure days are sorted Mon(0) -> Tue(1) -> Thu(2)
        const sortedDayIndices = Object.keys(days).map(Number).sort((a, b) => a - b);

        return (
          <div key={weekIdx} className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-slate-800 text-white px-6 py-3 font-bold text-lg">
              Setmana {weekIdx + 1}
            </div>
            <div className="divide-y divide-slate-200">
              {sortedDayIndices.map(dayIdx => {
                const dayGroups = getExamsForDay(weekIdx, dayIdx);
                const slotsCount = dayGroups.length;

                return (
                  <div key={dayIdx} className="p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                       <span className="w-2 h-8 bg-blue-500 rounded-full inline-block"></span>
                       {getDayLabel(dayIdx)}
                    </h3>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {dayGroups.map((group) => (
                        <div key={group.slot.id} className="relative group">
                          <div className={`absolute -inset-0.5 bg-gradient-to-r ${group.slot.slotInDay % 2 === 0 ? 'from-blue-200 to-cyan-200' : 'from-purple-200 to-pink-200'} rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-200`}></div>
                          <div className="relative p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-center mb-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                {group.slot.timeRange}
                              </span>
                              
                              {/* Show turn badge if multiple slots in day OR if explicitly Tue */}
                              {(slotsCount > 1 || group.slot.dayIndex === 1) && (
                                <span className={`text-xs font-bold uppercase tracking-wider ${group.slot.slotInDay % 2 === 0 ? 'text-blue-600' : 'text-purple-600'}`}>
                                  Torn {group.slot.slotInDay + 1}
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {group.exams.map(exam => (
                                <div key={exam.subject} className="flex justify-between items-start border-b last:border-0 border-slate-100 pb-2 last:pb-0">
                                  <div>
                                    <div className="font-bold text-slate-800 text-lg leading-tight">{exam.subject}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {exam.students.length} {exam.students.length === 1 ? 'alumne' : 'alumnes'}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                     <button 
                                        className="text-xs text-blue-500 hover:text-blue-700 underline"
                                        title={exam.students.join(', ')}
                                        onClick={() => alert(`Alumnes de ${exam.subject}:\n\n${exam.students.join(', ')}`)}
                                     >
                                       Veure
                                     </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};