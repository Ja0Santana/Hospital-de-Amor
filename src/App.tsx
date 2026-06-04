import { useState, useEffect } from 'react';
import Dashboard from './pages/patient/Dashboard';
import NewRequest from './pages/patient/NewRequest';
import StatusCheck from './pages/patient/StatusCheck';
import Profile from './pages/patient/Profile';
import Login from './pages/Login';
import SymptomsDiary from './pages/patient/SymptomsDiary';
import SymptomFloatingWidget from './components/SymptomFloatingWidget';
import { Button } from './components/ui/button';
import { LayoutGrid, PlusCircle, Calendar, Heart, Settings, HelpCircle, LogOut, Menu, X, Activity, FileText, MapPin } from 'lucide-react';
import { getUserByCpf } from './services/db';
import logoHospitalDeAmor from './assets/logoHospitalDeAmor.png';
import { InactivityTimeout } from './components/InactivityTimeout';
import HelpCenter from './pages/patient/HelpCenter';
import RoboFaqWidget from './components/RoboFaqWidget';
import ClinicalHistory from './pages/patient/ClinicalHistory';
import Units from './pages/patient/Units';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patientCpf, setPatientCpf] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedProtocol, setSelectedProtocol] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLoginSuccess = async (cpf: string) => {
    setPatientCpf(cpf);
    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      const user = await getUserByCpf(cleanCpf);
      if (user) {
        setPatientName(user.name);
        const digits = user.cpf.replace(/\D/g, "");
        setPatientId(`${digits.slice(0, 3)}.${digits.slice(3, 6)}-${user.name.charAt(0).toUpperCase()}`);
      } else {
        setPatientName('Anna Beatriz');
        setPatientId('294.102-A');
      }
    } catch (err) {
      setPatientName('Anna Beatriz');
      setPatientId('294.102-A');
    }
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsSidebarOpen(false);
    setIsAuthenticated(false);
    setPatientCpf('');
    setPatientName('');
    setPatientId('');
    setSelectedProtocol('');
    setCurrentPage('dashboard');
  };

  const PAGE_TITLES: Record<string, string> = {
    dashboard: 'Início — Hospital de Amor',
    symptoms: 'Diário de Sintomas — Hospital de Amor',
    'clinical-history': 'Histórico Clínico — Hospital de Amor',
    'new-request': 'Nova Solicitação — Hospital de Amor',
    'status-check': 'Acompanhar Agendamento — Hospital de Amor',
    profile: 'Meu Perfil — Hospital de Amor',
    'help-center': 'Central de Ajuda — Hospital de Amor',
    units: 'Nossas Unidades — Hospital de Amor',
  };

  useEffect(() => {
    document.title = PAGE_TITLES[currentPage] ?? 'Hospital de Amor';
  }, [currentPage]);

  const navigateTo = (path: string) => {
    setIsSidebarOpen(false);
    if (path.startsWith('status-')) {
      const protocol = path.replace('status-', '');
      setSelectedProtocol(protocol);
      setCurrentPage('status-check');
    } else {
      setSelectedProtocol('');
      setCurrentPage(path);
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <InactivityTimeout onLogout={handleLogout}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans antialiased text-zinc-900 dark:text-zinc-50 overflow-x-hidden">
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 md:hidden animate-in fade-in"
          />
        )}

        <aside className={`w-64 bg-primary dark:bg-zinc-950 border-r border-zinc-200/50 dark:border-zinc-800 flex flex-col shrink-0 p-5 fixed inset-y-0 left-0 z-40 h-screen transform transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex md:hidden justify-end mb-2">
            <Button variant="ghost" size="icon" aria-label="Fechar menu lateral" onClick={() => setIsSidebarOpen(false)} className="h-8 w-8 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5 text-blue-100" aria-hidden="true" />
            </Button>
          </div>

          <div 
            onClick={() => navigateTo('profile')}
            className="flex items-center gap-3 pb-6 border-b border-white/15 dark:border-zinc-800 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="w-11 h-11 bg-white rounded-full overflow-hidden flex items-center justify-center border-2 border-white/20 shrink-0">
              <svg className="w-full h-full text-secondary" viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" fill="#e31463" opacity="0.15" />
                <path d="M16,16 A4,4 0 0 1 12,12 A4,4 0 0 1 16,8 A4,4 0 0 1 20,12 A4,4 0 0 1 16,16 Z M16,18 C11.5,18 8,21.5 8,26 L24,26 C24,21.5 20.5,18 16,18 Z" fill="#e31463" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-white truncate">{patientName}</h3>
              <span className="text-[10px] font-bold text-blue-200 block tracking-wider">ID: {patientId}</span>
            </div>
          </div>

          <div className="flex-1 py-6 flex flex-col justify-between">
            <nav className="space-y-1">
              <Button
                variant="ghost"
                onClick={() => navigateTo('dashboard')}
                className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'dashboard' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                Início
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigateTo('symptoms')}
                className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'symptoms' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
              >
                <Activity className="w-4 h-4" />
                Diário de Sintomas
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigateTo('clinical-history')}
                className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'clinical-history' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
              >
                <FileText className="w-4 h-4" />
                Histórico Clínico
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigateTo('new-request')}
                className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'new-request' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
              >
                <PlusCircle className="w-4 h-4" />
                Nova Solicitação
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigateTo('status-check')}
                className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'status-check' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
              >
                <Calendar className="w-4 h-4" />
                Meus Agendamentos
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigateTo('units')}
                className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'units' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
              >
                <MapPin className="w-4 h-4" />
                Nossas Unidades
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigateTo('profile')}
                className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'profile' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
              >
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
            </nav>

            <div className="space-y-4">
              <Button
                onClick={() => navigateTo('new-request')}
                className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                + Novo Agendamento
              </Button>

              <div className="pt-4 border-t border-white/15 dark:border-zinc-800 space-y-1">
                <Button
                  variant="ghost"
                  onClick={() => navigateTo('help-center')}
                  className={`w-full justify-start text-xs font-bold h-9 px-3.5 rounded-lg gap-3 ${currentPage === 'help-center' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}
                >
                  <HelpCircle className="w-4 h-4" />
                  Ajuda
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-xs font-bold h-9 px-3.5 rounded-lg gap-3 text-blue-200 hover:bg-red-500/20 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-white dark:bg-zinc-950 min-h-screen overflow-y-auto md:ml-64">
          <header className="h-16 border-b border-zinc-200/50 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-white/95 dark:bg-zinc-950/75 sticky top-0 z-10 backdrop-blur">
            <div className="flex items-center gap-2.5">
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Abrir menu lateral"
                onClick={() => setIsSidebarOpen(true)} 
                className="md:hidden text-zinc-500 hover:bg-zinc-100"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-lg flex items-center justify-center border border-zinc-100 shadow-sm w-9 h-9">
                  <img src={logoHospitalDeAmor} alt="Hospital de Amor" className="w-full h-full object-contain" aria-hidden="true" />
                </div>
                <div className="font-comfortaa font-bold text-xs tracking-wide text-primary flex items-center select-none uppercase">
                  <span>Hospital de Am</span>
                  <Heart className="w-3 h-3 fill-brand-pink text-brand-pink inline mx-0.5 -mt-0.5" aria-hidden="true" />
                  <span>r</span>
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-8">
            {currentPage === 'dashboard' && <Dashboard onNavigate={navigateTo} patientCpf={patientCpf} patientName={patientName} />}
            {currentPage === 'symptoms' && <SymptomsDiary patientCpf={patientCpf} />}
            {currentPage === 'clinical-history' && <ClinicalHistory patientCpf={patientCpf} onNavigate={navigateTo} />}
            {currentPage === 'new-request' && <NewRequest onNavigate={navigateTo} patientCpf={patientCpf} />}
            {currentPage === 'status-check' && (
              <StatusCheck initialProtocol={selectedProtocol} onNavigate={navigateTo} />
            )}
            {currentPage === 'profile' && (
              <Profile patientCpf={patientCpf} onLogout={handleLogout} onNavigate={navigateTo} />
            )}
            {currentPage === 'help-center' && <HelpCenter />}
            {currentPage === 'units' && <Units onNavigate={navigateTo} />}
          </div>
        </main>
        <SymptomFloatingWidget patientCpf={patientCpf} currentPage={currentPage} />
        <RoboFaqWidget currentPage={currentPage} />
      </div>
    </InactivityTimeout>
  );
}

export default App;
