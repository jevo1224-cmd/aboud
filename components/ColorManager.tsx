
import React from 'react';
import { Plus, Trash2, Palette } from 'lucide-react';
import { ModelColor, SizeQuantities } from '../types';
import { TRANSLATIONS, SIZES } from '../constants';
import Button from './Button';
import Input from './Input';

interface ColorManagerProps {
  colors: ModelColor[];
  onChange: (colors: ModelColor[]) => void;
  isAdmin: boolean;
}

const ColorManager: React.FC<ColorManagerProps> = ({ colors, onChange, isAdmin }) => {
  const addColor = () => {
    const newColor: ModelColor = {
      id: crypto.randomUUID(),
      name: '',
      quantities: { size1: 0, size2: 0, oneSize: 0 }
    };
    onChange([...colors, newColor]);
  };

  const removeColor = (id: string) => {
    onChange(colors.filter(c => c.id !== id));
  };

  const updateColor = (id: string, field: keyof ModelColor | keyof SizeQuantities, value: string | number) => {
    const newColors = colors.map(c => {
      if (c.id === id) {
        if (field in c.quantities) {
          return { ...c, quantities: { ...c.quantities, [field]: value } };
        }
        return { ...c, [field]: value };
      }
      return c;
    });
    onChange(newColors);
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-black text-black flex items-center gap-2">
          <Palette size={20} />
          {TRANSLATIONS.colors}
        </h4>
        {isAdmin && (
          <Button variant="secondary" size="sm" onClick={addColor} type="button" className="border-black text-black hover:bg-slate-50 font-bold">
            <Plus size={16} className="ml-1" />
            {TRANSLATIONS.addColor}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {colors.map((color, index) => (
          <div key={color.id} className="p-5 border border-slate-300 rounded-2xl bg-white relative shadow-sm">
            {isAdmin && (
              <button
                type="button"
                onClick={() => removeColor(color.id)}
                className="absolute -top-3 -left-3 p-2 bg-white border border-red-300 text-red-600 rounded-full shadow-md hover:bg-red-50 transition-colors z-10"
              >
                <Trash2 size={16} />
              </button>
            )}

            <Input
              label={TRANSLATIONS.colors}
              placeholder="مثلاً: أحمر، أزرق..."
              value={color.name}
              onChange={(e) => updateColor(color.id, 'name', e.target.value)}
              disabled={!isAdmin}
              className="bg-white mb-4 border-slate-400 text-black font-black focus:border-black"
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">{SIZES.SIZE_1}</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 text-md border border-slate-400 rounded-lg bg-white outline-none text-black font-black focus:ring-2 focus:ring-black focus:border-black"
                  value={color.quantities.size1}
                  onChange={(e) => updateColor(color.id, 'size1', parseInt(e.target.value) || 0)}
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-black mb-1">{SIZES.SIZE_2}</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 text-md border border-slate-400 rounded-lg bg-white outline-none text-black font-black focus:ring-2 focus:ring-black focus:border-black"
                  value={color.quantities.size2}
                  onChange={(e) => updateColor(color.id, 'size2', parseInt(e.target.value) || 0)}
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-black mb-1">{SIZES.ONE_SIZE}</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 text-md border border-slate-400 rounded-lg bg-white outline-none text-black font-black focus:ring-2 focus:ring-black focus:border-black"
                  value={color.quantities.oneSize}
                  onChange={(e) => updateColor(color.id, 'oneSize', parseInt(e.target.value) || 0)}
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {colors.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold bg-white">
          لم يتم إضافة ألوان لهذا الموديل بعد
        </div>
      )}
    </div>
  );
};

export default ColorManager;
