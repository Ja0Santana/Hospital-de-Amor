import { useState, useEffect } from 'react';
import { Shield, Users, ClipboardList, LogOut, Menu, X, Sliders } from 'lucide-react';
import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AuditLogs from './pages/admin/AuditLogs';
import AdminConfig from './pages/admin/AdminConfig';
import { getEmployeePermissions } from './services/db';
import type { PatientUser } from './types';

export default function AdminApp() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/login');
  const [loggedEmployee, setLoggedEmployee] = useState<PatientUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>(() => {
    const stored = localStorage.getItem('hospital_amor_admin_permissions');
    return stored ? JSON.parse(stored) : [];
  });
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('font-size-level') || 'default';
  });

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
    const storedUser = localStorage.getItem('hospital_amor_admin_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setLoggedEmployee(parsed);
        const storedPerms = localStorage.getItem('hospital_amor_admin_permissions');
        if (storedPerms) {
          setPermissions(JSON.parse(storedPerms));
        } else if (parsed.role) {
          getEmployeePermissions(parsed.role).then(perms => {
            setPermissions(perms);
            localStorage.setItem('hospital_amor_admin_permissions', JSON.stringify(perms));
          });
        }
      } catch (e) {
        localStorage.removeItem('hospital_amor_admin_user');
        localStorage.removeItem('hospital_amor_admin_permissions');
      }
    }

    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/login');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = async (employee: PatientUser) => {
    setLoggedEmployee(employee);
    localStorage.setItem('hospital_amor_admin_user', JSON.stringify(employee));
    if (employee.role) {
      const perms = await getEmployeePermissions(employee.role);
      setPermissions(perms);
      localStorage.setItem('hospital_amor_admin_permissions', JSON.stringify(perms));
    } else {
      setPermissions([]);
      localStorage.setItem('hospital_amor_admin_permissions', JSON.stringify([]));
    }
    window.location.hash = '#/dashboard';
  };

  const handleLogout = () => {
    setLoggedEmployee(null);
    setPermissions([]);
    localStorage.removeItem('hospital_amor_admin_user');
    localStorage.removeItem('hospital_amor_admin_permissions');
    window.location.hash = '#/login';
  };

  const currentPath = currentHash.replace(/^#/, '');

  if (!loggedEmployee) {
    if (currentPath === '/registro') {
      return <AdminRegister onNavigate={(hash) => { window.location.hash = hash; }} />;
    }
    return <AdminLogin onLogin={handleLogin} onNavigate={(hash) => { window.location.hash = hash; }} />;
  }

  const renderContent = () => {
    switch (currentPath) {
      case '/dashboard':
        if (!permissions.includes('view_appointments')) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Shield className="w-12 h-12 text-zinc-400 mb-4" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">Acesso Negado</h2>
              <p className="text-xs text-zinc-500 max-w-sm">Você não tem permissão para visualizar o Painel de Triagem. Entre em contato com o administrador.</p>
            </div>
          );
        }
        return <AdminDashboard loggedEmployee={loggedEmployee} permissions={permissions} />;
      case '/usuarios':
        if (!permissions.includes('manage_users')) {
          window.location.hash = '#/dashboard';
          return null;
        }
        return <AdminUsers loggedEmployee={loggedEmployee} />;
      case '/configuracoes':
        if (!permissions.includes('manage_config')) {
          window.location.hash = '#/dashboard';
          return null;
        }
        return <AdminConfig loggedEmployee={loggedEmployee} />;
      case '/auditoria':
        if (!permissions.includes('view_audit')) {
          window.location.hash = '#/dashboard';
          return null;
        }
        return <AuditLogs />;
      case '/registro':
        return <AdminRegister onNavigate={(hash) => { window.location.hash = hash; }} />;
      default:
        window.location.hash = '#/dashboard';
        return null;
    }
  };

  const getRoleBadgeLabel = (role?: string) => {
    switch (role) {
      case 'recepcionista':
        return 'Recepcionista';
      case 'gestor':
        return 'Gestor Geral';
      case 'auditor':
        return 'Auditor';
      default:
        return 'Administrador';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row dark:bg-zinc-950 font-sans">
      <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center text-white font-extrabold text-sm">
            H
          </div>
          <span className="font-extrabold text-zinc-900 dark:text-zinc-50 text-sm tracking-tight">Hospital de Amor</span>
        </div>
        <button
          onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
          className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
        >
          {isSidebarMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 h-screen bg-white dark:bg-zinc-900 border-r border-zinc-250 dark:border-zinc-850 flex flex-col transform transition-transform duration-300 md:translate-x-0 ${isSidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-pink-600/30">
              H
            </div>
            <div>
              <h2 className="font-black text-zinc-950 dark:text-zinc-50 tracking-tight leading-none text-base">Hospital de Amor</h2>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mt-1">Portal Staff</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {permissions.includes('view_appointments') && (
            <a
              href="#/dashboard"
              onClick={() => setIsSidebarMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${currentPath === '/dashboard' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900'}`}
            >
              <ClipboardList className="w-4 h-4" />
              Painel de Triagem
            </a>
          )}

          {permissions.includes('manage_users') && (
            <a
              href="#/usuarios"
              onClick={() => setIsSidebarMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${currentPath === '/usuarios' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900'}`}
            >
              <Users className="w-4 h-4" />
              Gestão da Equipe
            </a>
          )}

          {permissions.includes('manage_config') && (
            <a
              href="#/configuracoes"
              onClick={() => setIsSidebarMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${currentPath === '/configuracoes' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900'}`}
            >
              <Sliders className="w-4 h-4" />
              Configurações
            </a>
          )}

          {permissions.includes('view_audit') && (
            <a
              href="#/auditoria"
              onClick={() => setIsSidebarMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${currentPath === '/auditoria' ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900'}`}
            >
              <Shield className="w-4 h-4" />
              Logs de Auditoria
            </a>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-150 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">Fonte:</span>
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  if (fontSize === 'medium') setFontSize('default');
                  else if (fontSize === 'large') setFontSize('medium');
                  else if (fontSize === 'xlarge') setFontSize('large');
                  else if (fontSize === 'default') setFontSize('small');
                }}
                disabled={fontSize === 'small'}
                className="h-7 w-7 text-[10px] font-extrabold hover:bg-white dark:hover:bg-zinc-850 rounded-md transition-colors text-zinc-600 dark:text-zinc-400 disabled:opacity-35"
                aria-label="Diminuir tamanho da fonte"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('default')}
                className={`h-7 px-2.5 text-[10px] font-bold hover:bg-white dark:hover:bg-zinc-850 rounded-md transition-colors text-zinc-600 dark:text-zinc-400 ${fontSize === 'default' ? 'bg-white dark:bg-zinc-800 shadow-sm text-pink-600 dark:text-white font-extrabold' : ''}`}
                aria-label="Tamanho de fonte padrão"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => {
                  if (fontSize === 'small') setFontSize('default');
                  else if (fontSize === 'default') setFontSize('medium');
                  else if (fontSize === 'medium') setFontSize('large');
                  else if (fontSize === 'large') setFontSize('xlarge');
                }}
                disabled={fontSize === 'xlarge'}
                className="h-7 w-7 text-xs font-bold hover:bg-white dark:hover:bg-zinc-850 rounded-md transition-colors text-zinc-600 dark:text-zinc-400 disabled:opacity-35"
                aria-label="Aumentar tamanho da fonte"
              >
                A+
              </button>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl flex items-center gap-3 border border-zinc-200/50 dark:border-zinc-800/80">
            <div className="w-9 h-9 rounded-lg bg-pink-100 dark:bg-pink-950/30 text-pink-750 dark:text-pink-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {loggedEmployee.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs block truncate leading-none mb-1">
                {loggedEmployee.name}
              </span>
              <span className="inline-block px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase bg-pink-100 text-pink-850 dark:bg-pink-950/50 dark:text-pink-400 border border-pink-200/20">
                {getRoleBadgeLabel(loggedEmployee.role)}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-900/50 rounded-xl text-xs font-bold transition-all text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900"
          >
            <LogOut className="w-4 h-4" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {isSidebarMobileOpen && (
        <div
          onClick={() => setIsSidebarMobileOpen(false)}
          className="fixed inset-0 bg-black/45 z-20 md:hidden animate-in fade-in"
        />
      )}

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full md:ml-64">
        {renderContent()}
      </main>
    </div>
  );
}
