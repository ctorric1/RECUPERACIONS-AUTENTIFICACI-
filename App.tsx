import React, { useState, useEffect } from 'react';
import { DATA_1BAT, DATA_2BAT, DEFAULT_CONFIG } from './constants';
import { CourseManager } from './components/CourseManager';
import { GraduationCap, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { auth, signIn, logOut, onAuthStateChanged, User } from './firebase';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'1bat' | '2bat'>(() => {
    const saved = localStorage.getItem('bat_manager_active_tab');
    return (saved === '1bat' || saved === '2bat') ? saved : '1bat';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('bat_manager_active_tab', activeTab);
  }, [activeTab]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('L\'usuari ha tancat la finestra d\'identificació abans de completar el procés.');
      } else {
        console.error('Error d\'autenticació:', error);
        alert('S\'ha produït un error en iniciar la sessió. Si us plau, torna-ho a provar.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                <GraduationCap className="h-6 w-6 text-white" />
             </div>
             <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                  Coordinació Batxillerat
                </h1>
                <p className="text-xs text-slate-500 font-medium">Gestió de Recuperacions</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-slate-900">{user.displayName}</p>
                  <p className="text-[10px] text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={logOut}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Tancar sessió"
                >
                  <LogOut size={20} />
                </button>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <LogIn size={18} className="text-blue-600" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-1px]">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('1bat')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === '1bat' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              1r Batxillerat
            </button>
            <button
              onClick={() => setActiveTab('2bat')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === '2bat' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              2n Batxillerat
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user && !isAuthLoading && (
          <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600">
              <UserIcon size={24} />
            </div>
            <div>
              <h3 className="font-bold">Inicia sessió per guardar les teves dades</h3>
              <p className="text-sm opacity-80">Si no inicies sessió, les dades només es guardaran en aquest navegador.</p>
            </div>
          </div>
        )}
        
        {/* Render 1st Bat logic */}
        <div style={{ display: activeTab === '1bat' ? 'block' : 'none' }}>
           <CourseManager initialData={DATA_1BAT} title="1r Batxillerat" defaultConfig={DEFAULT_CONFIG} user={user} />
        </div>

        {/* Render 2nd Bat logic */}
        <div style={{ display: activeTab === '2bat' ? 'block' : 'none' }}>
           <CourseManager initialData={DATA_2BAT} title="2n Batxillerat" defaultConfig={DEFAULT_CONFIG} user={user} />
        </div>

      </main>
    </div>
  );
}

export default App;
