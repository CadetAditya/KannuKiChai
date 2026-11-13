import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { Store, Coffee, Shield, History, LogOut, Sparkles, Check } from 'lucide-react';
import { sound } from '../../utils/sound';
import StoreSettingsTab from './StoreSettingsTab';

export default function AdminDashboard({ childrenMenu, childrenSecurity, childrenLogs }) {
  const { logout, settings } = useRealtime();
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'menu' | 'security' | 'logs'

  const TABS = [
    { id: 'settings', label: 'Store & Shifts', icon: Store },
    { id: 'menu', label: 'Menu CRUD', icon: Coffee },
    { id: 'security', label: 'PIN Access', icon: Shield },
    { id: 'logs', label: 'Audit History', icon: History }
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
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#140e0a] border border-[#2b1b11]">
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
              className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-950/50'
                  : 'text-[#9a8274] hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="truncate max-w-[65px] font-heading">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'settings' && <StoreSettingsTab />}
        {activeTab === 'menu' && (childrenMenu || <div className="text-center py-8 text-xs text-[#8a7263]">Menu manager tab loading...</div>)}
        {activeTab === 'security' && (childrenSecurity || <div className="text-center py-8 text-xs text-[#8a7263]">Security tab loading...</div>)}
        {activeTab === 'logs' && (childrenLogs || <div className="text-center py-8 text-xs text-[#8a7263]">Audit logs loading...</div>)}
      </div>
    </div>
  );
}
