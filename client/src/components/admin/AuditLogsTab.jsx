import React, { useState, useEffect, useMemo } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { History, Filter, Download, Trash2, RefreshCw, User, Shield, Cpu, Clock, Search } from 'lucide-react';
import { sound } from '../../utils/sound';

export default function AuditLogsTab() {
  const { authPin } = useRealtime();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actorFilter, setActorFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { 'x-admin-pin': authPin }
      });
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesActor =
        actorFilter === 'ALL' ||
        (log.actor && log.actor.toLowerCase().includes(actorFilter.toLowerCase()));
      const matchesSearch =
        !search ||
        (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
        (log.action && log.action.toLowerCase().includes(search.toLowerCase()));
      return matchesActor && matchesSearch;
    });
  }, [logs, actorFilter, search]);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear the audit history?')) return;
    sound.playTap();

    try {
      const res = await fetch('/api/admin/logs/clear', {
        method: 'POST',
        headers: { 'x-admin-pin': authPin }
      });
      if (res.ok) {
        sound.playSuccess();
        fetchLogs();
        setFeedback('Audit history cleared');
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (err) {
      sound.playWarning();
    }
  };

  const handleExportCSV = () => {
    sound.playTap();
    if (logs.length === 0) return;

    const headers = ['Timestamp', 'Actor', 'Action', 'Details'];
    const rows = logs.map(l => [
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.actor || ''}"`,
      `"${l.action || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kannu_ki_chai_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActorBadge = (actor = '') => {
    const act = actor.toLowerCase();
    if (act.includes('shopkeeper') || act.includes('operator')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[10px] font-bold">
          <User size={10} /> Shopkeeper
        </span>
      );
    }
    if (act.includes('admin')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
          <Shield size={10} /> Super Admin
        </span>
      );
    }
    if (act.includes('auto') || act.includes('engine')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
          <Cpu size={10} /> Auto Engine
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 text-[10px] font-bold">
        <Clock size={10} /> {actor}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {feedback && (
        <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* Header controls */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9a8274] font-heading">
            Live Activity History ({logs.length})
          </h3>
          <p className="text-[11px] text-[#8a7263]">Chronological trail of status & menu changes</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-xl bg-[#1b120c] hover:bg-[#261910] text-[#a89080] hover:text-white border border-[#382214] transition-all"
            title="Refresh logs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1b120c] hover:bg-[#261910] text-xs font-bold text-[#d4bca9] border border-[#382214] transition-all"
            title="Export CSV"
          >
            <Download size={13} />
            <span className="hidden xs:inline">CSV</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
            title="Clear logs"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Search & Actor Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7263]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or details..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#140e0a] border border-[#2d1b11] text-xs text-white placeholder-[#786153] focus:outline-none focus:border-orange-500/50"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Updates' },
            { id: 'Shopkeeper', label: 'Shopkeeper' },
            { id: 'Super Admin', label: 'Super Admin' },
            { id: 'Auto', label: 'Auto Scheduler' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                sound.playTap();
                setActorFilter(f.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                actorFilter === f.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#18110b] text-[#8a7263] border border-[#2b1a0f] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs timeline list */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
        {filteredLogs.map(log => {
          const date = new Date(log.timestamp);
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

          return (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-[#150f0b] border border-[#2c1b12] space-y-1 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {getActorBadge(log.actor)}
                  <span className="font-mono text-[10px] text-[#8a7263] font-bold">
                    {log.action}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#786153]">
                  {dateStr} • {timeStr}
                </span>
              </div>

              <p className="text-white/90 text-xs pl-0.5 leading-snug">
                {log.details}
              </p>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-xs text-[#8a7263]">
            No activity logs match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}

