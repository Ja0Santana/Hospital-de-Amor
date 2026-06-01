import { useState } from 'react';
import Dashboard from './pages/patient/Dashboard';
import NewRequest from './pages/patient/NewRequest';
import StatusCheck from './pages/patient/StatusCheck';
import Profile from './pages/patient/Profile';
import Login from './pages/Login';
import { Button } from './components/ui/button';
import { LayoutGrid, PlusCircle, Calendar, Heart, Settings, HelpCircle, LogOut } from 'lucide-react';
import { getUserByCpf } from './services/db';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patientCpf, setPatientCpf] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedProtocol, setSelectedProtocol] = useState('');

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
    setIsAuthenticated(false);
    setPatientCpf('');
    setPatientName('');
    setPatientId('');
    setSelectedProtocol('');
    setCurrentPage('dashboard');
  };

  const navigateTo = (path: string) => {
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans antialiased text-zinc-900 dark:text-zinc-50">
      <aside className="w-64 bg-[#FFF0F6] dark:bg-zinc-950 border-r border-zinc-200/50 dark:border-zinc-800 flex flex-col shrink-0 sticky top-0 h-screen p-5">
        <div 
          onClick={() => navigateTo('profile')}
          className="flex items-center gap-3 pb-6 border-b border-zinc-200/60 dark:border-zinc-800 cursor-pointer hover:opacity-85 transition-opacity"
        >
          <div className="w-11 h-11 bg-primary/20 rounded-full overflow-hidden flex items-center justify-center border-2 border-primary/40 shrink-0">
            <svg className="w-full h-full text-primary" viewBox="0 0 32 32">
              <rect width="32" height="32" fill="#E80053" opacity="0.1" />
              <path d="M16,16 A4,4 0 0 1 12,12 A4,4 0 0 1 16,8 A4,4 0 0 1 20,12 A4,4 0 0 1 16,16 Z M16,18 C11.5,18 8,21.5 8,26 L24,26 C24,21.5 20.5,18 16,18 Z" fill="#E80053" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 truncate">{patientName}</h3>
            <span className="text-[10px] font-bold text-zinc-400 block tracking-wider">ID: {patientId}</span>
          </div>
        </div>

        <div className="flex-1 py-6 flex flex-col justify-between">
          <nav className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => navigateTo('dashboard')}
              className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'dashboard' ? 'bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10' : 'text-zinc-600 hover:bg-primary/5 hover:text-primary dark:text-zinc-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Início
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigateTo('new-request')}
              className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'new-request' ? 'bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10' : 'text-zinc-600 hover:bg-primary/5 hover:text-primary dark:text-zinc-400'}`}
            >
              <PlusCircle className="w-4 h-4" />
              Nova Solicitação
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigateTo('status-check')}
              className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'status-check' ? 'bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10' : 'text-zinc-600 hover:bg-primary/5 hover:text-primary dark:text-zinc-400'}`}
            >
              <Calendar className="w-4 h-4" />
              Meus Agendamentos
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 text-zinc-600 hover:bg-primary/5 hover:text-primary dark:text-zinc-400"
            >
              <Heart className="w-4 h-4" />
              Doações
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigateTo('profile')}
              className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'profile' ? 'bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10' : 'text-zinc-600 hover:bg-primary/5 hover:text-primary dark:text-zinc-400'}`}
            >
              <Settings className="w-4 h-4" />
              Configurações
            </Button>
          </nav>

          <div className="space-y-4">
            <Button
              onClick={() => navigateTo('new-request')}
              className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-11 rounded-2xl shadow-lg shadow-primary/20 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              + Novo Agendamento
            </Button>

            <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-xs font-bold h-9 px-3.5 rounded-lg gap-3 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <HelpCircle className="w-4 h-4" />
                Ajuda
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-xs font-bold h-9 px-3.5 rounded-lg gap-3 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-white dark:bg-zinc-950 min-h-screen overflow-y-auto">
        <header className="h-16 border-b border-zinc-200/50 dark:border-zinc-800 flex items-center justify-between px-8 bg-white/95 dark:bg-zinc-950/75 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary fill-current" />
            <span className="font-extrabold text-sm tracking-tight text-zinc-400 uppercase">Hospital de Amor</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-1.5 text-[11px] text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-200/30 dark:border-green-800/10">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              LGPD
            </span>
          </div>
        </header>

        <div className="p-8">
          {currentPage === 'dashboard' && <Dashboard onNavigate={navigateTo} patientCpf={patientCpf} patientName={patientName} />}
          {currentPage === 'new-request' && <NewRequest onNavigate={navigateTo} patientCpf={patientCpf} />}
          {currentPage === 'status-check' && (
            <StatusCheck initialProtocol={selectedProtocol} onNavigate={navigateTo} />
          )}
          {currentPage === 'profile' && (
            <Profile patientCpf={patientCpf} onLogout={handleLogout} />
          )}
        </div>
      </main>
    </div>
  );
}

interface ShieldCheckProps extends React.SVGProps<SVGSVGElement> {}
function ShieldCheck(props: ShieldCheckProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default App;
