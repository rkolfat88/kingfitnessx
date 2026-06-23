import React, { useState } from 'react';
import { Shield, KeyRound, Radio, Sliders, ChevronRight, CheckCircle2, Circle, AlertTriangle, RefreshCcw, LogOut, Trash2, Download } from 'lucide-react';
import { WearableStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  wearables: WearableStats;
  streak: number;
  isUnlocked: boolean;
  onUpdateWearables: (stats: Partial<WearableStats>) => void;
  onUpdateStreak: (val: number) => void;
  onToggleUnlocked: () => void;
}

export function Settings({
  wearables,
  streak,
  isUnlocked,
  onUpdateWearables,
  onUpdateStreak,
  onToggleUnlocked,
}: SettingsProps) {
  
  const WEARABLES_LIST = [
    { key: 'whoop', label: 'WHOOP App Integration', desc: 'Syncs dynamic recovery, HRV & strain vectors.', active: true, statInfo: `HRV: ${wearables.whoopHrv}ms // Readiness: ${wearables.whoopReadiness}%` },
    { key: 'oura', label: 'Oura Sleep Ring Integration', desc: 'Syncs sleep cycle, REM & body temperature grids.', active: true, statInfo: `Sleep Score: ${wearables.ouraSleepScore}/100` },
    { key: 'appleHealth', label: 'Apple Watch (WatchOS)', desc: 'Provides real-time heart rate and eccentric stress load.', active: false, statInfo: 'Inactive // Tap to pair' },
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    onUpdateWearables({ whoopReadiness: val });
  };

  const { signOut } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [accountError, setAccountError] = useState('');

  const handleSignOut = async () => { await signOut(); };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    setAccountError('');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setAccountError('Not authenticated'); setDeleteLoading(false); return; }
    try {
      const res = await fetch('http://localhost:3001/api/account/delete', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const b = await res.json();
        setAccountError(b.error ?? 'Deletion failed');
        setDeleteLoading(false);
        return;
      }
      await signOut();
    } catch {
      setAccountError('Network error — try again');
      setDeleteLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    setAccountError('');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setAccountError('Not authenticated'); setExportLoading(false); return; }
    try {
      const res = await fetch('http://localhost:3001/api/account/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setAccountError('Export failed'); setExportLoading(false); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'king-ai-data.json';
      a.click();
    } catch {
      setAccountError('Network error — try again');
    }
    setExportLoading(false);
  };

  return (
    <div className="space-y-4 text-left animate-fade-in pb-4">
      {/* Settings Title */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-gold-base font-semibold font-display">CONNECTED SYSTEMS</p>
        <h2 className="text-3xl font-extrabold text-[#F0F0F0] tracking-tight mt-1 font-display">
          Settings & Sync
        </h2>
      </div>

      {/* Wearable Data Simulator */}
      <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-gold-base/20 relative overflow-hidden">
        <p className="text-[9px] font-mono tracking-widest text-gold-base font-bold uppercase mb-1 flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5" />
          Wearable Data Simulator
        </p>
        <h3 className="text-xs font-bold text-white leading-normal">
          Adjust your biometric inputs to see how Coach King adapts your session in real time.
        </h3>

        <div className="mt-4 space-y-3 pt-3 border-t border-white/5 text-xs">
          {/* WHOOP Readiness Slider */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-mono font-bold mb-1">
              <span className="text-gold-light">WHOOP DAILY READINESS:</span>
              <span className="text-white bg-black px-1.5 py-0.2 rounded font-mono">{wearables.whoopReadiness}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={wearables.whoopReadiness}
              onChange={handleSliderChange}
              className="w-full accent-gold-base h-1.5 bg-black rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-[#505050] font-bold font-mono mt-1">
              <span>CRITICAL COGNITION (15%)</span>
              <span>MEDIUM (55%)</span>
              <span className="text-gold-base font-bold">OPTIMAL ATHLETE (90%)</span>
            </div>
          </div>

          {/* Day streak input log */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[9px] font-mono font-bold text-[#909090] uppercase mb-1">STREAK TARGET (DAYS):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={streak}
                  onChange={(e) => onUpdateStreak(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 bg-[#111] border border-white/10 rounded-lg text-white font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-[#909090] uppercase mb-1">LICENSE TOGGLE:</label>
              <button
                onClick={onToggleUnlocked}
                className={`w-full py-1.5 px-2 rounded-lg font-mono font-extrabold text-[10px] flex items-center justify-center gap-1.5 leading-normal ${
                  isUnlocked
                    ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                    : 'bg-gold-base/10 text-gold-base border border-gold-base/30'
                }`}
              >
                <span>{isUnlocked ? 'PRO ACTIVE' : 'FREE MODE'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WEARABLE INTEGRATION DECLASSIFIED */}
      <div className="space-y-2">
        <p className="text-[9px] tracking-[0.2em] font-mono text-[#909090] uppercase font-bold">
          CONNECTED WEARABLES GRID
        </p>

        <div className="space-y-2.5">
          {WEARABLES_LIST.map((wear) => (
            <div
              key={wear.key}
              className="bg-[#1A1A1A] p-3 rounded-xl border border-white/5 text-left flex items-start gap-3 relative"
            >
              <div className="w-8 h-8 bg-black border border-white/5 text-gold-base rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                {wear.key === 'whoop' ? 'W' : wear.key === 'oura' ? 'O' : 'A'}
              </div>

              <div className="flex-1 min-w-0 pr-8">
                <h4 className="text-xs font-bold text-[#F0F0F0]">{wear.label}</h4>
                <p className="text-[10px] text-[#808080] mt-0.5 leading-snug">{wear.desc}</p>
                <div className="text-[9px] font-mono text-gold-light mt-1.5 font-bold uppercase">
                  {wear.statInfo}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="absolute right-3 top-3.5">
                {wear.active ? (
                  <span className="w-3.5 h-3.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded-full flex items-center justify-center text-[8px] font-extrabold select-none">
                    ✓
                  </span>
                ) : (
                  <span className="w-3.5 h-3.5 bg-white/5 text-[#505050] border border-[#222] rounded-full flex items-center justify-center text-[8px] font-extrabold select-none">
                    -
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Metrics summary */}
      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 flex items-center justify-between">
        <div className="text-left font-display">
          <p className="text-[8px] font-mono text-[#505050] uppercase tracking-wider font-bold leading-none">PRIMARY ATHLETE PROFILE</p>
          <p className="text-sm font-extrabold text-white mt-1 leading-none">KING ATHLETE</p>
        </div>
        <div className="text-right font-mono text-xs">
          <span className="text-[#909090]">LEVEL:</span>{' '}
          <span className="text-gold-base font-extrabold font-mono">4</span>
        </div>
      </div>

      {/* Account Management */}
      <div className="space-y-2">
        <p className="text-[9px] tracking-[0.2em] font-mono text-[#445577] uppercase font-bold">
          ACCOUNT
        </p>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 bg-[#111827] border border-[#1E2D40] rounded-xl px-4 py-3 text-left hover:border-[#C9A84C]/30 transition"
        >
          <LogOut className="w-4 h-4 text-[#8899BB] shrink-0" />
          <span className="text-sm font-semibold text-[#F0F4FF]">Sign Out</span>
        </button>

        <button
          onClick={handleExportData}
          disabled={exportLoading}
          className="w-full flex items-center gap-3 bg-[#111827] border border-[#1E2D40] rounded-xl px-4 py-3 text-left hover:border-[#C9A84C]/30 transition disabled:opacity-60"
        >
          <Download className="w-4 h-4 text-[#8899BB] shrink-0" />
          <div>
            <span className="text-sm font-semibold text-[#F0F4FF] block">
              {exportLoading ? 'Preparing export...' : 'Export My Data'}
            </span>
            <span className="text-xs text-[#445577]">Download all your data as JSON</span>
          </div>
        </button>

        <div className="bg-[#111827] border border-[#EF4444]/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span className="text-sm font-semibold text-[#EF4444]">Delete Account</span>
          </div>
          <p className="text-xs text-[#445577]">
            Permanently deletes your account and all data. This cannot be undone.
            Type DELETE to confirm.
          </p>
          <input
            type="text"
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full bg-[#0D1117] border border-[#1E2D40] rounded-lg px-3 py-2 text-sm text-[#F0F4FF] placeholder-[#445577] focus:outline-none focus:border-[#EF4444]/50"
          />
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'DELETE' || deleteLoading}
            className="w-full py-2.5 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm font-bold rounded-lg disabled:opacity-40 hover:bg-[#EF4444]/20 transition"
          >
            {deleteLoading ? 'Deleting...' : 'Delete My Account'}
          </button>
          {accountError && (
            <p className="text-xs text-[#EF4444]">{accountError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
