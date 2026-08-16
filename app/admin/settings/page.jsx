'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Settings, Bot, CheckCircle2, Shield, AlertTriangle, Save, Server, Database, Key, RefreshCw, Sparkles, HelpCircle, ToggleLeft, ToggleRight, Clock, Award, UserPlus, Lock
} from 'lucide-react';

export default function SettingsAdmin() {
  const [settings, setSettings] = useState({
    showExplanations: true,
    examTimerEnabled: true,
    maxExamQuestions: 30,
    passThreshold: 60,
    allowSelfRegistration: true,
    maintenanceMode: false
  });

  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettingsAndDiagnostics = async () => {
    setLoading(true);
    try {
      const settingsRes = await api.get('/settings');
      if (settingsRes) {
        setSettings(settingsRes);
      }
      const diagRes = await api.get('/settings/env-check').catch(() => null);
      if (diagRes) {
        setDiagnostics(diagRes);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load system settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndDiagnostics();
  }, []);

  const saveSettingsPayload = async (payload) => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.put('/settings', payload);
      if (res.settings) {
        setSettings(res.settings);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    const updated = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(updated);
    saveSettingsPayload(updated);
  };

  const handleInputChange = (key, val) => {
    setSettings((prev) => ({
      ...prev,
      [key]: val
    }));
    setSaveSuccess(false);
  };

  const handleSaveSettings = (e) => {
    if (e) e.preventDefault();
    saveSettingsPayload(settings);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-400" />
            <span>System & Platform Settings</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Configure AI tutor assistant features, exam rules, security, and system parameters.</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center space-x-2 cursor-pointer shadow-md transition-all shrink-0"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-green-950/50 border border-green-900/60 text-green-300 p-4 rounded-2xl flex items-center space-x-3 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <span>System settings auto-saved directly to MongoDB Atlas!</span>
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-900/50 text-red-300 p-4 rounded-2xl flex items-center space-x-2 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings Grid */}
      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Card 1: Learning Features */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <div className="p-2 bg-indigo-950/60 text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Learning & Explanation Settings</span>
              </h2>
              <p className="text-slate-400 text-xs">Configure answer explanations and feedback preferences.</p>
            </div>
          </div>

          <div className="space-y-4">

            {/* Instant Explanations Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">Show Answer Explanations Immediately</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    settings.showExplanations ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {settings.showExplanations ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">Display rich detailed answer explanations immediately after a student submits a question.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('showExplanations')}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1"
              >
                {settings.showExplanations ? (
                  <ToggleRight className="w-8 h-8 text-green-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Exam & Assessment Rules */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <div className="p-2 bg-blue-950/60 text-blue-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Exam & Assessment Rules</h2>
              <p className="text-slate-400 text-xs">Set countdown timer rules, question limits, and passing grade percentages.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Exam Countdown Timers Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">Practice Exam Timers</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    settings.examTimerEnabled ? 'bg-blue-950 text-blue-400 border border-blue-900' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {settings.examTimerEnabled ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">Enable timed exam countdown clock for timed exam simulation mode.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('examTimerEnabled')}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1"
              >
                {settings.examTimerEnabled ? (
                  <ToggleRight className="w-8 h-8 text-blue-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>

            {/* Inputs: Max Questions & Passing Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <label className="block font-bold text-slate-300">Max Questions Per Timed Exam</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={settings.maxExamQuestions}
                  onChange={(e) => handleInputChange('maxExamQuestions', parseInt(e.target.value, 10) || 30)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <label className="block font-bold text-slate-300">Passing Threshold Grade (%)</label>
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={settings.passThreshold}
                  onChange={(e) => handleInputChange('passThreshold', parseInt(e.target.value, 10) || 60)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Security & Maintenance Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <div className="p-2 bg-purple-950/60 text-purple-400 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Security & Access Controls</h2>
              <p className="text-slate-400 text-xs">Manage new student registration and system maintenance mode.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Student Registration Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">Allow Student Self-Registration</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    settings.allowSelfRegistration ? 'bg-purple-950 text-purple-400 border border-purple-900' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {settings.allowSelfRegistration ? 'ALLOWED' : 'LOCKED'}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">Permit new students to register accounts through the sign-up portal.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('allowSelfRegistration')}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1"
              >
                {settings.allowSelfRegistration ? (
                  <ToggleRight className="w-8 h-8 text-purple-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>

            {/* System Maintenance Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">System Maintenance Mode</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    settings.maintenanceMode ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {settings.maintenanceMode ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">Temporarily pause non-admin logins for scheduled maintenance upgrades.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('maintenanceMode')}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1"
              >
                {settings.maintenanceMode ? (
                  <ToggleRight className="w-8 h-8 text-red-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: System Health Diagnostics */}
        {diagnostics && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-xl">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Platform Health Diagnostics</h2>
                  <p className="text-slate-400 text-xs">Live server environment status and database connections.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchSettingsAndDiagnostics}
                className="text-slate-400 hover:text-white flex items-center text-xs space-x-1 font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">Database Status</span>
                </div>
                <p className="text-sm font-bold text-white">{diagnostics.mongodb?.status || 'HEALTHY'}</p>
                <p className="text-[11px] text-slate-500 line-clamp-1">{diagnostics.mongodb?.uriMasked}</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold">JWT Auth Secret</span>
                </div>
                <p className="text-sm font-bold text-white">{diagnostics.jwtSecret?.status || 'CONFIGURED'}</p>
                <p className="text-[11px] text-slate-500">Key Length: {diagnostics.jwtSecret?.length || 32} chars</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="font-bold">Server Port</span>
                </div>
                <p className="text-sm font-bold text-white">Port {diagnostics.serverPort || 5000}</p>
                <p className="text-[11px] text-slate-500">Environment: {diagnostics.nodeEnv || 'development'}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
