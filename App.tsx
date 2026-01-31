
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Camera, Activity, Heart, User, Sparkles, Loader2, FileText,
  ChevronRight, Save, X, Trash2, Plus, LogOut, Baby, TrendingUp, Users, Cloud, Droplets,
  CalendarDays, Filter, Info, ShieldCheck, AlertCircle, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { FamilyMember, MedicalRecord, OrganKey } from './types';
import { ORGAN_MAP, DEFAULT_FAMILY } from './constants';
import { AnatomySVG } from './components/AnatomySVG';
import { fetchFamilyMembers, fetchRecords, createRecord, analyzeImages } from './services/api';

// --- Helper Components ---

const LoadingScreen = () => (
  <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-in fade-in duration-500">
    <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mb-8 animate-pulse">
      <Activity className="w-12 h-12" />
    </div>
    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Family Health Cloud</h2>
    <p className="text-slate-400 text-sm mt-2 font-medium">Connecting to secure medical hub...</p>
  </div>
);

const NavItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-blue-50' : ''}`}>
      <Icon className={`w-6 h-6 ${active ? 'fill-blue-100' : ''}`} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className="text-[10px] font-bold tracking-tight">{label}</span>
  </button>
);

const RecordCard: React.FC<{ record: MedicalRecord, onClick: () => void }> = ({ record, onClick }) => (
  <div
    onClick={onClick}
    className="group bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex gap-4 items-center hover:shadow-lg hover:border-blue-100"
  >
    <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-50 relative">
      {record.images && record.images[0] ? (
        <img src={record.images[0]} className="w-full h-full object-cover" alt="report" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
          <FileText className="w-7 h-7" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {record.report_date}
      </div>
      <h3 className="font-bold text-slate-800 text-base truncate mb-1">
        {record.category_name}
      </h3>
      <div className="flex gap-2">
        {record.abnormal_items && record.abnormal_items.length > 0 ? (
          <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-bold border border-rose-100">
            {record.abnormal_items.length} 异常
          </span>
        ) : (
          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
            正常
          </span>
        )}
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${ORGAN_MAP[record.target_organ].bg} bg-opacity-10 ${ORGAN_MAP[record.target_organ].text} border-current border-opacity-20`}>
          {ORGAN_MAP[record.target_organ].label}
        </span>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1">
      <div className={`text-lg font-black ${record.health_score && record.health_score < 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
        {record.health_score || '--'}
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300" />
    </div>
  </div>
);

// --- Main Views ---

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'archive' | 'care' | 'profile'>('home');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [activeMember, setActiveMember] = useState<FamilyMember | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  // AI Flow State
  const [view, setView] = useState<'main' | 'analyzing' | 'review'>('main');
  const [pendingReport, setPendingReport] = useState<Partial<MedicalRecord> | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [debugLog, setDebugLog] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始加载：获取家庭成员列表
  useEffect(() => {
    const loadFamily = async () => {
      try {
        const members = await fetchFamilyMembers();
        setFamilyMembers(members);
        if (members.length > 0) {
          setActiveMember(members[0]);
        }
      } catch (err) {
        console.error('加载家庭成员失败:', err);
        // 降级使用默认数据
        setFamilyMembers(DEFAULT_FAMILY);
        setActiveMember(DEFAULT_FAMILY[0]);
      } finally {
        setIsLoading(false);
      }
    };
    loadFamily();
  }, []);

  // 当选中成员变化时，加载其医疗记录
  useEffect(() => {
    if (!activeMember) return;
    const loadRecords = async () => {
      try {
        const data = await fetchRecords(activeMember.id);
        setRecords(data);
      } catch (err) {
        console.error('加载医疗记录失败:', err);
        setRecords([]);
      }
    };
    loadRecords();
  }, [activeMember]);

  const saveRecord = useCallback(async (record: MedicalRecord) => {
    if (!activeMember) return;
    try {
      // 调用后端 API 保存记录
      const savedRecord = await createRecord({
        member_id: activeMember.id,
        category_name: record.category_name,
        target_organ: record.target_organ,
        report_date: record.report_date,
        date: record.date,
        findings: record.findings,
        diagnosis: record.diagnosis,
        doctor_summary: record.doctor_summary,
        health_score: record.health_score,
        abnormal_items: record.abnormal_items,
        images: record.images,
      });
      // 更新本地状态
      const newRecords = [savedRecord, ...records].sort((a, b) =>
        new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
      );
      setRecords(newRecords);
    } catch (err) {
      console.error('保存记录失败:', err);
      alert('保存失败，请重试');
    }
  }, [records, activeMember]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setView('analyzing');
    setDebugLog("Reading image data...");

    try {
      const base64Images = await Promise.all(files.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      })));

      setDebugLog("AI 正在分析中...");
      const result = await analyzeImages(base64Images);

      if (result.reports && result.reports.length > 0) {
        const report = result.reports[0];
        setPendingReport({
          ...report,
          images: base64Images,
          id: Date.now().toString()
        });
        setView('review');
      } else {
        throw new Error("No reports identified");
      }
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please ensure the image is clear.");
      setView('main');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [selectedOrgan, setSelectedOrgan] = useState<OrganKey | null>(null);

  const filteredRecords = useMemo(() => {
    if (!selectedOrgan) return records;
    return records.filter(r => r.target_organ === selectedOrgan);
  }, [records, selectedOrgan]);

  const chartData = useMemo(() => {
    return [...records].reverse().map(r => ({
      date: r.report_date,
      score: r.health_score || 0
    }));
  }, [records]);

  const timelineYears = useMemo(() => {
    const yearsSet = new Set<number>();
    filteredRecords.forEach(r => yearsSet.add(new Date(r.report_date).getFullYear()));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [filteredRecords]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />

      {/* --- Top Nav / Header --- */}
      {activeTab !== 'home' && (
        <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center transition-all">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('home')}
              className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm border border-slate-100"
            >
              {activeMember?.avatar}
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">{activeMember?.name}</span>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Secure Sync
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsPickerOpen(true)} className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-90 transition-transform">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* --- Main Views --- */}
      <main className="px-6 pt-6 max-w-2xl mx-auto">
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-8">
              <div>
                <p className="text-slate-500 text-sm font-semibold mb-1">Family Health Cloud</p>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Family Hub</h1>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                <Cloud className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {familyMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => { setActiveMember(member); setActiveTab('archive'); }}
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all group hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5"
                >
                  <div className="text-5xl mb-6 bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    {member.avatar}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.role}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{member.status}</span>
                  </div>
                </div>
              ))}
              <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer active:scale-95 transition-all hover:bg-white hover:border-blue-400 hover:text-blue-500">
                <Plus className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase tracking-widest">New Member</span>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="mt-10">
              <h3 className="text-lg font-bold text-slate-900 mb-4 px-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" /> AI Recommendations
              </h3>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full"></div>
                <h4 className="text-2xl font-bold mb-2">Smart Analysis</h4>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed opacity-90">
                  Instantly decode complex medical terminology from your test results.
                </p>
                <button
                  onClick={() => setIsPickerOpen(true)}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/40 hover:bg-blue-500 transition-colors flex items-center gap-2 active:scale-95"
                >
                  <Camera className="w-4 h-4" /> Start Scan
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'archive' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            {/* Anatomical Visualization Filter - Enhanced Aesthetics */}
            <div className="bg-gradient-to-b from-slate-50 to-white rounded-[4rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] p-8 mb-10 overflow-hidden relative">
              <div className="h-[460px] mb-4 flex items-center justify-center">
                <AnatomySVG
                  onOrganClick={setSelectedOrgan}
                  activeOrgan={selectedOrgan}
                  hasDataMap={records.reduce((acc, r) => ({ ...acc, [r.target_organ]: true }), {})}
                />
              </div>
              <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-50 shadow-sm relative z-20">
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-full shadow-inner ring-4 ring-white transition-colors duration-500 ${selectedOrgan ? ORGAN_MAP[selectedOrgan].bg : 'bg-slate-200'}`}></div>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-xl leading-none">{selectedOrgan ? ORGAN_MAP[selectedOrgan].label : '所有指标'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                      {filteredRecords.length} 份报告存档
                    </span>
                  </div>
                </div>
                {selectedOrgan && (
                  <button
                    onClick={() => setSelectedOrgan(null)}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-6 py-3 bg-white shadow-sm border border-slate-100 rounded-2xl hover:bg-blue-50 transition-all active:scale-95"
                  >
                    重置视图
                  </button>
                )}
              </div>
            </div>

            {/* Timeline Records */}
            <div className="space-y-12 relative pl-6">
              <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent"></div>
              {timelineYears.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300">
                    <FileText className="w-12 h-12" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-slate-900 font-bold text-xl">档案库尚空</p>
                    <p className="text-slate-400 text-sm font-medium">点击相机快速扫描录入医疗报告</p>
                  </div>
                </div>
              ) : (
                timelineYears.map(year => (
                  <div key={year} className="relative">
                    <div className="absolute left-[-21px] top-1.5 w-5 h-5 rounded-full bg-white border-[5px] border-blue-600 shadow-sm z-10"></div>
                    <div className="mb-8">
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{year}</h2>
                    </div>
                    <div className="space-y-4">
                      {filteredRecords.filter(r => new Date(r.report_date).getFullYear() === year).map(record => (
                        <RecordCard key={record.id} record={record} onClick={() => setSelectedRecord(record)} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ... (Care and Profile tabs remain unchanged) ... */}
        {activeTab === 'care' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">健康指数趋势</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Health Score Trends</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {chartData.length > 1 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Activity className="w-10 h-10 mb-4 opacity-20" />
                  <p className="text-sm font-bold">数据不足，无法生成趋势图</p>
                  <p className="text-[10px] uppercase tracking-widest mt-1">需至少 2 份报告</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100">
                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-rose-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-rose-900">异常指标</h4>
                <p className="text-rose-600 text-3xl font-black mt-1">
                  {records.reduce((acc, r) => acc + (r.abnormal_items?.length || 0), 0)}
                </p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/20">
                  <Heart className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-emerald-900">平均分</h4>
                <p className="text-emerald-600 text-3xl font-black mt-1">
                  {records.length > 0 ? Math.round(records.reduce((acc, r) => acc + (r.health_score || 0), 0) / records.length) : '--'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter">Profile</h1>
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 mb-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-[2.5rem] flex items-center justify-center text-5xl mb-6 shadow-xl shadow-blue-500/10">🧑🏻</div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Health Explorer</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Personal Health Cloud ID</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Security & Privacy', icon: ShieldCheck, color: 'text-blue-500' },
                { label: 'Data Export', icon: FileText, color: 'text-emerald-500' },
                { label: 'Family Management', icon: Users, color: 'text-indigo-500' },
                { label: 'Cloud Storage', icon: Cloud, color: 'text-amber-500' }
              ].map(item => (
                <div key={item.label} className="bg-white p-5 rounded-3xl flex items-center justify-between border border-slate-100 shadow-sm active:bg-slate-50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl bg-slate-50 group-hover:bg-white transition-colors`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="font-bold text-slate-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
              ))}
            </div>

            <button className="mt-12 w-full bg-rose-50 text-rose-600 font-black py-6 rounded-[2.5rem] border border-rose-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              <LogOut className="w-5 h-5" /> Logout Session
            </button>
          </div>
        )}
      </main>

      {/* ... (Modals remain unchanged) ... */}
      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-md flex items-end justify-center animate-in fade-in" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white w-full max-w-xl rounded-t-[4rem] flex flex-col max-h-[92vh] shadow-2xl animate-in slide-in-from-bottom-20 duration-500 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-50 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-12 pt-4">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">{selectedRecord.category_name}</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{selectedRecord.report_date} · {ORGAN_MAP[selectedRecord.target_organ].label}</p>
                </div>
                <div className={`text-4xl font-black ${selectedRecord.health_score && selectedRecord.health_score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {selectedRecord.health_score}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Findings</span>
                  <p className="text-slate-700 text-sm font-medium leading-relaxed">{selectedRecord.findings || 'No findings recorded.'}</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">Diagnosis</span>
                  <p className="text-blue-900 text-sm font-bold leading-relaxed italic">"{selectedRecord.diagnosis}"</p>
                </div>
              </div>

              {selectedRecord.abnormal_items && selectedRecord.abnormal_items.length > 0 && (
                <div className="mb-10">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">异常指标提示</h4>
                  <div className="space-y-3">
                    {selectedRecord.abnormal_items.map((item, idx) => (
                      <div key={idx} className="bg-rose-50 text-rose-700 p-4 rounded-2xl flex items-center gap-3 border border-rose-100">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.doctor_summary && (
                <div className="mb-10 p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
                  <Sparkles className="absolute top-4 right-4 w-10 h-10 opacity-10" />
                  <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-4">AI 专家建议</h4>
                  <p className="text-slate-200 text-base font-medium leading-relaxed italic">{selectedRecord.doctor_summary}</p>
                </div>
              )}

              <div className="rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
                <img src={selectedRecord.images?.[0]} className="w-full h-auto" alt="Report scan" />
              </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-50 flex gap-4">
              <button onClick={() => setSelectedRecord(null)} className="flex-1 bg-slate-100 text-slate-600 py-6 rounded-3xl font-black">Close</button>
              <button className="flex-1 bg-blue-600 text-white py-6 rounded-3xl font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">Download</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Processing Overlay */}
      {view === 'analyzing' && (
        <div className="fixed inset-0 z-[150] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-20 animate-pulse"></div>
            <Loader2 className="w-20 h-20 text-blue-600 animate-spin mb-8 relative" />
          </div>
          <h3 className="font-black text-slate-900 text-3xl mb-3 tracking-tighter">Analyzing Health Cloud</h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{debugLog}</p>
        </div>
      )}

      {/* AI Review Modal */}
      {view === 'review' && pendingReport && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="relative h-64 bg-slate-100">
              <img src={pendingReport.images?.[0]} className="w-full h-full object-contain" alt="preview" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                <div className="flex flex-col">
                  <span className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1">New Scan Identified</span>
                  <h2 className="text-white text-3xl font-black tracking-tight">确认归档</h2>
                </div>
              </div>
              <button onClick={() => setView('main')} className="absolute top-8 right-8 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 active:scale-90 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">报告标题</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-4 text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={pendingReport.category_name}
                    onChange={e => setPendingReport({ ...pendingReport, category_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">关键器官</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-4 font-bold text-slate-800 appearance-none focus:outline-none"
                      value={pendingReport.target_organ}
                      onChange={e => setPendingReport({ ...pendingReport, target_organ: e.target.value as OrganKey })}
                    >
                      {Object.entries(ORGAN_MAP).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">检查日期</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-4 font-bold text-slate-800 focus:outline-none"
                      value={pendingReport.report_date}
                      onChange={e => setPendingReport({ ...pendingReport, report_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">初步结论</label>
                  <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                    <p className="text-sm font-bold text-blue-900 leading-relaxed italic">
                      "{pendingReport.diagnosis || '正在分析中...'}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 bg-white border-t border-slate-50">
              <button
                onClick={() => { saveRecord(pendingReport as MedicalRecord); setView('main'); }}
                className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black shadow-2xl shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
              >
                <Save className="w-6 h-6" /> 保存到健康云
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Family Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setIsPickerOpen(false)}>
          <div className="bg-white w-full max-w-xl rounded-t-[4rem] p-12 animate-in slide-in-from-bottom-20 duration-500 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-1.5 bg-slate-100 rounded-full mb-8"></div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight text-center">选择家庭成员</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 text-center">归档至个人健康档案</p>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-12">
              {familyMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setActiveMember(m); setIsPickerOpen(false); fileInputRef.current?.click(); }}
                  className="flex flex-col items-center gap-4 p-6 rounded-[2.5rem] border-2 border-slate-50 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-90 group"
                >
                  <div className="text-5xl group-hover:scale-110 transition-transform">{m.avatar}</div>
                  <span className="font-black text-slate-800 text-sm">{m.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsPickerOpen(false)}
              className="w-full bg-slate-100 text-slate-500 py-6 rounded-[2rem] font-black uppercase tracking-widest active:bg-slate-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* --- Persistent Bottom Nav --- */}
      <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-3xl border-t border-slate-100 pb-12 pt-4 px-10 flex justify-center z-50">
        <div className="flex w-full justify-between items-center max-w-lg relative">
          <NavItem icon={Users} label="Family" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={FileText} label="Archive" active={activeTab === 'archive'} onClick={() => setActiveTab('archive')} />

          <div className="w-20"></div> {/* Spacer for central button */}

          <NavItem icon={Activity} label="Care" active={activeTab === 'care'} onClick={() => setActiveTab('care')} />
          <NavItem icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />

          {/* Floating Action Button */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-16">
            <button
              onClick={() => setIsPickerOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 active:scale-90 text-white p-7 rounded-[2.5rem] shadow-2xl shadow-blue-500/50 transition-all border-[10px] border-white group"
            >
              <Camera className="w-9 h-9 group-active:scale-90 transition-transform" />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
