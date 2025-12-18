import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { containerVariants, tapScale } from '../lib/motion';
import { ProductCard } from './ProductCard';
import { MOCK_PRODUCTS, cn } from '../lib/tokens';
import { TH } from '../lib/i18n';

const BRANDS = ['All', 'Onetouch', 'Okamoto', 'Durex'];
const TYPE_MAP: Record<string, string> = {
  'Condom': TH.filterCondom,
  'Gel': TH.filterGel
};
const TYPES = ['Condom', 'Gel'];
const ALL_FEATURES = Array.from(new Set(MOCK_PRODUCTS.flatMap(p => p.features)));

export const BrowseView = () => {
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedType, setSelectedType] = useState('Condom');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const toggleFeature = (f: string) => {
    setSelectedFeatures(prev => 
      prev.includes(f) ? prev.filter(i => i !== f) : [...prev, f]
    );
  };

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const brandMatch = selectedBrand === 'All' || p.brand === selectedBrand;
    const typeMatch = p.type === selectedType;
    const featureMatch = selectedFeatures.length === 0 || p.features.some(f => selectedFeatures.includes(f));
    return brandMatch && typeMatch && featureMatch;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 pb-24"
    >
      {/* Brand Filter Row */}
      <div className="px-4 overflow-x-auto no-scrollbar py-1">
        <div className="flex gap-2">
          {BRANDS.map(brand => (
             <motion.button
               key={brand}
               whileTap={tapScale}
               onClick={() => setSelectedBrand(brand)}
               className={cn(
                 "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                 selectedBrand === brand 
                   ? "bg-zipdam-gradient text-white border-transparent shadow-zipdam-gold/30" 
                   : "bg-white text-zipdam-muted border-zipdam-border hover:border-zipdam-gold/50"
               )}
             >
               {brand === 'All' ? TH.filterAll : brand}
             </motion.button>
          ))}
        </div>
      </div>

      {/* Type & Features Filter */}
      <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar items-center">
         {/* Type Toggle */}
         <div className="flex bg-zipdam-surface2 p-1 rounded-lg shrink-0 border border-zipdam-border">
            {TYPES.map(type => (
               <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                     "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                     selectedType === type 
                       ? "bg-zipdam-surface text-zipdam-gold shadow-sm ring-1 ring-black/5" 
                       : "text-zipdam-muted hover:text-zipdam-text"
                  )}
               >
                  {TYPE_MAP[type] || type}
               </button>
            ))}
         </div>
         
         <div className="w-[1px] bg-zipdam-border mx-1 h-6 self-center"></div>

         {/* Features Chips */}
         {ALL_FEATURES.map(feat => (
            <button
               key={feat}
               onClick={() => toggleFeature(feat)}
               className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap",
                  selectedFeatures.includes(feat)
                    ? "bg-zipdam-gold/10 border-zipdam-gold text-zipdam-gold"
                    : "bg-white border-zipdam-border text-zipdam-muted hover:border-zipdam-muted"
               )}
            >
               {feat}
            </button>
         ))}
      </div>

      {/* Grid */}
      <div className="px-4 grid grid-cols-2 gap-3 mt-4">
         {filteredProducts.map(p => (
            <ProductCard key={p.id} product={p} />
         ))}
         {filteredProducts.length === 0 && (
            <div className="col-span-2 py-10 text-center text-zipdam-muted text-sm">
               {TH.emptyBrowse}
            </div>
         )}
      </div>
    </motion.div>
  );
};