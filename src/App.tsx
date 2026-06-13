import { useState, useEffect } from 'react';
import Dashboard from './pages/patient/Dashboard';
import NewRequest from './pages/patient/NewRequest';
import StatusCheck from './pages/patient/StatusCheck';
import Profile from './pages/patient/Profile';
import Login from './pages/Login';
import SymptomsDiary from './pages/patient/SymptomsDiary';
import SymptomFloatingWidget from './components/SymptomFloatingWidget';
import { Button } from './components/ui/button';
import { LayoutGrid, PlusCircle, Calendar, Heart, Settings, HelpCircle, LogOut, Menu, X, Activity, FileText, MapPin, Sun, Moon, Eye, Mail, Award, Building2 } from 'lucide-react';
import { getUserByCpf } from './services/db';
import logoHospitalDeAmor from './assets/logoHospitalDeAmor.png';
import { InactivityTimeout } from './components/InactivityTimeout';
import HelpCenter from './pages/patient/HelpCenter';
import RoboFaqWidget from './components/RoboFaqWidget';
import ClinicalHistory from './pages/patient/ClinicalHistory';
import Units from './pages/patient/Units';
import DigitalCard from './components/DigitalCard';
import EmailSimulator from './pages/patient/EmailSimulator';
import DonorDashboard from './pages/donor/DonorDashboard';
import DonationModal from './components/donor/DonationModal';
import RedeemPoints from './pages/donor/RedeemPoints';
import CorporateSponsorship from './pages/donor/CorporateSponsorship';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patientCpf, setPatientCpf] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientPhotoUrl, setPatientPhotoUrl] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedProtocol, setSelectedProtocol] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('font-size-level') || 'default';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('portal-theme') || 'light';
  });
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [userRole, setUserRole] = useState<'patient' | 'donor'>('patient');
  const [donationsTrigger, setDonationsTrigger] = useState(0);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  useEffect(() => {
    let sizePercent = '106.25%';
    if (fontSize === 'small') sizePercent = '93.75%';
    if (fontSize === 'medium') sizePercent = '112.5%';
    if (fontSize === 'large') sizePercent = '125%';
    if (fontSize === 'xlarge') sizePercent = '137.5%';
    
    document.documentElement.style.fontSize = sizePercent;
    localStorage.setItem('font-size-level', fontSize);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'contrast') {
      root.classList.add('high-contrast');
    }
    localStorage.setItem('portal-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScrollLock = () => {
      const hasOverlay = document.querySelector('.fixed.inset-0[class*="bg-black/"]');
      if (hasOverlay) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    };
    handleScrollLock();
    const observer = new MutationObserver(handleScrollLock);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const getRouteFromHash = () => {
    const hash = window.location.hash;
    if (!hash || hash === '#/' || hash === '#' || hash === '#/login') {
      return { role: userRole, page: 'dashboard', protocol: '' };
    }
    const parts = hash.slice(2).split('/');
    const userType = parts[0] === 'doador' ? 'donor' : 'patient';
    const page = parts[1] || 'dashboard';
    const protocol = parts[2] || '';
    const routeMap: Record<string, string> = {
      'dashboard': 'dashboard',
      'diario-sintomas': 'symptoms',
      'historico-clinico': 'clinical-history',
      'novo-agendamento': 'new-request',
      'acompanhar-agendamento': 'status-check',
      'perfil': 'profile',
      'central-ajuda': 'help-center',
      'nossas-unidades': 'units',
      'simulador-emails': 'email-simulator',
      'fidelidade': 'fidelidade',
      'patrocinio': 'patrocinio'
    };
    return {
      role: userType as 'patient' | 'donor',
      page: routeMap[page] || 'dashboard',
      protocol: protocol
    };
  };

  const handleLoginSuccess = async (cpf: string, loggedRole: 'patient' | 'donor') => {
    setPatientCpf(cpf);
    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      const user = await getUserByCpf(cleanCpf);
      if (user) {
        setPatientName(user.name);
        const digits = user.cpf.replace(/\D/g, "");
        setPatientId(`${digits.slice(0, 3)}.${digits.slice(3, 6)}-${user.name.charAt(0).toUpperCase()}`);
        setUserRole(loggedRole);
        setPatientPhotoUrl(user.photoUrl || '');
      } else {
        setPatientName('Anna Beatriz');
        setPatientId('294.102-A');
        setPatientPhotoUrl('');
        setUserRole(loggedRole);
      }
    } catch (err) {
      setPatientName('Anna Beatriz');
      setPatientId('294.102-A');
      setPatientPhotoUrl('');
      setUserRole(loggedRole);
    }
    setIsAuthenticated(true);
    const { role, page, protocol } = getRouteFromHash();
    if (role === loggedRole && page && page !== 'login') {
      setCurrentPage(page);
      setSelectedProtocol(protocol || '');
    } else {
      const rolePath = loggedRole === 'donor' ? 'doador' : 'paciente';
      window.location.hash = `#/${rolePath}/dashboard`;
      setCurrentPage('dashboard');
      setSelectedProtocol('');
    }
  };

  const handleLogout = () => {
    setIsSidebarOpen(false);
    setIsAuthenticated(false);
    setPatientCpf('');
    setPatientName('');
    setPatientId('');
    setPatientPhotoUrl('');
    setSelectedProtocol('');
    setUserRole('patient');
    setCurrentPage('dashboard');
    window.location.hash = '#/login';
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
    patrocinio: 'Patrocínio Corporativo — Hospital de Amor',
  };

  useEffect(() => {
    document.title = PAGE_TITLES[currentPage] ?? 'Hospital de Amor';
  }, [currentPage]);

  useEffect(() => {
    const handleHashChange = () => {
      if (!isAuthenticated) {
        if (window.location.hash !== '#/login') {
          window.location.hash = '#/login';
        }
        return;
      }
      const hash = window.location.hash;
      if (!hash || hash === '#/' || hash === '#' || hash === '#/login') {
        const rolePath = userRole === 'donor' ? 'doador' : 'paciente';
        window.location.hash = `#/${rolePath}/dashboard`;
        return;
      }
      const { role, page, protocol } = getRouteFromHash();
      setUserRole(role as 'patient' | 'donor');
      setCurrentPage(page);
      setSelectedProtocol(protocol || '');
    };
    window.addEventListener('hashchange', handleHashChange);
    if (isAuthenticated) {
      handleHashChange();
    } else {
      if (window.location.hash !== '#/login' && window.location.hash !== '') {
        // preserve
      } else {
        window.location.hash = '#/login';
      }
    }
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isAuthenticated, userRole]);

  const navigateTo = (path: string) => {
    setIsSidebarOpen(false);
    let rolePath = userRole === 'donor' ? 'doador' : 'paciente';
    let targetPage = path;
    let protocol = '';
    if (path.startsWith('status-')) {
      protocol = path.replace('status-', '');
      targetPage = 'acompanhar-agendamento';
    } else {
      const reverseRouteMap: Record<string, string> = {
        'dashboard': 'dashboard',
        'symptoms': 'diario-sintomas',
        'clinical-history': 'historico-clinico',
        'new-request': 'novo-agendamento',
        'status-check': 'acompanhar-agendamento',
        'profile': 'perfil',
        'help-center': 'central-ajuda',
        'units': 'nossas-unidades',
        'email-simulator': 'simulador-emails',
        'fidelidade': 'fidelidade',
        'patrocinio': 'patrocinio'
      };
      targetPage = reverseRouteMap[path] || path;
    }
    const newHash = protocol 
      ? `#/${rolePath}/${targetPage}/${protocol}` 
      : `#/${rolePath}/${targetPage}`;
    window.location.hash = newHash;
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} setTheme={setTheme} />;
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

        <aside className={`w-64 bg-primary dark:bg-zinc-950 border-r border-zinc-200/50 dark:border-zinc-800 flex flex-col shrink-0 px-5 pt-5 pb-2 fixed inset-y-0 left-0 z-40 h-screen transform transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
              {patientPhotoUrl ? (
                <img src={patientPhotoUrl} alt="Foto de perfil" className="w-full h-full object-cover animate-in fade-in" />
              ) : (
                <svg className="w-full h-full text-secondary" viewBox="0 0 32 32" aria-hidden="true">
                  <rect width="32" height="32" fill="#e31463" opacity="0.15" />
                  <path d="M16,16 A4,4 0 0 1 12,12 A4,4 0 0 1 16,8 A4,4 0 0 1 20,12 A4,4 0 0 1 16,16 Z M16,18 C11.5,18 8,21.5 8,26 L24,26 C24,21.5 20.5,18 16,18 Z" fill="#e31463" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-white truncate">{patientName}</h3>
              <span className="text-[10px] font-bold text-blue-200 block tracking-wider">
                {userRole === 'donor' ? 'Doador' : `ID: ${patientId}`}
              </span>
            </div>
          </div>

          <div className="flex-1 py-6 flex flex-col overflow-hidden">
            <nav className="space-y-1 overflow-y-auto flex-1 min-h-0">
              {userRole === 'donor' ? (
                <>
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
                    onClick={() => navigateTo('fidelidade')}
                    className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'fidelidade' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
                  >
                    <Award className="w-4 h-4" />
                    Fidelidade
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigateTo('patrocinio')}
                    className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'patrocinio' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
                  >
                    <Building2 className="w-4 h-4" />
                    Patrocínio Corporativo
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigateTo('profile')}
                    className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'profile' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
                  >
                    <Settings className="w-4 h-4" />
                    Configurações
                  </Button>
                </>
              ) : (
                <>
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
                  <Button
                    variant="ghost"
                    onClick={() => navigateTo('email-simulator')}
                    className={`w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl gap-3 ${currentPage === 'email-simulator' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/95 shadow-md shadow-secondary/10' : 'text-blue-100 hover:bg-white/10 hover:text-white dark:text-zinc-400'}`}
                  >
                    <Mail className="w-4 h-4" />
                    Simulador de E-mail
                  </Button>
                </>
              )}
            </nav>

            <div className="shrink-0 space-y-4 pt-4">
              {userRole === 'donor' ? (
                <Button
                  onClick={() => setIsDonationModalOpen(true)}
                  className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  + Fazer uma Doação
                </Button>
              ) : (
                <Button
                  onClick={() => navigateTo('new-request')}
                  className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  + Novo Agendamento
                </Button>
              )}

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

        <main className="flex-1 min-w-0 bg-white dark:bg-zinc-950 min-h-screen md:ml-64">
          <header className="h-16 border-b border-zinc-200/50 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-white/95 dark:bg-zinc-950/75 fixed top-0 left-0 md:left-64 right-0 z-30 backdrop-blur">
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
                <div className="font-comfortaa font-bold text-xs tracking-wide text-primary select-none uppercase hidden sm:flex items-center">
                  <span>Hospital de Am</span>
                  <Heart className="w-3 h-3 fill-brand-pink text-brand-pink inline mx-0.5 -mt-0.5" aria-hidden="true" />
                  <span>r</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider hidden sm:inline select-none">Fonte:</span>
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (fontSize === 'medium') setFontSize('default');
                      else if (fontSize === 'large') setFontSize('medium');
                      else if (fontSize === 'xlarge') setFontSize('large');
                      else if (fontSize === 'default') setFontSize('small');
                    }}
                    disabled={fontSize === 'small'}
                    className="h-7 w-7 text-[10px] font-extrabold hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-650 dark:text-zinc-350 disabled:opacity-35"
                    aria-label="Diminuir tamanho da fonte"
                  >
                    A-
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setFontSize('default')}
                    className={`h-7 px-2.5 text-[10px] font-bold hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-650 dark:text-zinc-350 ${fontSize === 'default' ? 'bg-white dark:bg-zinc-850 shadow-sm text-primary dark:text-white font-extrabold' : ''}`}
                    aria-label="Tamanho de fonte padrão"
                  >
                    A
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (fontSize === 'small') setFontSize('default');
                      else if (fontSize === 'default') setFontSize('medium');
                      else if (fontSize === 'medium') setFontSize('large');
                      else if (fontSize === 'large') setFontSize('xlarge');
                    }}
                    disabled={fontSize === 'xlarge'}
                    className="h-7 w-7 text-xs font-bold hover:bg-white dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-650 dark:text-zinc-350 disabled:opacity-35"
                    aria-label="Aumentar tamanho da fonte"
                  >
                    A+
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider hidden sm:inline select-none">Tema:</span>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                    className="h-8 w-8 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800 shadow-sm rounded-lg text-zinc-650 dark:text-zinc-350 hover:bg-zinc-200 dark:hover:bg-zinc-850 flex items-center justify-center"
                    aria-label="Opções de tema"
                    title="Opções de tema"
                  >
                    {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
                    {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
                    {theme === 'contrast' && <Eye className="w-4 h-4 text-white" />}
                  </Button>

                  {showThemeMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                      <div className="absolute right-0 mt-1.5 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 p-1 flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                          className={`h-8 px-2.5 text-xs font-bold justify-start gap-2 rounded-lg transition-colors w-full ${theme === 'light' ? 'bg-zinc-100 dark:bg-zinc-800 text-primary font-extrabold' : 'text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-850'}`}
                        >
                          <Sun className="w-3.5 h-3.5" />
                          Claro
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                          className={`h-8 px-2.5 text-xs font-bold justify-start gap-2 rounded-lg transition-colors w-full ${theme === 'dark' ? 'bg-zinc-100 dark:bg-zinc-800 text-primary font-extrabold' : 'text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-850'}`}
                        >
                          <Moon className="w-3.5 h-3.5" />
                          Escuro
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => { setTheme('contrast'); setShowThemeMenu(false); }}
                          className={`h-8 px-2.5 text-xs font-bold justify-start gap-2 rounded-lg transition-colors w-full ${theme === 'contrast' ? 'bg-zinc-100 dark:bg-zinc-800 text-primary font-extrabold' : 'text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-850'}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Contraste
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-8 pt-20 md:pt-24">
            {currentPage === 'dashboard' && (
              userRole === 'donor' ? (
                <DonorDashboard
                  donorCpf={patientCpf}
                  donorName={patientName}
                  updateTrigger={donationsTrigger}
                />
              ) : (
                <Dashboard 
                  onNavigate={navigateTo} 
                  patientCpf={patientCpf} 
                  patientName={patientName} 
                  onOpenCard={() => setIsCardOpen(true)} 
                />
              )
            )}
            {currentPage === 'symptoms' && userRole === 'patient' && <SymptomsDiary patientCpf={patientCpf} />}
            {currentPage === 'fidelidade' && userRole === 'donor' && (
              <RedeemPoints 
                donorCpf={patientCpf} 
                updateTrigger={donationsTrigger}
                onPointsUpdated={() => setDonationsTrigger((prev) => prev + 1)}
              />
            )}
            {currentPage === 'patrocinio' && userRole === 'donor' && <CorporateSponsorship />}
            {currentPage === 'clinical-history' && userRole === 'patient' && <ClinicalHistory patientCpf={patientCpf} onNavigate={navigateTo} />}
            {currentPage === 'new-request' && userRole === 'patient' && <NewRequest onNavigate={navigateTo} patientCpf={patientCpf} />}
            {currentPage === 'status-check' && userRole === 'patient' && (
              <StatusCheck initialProtocol={selectedProtocol} onNavigate={navigateTo} patientCpf={patientCpf} />
            )}
            {currentPage === 'profile' && (
              <Profile 
                patientCpf={patientCpf} 
                onLogout={handleLogout} 
                onNavigate={navigateTo} 
                fontSize={fontSize}
                setFontSize={setFontSize}
                theme={theme}
                setTheme={setTheme}
                onPhotoUpdate={(url) => setPatientPhotoUrl(url)}
              />
            )}
            {currentPage === 'help-center' && <HelpCenter />}
            {currentPage === 'units' && userRole === 'patient' && <Units onNavigate={navigateTo} />}
            {currentPage === 'email-simulator' && userRole === 'patient' && (
              <EmailSimulator 
                patientCpf={patientCpf} 
                patientName={patientName} 
                onNavigate={navigateTo} 
              />
            )}
          </div>
        </main>
        {userRole === 'patient' && <SymptomFloatingWidget patientCpf={patientCpf} currentPage={currentPage} />}
        {userRole === 'patient' && <RoboFaqWidget currentPage={currentPage} />}
        {userRole === 'patient' && <DigitalCard patientCpf={patientCpf} isOpen={isCardOpen} onClose={() => setIsCardOpen(false)} />}
        <DonationModal
          isOpen={isDonationModalOpen}
          onClose={() => setIsDonationModalOpen(false)}
          donorCpf={patientCpf}
          onDonationSuccess={() => setDonationsTrigger((prev) => prev + 1)}
        />
      </div>
    </InactivityTimeout>
  );
}

export default App;
