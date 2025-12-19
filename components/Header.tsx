import React from 'react';
import { DEMO_USER } from '../lib/tokens';
import { TH } from '../lib/i18n';

type HeaderProps = {
  displayName?: string;
  pictureUrl?: string;
};

export const Header = ({ displayName, pictureUrl }: HeaderProps) => {
  const name = displayName || DEMO_USER.displayName;
  const avatar = pictureUrl || DEMO_USER.pictureUrl;
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pt-4 pb-2 px-4 transition-all border-b border-zipdam-border/50">
      {/* Top Row: Identity */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={avatar} 
              alt="Avatar" 
              className="w-9 h-9 rounded-full border border-zipdam-border object-cover" 
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-zipdam-success rounded-full border-2 border-white"></div>
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] text-zipdam-muted font-medium uppercase tracking-wider">{TH.greeting}</span>
             <span className="text-sm font-bold text-zipdam-text -mt-0.5">{name}</span>
          </div>
        </div>
        
        <button className="w-9 h-9 rounded-full bg-zipdam-surface2 flex items-center justify-center text-zipdam-text relative hover:bg-zipdam-surface border border-zipdam-border transition-colors">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
           </svg>
           <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-zipdam-danger rounded-full ring-1 ring-white"></span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-zipdam-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
         </div>
         <input 
            type="text" 
            placeholder={TH.searchPlaceholder} 
            className="w-full bg-zipdam-surface2 text-sm text-zipdam-text placeholder-zipdam-muted rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-zipdam-gold transition-all border border-transparent focus:bg-white"
         />
         <button className="absolute inset-y-0 right-1 px-2 flex items-center">
            <div className="bg-white p-1 rounded-md border border-zipdam-border shadow-sm">
               <svg className="w-4 h-4 text-zipdam-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
               </svg>
            </div>
         </button>
      </div>
    </header>
  );
};