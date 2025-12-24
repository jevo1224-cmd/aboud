
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  Package, 
  LogOut, 
  Search, 
  Box, 
  Filter,
  TrendingUp,
  AlertTriangle,
  History,
  Calendar,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { User, UserRole, ClothingModel, InventoryStats, AuditLog } from './types';
import { TRANSLATIONS, APP_NAME, SUPABASE_URL } from './constants';
import { storageService } from './services/storageService';
import Button from './components/Button';
import Input from './components/Input';
import Modal from './components/Modal';
import ModelForm from './components/ModelForm';
import ModelCard from './components/ModelCard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aboud_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState<'inventory' | 'history'>('inventory');
  const [models, setModels] = useState<ClothingModel[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ClothingModel | undefined>();
  const [viewingModel, setViewingModel] = useState<ClothingModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // مراقبة حالة الإنترنت
  useEffect(() => {
    const handleStatusChange = () => setOnlineStatus(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const refreshData = useCallback(async (background = false) => {
    if (!background) setIsLoading(true);
    else setIsSyncing(true);
    
    try {
      const [fetchedModels, fetchedLogs] = await Promise.all([
        storageService.getModels(),
        storageService.getLogs()
      ]);
      setModels(fetchedModels);
      setLogs(fetchedLogs);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  // المزامنة اللحظية
  useEffect(() => {
    if (currentUser) {
      refreshData();
      
      let subscription: any = null;
      const initRealtime = async () => {
        subscription = await storageService.subscribeToChanges(() => {
          refreshData(true);
        });
      };
      
      initRealtime();
      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }
  }, [currentUser, refreshData]);

  // إحصائيات محسنة (Memoized للأداء)
  const stats = useMemo(() => storageService.getStats(models), [models]);

  const filteredModels = useMemo(() => 
    models.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fabric.toLowerCase().includes(searchQuery.toLowerCase())
    ), [models, searchQuery]
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const { username, password } = loginForm;
    
    if (username === 'aboud' && password === '123') {
      const user = { username: 'Aboud', role: UserRole.ADMIN };
      setCurrentUser(user);
      localStorage.setItem('aboud_user', JSON.stringify(user));
    } else if (username === 'staff' && password === '2') {
      const user = { username: 'موظف', role: UserRole.VIEWER };
      setCurrentUser(user);
      localStorage.setItem('aboud_user', JSON.stringify(user));
    } else {
      setLoginError('بيانات الدخول غير صحيحة');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('aboud_user');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[3rem] border border-slate-200 shadow-2xl p-12 text-center animate-in fade-in slide-in-from-bottom-10">
          <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3">
            <Box className="text-white" size={48} />
          </div>
          <h1 className="text-4xl font-black text-black mb-2 tracking-tight">{APP_NAME}</h1>
          <p className="text-slate-500 font-bold mb-10">نظام إدارة المخزون الذكي</p>

          <form onSubmit={handleLogin} className="space-y-6 text-right" dir="rtl">
            <Input 
              label={TRANSLATIONS.username} 
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
              className="h-16 rounded-2xl bg-slate-50 border-transparent focus:bg-white"
            />
            <Input 
              label={TRANSLATIONS.password} 
              type="password" 
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              className="h-16 rounded-2xl bg-slate-50 border-transparent focus:bg-white"
            />
            {loginError && <p className="text-rose-600 font-black text-sm bg-rose-50 py-3 rounded-xl">{loginError}</p>}
            
            <Button type="submit" fullWidth className="h-16 bg-black hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 text-lg">
              {TRANSLATIONS.login}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-['Tajawal']" dir="rtl">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white text-black md:sticky md:top-0 md:h-screen flex flex-col p-8 z-40 border-l border-slate-200 shadow-sm overflow-y-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-2.5 bg-black rounded-2xl shadow-lg">
            <Box size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter">{APP_NAME}</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setCurrentView('inventory')}
            className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all font-black ${currentView === 'inventory' ? 'bg-black text-white shadow-xl' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <LayoutDashboard size={22} />
            <span>{TRANSLATIONS.inventory}</span>
          </button>
          
          {currentUser.role === UserRole.ADMIN && (
            <button 
              onClick={() => setCurrentView('history')}
              className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all font-black ${currentView === 'history' ? 'bg-black text-white shadow-xl' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <History size={22} />
              <span>{TRANSLATIONS.history}</span>
            </button>
          )}

          {/* Real-time Status */}
          <div className={`mt-8 px-5 py-4 rounded-2xl border flex items-center gap-4 transition-all ${onlineStatus ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className={`p-2 rounded-xl shadow-sm ${onlineStatus ? 'bg-emerald-500 text-white animate-pulse' : 'bg-rose-500 text-white'}`}>
              {onlineStatus ? <Zap size={18} /> : <WifiOff size={18} />}
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-500 uppercase">حالة المزامنة</span>
               <span className={`text-xs font-black ${onlineStatus ? 'text-emerald-700' : 'text-rose-700'}`}>
                {onlineStatus ? 'متصل بالسحاب' : 'غير متصل'}
               </span>
            </div>
          </div>
          
          <div className="mt-auto pt-10 border-t border-slate-100 space-y-4">
            <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <p className="text-[10px] uppercase font-black text-slate-400">المستخدم النشط</p>
              </div>
              <p className="text-md font-black text-black truncate">{currentUser.username}</p>
              <p className="text-xs text-slate-500 font-bold">{currentUser.role === UserRole.ADMIN ? TRANSLATIONS.adminLabel : TRANSLATIONS.viewerLabel}</p>
            </div>
            
            <button onClick={handleLogout} className="flex items-center gap-4 w-full px-5 py-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all font-black group">
              <LogOut size={22} className="group-hover:translate-x-[-4px] transition-transform" />
              <span>{TRANSLATIONS.logout}</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-14 relative overflow-x-hidden">
        {isSyncing && (
          <div className="fixed top-8 left-8 z-50 bg-white/80 backdrop-blur shadow-xl rounded-2xl px-4 py-2 border border-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <RefreshCw className="animate-spin text-black" size={16} />
            <span className="text-xs font-black">جاري المزامنة...</span>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-50/50 backdrop-blur-sm flex items-center justify-center">
            <RefreshCw className="animate-spin text-black" size={48} />
          </div>
        )}

        {currentView === 'inventory' ? (
          <>
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-14">
              <div>
                <h1 className="text-5xl font-black text-black mb-3 tracking-tight">{TRANSLATIONS.inventory}</h1>
                <p className="text-slate-500 font-bold text-lg">إدارة المخزون اللحظية لـ ABOUD STORE</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder={TRANSLATIONS.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-black/5 focus:border-black outline-none transition-all text-black font-black shadow-sm text-lg"
                  />
                </div>
                {currentUser.role === UserRole.ADMIN && (
                  <Button size="lg" onClick={() => setIsFormOpen(true)} className="h-16 px-8 bg-black hover:bg-slate-800 text-white shadow-2xl shadow-black/20 font-black rounded-3xl text-lg active:scale-95">
                    <Plus size={24} className="ml-2" />
                    {TRANSLATIONS.addModel}
                  </Button>
                )}
              </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-14">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-slate-50 rounded-2xl text-black group-hover:bg-black group-hover:text-white transition-all shadow-inner">
                    <Package size={32} />
                  </div>
                </div>
                <p className="text-slate-400 font-black text-sm uppercase tracking-widest mb-1">إجمالي الموديلات</p>
                <p className="text-5xl font-black text-black">{stats.totalModels}</p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-slate-50 rounded-2xl text-black group-hover:bg-black group-hover:text-white transition-all shadow-inner">
                    <TrendingUp size={32} />
                  </div>
                </div>
                <p className="text-slate-400 font-black text-sm uppercase tracking-widest mb-1">إجمالي القطع بالمخزن</p>
                <p className="text-5xl font-black text-black">{stats.totalItems}</p>
              </div>
            </div>

            {/* Grid */}
            {filteredModels.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {filteredModels.map(model => (
                  <ModelCard 
                    key={model.id} 
                    model={model} 
                    onClick={() => setViewingModel(model)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Filter className="text-slate-200" size={64} />
                </div>
                <h3 className="text-2xl font-black text-black mb-2">{TRANSLATIONS.noResults}</h3>
                <p className="text-slate-400 font-bold text-lg">حاول البحث باستخدام اسم الموديل أو نوع الخامة</p>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-5xl mx-auto">
            <header className="mb-14 text-right">
              <h1 className="text-5xl font-black text-black mb-3 tracking-tight">{TRANSLATIONS.history}</h1>
              <p className="text-slate-500 font-bold text-lg">سجل العمليات المتزامن لكل المستخدمين</p>
            </header>

            <div className="space-y-4">
              {logs.length > 0 ? (
                logs.map(log => (
                  <div key={log.id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-black transition-all">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        log.type === 'add' ? 'bg-emerald-100 text-emerald-700' : 
                        log.type === 'update' ? 'bg-amber-100 text-amber-700' : 
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {log.type === 'add' ? <Plus size={24} /> : log.type === 'update' ? <RefreshCw size={24} /> : <AlertTriangle size={24} />}
                      </div>
                      <div>
                        <p className="font-black text-black text-xl mb-2">{log.action}</p>
                        <div className="flex items-center gap-6 text-slate-400 text-sm font-bold">
                           <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(log.timestamp).toLocaleDateString('ar-EG')}</span>
                           <span className="flex items-center gap-2"><Clock size={16} /> {new Date(log.timestamp).toLocaleTimeString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                  <History className="mx-auto text-slate-200 mb-6" size={64} />
                  <p className="text-slate-400 font-black text-xl">{TRANSLATIONS.emptyLogs}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingModel(undefined); }} title={editingModel ? TRANSLATIONS.editModel : TRANSLATIONS.addModel}>
        <ModelForm 
          onClose={() => { setIsFormOpen(false); setEditingModel(undefined); }}
          initialData={editingModel}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingModel(undefined);
            refreshData(true);
          }}
        />
      </Modal>

      <Modal isOpen={!!viewingModel} onClose={() => setViewingModel(null)} title={viewingModel?.name || ''}>
        {viewingModel && (
          <div className="space-y-10 py-4">
            <div className="flex flex-col lg:flex-row gap-10">
              <div className="w-full lg:w-1/2 aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                {viewingModel.image ? (
                  <img src={viewingModel.image} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package size={100} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-8">
                <div className="flex flex-wrap gap-4">
                  <div className="bg-black text-white px-8 py-5 rounded-[2rem] shadow-xl flex-1 text-center">
                    <p className="text-[10px] uppercase font-black opacity-50 mb-1">{TRANSLATIONS.price}</p>
                    <p className="text-4xl font-black">{viewingModel.price} ج.م</p>
                  </div>
                  <div className="bg-white border border-slate-200 px-8 py-5 rounded-[2rem] flex-1 text-center shadow-sm">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">{TRANSLATIONS.fabric}</p>
                    <p className="text-3xl font-black text-black">{viewingModel.fabric || '---'}</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                   <h4 className="font-black text-black mb-8 flex items-center gap-4 text-2xl">
                     <Package size={28} className="text-slate-300" />
                     مواصفات المخزون
                   </h4>
                   <div className="space-y-4">
                     {viewingModel.colors.map(color => {
                       const totalInColor = (color.quantities.size1 || 0) + (color.quantities.size2 || 0) + (color.quantities.oneSize || 0);
                       return (
                        <div key={color.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                            <div className="flex justify-between items-center mb-5">
                              <span className="font-black text-black text-xl">{color.name}</span>
                              <span className="text-xs font-black text-white bg-black px-4 py-1.5 rounded-full">
                                {totalInColor} قطعة
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4">
                              {['size1', 'size2', 'oneSize'].map((sz) => {
                                const q = color.quantities[sz as keyof typeof color.quantities] || 0;
                                if (q === 0) return null;
                                return (
                                  <div key={sz} className="text-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 min-w-[80px]">
                                    <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">
                                      {sz === 'size1' ? 'مقاس 1' : sz === 'size2' ? 'مقاس 2' : 'مقاس واحد'}
                                    </p>
                                    <p className="text-2xl font-black text-black">{q}</p>
                                  </div>
                                )
                              })}
                              {totalInColor === 0 && (
                                <div className="w-full text-center py-4 text-rose-600 font-black bg-rose-50 rounded-2xl border border-rose-100">
                                  {TRANSLATIONS.outOfStock}
                                </div>
                              )}
                            </div>
                        </div>
                       );
                     })}
                   </div>
                </div>
              </div>
            </div>

            {currentUser.role === UserRole.ADMIN && (
              <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100">
                <Button fullWidth onClick={() => { setEditingModel(viewingModel); setViewingModel(null); setIsFormOpen(true); }} className="h-16 bg-black text-white hover:bg-slate-800 font-black rounded-2xl shadow-xl text-lg">
                  تعديل بيانات الموديل
                </Button>
                <Button variant="danger" onClick={async () => {
                  if (confirm(TRANSLATIONS.confirmDelete)) {
                    await storageService.deleteModel(viewingModel.id);
                    setViewingModel(null);
                    refreshData(true);
                  }
                }} className="h-16 px-10 rounded-2xl font-black text-lg">
                  حذف
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default App;
