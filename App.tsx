
import React, { useState, useEffect } from 'react';
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
  CloudLightning,
  RefreshCw
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
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // 1. تحميل البيانات وتفعيل المزامنة اللحظية
  useEffect(() => {
    if (currentUser) {
      refreshData();
      
      // الاشتراك في التغييرات السحابية
      let subscription: any = null;
      const setupSubscription = async () => {
        subscription = await storageService.subscribeToChanges(() => {
          refreshData(); // تحديث فوري عند حدوث أي تغيير من أي جهاز
        });
      };
      
      setupSubscription();
      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }
  }, [currentUser]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const fetchedModels = await storageService.getModels();
      const fetchedLogs = await storageService.getLogs();
      setModels(fetchedModels);
      setLogs(fetchedLogs);
      setStats(storageService.getStats(fetchedModels));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Box className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-black text-black">{APP_NAME}</h1>
            <p className="text-slate-600 font-bold">نظام إدارة المخزون</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              label={TRANSLATIONS.username} 
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
              className="bg-white text-black border-slate-300"
            />
            <Input 
              label={TRANSLATIONS.password} 
              type="password" 
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              className="bg-white text-black border-slate-300"
            />
            {loginError && <p className="text-red-600 font-bold text-sm text-center">{loginError}</p>}
            
            <Button type="submit" fullWidth size="lg" className="bg-black hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-lg">
              {TRANSLATIONS.login}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white text-black md:sticky md:top-0 md:h-screen flex flex-col p-6 z-40 border-l border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 bg-black rounded-lg">
            <Box size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-black">{APP_NAME}</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setCurrentView('inventory')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors font-black ${currentView === 'inventory' ? 'bg-black text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <LayoutDashboard size={20} />
            <span>{TRANSLATIONS.inventory}</span>
          </button>
          
          {currentUser.role === UserRole.ADMIN && (
            <button 
              onClick={() => setCurrentView('history')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors font-black ${currentView === 'history' ? 'bg-black text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <History size={20} />
              <span>{TRANSLATIONS.history}</span>
            </button>
          )}

          {/* مؤشر المزامنة السحابية */}
          <div className="mt-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className={`p-1.5 rounded-full ${SUPABASE_URL ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-orange-100 text-orange-600'}`}>
              <CloudLightning size={14} />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-500 uppercase leading-none">Status</span>
               <span className="text-xs font-black text-black">{SUPABASE_URL ? 'Live Sync Active' : 'Offline Mode'}</span>
            </div>
          </div>
          
          <div className="mt-auto pt-10 border-t border-slate-200 space-y-2">
            <div className="px-4 py-2">
              <p className="text-[10px] uppercase font-black text-slate-500 mb-1">المستخدم الحالي</p>
              <p className="text-sm font-black text-black truncate">{currentUser.username}</p>
              <p className="text-[10px] text-slate-500 font-bold">{currentUser.role === UserRole.ADMIN ? TRANSLATIONS.adminLabel : TRANSLATIONS.viewerLabel}</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-black hover:bg-slate-50 rounded-xl transition-colors font-black"
            >
              <LogOut size={20} />
              <span>{TRANSLATIONS.logout}</span>
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 lg:p-12 relative">
        {isLoading && (
          <div className="absolute top-4 left-4 z-50">
            <RefreshCw className="animate-spin text-slate-400" size={20} />
          </div>
        )}

        {currentView === 'inventory' ? (
          <>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-black text-black mb-2">{TRANSLATIONS.inventory}</h1>
                <p className="text-slate-600 font-bold">نظرة عامة على جميع الموديلات المتاحة</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-black" size={18} />
                  <input 
                    type="text" 
                    placeholder={TRANSLATIONS.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-12 pl-4 py-3 bg-white border border-slate-400 rounded-2xl w-full md:w-64 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-black font-black"
                  />
                </div>
                {currentUser.role === UserRole.ADMIN && (
                  <Button size="lg" onClick={() => setIsFormOpen(true)} className="bg-black hover:bg-slate-800 text-white shadow-xl shadow-black/10 font-black">
                    <Plus size={20} className="ml-2" />
                    {TRANSLATIONS.addModel}
                  </Button>
                )}
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <div className="bg-white p-6 rounded-3xl border border-slate-300 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-slate-100 rounded-2xl text-black">
                    <Package size={24} />
                  </div>
                </div>
                <p className="text-slate-600 font-black text-sm mb-1">إجمالي الموديلات</p>
                <p className="text-4xl font-black text-black">{stats.totalModels}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-300 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-slate-100 rounded-2xl text-black">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <p className="text-slate-600 font-black text-sm mb-1">إجمالي القطع بالمخزن</p>
                <p className="text-4xl font-black text-black">{stats.totalItems}</p>
              </div>
            </div>

            {filteredModels.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredModels.map(model => (
                  <ModelCard 
                    key={model.id} 
                    model={model} 
                    onClick={() => setViewingModel(model)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Filter className="text-black" size={32} />
                </div>
                <h3 className="text-xl font-black text-black mb-1">{TRANSLATIONS.noResults}</h3>
                <p className="text-slate-500 font-bold">حاول البحث بكلمة أخرى أو إضافة موديل جديد</p>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <header className="mb-12">
              <h1 className="text-4xl font-black text-black mb-2">{TRANSLATIONS.history}</h1>
              <p className="text-slate-600 font-bold">سجل بكافة التعديلات والإضافات التي تمت على المخزون</p>
            </header>

            <div className="space-y-4">
              {logs.length > 0 ? (
                logs.map(log => (
                  <div key={log.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-black transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        log.type === 'add' ? 'bg-green-100 text-green-700' : 
                        log.type === 'update' ? 'bg-blue-100 text-blue-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {log.type === 'add' ? <Plus size={20} /> : log.type === 'update' ? <TrendingUp size={20} /> : <AlertTriangle size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-black text-lg leading-relaxed">{log.action}</p>
                        <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm font-bold">
                           <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(log.timestamp).toLocaleDateString('ar-EG')}</span>
                           <span className="flex items-center gap-1"><Clock size={14} /> {new Date(log.timestamp).toLocaleTimeString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-300">
                  <History className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 font-black">{TRANSLATIONS.emptyLogs}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

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
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                {viewingModel.image ? (
                  <img src={viewingModel.image} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Package size={64} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="bg-white border border-slate-300 px-4 py-2 rounded-xl shadow-sm">
                    <p className="text-[10px] text-slate-500 font-black">{TRANSLATIONS.price}</p>
                    <p className="font-black text-black">{viewingModel.price} ج.م</p>
                  </div>
                  <div className="bg-white border border-slate-300 px-4 py-2 rounded-xl shadow-sm">
                    <p className="text-[10px] text-slate-500 font-black">{TRANSLATIONS.fabric}</p>
                    <p className="font-black text-black">{viewingModel.fabric || '---'}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
                   <h4 className="font-black text-black mb-4 flex items-center gap-2 text-lg">
                     <Package size={20} />
                     تفاصيل الكميات
                   </h4>
                   <div className="space-y-3">
                     {viewingModel.colors.map(color => {
                       const totalInColor = color.quantities.size1 + color.quantities.size2 + color.quantities.oneSize;
                       return (
                        <div key={color.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-black text-black text-md">{color.name}</span>
                              <span className="text-xs font-black text-slate-600 bg-white px-2 py-1 rounded-full border border-slate-200">
                                إجمالي: {totalInColor} قطع
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {color.quantities.size1 > 0 && (
                                <div className="text-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm min-w-[70px] flex-1">
                                  <p className="text-[10px] font-black text-slate-500 mb-1">مقاس 1</p>
                                  <p className="text-lg font-black text-black">{color.quantities.size1}</p>
                                </div>
                              )}
                              {color.quantities.size2 > 0 && (
                                <div className="text-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm min-w-[70px] flex-1">
                                  <p className="text-[10px] font-black text-slate-500 mb-1">مقاس 2</p>
                                  <p className="text-lg font-black text-black">{color.quantities.size2}</p>
                                </div>
                              )}
                              {color.quantities.oneSize > 0 && (
                                <div className="text-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm min-w-[70px] flex-1">
                                  <p className="text-[10px] font-black text-slate-500 mb-1">مقاس واحد</p>
                                  <p className="text-lg font-black text-black">{color.quantities.oneSize}</p>
                                </div>
                              )}
                              {totalInColor === 0 && (
                                <div className="w-full text-center py-2 text-red-600 font-bold text-sm bg-red-50 rounded-lg border border-red-100">
                                  غير متوفر حالياً
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
              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <Button fullWidth onClick={() => { 
                  setEditingModel(viewingModel); 
                  setViewingModel(null); 
                  setIsFormOpen(true); 
                }} className="bg-black text-white hover:bg-slate-800 font-black">
                  تعديل الموديل
                </Button>
                <Button variant="danger" onClick={async () => {
                  if (confirm(TRANSLATIONS.confirmDelete)) {
                    await storageService.deleteModel(viewingModel.id);
                    setViewingModel(null);
                    refreshData();
                  }
                }} className="font-black">
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
