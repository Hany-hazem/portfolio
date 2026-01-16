import React, { useState, useEffect } from 'react';
import { LogOut, Settings, Activity, Loader2, AlertCircle, Save } from 'lucide-react';
import { type ActivityLog } from '../services/github';
const ADMIN_API_BASE = '/admin-api/admin';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_PASSWORD || '';

interface AdminDashboardProps {
  onClose: () => void;
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings');
  
  // Settings state
  const [githubUsername, setGithubUsername] = useState('');
  const [repoFilter, setRepoFilter] = useState<'pinned' | 'recent' | 'stars'>('recent');
  const [maxRepos, setMaxRepos] = useState(6);
  const [bioOverride, setBioOverride] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Logs state
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [healthTime, setHealthTime] = useState<string>('');

  const totalLogs = logs.length;
  const errorCount = logs.filter((log) => log.event_type === 'error').length;
  const lastLogTime = logs[0]?.created_at ? new Date(logs[0].created_at).toLocaleString() : 'No logs yet';

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        
        // Load settings from Supabase (admin_settings has a single row id=1)
        const resp = await fetch(`${ADMIN_API_BASE}/settings`, {
          headers: { 'x-admin-token': ADMIN_TOKEN },
        });
        if (!resp.ok) throw new Error(`Settings fetch failed: ${resp.status}`);
        const data = await resp.json();

        setGithubUsername(data.github_username || 'Hany-hazem');
        setRepoFilter((data.repo_filter as 'pinned' | 'recent' | 'stars') || 'recent');
        setMaxRepos(data.max_repos ?? 6);
        setBioOverride(data.bio_override || '');

        // Load initial logs from Supabase
        await loadLogs();
      } catch (err) {
        console.error('Error loading settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, []);

  const loadHealth = async () => {
    try {
      setHealthLoading(true);
      const resp = await fetch('/admin-api/health');
      if (!resp.ok) throw new Error(`Health check failed: ${resp.status}`);
      const data = await resp.json();
      setHealthOk(true);
      setHealthTime(data.time || new Date().toISOString());
    } catch (err) {
      console.error('Error loading health:', err);
      setHealthOk(false);
    } finally {
      setHealthLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      setError(null);
      const resp = await fetch(`${ADMIN_API_BASE}/logs`, {
        headers: { 'x-admin-token': ADMIN_TOKEN },
      });
      if (!resp.ok) throw new Error(`Logs fetch failed: ${resp.status}`);
      const data = await resp.json();
      setLogs(data || []);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      const resp = await fetch('/admin-api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN,
        },
        body: JSON.stringify({
          github_username: githubUsername,
          repo_filter: repoFilter,
          max_repos: maxRepos,
          bio_override: bioOverride,
        })
      });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || `Settings save failed: ${resp.status}`);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    await loadLogs();
  } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    onClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-gray-400">
            Manage your portfolio settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${healthOk === null ? 'border-gray-600 text-gray-400' : healthOk ? 'border-green-600 text-green-400' : 'border-red-600 text-red-400'}`}>
            {healthLoading ? 'API: Checking…' : healthOk === null ? 'API: Unknown' : healthOk ? `API: Online` : 'API: Offline'}
          </div>
          <button
            onClick={loadHealth}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs"
          >
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/60">
          <p className="text-sm text-gray-400">Active GitHub user</p>
          <p className="text-xl font-semibold mt-1">{githubUsername || 'Hany-hazem'}</p>
          <p className="text-xs text-gray-500 mt-2">Filter: {repoFilter}, Max: {maxRepos}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/60">
          <p className="text-sm text-gray-400">Activity logs</p>
          <p className="text-xl font-semibold mt-1">{totalLogs}</p>
          <p className="text-xs text-gray-500 mt-2">Errors: {errorCount}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/60">
          <p className="text-sm text-gray-400">Last event</p>
          <p className="text-xl font-semibold mt-1 truncate">{lastLogTime}</p>
          <p className="text-xs text-gray-500 mt-2">Bio override: {bioOverride ? 'Custom' : 'Using GitHub bio'}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-600/30 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
          <p className="text-green-400">Settings saved successfully!</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${
            activeTab === 'settings'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${
            activeTab === 'logs'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Activity className="w-5 h-5" />
          Activity Logs
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-gray-800 rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">GitHub Username</label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="e.g., Hany-hazem"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
            />
            <p className="text-sm text-gray-500 mt-1">Leave empty to use default username</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Repository Display</label>
            <select
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-600 focus:outline-none"
            >
              <option value="recent">Most Recent</option>
              <option value="stars">Most Starred</option>
              <option value="pinned">Pinned Repos (requires token)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Max Repositories to Show</label>
            <input
              type="number"
              min="1"
              max="50"
              value={maxRepos}
              onChange={(e) => setMaxRepos(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Bio Override</label>
            <textarea
              value={bioOverride}
              onChange={(e) => setBioOverride(e.target.value)}
              placeholder="Leave empty to use GitHub bio"
              rows={4}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Activity Logs</h3>
            <button
              onClick={() => loadLogs()}
              disabled={logsLoading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {logsLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {logsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
              <p>No activity logs yet</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-300 font-semibold">Event</th>
                      <th className="px-6 py-3 text-left text-gray-300 font-semibold">Time</th>
                      <th className="px-6 py-3 text-left text-gray-300 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-3 text-gray-300">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            log.event_type === 'error'
                              ? 'bg-red-600/20 text-red-400'
                              : log.event_type === 'login'
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-blue-600/20 text-blue-400'
                          }`}>
                            {log.event_type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-xs">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-3">
                          {log.error_message ? (
                            <span className="text-red-400 text-xs">{log.error_message.substring(0, 50)}...</span>
                          ) : (
                            <span className="text-green-400 text-xs">Success</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default AdminDashboard;