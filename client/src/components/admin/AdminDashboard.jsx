import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Store, Coffee, Shield, History, LogOut, Sparkles, Check, Camera } from 'lucide-react';
import { sound } from '../../utils/sound';
import StoreSettingsTab from './StoreSettingsTab';
import MenuManagerTab from './MenuManagerTab';
import SecurityTab from './SecurityTab';
import AuditLogsTab from './AuditLogsTab';
import GalleryManagerTab from './GalleryManagerTab';

export default function AdminDashboard() {
  const { logout, settings } = useRealtime();
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'menu' | 'security' | 'gallery' | 'logs'

  const TABS = [
    { id: 'settings', label: 'Store & Shifts', icon: Store },
    { id: 'menu', label: 'Menu CRUD', icon: Coffee },
    { id: 'gallery', label: 'BG Photos', icon: Camera },
    { id: 'security', label: 'PIN Access', icon: Shield },
    { id: 'logs', label: 'Audit Log', icon: History }
  ];

  return (
    <div className="space-y-4">
      {/* Super Admin Top Header */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-[#1c120b] to-orange-950/60 border border-amber-500/30 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Super Admin Control Center
          </span>
          <h2 className="text-base font-bold text-white font-heading">
            {settings.shopName} Management
          </h2>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold active:scale-95 transition-all"
        >
          <LogOut size={14} /> Exit Admin
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-[#140e0a] border border-[#2b1b11]">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playTap();
                setActiveTab(tab.id);
              }}
              className={`py-2 px-0.5 rounded-xl text-[10px] sm:text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-950/50'
                  : 'text-[#9a8274] hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="truncate max-w-[55px] font-heading">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'settings' && <StoreSettingsTab />}
        {activeTab === 'menu' && <MenuManagerTab />}
        {activeTab === 'gallery' && <GalleryManagerTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'logs' && <AuditLogsTab />}
      </div>
    </div>
  );
}
