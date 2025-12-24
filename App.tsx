
import React, { useState, useEffect, useCallback } from 'react';
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
  Zap
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
  const [stats, setStats] = useState<InventoryStats>({ totalModels: 0, totalItems: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ClothingModel | undefined>();
  const [viewingModel, setViewingModel] = useState<ClothingModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(!!SUPABASE_URL);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // دالة تحديث البيانات
  const refreshData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const fetchedModels = await storageService.getModels();
      const fetchedLogs = await storageService.getLogs();
      setModels(fetchedModels);
      setLogs(fetchedLogs);
      setStats(storageService.getStats(fetchedModels));
    } catch (e) {
      console.error("Error refreshing data:", e);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  // تفعيل المزامنة اللحظية
  useEffect(() => {
    if (currentUser) {
      refreshData();
      
      let subscription: any = null;
      const setupSync = async () => {
        subscription = await storageService.subscribeToChanges(() => {
          // استدعاء التحديث بدون شاشة تحميل ليكون سلساً (Background Refresh)
          refreshData(false);
        });
      };
      
      setupSync();
      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }
  }, [currentUser, refreshData]);

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

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.fabric.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-10 animate-in fade-in slide-in-from-bottom-8">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
              <Box className="text-white" size={48} />
            </div>
            <h1 className="text-4xl font-black text-black tracking-tight mb-2">{APP_NAME}</h1>
            <p className="text-slate-500 font-bold">نظام إدارة المخزون السحابي</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input 
              label={TRANSLATIONS.username} 
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
              className="h-14 rounded-2xl border-slate-200"
            />
            <Input 
              label={TRANSLATIONS.password} 
              type="password" 
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              className="h-14 rounded-2xl border-slate-200"
            />
            {loginError && <p className="text-red-600 font-black text-sm text-center bg-red-50 py-2 rounded-lg">{loginError}</p>}
            
            <Button type="submit" fullWidth size="lg" className="h-16 bg-black hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95">
              {TRANSLATIONS.login}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white text-black md:sticky md:top-0 md:h-screen flex flex-col p-8 z-40 border-l border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-16">
          <div className="p-2.5 bg-black rounded-2xl shadow-lg rotate-3">
            <Box size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-black">{APP_NAME}</h2>
        </div>

        <nav className="flex-1 space-y-3">
          <button 
            onClick={() => setCurrentView('inventory')}
            className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all font-black text-lg ${currentView === 'inventory' ? 'bg-black text-white shadow-xl translate-x-1' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <LayoutDashboard size={22} />
            <span>{TRANSLATIONS.inventory}</span>
          </button>
          
          {currentUser.role === UserRole.ADMIN && (
            <button 
              onClick={() => setCurrentView('history')}
              className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all font-black text-lg ${currentView === 'history' ? 'bg-black text-white shadow-xl translate-x-1' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <History size={22} />
              <span>{TRANSLATIONS.history}</span>
            </button>
          )}

          {/* Connected Status Indicator */}
          <div className={`mt-8 px-5 py-4 rounded-2xl border transition-colors flex items-center gap-4 ${isConnected ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className={`p-2 rounded-xl ${isConnected ? 'bg-emerald-500 text-white animate-pulse' : 'bg-rose-500 text-white'}`}>
              {isConnected ? <Zap size={18} /> : <WifiOff size={18} />}
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-500 uppercase">الربط السحابي</span>
               <span className={`text-sm font-black ${isConnected ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isConnected ? 'متصل ومزامن' : 'وضع الأوفلاين'}
               </span>
            </div>
          </div>
          
          <div className="mt-auto pt-10 border-t border-slate-100 space-y-4">
            <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] uppercase font-black text-slate-400 mb-1">المستخدم</p>
              <p className="text-md font-black text-black truncate">{currentUser.username}</p>
              <p className="text-xs text-slate-500 font-bold">{currentUser.role === UserRole.ADMIN ? TRANSLATIONS.adminLabel : TRANSLATIONS.viewerLabel}</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-5 py-4 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all font-black group"
            >
              <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
              <span>{TRANSLATIONS.logout}</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 relative overflow-x-hidden">
        {isLoading && (
          <div className="fixed top-6 left-6 z-50 bg-white shadow-2xl rounded-full p-3 border border-slate-100 animate-bounce">
            <RefreshCw className="animate-spin text-black" size={24} />
          </div>
        )}

        {currentView === 'inventory' ? (
          <>
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16">
              <div>
                <h1 className="text-5xl font-black text-black mb-3 tracking-tight">{TRANSLATIONS.inventory}</h1>
                <p className="text-slate-500 font-bold text-lg">تحكم في مخزون ABOUD STORE بكل سهولة</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder={TRANSLATIONS.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black outline-none transition-all text-black font-black shadow-sm text-lg"
                  />
                </div>
                {currentUser.role === UserRole.ADMIN && (
                  <Button size="lg" onClick={() => setIsFormOpen(true)} className="h-16 px-8 bg-black hover:bg-slate-800 text-white shadow-2xl shadow-black/20 font-black rounded-2xl text-lg active:scale-95">
                    <Plus size={24} className="ml-2" />
                    {TRANSLATIONS.addModel}
                  </Button>
                )}
              </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-slate-50 rounded-2xl text-black group-hover:bg-black group-hover:text-white transition-colors shadow-inner">
                    <Package size={32} />
                  </div>
                </div>
                <p className="text-slate-400 font-black text-sm uppercase tracking-widest mb-1">إجمالي الموديلات</p>
                <p className="text-5xl font-black text-black tabular-nums">{stats.totalModels}</p>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-slate-50 rounded-2xl text-black group-hover:bg-black group-hover:text-white transition-colors shadow-inner">
                    <TrendingUp size={32} />
                  </div>
                </div>
                <p className="text-slate-400 font-black text-sm uppercase tracking-widest mb-1">إجمالي القطع المتوفرة</p>
                <p className="text-5xl font-black text-black tabular-nums">{stats.totalItems}</p>
              </div>
            </div>

            {/* Models Grid */}
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
                  <Filter className="text-slate-300" size={48} />
                </div>
                <h3 className="text-2xl font-black text-black mb-2">{TRANSLATIONS.noResults}</h3>
                <p className="text-slate-400 font-bold text-lg">لم نعثر على أي موديلات تطابق بحثك</p>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-5xl mx-auto">
            <header className="mb-16">
              <h1 className="text-5xl font-black text-black mb-3 tracking-tight">{TRANSLATIONS.history}</h1>
              <p className="text-slate-500 font-bold text-lg">تتبع كافة التحركات والتغييرات على النظام بشكل لحظي</p>
            </header>

            <div className="space-y-4">
              {logs.length > 0 ? (
                logs.map(log => (
                  <div key={log.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-black transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-left-4">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${
                        log.type === 'add' ? 'bg-emerald-100 text-emerald-700' : 
                        log.type === 'update' ? 'bg-amber-100 text-amber-700' : 
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {log.type === 'add' ? <Plus size={24} /> : log.type === 'update' ? <RefreshCw size={24} /> : <AlertTriangle size={24} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-black text-xl leading-snug">{log.action}</p>
                        <div className="flex items-center gap-6 mt-3 text-slate-400 text-sm font-bold">
                           <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full"><Calendar size={16} /> {new Date(log.timestamp).toLocaleDateString('ar-EG')}</span>
                           <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full"><Clock size={16} /> {new Date(log.timestamp).toLocaleTimeString('ar-EG')}</span>
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

      {/* Forms and Viewers */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditingModel(undefined); }}
        title={editingModel ? TRANSLATIONS.editModel : TRANSLATIONS.addModel}
      >
        <ModelForm 
          onClose={() => { setIsFormOpen(false); setEditingModel(undefined); }}
          initialData={editingModel}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingModel(undefined);
            refreshData();
          }}
        />
      </Modal>

      <Modal 
        isOpen={!!viewingModel} 
        onClose={() => setViewingModel(null)}
        title={viewingModel?.name || ''}
      >
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
                  <div className="bg-black text-white px-8 py-5 rounded-3xl shadow-2xl flex-1 text-center">
                    <p className="text-[10px] uppercase font-black opacity-60 mb-1">{TRANSLATIONS.price}</p>
                    <p className="text-3xl font-black">{viewingModel.price} ج.م</p>
                  </div>
                  <div className="bg-white border border-slate-200 px-8 py-5 rounded-3xl shadow-sm flex-1 text-center">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1">{TRANSLATIONS.fabric}</p>
                    <p className="text-3xl font-black text-black">{viewingModel.fabric || '---'}</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                   <h4 className="font-black text-black mb-8 flex items-center gap-4 text-2xl">
                     <Package size={28} className="text-slate-400" />
                     المخزون المتوفر
                   </h4>
                   <div className="space-y-5">
                     {viewingModel.colors.map(color => {
                       const totalInColor = color.quantities.size1 + color.quantities.size2 + color.quantities.oneSize;
                       return (
                        <div key={color.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-hover hover:border-black/10">
                            <div className="flex justify-between items-center mb-5">
                              <span className="font-black text-black text-xl">{color.name}</span>
                              <span className="text-xs font-black text-white bg-black px-4 py-1.5 rounded-full shadow-lg">
                                إجمالي: {totalInColor} قطع
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4">
                              {color.quantities.size1 > 0 && (
                                <div className="text-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 min-w-[80px]">
                                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">مقاس 1</p>
                                  <p className="text-2xl font-black text-black">{color.quantities.size1}</p>
                                </div>
                              )}
                              {color.quantities.size2 > 0 && (
                                <div className="text-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 min-w-[80px]">
                                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">مقاس 2</p>
                                  <p className="text-2xl font-black text-black">{color.quantities.size2}</p>
                                </div>
                              )}
                              {color.quantities.oneSize > 0 && (
                                <div className="text-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 min-w-[80px]">
                                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">مقاس واحد</p>
                                  <p className="text-2xl font-black text-black">{color.quantities.oneSize}</p>
                                </div>
                              )}
                              {totalInColor === 0 && (
                                <div className="w-full text-center py-4 text-rose-600 font-black text-lg bg-rose-50 rounded-2xl border border-rose-100">
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
                <Button fullWidth onClick={() => { 
                  setEditingModel(viewingModel); 
                  setViewingModel(null); 
                  setIsFormOpen(true); 
                }} className="h-16 bg-black text-white hover:bg-slate-800 font-black rounded-2xl text-lg shadow-xl active:scale-95">
                  تعديل بيانات الموديل
                </Button>
                <Button variant="danger" onClick={async () => {
                  if (confirm(TRANSLATIONS.confirmDelete)) {
                    await storageService.deleteModel(viewingModel.id);
                    setViewingModel(null);
                    refreshData();
                  }
                }} className="h-16 px-10 rounded-2xl font-black text-lg active:scale-95">
                  حذف نهائي
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
