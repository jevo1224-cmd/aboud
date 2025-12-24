
import React from 'react';
import { ChevronLeft, Info, Package } from 'lucide-react';
import { ClothingModel } from '../types';
import { TRANSLATIONS } from '../constants';

interface ModelCardProps {
  model: ClothingModel;
  onClick: () => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onClick }) => {
  const totalStock = model.colors.reduce((acc, color) => 
    acc + color.quantities.size1 + color.quantities.size2 + color.quantities.oneSize, 0
  );

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:border-black hover:shadow-2xl transition-all active:scale-[0.98]"
    >
      <div className="aspect-[4/5] overflow-hidden bg-slate-50 relative">
        {model.image ? (
          <img 
            src={model.image} 
            alt={model.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Package size={48} />
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-black text-white rounded-lg text-xs font-black shadow-lg">
            {model.price} ج.م
          </span>
        </div>

        {totalStock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
              {TRANSLATIONS.outOfStock}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 bg-white">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-black text-black text-lg line-clamp-1 flex-1">{model.name}</h3>
          <ChevronLeft size={16} className="text-black group-hover:translate-x-[-4px] transition-transform" />
        </div>
        <p className="text-xs text-slate-600 font-bold mb-3">{model.fabric || 'خامة غير محددة'}</p>
        
        <div className="flex items-center gap-2 text-[11px] text-black font-black border-t border-slate-100 pt-3">
          <span className="bg-slate-100 px-2 py-0.5 rounded">{model.colors.length} ألوان</span>
          <span>•</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded">{totalStock} قطعة</span>
        </div>
      </div>
    </div>
  );
};

export default ModelCard;