
import { ClothingModel, InventoryStats, AuditLog } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// استخدام استيراد ديناميكي لمكتبة Supabase من CDN
const getSupabaseClient = async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js');
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Failed to load Supabase client", e);
    return null;
  }
};

const LOCAL_MODELS = 'aboud_store_data';
const LOCAL_LOGS = 'aboud_store_logs';

export const storageService = {
  // Models Logic
  getModels: async (): Promise<ClothingModel[]> => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('models').select('*').order('createdAt', { ascending: false });
      if (!error && data) return data;
    }
    const local = localStorage.getItem(LOCAL_MODELS);
    return local ? JSON.parse(local) : [];
  },

  addModel: async (model: ClothingModel) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      await supabase.from('models').insert([model]);
    } else {
      const models = await storageService.getModels();
      models.unshift(model);
      localStorage.setItem(LOCAL_MODELS, JSON.stringify(models));
    }
    
    storageService.addLog('add', `إضافة موديل: ${model.name} بسعر ${model.price} ج.م`);
  },

  updateModel: async (id: string, updatedModel: ClothingModel) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      await supabase.from('models').update(updatedModel).eq('id', id);
    } else {
      const models = await storageService.getModels();
      const index = models.findIndex(m => m.id === id);
      if (index !== -1) {
        models[index] = updatedModel;
        localStorage.setItem(LOCAL_MODELS, JSON.stringify(models));
      }
    }
    storageService.addLog('update', `تعديل في الموديل: ${updatedModel.name}`);
  },

  deleteModel: async (id: string) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      await supabase.from('models').delete().eq('id', id);
    } else {
      const models = await storageService.getModels();
      const filtered = models.filter(m => m.id !== id);
      localStorage.setItem(LOCAL_MODELS, JSON.stringify(filtered));
    }
    storageService.addLog('delete', `حذف موديل بنجاح`);
  },

  getLogs: async (): Promise<AuditLog[]> => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (!error && data) return data;
    }
    const data = localStorage.getItem(LOCAL_LOGS);
    return data ? JSON.parse(data) : [];
  },

  addLog: async (type: AuditLog['type'], details: string) => {
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      action: details,
      details,
      timestamp: Date.now(),
      type
    };

    const supabase = await getSupabaseClient();
    if (supabase) {
      await supabase.from('logs').insert([newLog]);
    } else {
      const logs = await storageService.getLogs();
      logs.unshift(newLog);
      localStorage.setItem(LOCAL_LOGS, JSON.stringify(logs.slice(0, 500)));
    }
  },

  getStats: (models: ClothingModel[]): InventoryStats => {
    let totalItems = 0;
    models.forEach(model => {
      model.colors.forEach(color => {
        totalItems += color.quantities.size1 + color.quantities.size2 + color.quantities.oneSize;
      });
    });
    return {
      totalModels: models.length,
      totalItems
    };
  },

  // ميزة الاشتراك اللحظي
  subscribeToChanges: async (callback: () => void) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return null;

    return supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, callback)
      .subscribe();
  }
};
