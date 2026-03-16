import React, { useState, useEffect, useMemo } from 'react';
import { parseRawData } from '../utils/parser';
import { generateSchedule } from '../utils/scheduler';
import { DataInput } from './DataInput';
import { ScheduleView } from './ScheduleView';
import { ConfigurationView } from './ConfigurationView';
import { SubjectStats, ScheduleResult, AppConfiguration } from '../types';
import { Settings, Calendar, Download, Save, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { exportScheduleToPDF } from '../utils/pdfExport';
import { db, User } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface CourseManagerProps {
  initialData: string;
  title: string;
  defaultConfig: AppConfiguration;
  user: User | null;
}

type Trimester = '1' | '2' | '3';
type ViewMode = 'schedule' | 'config';

export const CourseManager: React.FC<CourseManagerProps> = ({ initialData, title, defaultConfig, user }) => {
  const courseId = title.replace(/\s+/g, '_').toLowerCase();

  // State for tabs
  const [activeTrimester, setActiveTrimester] = useState<Trimester>(() => {
    const storageKey = `bat_manager_trimester_${courseId}`;
    const saved = localStorage.getItem(storageKey);
    return (saved === '1' || saved === '2' || saved === '3') ? saved as Trimester : '1';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const storageKey = `bat_manager_viewmode_${courseId}`;
    const saved = localStorage.getItem(storageKey);
    return (saved === 'schedule' || saved === 'config') ? saved as ViewMode : 'schedule';
  });

  // Persistence status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // State for data per trimester
  const [trimesterData, setTrimesterData] = useState<Record<Trimester, string>>({
    '1': initialData,
    '2': '',
    '3': ''
  });

  // State for config per trimester
  const [trimesterConfigs, setTrimesterConfigs] = useState<Record<Trimester, AppConfiguration>>({
    '1': defaultConfig,
    '2': defaultConfig,
    '3': defaultConfig
  });

  // Load from LocalStorage initially
  useEffect(() => {
    const dataKey = `bat_manager_data_${courseId}`;
    const configKey = `bat_manager_config_${courseId}`;
    
    const savedData = localStorage.getItem(dataKey);
    const savedConfig = localStorage.getItem(configKey);

    if (savedData) {
      try {
        setTrimesterData(JSON.parse(savedData));
      } catch (e) { console.error(e); }
    }
    if (savedConfig) {
      try {
        setTrimesterConfigs(JSON.parse(savedConfig));
      } catch (e) { console.error(e); }
    }
    setIsInitialLoad(false);
  }, [courseId]);

  // Sync with Firestore if user is logged in
  useEffect(() => {
    if (!user || isInitialLoad) return;

    const docRef = doc(db, 'users', user.uid, 'courses', courseId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data();
        if (remoteData.trimesterData) setTrimesterData(remoteData.trimesterData);
        if (remoteData.trimesterConfigs) setTrimesterConfigs(remoteData.trimesterConfigs);
      }
    });

    return () => unsubscribe();
  }, [user, courseId, isInitialLoad]);

  // Save to LocalStorage
  useEffect(() => {
    if (isInitialLoad) return;
    localStorage.setItem(`bat_manager_data_${courseId}`, JSON.stringify(trimesterData));
    localStorage.setItem(`bat_manager_config_${courseId}`, JSON.stringify(trimesterConfigs));
  }, [trimesterData, trimesterConfigs, courseId, isInitialLoad]);

  // Manual save to Firestore
  const handleSaveToCloud = async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      const docRef = doc(db, 'users', user.uid, 'courses', courseId);
      await setDoc(docRef, {
        trimesterData,
        trimesterConfigs,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Error saving to cloud:", error);
      setSaveStatus('error');
    }
  };

  // UI state persistence
  useEffect(() => {
    localStorage.setItem(`bat_manager_trimester_${courseId}`, activeTrimester);
  }, [activeTrimester, courseId]);

  useEffect(() => {
    localStorage.setItem(`bat_manager_viewmode_${courseId}`, viewMode);
  }, [viewMode, courseId]);

  const [isInputOpen, setIsInputOpen] = useState(false);
  const [parsedData, setParsedData] = useState<{ students: any[], subjectStats: SubjectStats[] } | null>(null);
  
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

  const currentRawData = trimesterData[activeTrimester];
  const currentConfig = trimesterConfigs[activeTrimester];

  const handleDataChange = (val: string) => {
    setTrimesterData(prev => ({
        ...prev,
        [activeTrimester]: val
    }));
  };

  const handleConfigSave = (newConfig: AppConfiguration) => {
    setTrimesterConfigs(prev => ({
      ...prev,
      [activeTrimester]: newConfig
    }));
    setViewMode('schedule');
  };

  useEffect(() => {
    try {
      if (!currentRawData.trim()) {
          setParsedData(null);
          return;
      }
      const data = parseRawData(currentRawData);
      setParsedData(data);
    } catch (e) {
      setParsedData(null);
    }
  }, [currentRawData]);

  const scheduleResults: ScheduleResult[] = useMemo(() => {
    if (!parsedData) return [];
    setSelectedOptionIndex(0);
    return generateSchedule(parsedData.subjectStats, currentConfig);
  }, [parsedData, currentConfig]);

  const currentResult = scheduleResults.length > 0 ? scheduleResults[selectedOptionIndex] : null;

  const getTrimesterLabel = (t: Trimester) => {
      if (t === '1') return '1r Trimestre';
      if (t === '2') return '2n Trimestre';
      return '3r Trimestre';
  };

  return (
    <div>
        {/* Header with Save Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            
            <div className="flex items-center gap-3">
                {user ? (
                    <button
                        onClick={handleSaveToCloud}
                        disabled={saveStatus === 'saving'}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm
                            ${saveStatus === 'saved' 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : saveStatus === 'error'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}
                        `}
                    >
                        {saveStatus === 'saving' ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : saveStatus === 'saved' ? (
                            <Cloud size={18} />
                        ) : (
                            <Save size={18} className="text-blue-600" />
                        )}
                        <span>
                            {saveStatus === 'saving' ? 'Guardant...' : 
                             saveStatus === 'saved' ? 'Guardat al núvol' : 
                             saveStatus === 'error' ? 'Error al guardar' : 'Guardar al núvol'}
                        </span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium border border-slate-200">
                        <CloudOff size={14} />
                        Només guardat localment
                    </div>
                )}
            </div>
        </div>

        {/* Trimester Tabs & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg w-fit">
                {(['1', '2', '3'] as Trimester[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => {
                            setActiveTrimester(t);
                            if (!trimesterData[t]) setIsInputOpen(true);
                        }}
                        className={`
                            px-4 py-2 text-sm font-medium rounded-md transition-all
                            ${activeTrimester === t 
                                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                        `}
                    >
                        {getTrimesterLabel(t)}
                    </button>
                ))}
            </div>

            <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setViewMode('schedule')}
                    className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all
                        ${viewMode === 'schedule' 
                            ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                    `}
                >
                    <Calendar size={16} />
                    Horari
                </button>
                <button
                    onClick={() => setViewMode('config')}
                    className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all
                        ${viewMode === 'config' 
                            ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                    `}
                >
                    <Settings size={16} />
                    Configuració
                </button>
            </div>
        </div>

        {viewMode === 'config' ? (
            <ConfigurationView config={currentConfig} onSave={handleConfigSave} />
        ) : (
            <>
                {/* Controls Panel */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                   
                   {/* Instructions */}
                   <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900 shadow-sm">
                     <div className="flex gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                       </svg>
                       <div className="markdown-body">
                          <p className="font-semibold mb-1">
                              Configuració activa: {title} - {getTrimesterLabel(activeTrimester)}
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-blue-800/80">
                             <li>Franges disponibles: {currentConfig.slots.length}</li>
                             <li>Límit alumne: <strong>Màxim {currentConfig.maxExamsPerDay} exàmens per dia</strong>.</li>
                             {currentConfig.incompatibilities.length > 0 && (
                                <li>Incompatibilitats actives: {currentConfig.incompatibilities.length}</li>
                             )}
                             {currentConfig.groupings.length > 0 && (
                                <li>Agrupaments actius: {currentConfig.groupings.length}</li>
                             )}
                          </ul>
                       </div>
                     </div>
                   </div>
                </div>

                {/* Data Input Section */}
                <DataInput 
                  value={currentRawData} 
                  onChange={handleDataChange} 
                  isOpen={isInputOpen}
                  onToggle={() => setIsInputOpen(!isInputOpen)}
                />

                {/* Results Selection & Display */}
                {parsedData && currentRawData.trim() ? (
                    <div>
                        {scheduleResults.length > 0 ? (
                            <div>
                                {/* Option Selector */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Opcions d'horari generades:</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {scheduleResults.map((res, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedOptionIndex(idx)}
                                                className={`
                                                    flex flex-col items-start px-4 py-2 rounded-lg border text-sm transition-all
                                                    ${selectedOptionIndex === idx 
                                                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 z-10' 
                                                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}
                                                `}
                                            >
                                                <div className="flex items-center gap-2 font-medium">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${selectedOptionIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className={selectedOptionIndex === idx ? 'text-blue-900' : 'text-slate-700'}>
                                                        Opció {idx + 1}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {res.totalDays} dies • {res.slots.length > 0 ? res.slots[res.slots.length - 1].id + 1 : 0} franges
                                                    {res.unassignable.length > 0 && <span className="text-red-500 ml-1">⚠ Incidències</span>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Selected Result Stats */}
                                {currentResult && (
                                     <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
                                                {currentResult.totalDays} dies totals necessaris
                                            </div>
                                            <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                                {parsedData.students.length} alumnes detectats
                                            </div>
                                            {currentResult.unassignable.length > 0 && (
                                                <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full border border-red-200">
                                                    ⚠ {currentResult.unassignable.length} matèries sense assignar
                                                </div>
                                            )}
                                        </div>
                                        
                                        <button
                                            onClick={() => exportScheduleToPDF(currentResult, title, getTrimesterLabel(activeTrimester))}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-md hover:bg-blue-700 transition-all active:scale-95"
                                        >
                                            <Download size={16} />
                                            Exportar PDF
                                        </button>
                                     </div>
                                )}

                                {/* Schedule View */}
                                {currentResult && <ScheduleView result={currentResult} />}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500 bg-white rounded shadow border border-slate-200">
                                No s'ha trobat cap combinació vàlida amb aquestes restriccions.
                            </div>
                        )}
                    </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-lg border border-slate-200 border-dashed">
                     <div className="py-8">
                          <p className="text-slate-400 mb-2">No hi ha dades per aquest trimestre.</p>
                          <button onClick={() => setIsInputOpen(true)} className="text-blue-600 font-medium hover:underline">
                              Afegir dades d'alumnes
                          </button>
                     </div>
                  </div>
                )}
            </>
        )}
    </div>
  );
};
