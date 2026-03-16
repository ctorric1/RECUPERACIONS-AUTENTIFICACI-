import React from 'react';

interface DataInputProps {
  value: string;
  onChange: (val: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const DataInput: React.FC<DataInputProps> = ({ value, onChange, isOpen, onToggle }) => {
  return (
    <div className="mb-6 bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
      <div 
        className="w-full px-6 py-4 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={onToggle}
      >
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          Dades d'entrada (Alumnes i Matèries)
        </h2>
        <span className="text-sm text-slate-500">{isOpen ? 'Amagar' : 'Veure/Editar'}</span>
      </div>
      
      {isOpen && (
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-2">Pots editar les dades directament aquí. Assegura't de mantenir el format de tabulacions (copiar/enganxar des d'Excel).</p>
          <textarea
            className="w-full h-64 p-3 font-mono text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};