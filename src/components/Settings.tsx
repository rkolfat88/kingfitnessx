import React, { useState } from 'react';
import { LogOut, Trash2, Download, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { HeaderBar } from './HeaderBar';

interface SettingsProps {
  onBack?: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { signOut } = useAuth();
  const [deleteConfirm, setDeleteConfirm]   = useState('');
  const [deleteLoading, setDeleteLoading]   = useState(false);
  const [exportLoading, setExportLoading]   = useState(false);
  const [accountError, setAccountError]     = useState('');

  const handleSignOut = async () => { await signOut(); };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    setAccountError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setAccountError('Not authenticated');
      setDeleteLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
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
    if (!session?.access_token) {
      setAccountError('Not authenticated');
      setExportLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/account/export', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { setAccountError('Export failed'); setExportLoading(false); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'kfx-data.json';
      a.click();
    } catch {
      setAccountError('Network error — try again');
    }
    setExportLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#000000] pb-24">
      <HeaderBar onBack={onBack} />
      <div className="px-5 space-y-6 pb-8">
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#CAFF40] font-semibold font-mono">KFX</p>
        <h2 className="text-3xl font-black text-[#FFFFFF] tracking-tight mt-1">Settings</h2>
      </div>

      {/* Account actions */}
      <div className="space-y-2">
        <p className="text-[9px] tracking-[0.2em] font-mono text-[#5C5C5C] uppercase font-bold">Account</p>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 bg-[#0D0D0D] border border-[#262626] rounded-xl px-4 py-3 text-left hover:border-[#CAFF40]/30 transition"
        >
          <LogOut className="w-4 h-4 text-[#A0A0A0] shrink-0" />
          <span className="text-sm font-semibold text-[#FFFFFF]">Sign Out</span>
        </button>

        <button
          onClick={handleExportData}
          disabled={exportLoading}
          className="w-full flex items-center gap-3 bg-[#0D0D0D] border border-[#262626] rounded-xl px-4 py-3 text-left hover:border-[#CAFF40]/30 transition disabled:opacity-60"
        >
          <Download className="w-4 h-4 text-[#A0A0A0] shrink-0" />
          <div>
            <span className="text-sm font-semibold text-[#FFFFFF] block">
              {exportLoading ? 'Preparing export...' : 'Export My Data'}
            </span>
            <span className="text-xs text-[#5C5C5C]">Download all your data as JSON (GDPR)</span>
          </div>
        </button>
      </div>

      {/* Danger zone */}
      <div className="space-y-2">
        <p className="text-[9px] tracking-[0.2em] font-mono text-[#EF4444]/60 uppercase font-bold">Danger Zone</p>

        <div className="bg-[#0D0D0D] border border-[#EF4444]/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span className="text-sm font-semibold text-[#EF4444]">Delete Account</span>
          </div>
          <p className="text-xs text-[#5C5C5C] leading-relaxed">
            Permanently deletes your account and all data. This cannot be undone.
          </p>
          <input
            type="text"
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full bg-[#0D0D0D] border border-[#262626] rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#5C5C5C] focus:outline-none focus:border-[#EF4444]/50"
          />
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'DELETE' || deleteLoading}
            className="w-full py-2.5 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm font-bold rounded-lg disabled:opacity-40 hover:bg-[#EF4444]/20 transition"
          >
            {deleteLoading ? 'Deleting...' : 'Delete My Account'}
          </button>
          {accountError && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
              <p className="text-xs text-[#EF4444]">{accountError}</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
