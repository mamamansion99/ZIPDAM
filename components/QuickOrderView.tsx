import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { containerVariants, itemFadeUp, tapScale } from '../lib/motion';
import { useCart } from './CartContext';
import { TH, formatTHB } from '../lib/i18n';
import { Product } from '../types';

interface QuickOrderViewProps {
  products: Product[];
}

export const QuickOrderView: React.FC<QuickOrderViewProps> = ({ products }) => {
  const { addToCart } = useCart();
  const [quickText, setQuickText] = useState('');

  // Favorites logic: First 3 items for now
  const favorites = useMemo(() => products.slice(0, 3), [products]);
  
  // Dynamic Bundles generation based on available products
  const bundles = useMemo(() => {
    const list = [];
    
    if (products.length >= 4) {
      list.push({ 
        id: 'b1', 
        name: 'Safe Weekend', 
        items: [products[0], products[3]].filter(Boolean), 
        price: (products[0]?.price || 0) + (products[3]?.price || 0) - 10, 
        desc: `${products[0]?.name} + ${products[3]?.name}`
      });
    }
    
    if (products.length >= 6) {
      list.push({ 
        id: 'b2', 
        name: 'Explorer Pack', 
        items: [products[1], products[5]].filter(Boolean), 
        price: (products[1]?.price || 0) + (products[5]?.price || 0) - 15, 
        desc: `${products[1]?.name} + ${products[5]?.name}`
      });
    }
    
    return list;
  }, [products]);

  const handleQuickAdd = () => {
    // Simple heuristic for demo purposes
    const target = products.find(p => p.brand.toLowerCase().includes(quickText.toLowerCase()) || p.name.toLowerCase().includes(quickText.toLowerCase()));
    
    if (target) {
       addToCart(target);
       setQuickText('');
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="px-4 py-2 space-y-6 pb-24"
    >
      {/* Quick Input */}
      <motion.div variants={itemFadeUp} className="bg-zipdam-surface border border-zipdam-border rounded-2xl p-4 shadow-sm">
        <label className="text-xs font-bold text-zipdam-gold uppercase tracking-wider mb-2 block">{TH.quickParseLabel}</label>
        <div className="flex gap-2">
           <input 
             value={quickText}
             onChange={(e) => setQuickText(e.target.value)}
             type="text" 
             placeholder={TH.quickParsePlaceholder} 
             className="flex-1 bg-zipdam-surface2 text-zipdam-text border border-zipdam-border rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-zipdam-gold placeholder-zipdam-muted transition-shadow"
           />
           <motion.button 
             whileTap={tapScale}
             onClick={handleQuickAdd}
             className="bg-zipdam-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-zipdam-gold/20"
           >
             {TH.quickParseAdd}
           </motion.button>
        </div>
        <p className="text-[10px] text-zipdam-muted mt-2">{TH.experimental}</p>
      </motion.div>

      {/* Essentials / Favorites */}
      <motion.div variants={itemFadeUp}>
         <div className="flex justify-between items-end mb-3">
            <h2 className="text-lg font-bold text-zipdam-text">{TH.sectionFavorites}</h2>
            <button className="text-xs text-zipdam-gold font-medium hover:text-zipdam-goldHover hover:underline">{TH.edit}</button>
         </div>
         {favorites.length === 0 ? (
           <div className="text-zipdam-muted text-center py-4 text-sm">{TH.emptyFavorites}</div>
         ) : (
           <div className="space-y-3">
              {favorites.map(fav => {
                const cleanKey = (fav.imageKey || '').trim();
                const fallback = `https://picsum.photos/seed/${cleanKey || 'zipdam'}/100/100`;
                const imageSrc = cleanKey.startsWith('http') ? cleanKey : fallback;
                return (
                  <div key={fav.id} className="bg-zipdam-surface border border-zipdam-border p-3 rounded-2xl flex items-center justify-between shadow-sm hover:border-zipdam-gold/30 transition-colors">
                     <div className="flex items-center gap-3">
                        {/* White Image Well with gray background for contrast in white theme */}
                        <div className="w-12 h-12 rounded-lg bg-gray-50 p-0.5 shrink-0 border border-gray-100">
                          <img
                            src={imageSrc}
                            className="w-full h-full object-cover rounded-md mix-blend-multiply"
                            onError={(e) => {
                              if (e.currentTarget.src !== fallback) {
                                e.currentTarget.src = fallback;
                                e.currentTarget.onerror = null;
                              }
                            }}
                          />
                        </div>
                        <div>
                           <p className="font-semibold text-sm text-zipdam-text">{fav.name}</p>
                           <p className="text-xs text-zipdam-muted">{fav.brand} • {fav.size}</p>
                        </div>
                     </div>
                     <div className="flex gap-1.5">
                        {[1, 2, 3].map(q => (
                           <motion.button
                              key={q}
                              whileTap={tapScale}
                              onClick={() => addToCart(fav, q)}
                              className="w-8 h-8 rounded-lg bg-zipdam-surface2 border border-zipdam-border text-zipdam-text hover:bg-zipdam-gradient hover:text-white hover:border-transparent text-xs font-bold transition-all"
                           >
                              +{q}
                           </motion.button>
                        ))}
                     </div>
                  </div>
                );
              })}
           </div>
         )}
      </motion.div>

      {/* Bundles */}
      <motion.div variants={itemFadeUp}>
         <h2 className="text-lg font-bold text-zipdam-text mb-3">{TH.sectionBundles}</h2>
         <div className="flex overflow-x-auto gap-4 -mx-4 px-4 pb-4 no-scrollbar">
            {bundles.map(bundle => (
               <div key={bundle.id} className="min-w-[240px] bg-zipdam-gradient-subtle border border-zipdam-gold/20 text-zipdam-text p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 shrink-0 shadow-sm">
                   {/* Abstract decoration - vibrant glow */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-zipdam-gold/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                   
                   <div className="relative z-10">
                     <h3 className="font-bold text-lg leading-none mb-1 text-transparent bg-clip-text bg-zipdam-gradient">{bundle.name}</h3>
                     <p className="text-xs text-zipdam-muted line-clamp-2 opacity-90">{bundle.desc}</p>
                   </div>
                   
                   <div className="flex items-center justify-between mt-2 relative z-10">
                      <span className="font-bold text-lg text-zipdam-text">{formatTHB(bundle.price)}</span>
                      <motion.button
                         whileTap={tapScale}
                         onClick={() => {
                            bundle.items.forEach(i => addToCart(i));
                         }}
                         className="bg-white border border-zipdam-gold/30 text-zipdam-gold hover:bg-zipdam-gradient hover:text-white hover:border-transparent backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                      >
                         {TH.addBundle}
                      </motion.button>
                   </div>
               </div>
            ))}
         </div>
      </motion.div>
    </motion.div>
  );
};
