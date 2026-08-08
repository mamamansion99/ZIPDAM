"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideUpSheet, tapScale } from '../lib/motion';
import { TH, formatTHB } from '../lib/i18n';
import { useCart } from './CartContext';
import { useFavorites } from './FavoritesContext';
import {
  getLiffAuth,
  isExpiredLineTokenError,
  restartLiffAuth,
} from '../lib/liffAuth';
import { Product } from '../types';

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  displayName?: string;
  pictureUrl?: string;
}

interface LoyaltyProgress {
  eligible?: boolean;
  rewardValue?: string;
  totalSpend?: number;
  targetSpend?: number;
  cycleSpend?: number;
  remainingSpend?: number;
  progressPercent?: number;
  nextCycle?: number;
}

interface Summary {
  orderCount?: number;
  productTotal?: number;
  shippingTotal?: number;
  lifetimeSpend?: number;
  loyalty?: LoyaltyProgress;
}

type ContactForm = {
  store: string;
  area: string;
  phone: string;
  address: string;
};

const emptyContact: ContactForm = { store: '', area: '', phone: '', address: '' };

const postProfileApi = async (payload: Record<string, unknown>) => {
  const res = await fetch('/api/customer-profile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || 'PROFILE_REQUEST_FAILED');
  }
  return data;
};

