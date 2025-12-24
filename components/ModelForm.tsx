
import React, { useState } from 'react';
import { Camera, Save, RefreshCw } from 'lucide-react';
import { ClothingModel } from '../types';
import { TRANSLATIONS } from '../constants';
import { storageService } from '../services/storageService';
import Button from './Button';
import Input from './Input';
import ColorManager from './ColorManager';

interface ModelFormProps {
  onClose: () => void;
  initialData?: ClothingModel;
  onSuccess: () => void;
}

const ModelForm: React.FC<ModelFormProps> = ({ onClose, initialData, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ClothingModel>(initialData || {
    id: crypto.randomUUID(),
    name: '',
    image: '',
    price: 0,
    fabric: '',
    colors: [],
    createdAt: Date.now()
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (initialData) {
        await storageService.updateModel(formData.id, formData);
      } else {
        await storageService.addModel(formData);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ، يرجى التحقق من الاتصال.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-black text-black mb-2">صورة الموديل</label>
          <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-slate-400 bg-white flex items-center justify-center cursor-pointer hover:border-black transition-all">
            {formData.image ? (
              <>
                <img src={formData.image} alt="Model" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="text-white" size={32} />
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <Camera className="mx-auto text-slate-300 mb-2" size={48} />
                <p className="text-xs text-slate-500 font-bold">اضغط لرفع صورة</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <Input
            label={TRANSLATIONS.modelName}
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="border-slate-400 font-black"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={TRANSLATIONS.price}
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              className="border-slate-400 font-black"
            />
            <Input
              label={TRANSLATIONS.fabric}
              placeholder={TRANSLATIONS.fabricPlaceholder}
              value={formData.fabric}
              onChange={(e) => setFormData(prev => ({ ...prev, fabric: e.target.value }))}
              className="border-slate-400 font-black"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <ColorManager 
          colors={formData.colors} 
          onChange={(colors) => setFormData(prev => ({ ...prev, colors }))} 
          isAdmin={true} 
        />
      </div>

      <div className="flex gap-3 pt-6 border-t border-slate-200">
        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-black text-white hover:bg-slate-800 font-black">
          {isSubmitting ? <RefreshCw className="animate-spin ml-2" size={18} /> : <Save size={18} className="ml-2" />}
          {TRANSLATIONS.save}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="border-black text-black font-black">
          {TRANSLATIONS.cancel}
        </Button>
      </div>
    </form>
  );
};

export default ModelForm;
