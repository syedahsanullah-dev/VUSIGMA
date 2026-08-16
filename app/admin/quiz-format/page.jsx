'use client';
import React, { useState, useEffect } from 'react';
import {
  Sparkles, BarChart3, Split, CopyX, CheckCircle2, Workflow, LayoutDashboard,
  Upload, Download, Database, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '@/store/useAuthStore';
import { DashboardView } from '@/components/admin/quizformat/DashboardView';
import { CleanerTab } from '@/components/admin/quizformat/CleanerTab';
import { CounterTab } from '@/components/admin/quizformat/CounterTab';
import { SeparatorTab } from '@/components/admin/quizformat/SeparatorTab';
import { DeduplicatorTab } from '@/components/admin/quizformat/DeduplicatorTab';
import { ValidatorTab } from '@/components/admin/quizformat/ValidatorTab';
import { PipelineTab } from '@/components/admin/quizformat/PipelineTab';
import { SAMPLE_MESSY_DATA } from '@/utils/quizformat/sampleData';
import { extractAllJson } from '@/utils/quizformat/jsonCleaner';
import { separateQuestionTypes, generateScheme2Payload } from '@/utils/quizformat/questionSeparator';
import JSZip from 'jszip';

export default function QuizFormatAdmin() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rawText, setRawText] = useState(SAMPLE_MESSY_DATA);
  const [masterItems, setMasterItems] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [subjectInfo, setSubjectInfo] = useState({
    code: 'CS603P',
    name: 'CS603P - Software Architecture and Design Lab',
    description: 'Lab handouts, MCQs, and subjective question bank.',
  });

  useEffect(() => {
    const res = extractAllJson(SAMPLE_MESSY_DATA);
    setMasterItems(res.extractedData);
  }, []);

  const handleLoadSample = () => {
    setRawText(SAMPLE_MESSY_DATA);
    const res = extractAllJson(SAMPLE_MESSY_DATA);
    setMasterItems(res.extractedData);
    toast.success('Sample dataset loaded');
  };

  const handleExportAllZip = async () => {
    if (masterItems.length === 0) {
      toast.error('No items available to export');
      return;
    }
    const separated = separateQuestionTypes(masterItems);
    const scheme2Payload = generateScheme2Payload(masterItems, subjectInfo);

    const zip = new JSZip();
    zip.file('clean_data.json', JSON.stringify(masterItems, null, 2));
    zip.file('mcqs.json', JSON.stringify(separated.mcqs, null, 2));
    zip.file('qna.json', JSON.stringify(separated.qnas, null, 2));
    zip.file('short.json', JSON.stringify(separated.short, null, 2));
    zip.file('long.json', JSON.stringify(separated.long, null, 2));
    zip.file('full_subject_import.json', JSON.stringify(scheme2Payload, null, 2));
    zip.file('unrecognized.json', JSON.stringify(separated.unrecognized, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VU_SIGMA_Exam_Prepared_Data.zip';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded ZIP Package successfully');
  };

  const handleDirectDatabaseImport = async () => {
    if (masterItems.length === 0) {
      toast.error('Cannot import empty dataset');
      return;
    }

    setIsImporting(true);
    const loadingToast = toast.loading('Importing full subject hierarchy into MongoDB database...');

    try {
      const payload = generateScheme2Payload(masterItems, subjectInfo);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/subjects/import-full`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      toast.dismiss(loadingToast);
      if (response.data?.success) {
        toast.success(`Successfully imported Subject "${subjectInfo.code}" with ${masterItems.length} questions into Database!`);
        setShowImportModal(false);
      } else {
        toast.error(response.data?.error || 'Import failed');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Database import error';
      toast.error(`Import Error: ${errMsg}`);
    } finally {
      setIsImporting(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cleaner', label: 'AI Cleaner', icon: Sparkles },
    { id: 'counter', label: 'Counter', icon: BarChart3 },
    { id: 'separator', label: 'Separator', icon: Split },
    { id: 'deduplicator', label: 'Deduplicator', icon: CopyX },
    { id: 'validator', label: 'Validator', icon: CheckCircle2 },
    { id: 'pipeline', label: '1-Click Pipeline', icon: Workflow },
  ];

  return (
    <div className="space-y-6">
      {/* Top Suite Navigation & Global Bar */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Quiz AI Processing & Bulk Importer
              </h1>
              <span className="badge badge-indigo text-xs">Admin Exclusive</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Clean, deduplicate, validate, and bulk-import AI questions directly into the MongoDB system.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleLoadSample} className="btn-secondary text-xs">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Load Sample</span>
            </button>

            <button onClick={handleExportAllZip} className="btn-secondary text-xs">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export ZIP</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="btn-success text-xs py-2 px-4 shadow-lg shadow-emerald-500/20"
            >
              <Database className="w-4 h-4" />
              <span>Import Directly into Database</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/80 pt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'dashboard' && masterItems.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {masterItems.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'dashboard' && (
          <DashboardView onMasterItemsUpdated={(updatedItems) => setMasterItems(updatedItems)} />
        )}

        {activeTab === 'cleaner' && (
          <CleanerTab
            initialRawText={rawText}
            onDataCleaned={(cleanedData) => setMasterItems(cleanedData)}
          />
        )}

        {activeTab === 'counter' && <CounterTab items={masterItems} />}

        {activeTab === 'separator' && <SeparatorTab items={masterItems} />}

        {activeTab === 'deduplicator' && (
          <DeduplicatorTab
            items={masterItems}
            onApplyDeduplicated={(uniqueData) => setMasterItems(uniqueData)}
          />
        )}

        {activeTab === 'validator' && (
          <ValidatorTab
            items={masterItems}
            onApplyRepaired={(repairedData) => setMasterItems(repairedData)}
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelineTab
            rawText={rawText}
            onPipelineCompleted={(finalData) => setMasterItems(finalData)}
          />
        )}
      </div>

      {/* Direct Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 space-y-4 border-emerald-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Direct Database Ingestion
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to import <strong className="text-emerald-400">{masterItems.length} items</strong> directly into the database under Scheme 2 Full Subject Format.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Subject Code</label>
                <input
                  type="text"
                  value={subjectInfo.code}
                  onChange={(e) => setSubjectInfo({ ...subjectInfo, code: e.target.value })}
                  placeholder="e.g. CS603P"
                  className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Subject Full Title</label>
                <input
                  type="text"
                  value={subjectInfo.name}
                  onChange={(e) => setSubjectInfo({ ...subjectInfo, name: e.target.value })}
                  placeholder="e.g. CS603P - Software Architecture and Design Lab"
                  className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Description</label>
                <textarea
                  value={subjectInfo.description}
                  onChange={(e) => setSubjectInfo({ ...subjectInfo, description: e.target.value })}
                  placeholder="Subject description or handouts reference..."
                  className="w-full bg-slate-900 text-xs text-white p-2.5 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 h-20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowImportModal(false)}
                className="btn-secondary text-xs"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                onClick={handleDirectDatabaseImport}
                disabled={isImporting}
                className="btn-success text-xs py-2.5 px-4 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isImporting ? 'Importing...' : 'Confirm & Import to DB'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
