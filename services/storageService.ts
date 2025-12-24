
import { ClothingModel, InventoryStats, AuditLog } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// استيراد مكتبة Supabase بشكل ديناميكي
const getSupabaseClient = async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js');
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Supabase load failed", e);
    return null;
  }
};

const LOCAL_MODELS = 'aboud_store_data';
const LOCAL_LOGS = 'aboud_store_logs';

export const storageService = {
  // جلب البيانات مع دعم السحاب والمحلي
  getModels: async (): Promise<ClothingModel[]> => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('models').select('*').order('createdAt', { ascending: false });
      if (!error && data) {
        // تحديث النسخة المحلية للمزامنة مستقبلاً
        localStorage.setItem(LOCAL_MODELS, JSON.stringify(data));
        return data;
      }
    }
    const local = localStorage.getItem(LOCAL_MODELS);
    return local ? JSON.parse(local) : [];
  },

  addModel: async (model: ClothingModel) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('models').insert([model]);
      if (error) throw error;
    } else {
      const models = await storageService.getModels();
      models.unshift(model);
      localStorage.setItem(LOCAL_MODELS, JSON.stringify(models));
    }
    await storageService.addLog('add', `إضافة موديل: ${model.name}`);
  },

  updateModel: async (id: string, updatedModel: ClothingModel) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('models').update(updatedModel).eq('id', id);
      if (error) throw error;
    } else {
      const models = await storageService.getModels();
      const index = models.findIndex(m => m.id === id);
      if (index !== -1) {
        models[index] = updatedModel;
        localStorage.setItem(LOCAL_MODELS, JSON.stringify(models));
      }
    }
    await storageService.addLog('update', `تعديل موديل: ${updatedModel.name}`);
  },

  deleteModel: async (id: string) => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('models').delete().eq('id', id);
      if (error) throw error;
    } else {
      const models = await storageService.getModels();
      const filtered = models.filter(m => m.id !== id);
      localStorage.setItem(LOCAL_MODELS, JSON.stringify(filtered));
    }
    await storageService.addLog('delete', `حذف موديل من المخزون`);
  },

  getLogs: async (): Promise<AuditLog[]> => {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(50);
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
      localStorage.setItem(LOCAL_LOGS, JSON.stringify(logs.slice(0, 100)));
    }
  },

  getStats: (models: ClothingModel[]): InventoryStats => {
    let totalItems = 0;
    models.forEach(model => {
      model.colors.forEach(color => {
        totalItems += (color.quantities.size1 || 0) + (color.quantities.size2 || 0) + (color.quantities.oneSize || 0);
      });
    });
    return {
      totalModels: models.length,
      totalItems
    };
  },

  // الاشتراك اللحظي الفائق
  subscribeToChanges: async (onUpdate: () => void) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return null;

    // تفعيل الاشتراك لكافة الأحداث (إضافة، تعديل، حذف)
    return supabase
      .channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, (payload) => {
        console.log('Change received!', payload);
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, () => {
        onUpdate();
      })
      .subscribe();
  }
};
