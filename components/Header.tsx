import React from 'react';
import { DEMO_USER } from '../lib/tokens';
import { TH } from '../lib/i18n';

type HeaderProps = {
  displayName?: string;
  pictureUrl?: string;
  onProfileClick?: () => void;
};

export const Header = ({ displayName, pictureUrl, onProfileClick }: HeaderProps) => {
  const name = displayName || DEMO_USER.displayName;
  const avatar = pictureUrl || DEMO_USER.pictureUrl;
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pt-4 pb-2 px-4 transition-all border-b border-zipdam-border/50">
      {/* Top Row: Identity */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onProfileClick}
          aria-label={TH.profileTitle}
          className="flex items-center gap-3 rounded-full pr-3 -ml-1 pl-1 py-1 hover:bg-zipdam-surface2 transition-colors text-left"
        >
          <div className="relative">
            <img
              src={avatar}
              alt=""
              className="w-9 h-9 rounded-full border border-zipdam-border object-cover"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-zipdam-success rounded-full border-2 border-white"></div>
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] text-zipdam-muted font-medium uppercase tracking-wider">{TH.greeting}</span>
             <span className="text-sm font-bold text-zipdam-text -mt-0.5">{name}</span>
          </div>
        </button>

        <button className="w-9 h-9 rounded-full bg-zipdam-surface2 flex items-center justify-center text-zipdam-text relative hover:bg-zipdam-surface border border-zipdam-border transition-colors">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
           </svg>
           <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-zipdam-danger rounded-full ring-1 ring-white"></span>
        </button>
      </div>

    </header>
  );
};
