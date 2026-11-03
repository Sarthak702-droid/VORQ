import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  HardHat, 
  Calendar, 
  CloudSun, 
  Camera, 
  AlertCircle, 
  Save, 
  Send, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  WifiOff, 
  Wifi,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { DailySiteReport } from '../../types';

export const SiteDailyReportView: React.FC = () => {
  const { 
    currentProject, 
    tasks, 
    dailyReports, 
    submitDailyReport, 
    saveDailyReportDraft, 
    isOnline, 
    offlineDraftsCount, 
    syncOfflineQueue 
  } = useApp();

  const [siteDate, setSiteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState<'Clear / Sunny' | 'Light Rain' | 'Heavy Rain / Monsoon' | 'Cloudy' | 'Extreme Heat'>('Clear / Sunny');
  const [temperature, setTemperature] = useState<string>('31°C');
  const [blockers, setBlockers] = useState<string>('');

  // Task progress state
  const [taskProgress, setTaskProgress] = useState<{ taskId: string; taskName: string; progressPercent: number; notes: string }[]>([
    { taskId: 'TSK-06', taskName: 'First floor RCC slab casting', progressPercent: 70, notes: 'Completed grid C-F pour' }
  ]);

  // Consumed materials state
  const [consumedMaterials, setConsumedMaterials] = useState<{ item: string; qty: number; uom: string; costCode: string }[]>([
    { item: 'UltraTech Cement OPC 53 Grade', qty: 120, uom: 'Bag (50kg)', costCode: '2020' },
    { item: 'Flyash Bricks 250mm', qty: 1600, uom: 'Nos', costCode: '2030' }
  ]);

  // Photo uploads
  const [photos, setPhotos] = useState<{ id: string; url: string; caption: string; timestamp: string }[]>([
    { id: '1', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600', caption: 'Slab reinforcement inspection before pouring', timestamp: '10:45 AM' },
    { id: '2', url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600', caption: 'Concrete pumping on 1st floor deck', timestamp: '01:15 PM' }
  ]);

  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  const handleAddTaskProgress = () => {
    setTaskProgress(prev => [
      ...prev,
      { taskId: 'TSK-07', taskName: 'Ground floor brick masonry outer wall', progressPercent: 45, notes: '' }
    ]);
  };

  const handleAddMaterial = () => {
    setConsumedMaterials(prev => [
      ...prev,
      { item: 'River Sand', qty: 180, uom: 'Cu.ft', costCode: '2030' }
    ]);
  };

  const handleSimulatePhotoUpload = () => {
    const newPhoto = {
      id: String(Date.now()),
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600',
      caption: `Field evidence capture - ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    setPhotos(prev => [...prev, newPhoto]);
  };

  const handleSaveDraft = () => {
    saveDailyReportDraft({
      projectId: currentProject.id,
      siteDate,
      weather,
      temperature,
      blockers,
      taskProgress,
      materialsConsumed: consumedMaterials,
      photos,
      submittedBy: 'Er. Alok Das (Site Engineer)'
    });
    setNotification({
      type: 'warning',
      message: 'Draft saved locally in device IndexedDB queue. Not yet submitted to server.'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = submitDailyReport({
      projectId: currentProject.id,
      siteDate,
      submittedBy: 'Er. Alok Das (Site Engineer)',
      weather,
      temperature,
      blockers,
      taskProgress,
      materialsReceived: [],
      materialsConsumed: consumedMaterials,
      photos
    });

    setNotification({
      type: isOnline ? 'success' : 'warning',
      message: result.message
    });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Field PWA Header */}
      <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-vorq-ink flex items-center gap-2">
              <HardHat className="w-6 h-6 text-vorq-primary" />
              Daily Site Progress Report
            </h1>
            {!isOnline ? (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                Offline Mode (Odisha Field Draft)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                <Wifi className="w-3.5 h-3.5 text-green-600" />
                Live Sync Active
              </span>
            )}
          </div>
          <p className="text-xs text-vorq-slate">
            Project: <strong className="text-slate-800">{currentProject.name}</strong> • Engineer: <strong className="text-slate-700">Er. Alok Das</strong>
          </p>
        </div>

        {/* Offline Queue Sync Indicator */}
        {offlineDraftsCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <div className="text-xs text-amber-800">
              <strong className="font-bold">{offlineDraftsCount}</strong> site draft(s) stored locally
            </div>
            {isOnline && (
              <button
                onClick={syncOfflineQueue}
                className="px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 transition"
              >
                Sync Now
              </button>
            )}
          </div>
        )}
      </div>

      {notification && (
        <div className={`p-4 rounded-vorq border flex items-center gap-2 text-xs font-medium animate-in fade-in ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-amber-50 border-amber-300 text-amber-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Form Formatted for Fast Field Entry */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Site Conditions */}
        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs space-y-4">
          <div className="text-xs font-bold text-vorq-slate uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Site & Weather Conditions
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Work</label>
              <input
                type="date"
                required
                value={siteDate}
                onChange={(e) => setSiteDate(e.target.value)}
                className="w-full px-3 py-2 border border-vorq-border rounded-lg text-xs font-medium touch-target"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weather on Site</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as any)}
                className="w-full px-3 py-2 border border-vorq-border rounded-lg text-xs bg-slate-50 font-medium touch-target"
              >
                <option value="Clear / Sunny">Clear / Sunny</option>
                <option value="Cloudy">Cloudy</option>
                <option value="Light Rain">Light Rain</option>
                <option value="Heavy Rain / Monsoon">Heavy Rain / Monsoon</option>
                <option value="Extreme Heat">Extreme Heat (&gt;38°C)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ambient Temperature</label>
              <input
                type="text"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g. 32°C"
                className="w-full px-3 py-2 border border-vorq-border rounded-lg text-xs font-medium touch-target"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Site Blockers, Delays or Obstructions
            </label>
            <textarea
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="e.g. Transit mixer delayed 45 mins due to traffic on Patia square; power outage handled by DG generator."
              className="w-full px-3 py-2 border border-vorq-border rounded-lg text-xs focus:ring-1 focus:ring-vorq-primary"
            />
          </div>
        </div>

        {/* Section 2: Task Physical Progress */}
        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="text-xs font-bold text-vorq-slate uppercase tracking-wider">
              2. Tasks Executed Today
            </div>
            <button
              type="button"
              onClick={handleAddTaskProgress}
              className="text-xs font-semibold text-vorq-primary hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="space-y-3">
            {taskProgress.map((tp, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Task Name</label>
                    <input
                      type="text"
                      value={tp.taskName}
                      onChange={(e) => {
                        const updated = [...taskProgress];
                        updated[idx].taskName = e.target.value;
                        setTaskProgress(updated);
                      }}
                      className="w-full px-3 py-2 border border-vorq-border rounded-lg text-xs font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Cumulative Progress ({tp.progressPercent}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tp.progressPercent}
                      onChange={(e) => {
                        const updated = [...taskProgress];
                        updated[idx].progressPercent = Number(e.target.value);
                        setTaskProgress(updated);
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-vorq-primary"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={tp.notes}
                    onChange={(e) => {
                      const updated = [...taskProgress];
                      updated[idx].notes = e.target.value;
                      setTaskProgress(updated);
                    }}
                    placeholder="Specific execution notes (e.g. 42 cum concrete poured, vibrated and cured)..."
                    className="w-full px-3 py-1.5 border border-vorq-border rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Material Consumed on Site */}
        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="text-xs font-bold text-vorq-slate uppercase tracking-wider">
              3. Materials Consumed on Site
            </div>
            <button
              type="button"
              onClick={handleAddMaterial}
              className="text-xs font-semibold text-vorq-primary hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Material</span>
            </button>
          </div>

          <div className="space-y-2">
            {consumedMaterials.map((mat, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 border border-slate-100 rounded-lg bg-slate-50/40">
                <div className="flex-1 w-full sm:w-auto">
                  <span className="text-xs font-medium text-vorq-ink">{mat.item}</span>
                  <span className="text-[11px] text-slate-400 block font-mono">Cost Code: {mat.costCode}</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <input
                    type="number"
                    min="1"
                    value={mat.qty}
                    onChange={(e) => {
                      const updated = [...consumedMaterials];
                      updated[idx].qty = Number(e.target.value);
                      setConsumedMaterials(updated);
                    }}
                    className="w-24 px-2 py-1 border border-vorq-border rounded text-xs font-bold text-right"
                  />
                  <span className="text-xs font-semibold text-slate-600 w-20">{mat.uom}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Site Evidence Photos */}
        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="text-xs font-bold text-vorq-slate uppercase tracking-wider">
              4. Evidence Photos & Field Verification
            </div>
            <button
              type="button"
              onClick={handleSimulatePhotoUpload}
              className="px-3 py-1.5 bg-blue-50 text-vorq-primary border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5 touch-target"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Site Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="border border-vorq-border rounded-lg overflow-hidden bg-slate-50">
                <img src={photo.url} alt={photo.caption} className="w-full h-36 object-cover" />
                <div className="p-2.5">
                  <p className="text-xs font-medium text-vorq-ink line-clamp-1">{photo.caption}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{photo.timestamp} • Geotagged</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Bar (Glove-friendly, large 44px touch targets) */}
        <div className="bg-white border border-vorq-border rounded-vorq p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Submissions are audited and lock daily muster records to ERP general ledger.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex-1 sm:flex-none px-5 py-3 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition flex items-center justify-center gap-2 touch-target"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Save Local Draft</span>
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-3 bg-vorq-primary text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xs touch-target"
            >
              <Send className="w-4 h-4" />
              <span>Submit Daily Report</span>
            </button>
          </div>
        </div>

      </form>

      {/* Previous Site Logs History */}
      <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
        <h3 className="text-sm font-bold text-vorq-ink mb-3">Recent Submitted Site Logs</h3>
        <div className="divide-y divide-slate-100">
          {dailyReports.map((report) => (
            <div key={report.id} className="py-3 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-vorq-ink">{report.siteDate}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {report.id}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                    {report.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{report.blockers || 'No blockers reported'}</p>
                <div className="text-[11px] text-slate-400 mt-1">
                  Submitted by {report.submittedBy} • {report.createdAt}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