export const ProfileSheet: React.FC<ProfileSheetProps> = ({
  open,
  onClose,
  products,
  displayName,
  pictureUrl,
}) => {
  const { addToCart } = useCart();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [contact, setContact] = useState<ContactForm>(emptyContact);
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const load = useCallback(async () => {
    const auth = getLiffAuth();
    if (!auth.idToken && !auth.lineUserId) {
      setLinked(false);
      return;
    }
    setLinked(true);
    setLoading(true);
    const identity = { idToken: auth.idToken || '', lineUserId: auth.lineUserId || '' };

    const [summaryResult, profileResult] = await Promise.allSettled([
      postProfileApi({ action: 'customer_summary', ...identity }),
      postProfileApi({ action: 'customer_profile', ...identity }),
    ]);

    if (summaryResult.status === 'fulfilled' && summaryResult.value?.summary) {
      setSummary(summaryResult.value.summary);
    }
    if (profileResult.status === 'fulfilled' && profileResult.value?.profile) {
      const profile = profileResult.value.profile;
      setContact({
        store: profile.store || '',
        area: profile.area || '',
        phone: profile.phone || '',
        address: profile.defaultAddress || profile.address || '',
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const favoriteProducts = useMemo(
    () => products.filter(p => isFavorite(p)),
    [products, favorites, isFavorite]
  );

  const save = async () => {
    setSaveState('saving');
    try {
      const auth = getLiffAuth();
      await postProfileApi({
        action: 'customer_profile_set',
        idToken: auth.idToken || '',
        lineUserId: auth.lineUserId || '',
        displayName: displayName || auth.displayName || '',
        ...contact,
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      if (isExpiredLineTokenError(err instanceof Error ? err.message : err)) {
        await restartLiffAuth();
        return;
      }
      console.error('customer_profile_set failed', err);
      setSaveState('error');
    }
  };

  const loyalty = summary?.loyalty;
  const showProgress = Boolean(loyalty?.eligible && loyalty?.targetSpend);
  const percent = Math.max(0, Math.min(100, loyalty?.progressPercent ?? 0));

  const field = (label: string, key: keyof ContactForm, multiline = false) => (
    <label className="block">
      <span className="text-[11px] font-semibold text-zipdam-muted">{label}</span>
      {multiline ? (
        <textarea
          value={contact[key]}
          onChange={e => setContact(prev => ({ ...prev, [key]: e.target.value }))}
          rows={2}
          className="mt-1 w-full bg-zipdam-surface2 border border-zipdam-border rounded-xl px-3 py-2 text-sm text-zipdam-text focus:outline-none focus:ring-1 focus:ring-zipdam-gold resize-none"
        />
      ) : (
        <input
          value={contact[key]}
          onChange={e => setContact(prev => ({ ...prev, [key]: e.target.value }))}
          inputMode={key === 'phone' ? 'tel' : 'text'}
          className="mt-1 w-full h-11 bg-zipdam-surface2 border border-zipdam-border rounded-xl px-3 text-sm text-zipdam-text focus:outline-none focus:ring-1 focus:ring-zipdam-gold"
        />
      )}
    </label>
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Close profile"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
          />

          <motion.div
            variants={slideUpSheet}
            initial="hidden"
            animate="show"
            exit="exit"
            role="dialog"
            aria-label={TH.profileTitle}
            className="relative bg-zipdam-surface w-full max-w-md rounded-t-[32px] shadow-2xl max-h-[90vh] flex flex-col border-t border-zipdam-border"
          >
            {/* Identity */}
            <div className="flex items-center gap-3 p-5 border-b border-zipdam-border">
              <img
                src={pictureUrl}
                alt=""
                className="w-12 h-12 rounded-full border border-zipdam-border object-cover bg-zipdam-surface2"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zipdam-text truncate">{displayName || '-'}</p>
                <p className="text-[11px] text-zipdam-muted">{TH.profileFromLine}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full bg-zipdam-surface2 border border-zipdam-border flex items-center justify-center text-zipdam-muted hover:text-zipdam-text"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 space-y-5">
              {!linked && (
                <p className="text-sm text-zipdam-muted text-center py-6">{TH.profileNeedLine}</p>
              )}

              {linked && (
                <>
                  {/* Loyalty */}
                  <section className="bg-zipdam-surface2 border border-zipdam-border rounded-2xl p-4">
                    <p className="text-[11px] font-semibold text-zipdam-muted">
                      {TH.profileLoyaltyTitle}
                    </p>
                    <p className="text-3xl font-bold text-zipdam-text leading-tight">
                      {loading && !summary ? '—' : formatTHB(loyalty?.totalSpend ?? summary?.productTotal ?? 0)}
                    </p>

                    {showProgress && (
                      <>
                        <div className="flex items-baseline justify-between mt-3 text-[11px] text-zipdam-muted">
                          <span>
                            {TH.profileLoyaltyCycle} {loyalty?.nextCycle} • {formatTHB(loyalty?.cycleSpend ?? 0)} / {formatTHB(loyalty?.targetSpend ?? 0)}
                          </span>
                          <span className="font-bold text-zipdam-gold">{percent}%</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full bg-zipdam-border/60 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-zipdam-gradient"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        {(loyalty?.remainingSpend ?? 0) > 0 && (
                          <p className="mt-2.5 text-center text-sm font-bold text-zipdam-gold bg-white border border-zipdam-gold/30 rounded-xl py-2">
                            {TH.profileLoyaltyRemaining} {formatTHB(loyalty?.remainingSpend ?? 0)} {TH.profileLoyaltyReceive} {loyalty?.rewardValue}
                          </p>
                        )}
                        <p className="mt-2 text-[10px] text-zipdam-muted text-center">
                          {TH.profileLoyaltyNote}
                        </p>
                      </>
                    )}
                  </section>

                  {/* Stats */}
                  <section className="grid grid-cols-3 gap-2">
                    {[
                      { label: TH.profileStatOrders, value: `${summary?.orderCount ?? 0} ${TH.orders}` },
                      { label: TH.profileStatProducts, value: formatTHB(summary?.productTotal ?? 0) },
                      { label: TH.profileStatShipping, value: formatTHB(summary?.shippingTotal ?? 0) },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className="bg-white border border-zipdam-border rounded-xl p-3 text-center"
                      >
                        <p className="text-sm font-bold text-zipdam-text">{stat.value}</p>
                        <p className="text-[10px] text-zipdam-muted mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </section>

                  {/* Shipping details */}
                  <section className="space-y-3">
                    <h3 className="font-bold text-zipdam-text">{TH.profileAddressTitle}</h3>
                    {field(TH.profileFieldStore, 'store')}
                    {field(TH.profileFieldArea, 'area')}
                    {field(TH.profileFieldPhone, 'phone')}
                    {field(TH.profileFieldAddress, 'address', true)}

                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={tapScale}
                        onClick={save}
                        disabled={saveState === 'saving'}
                        className="bg-zipdam-gradient text-white font-bold text-sm rounded-xl h-11 px-6 shadow-md shadow-zipdam-gold/30 disabled:opacity-60"
                      >
                        {TH.profileSave}
                      </motion.button>
                      {saveState === 'saved' && (
                        <span className="text-xs font-semibold text-zipdam-success">{TH.profileSaved}</span>
                      )}
                      {saveState === 'error' && (
                        <span className="text-xs font-semibold text-zipdam-danger">{TH.profileSaveError}</span>
                      )}
                    </div>
                  </section>

                  {/* Favorites */}
                  <section className="space-y-2">
                    <h3 className="font-bold text-zipdam-text">{TH.sectionFavorites}</h3>
                    {favoriteProducts.length === 0 ? (
                      <p className="text-sm text-zipdam-muted py-2">{TH.emptyFavorites}</p>
                    ) : (
                      <ul className="space-y-2">
                        {favoriteProducts.map(product => {
                          const cleanKey = (product.imageKey || '').trim();
                          const imageSrc = cleanKey.startsWith('http') ? cleanKey : '';
                          return (
                            <li
                              key={product.id}
                              className="flex items-center gap-3 bg-white border border-zipdam-border rounded-2xl p-2.5"
                            >
                              <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
                                {imageSrc && (
                                  <img src={imageSrc} alt="" className="w-full h-full object-contain" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zipdam-text truncate">
                                  {product.name}
                                </p>
                                <p className="text-[11px] text-zipdam-muted">
                                  {product.size} • {formatTHB(product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.price)}
                                </p>
                              </div>
                              <button
                                onClick={() => toggleFavorite(product)}
                                aria-label={`${TH.remove} ${product.name}`}
                                className="w-11 h-11 shrink-0 rounded-full border border-zipdam-border text-zipdam-muted hover:text-zipdam-danger flex items-center justify-center"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <motion.button
                                whileTap={tapScale}
                                onClick={() => addToCart(product)}
                                aria-label={`${TH.add} ${product.name}`}
                                className="w-11 h-11 shrink-0 rounded-full bg-zipdam-gradient text-white flex items-center justify-center shadow-sm"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </motion.button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
