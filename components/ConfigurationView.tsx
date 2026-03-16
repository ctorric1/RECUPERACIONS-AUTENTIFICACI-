import React, { useState } from 'react';
import { AppConfiguration, ConfigSlot, IncompatibilityRule, GroupingRule } from '../types';
import { Plus, Trash2, Clock, Users, Ban, Save } from 'lucide-react';

interface ConfigurationViewProps {
  config: AppConfiguration;
  onSave: (newConfig: AppConfiguration) => void;
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AppConfiguration>(config);

  const handleAddSlot = () => {
    const newSlot: ConfigSlot = { dayName: 'Dilluns', dayIndex: 0, timeRange: '15:00 - 16:00' };
    setLocalConfig({ ...localConfig, slots: [...localConfig.slots, newSlot] });
  };

  const handleRemoveSlot = (index: number) => {
    const newSlots = localConfig.slots.filter((_, i) => i !== index);
    setLocalConfig({ ...localConfig, slots: newSlots });
  };

  const DAY_MAP: Record<string, number> = {
    'Dilluns': 0,
    'Dimarts': 1,
    'Dimecres': 2,
    'Dijous': 3,
    'Divendres': 4
  };

  const handleUpdateSlot = (index: number, field: keyof ConfigSlot, value: any) => {
    const newSlots = [...localConfig.slots];
    if (field === 'dayName') {
      newSlots[index] = { 
        ...newSlots[index], 
        dayName: value, 
        dayIndex: DAY_MAP[value] ?? 0 
      };
    } else {
      newSlots[index] = { ...newSlots[index], [field]: value };
    }
    setLocalConfig({ ...localConfig, slots: newSlots });
  };

  const handleAddIncompatibility = () => {
    setLocalConfig({
      ...localConfig,
      incompatibilities: [...localConfig.incompatibilities, { subjects: ['', ''] }]
    });
  };

  const handleRemoveIncompatibility = (index: number) => {
    setLocalConfig({
      ...localConfig,
      incompatibilities: localConfig.incompatibilities.filter((_, i) => i !== index)
    });
  };

  const handleUpdateIncompatibility = (index: number, subIndex: number, value: string) => {
    const newIncompatibilities = [...localConfig.incompatibilities];
    const newSubjects = [...newIncompatibilities[index].subjects];
    newSubjects[subIndex] = value;
    newIncompatibilities[index] = { ...newIncompatibilities[index], subjects: newSubjects };
    setLocalConfig({ ...localConfig, incompatibilities: newIncompatibilities });
  };

  const handleAddGrouping = () => {
    setLocalConfig({
      ...localConfig,
      groupings: [...localConfig.groupings, { subjects: ['', '', ''] }]
    });
  };

  const handleRemoveGrouping = (index: number) => {
    setLocalConfig({
      ...localConfig,
      groupings: localConfig.groupings.filter((_, i) => i !== index)
    });
  };

  const handleUpdateGrouping = (index: number, subIndex: number, value: string) => {
    const newGroupings = [...localConfig.groupings];
    const newSubjects = [...newGroupings[index].subjects];
    newSubjects[subIndex] = value;
    newGroupings[index] = { ...newGroupings[index], subjects: newSubjects };
    setLocalConfig({ ...localConfig, groupings: newGroupings });
  };

  const handleAddSubjectToGrouping = (groupIndex: number) => {
    const newGroupings = [...localConfig.groupings];
    newGroupings[groupIndex] = {
      ...newGroupings[groupIndex],
      subjects: [...newGroupings[groupIndex].subjects, '']
    };
    setLocalConfig({ ...localConfig, groupings: newGroupings });
  };

  const handleRemoveSubjectFromGrouping = (groupIndex: number, subIndex: number) => {
    const newGroupings = [...localConfig.groupings];
    const newSubjects = newGroupings[groupIndex].subjects.filter((_, i) => i !== subIndex);
    if (newSubjects.length < 2) return; // Keep at least 2
    newGroupings[groupIndex] = { ...newGroupings[groupIndex], subjects: newSubjects };
    setLocalConfig({ ...localConfig, groupings: newGroupings });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Configuració del Planificador</h2>
        <button
          onClick={() => onSave(localConfig)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Save size={18} />
          Guardar Canvis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Slots Section */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Clock size={20} />
              <h3 className="text-lg font-bold text-slate-800">Franges Horàries</h3>
            </div>
            <button
              onClick={handleAddSlot}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-3">
            {localConfig.slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                <select
                  value={slot.dayName}
                  onChange={(e) => handleUpdateSlot(idx, 'dayName', e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Dilluns">Dilluns</option>
                  <option value="Dimarts">Dimarts</option>
                  <option value="Dimecres">Dimecres</option>
                  <option value="Dijous">Dijous</option>
                  <option value="Divendres">Divendres</option>
                </select>
                <input
                  type="text"
                  value={slot.timeRange}
                  onChange={(e) => handleUpdateSlot(idx, 'timeRange', e.target.value)}
                  placeholder="Ex: 15:00 - 16:00"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={() => handleRemoveSlot(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* General Settings */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-6">
            <Ban size={20} />
            <h3 className="text-lg font-bold text-slate-800">Restriccions Generals</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Màxim d'exàmens per alumne i dia
              </label>
              <input
                type="number"
                value={localConfig.maxExamsPerDay}
                onChange={(e) => setLocalConfig({ ...localConfig, maxExamsPerDay: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Incompatibilities Section */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Ban size={20} />
              <h3 className="text-lg font-bold text-slate-800">Incompatibilitats</h3>
            </div>
            <button
              onClick={handleAddIncompatibility}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-3">
            {localConfig.incompatibilities.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                <input
                  type="text"
                  value={rule.subjects[0]}
                  onChange={(e) => handleUpdateIncompatibility(idx, 0, e.target.value)}
                  placeholder="Matèria A"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-slate-400 text-xs font-bold">VS</span>
                <input
                  type="text"
                  value={rule.subjects[1]}
                  onChange={(e) => handleUpdateIncompatibility(idx, 1, e.target.value)}
                  placeholder="Matèria B"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={() => handleRemoveIncompatibility(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Groupings Section */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Users size={20} />
              <h3 className="text-lg font-bold text-slate-800">Agrupaments (Mateix Horari)</h3>
            </div>
            <button
              onClick={handleAddGrouping}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-6">
            {localConfig.groupings.map((rule, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
                <button
                  onClick={() => handleRemoveGrouping(idx)}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="space-y-3">
                  {rule.subjects.map((subject, subIdx) => (
                    <div key={subIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => handleUpdateGrouping(idx, subIdx, e.target.value)}
                        placeholder={`Matèria ${subIdx + 1}`}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      {rule.subjects.length > 2 && (
                        <button
                          onClick={() => handleRemoveSubjectFromGrouping(idx, subIdx)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddSubjectToGrouping(idx)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2"
                  >
                    <Plus size={14} />
                    Afegir matèria al grup
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
