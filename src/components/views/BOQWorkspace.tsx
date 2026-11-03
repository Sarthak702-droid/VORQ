import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Plus, 
  Lock, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  FileCheck2
} from 'lucide-react';
import { BOQItem } from '../../types';

export const BOQWorkspace: React.FC = () => {
  const { currentProject, boqRevisions, approveBOQRevision, addBOQItem, currentRole } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCostCode, setSelectedCostCode] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form state for adding new BOQ item
  const [newItem, setNewItem] = useState({
    costCode: '2010',
    description: '',
    uom: 'cum',
    quantity: 10,
    materialRate: 4500,
    labourRate: 1200
  });

  const projectBOQ = boqRevisions.find(b => b.projectId === currentProject.id) || boqRevisions[0];

  const filteredItems = projectBOQ.items.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.costCode.includes(searchQuery);
    const matchesCode = selectedCostCode === 'All' || item.costCode.startsWith(selectedCostCode);
    return matchesSearch && matchesCode;
  });

  const totalBOQAmount = projectBOQ.items.reduce((sum, item) => sum + item.amount, 0);
  const isBaselineLocked = projectBOQ.status === 'Approved Baseline';

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.description) return;

    addBOQItem({
      costCode: newItem.costCode,
      description: newItem.description,
      uom: newItem.uom,
      quantity: Number(newItem.quantity),
      materialRate: Number(newItem.materialRate),
      labourRate: Number(newItem.labourRate),
      totalRate: Number(newItem.materialRate) + Number(newItem.labourRate)
    });

    setNewItem({
      costCode: '2010',
      description: '',
      uom: 'cum',
      quantity: 10,
      materialRate: 4500,
      labourRate: 1200
    });
    setIsAddModalOpen(false);
  };

  const exportBOQToCSV = () => {
    const headers = ['Cost Code', 'Description', 'UOM', 'Quantity', 'Material Rate (₹)', 'Labour Rate (₹)', 'Unit Rate (₹)', 'Total Amount (₹)'];
    const rows = projectBOQ.items.map(item => [
      item.costCode,
      `"${item.description.replace(/"/g, '""')}"`,
      item.uom,
      item.quantity,
      item.materialRate,
      item.labourRate,
      item.totalRate,
      item.amount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BOQ_${currentProject.code}_${projectBOQ.revisionNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header with Baseline Status */}
      <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-vorq-ink">
              Bill of Quantities (BOQ)
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-vorq-primary border border-blue-200 font-mono">
              {projectBOQ.revisionNumber}
            </span>
            {isBaselineLocked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                <Lock className="w-3 h-3 text-green-600" />
                Baseline Locked
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Draft Revision
              </span>
            )}
          </div>
          <p className="text-xs text-vorq-slate">
            Project: <strong className="text-slate-800">{currentProject.name}</strong> • Baseline Hash: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700">{projectBOQ.baselineHash}</code>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportBOQToCSV}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition flex items-center gap-1.5 border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {['Owner', 'QuantitySurveyor'].includes(currentRole) && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition flex items-center gap-1.5 border border-slate-200"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Schedule</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-1.5 bg-vorq-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </>
          )}

          {!isBaselineLocked && ['Owner', 'QuantitySurveyor'].includes(currentRole) && (
            <button
              onClick={() => approveBOQRevision(projectBOQ.id, 'Siddharth Patnaik')}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Lock as Baseline</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white border border-vorq-border rounded-vorq p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, description or cost code..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-vorq-border rounded-lg text-xs text-vorq-ink focus:outline-none focus:ring-1 focus:ring-vorq-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Stage:</span>
          <select
            value={selectedCostCode}
            onChange={(e) => setSelectedCostCode(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-vorq-border rounded-lg text-xs font-medium text-vorq-ink focus:outline-none"
          >
            <option value="All">All Stages</option>
            <option value="10">1000 - Substructure</option>
            <option value="20">2000 - Superstructure</option>
            <option value="30">3000 - Finishes</option>
            <option value="40">4000 - MEP</option>
          </select>
        </div>
      </div>

      {/* BOQ Data Table */}
      <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
            <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Item #</th>
                <th className="py-2.5 px-3">Cost Code</th>
                <th className="py-2.5 px-3 max-w-xs">Item Description</th>
                <th className="py-2.5 px-3">UOM</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Material (₹)</th>
                <th className="py-2.5 px-3 text-right">Labour (₹)</th>
                <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-mono font-bold text-vorq-primary bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                      {item.costCode}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-vorq-ink max-w-md">
                    {item.description}
                  </td>
                  <td className="py-3 px-3 uppercase text-slate-600 font-semibold">{item.uom}</td>
                  <td className="py-3 px-3 text-right font-tabular font-medium text-slate-800">
                    {item.quantity.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-tabular text-slate-600">
                    ₹ {item.materialRate.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-tabular text-slate-600">
                    ₹ {item.labourRate.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-tabular font-semibold text-slate-900">
                    ₹ {item.totalRate.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-tabular font-bold text-vorq-ink whitespace-nowrap">
                    ₹ {item.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-vorq-border font-bold">
              <tr>
                <td colSpan={8} className="py-3 px-3 text-right uppercase text-vorq-slate">
                  Total Approved BOQ Baseline (Ex-Tax):
                </td>
                <td className="py-3 px-3 text-right text-vorq-primary text-sm font-tabular whitespace-nowrap">
                  ₹ {totalBOQAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-vorq shadow-xl border border-vorq-border w-full max-w-lg p-5">
            <h3 className="text-base font-bold text-vorq-ink mb-1">Add BOQ Item to Draft</h3>
            <p className="text-xs text-vorq-slate mb-4">Changes to approved baseline require formal change order verification.</p>
            
            <form onSubmit={handleAddNewItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cost Code</label>
                <select
                  value={newItem.costCode}
                  onChange={(e) => setNewItem({ ...newItem, costCode: e.target.value })}
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg bg-slate-50"
                >
                  <option value="1010">1010 - Earthwork excavation</option>
                  <option value="1020">1020 - PCC 1:4:8 Bed</option>
                  <option value="1030">1030 - RCC Footings</option>
                  <option value="2010">2010 - RCC Columns M25</option>
                  <option value="2020">2020 - RCC Slabs and Beams</option>
                  <option value="2030">2030 - Brick masonry 250mm</option>
                  <option value="3010">3010 - Internal Plastering</option>
                  <option value="4010">4010 - Electrical Conduits</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Description</label>
                <textarea
                  required
                  rows={2}
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="e.g. M25 Grade RMC with boom placer including vibrating..."
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg focus:outline-none focus:ring-1 focus:ring-vorq-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={newItem.uom}
                    onChange={(e) => setNewItem({ ...newItem, uom: e.target.value })}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg bg-slate-50"
                  >
                    <option value="cum">cum (Cubic Metre)</option>
                    <option value="sqm">sqm (Square Metre)</option>
                    <option value="sqft">sqft (Square Feet)</option>
                    <option value="rft">rft (Running Feet)</option>
                    <option value="ton">ton (Metric Tonne)</option>
                    <option value="bag">bag (50kg Bag)</option>
                    <option value="nos">nos (Numbers)</option>
                    <option value="point">point (Electrical Point)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Material Unit Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.materialRate}
                    onChange={(e) => setNewItem({ ...newItem, materialRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Labour Unit Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.labourRate}
                    onChange={(e) => setNewItem({ ...newItem, labourRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs font-semibold">
                <span>Calculated Item Total:</span>
                <span className="text-vorq-primary font-bold text-sm">
                  ₹ {(newItem.quantity * (newItem.materialRate + newItem.labourRate)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-vorq-primary text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-vorq shadow-xl border border-vorq-border w-full max-w-md p-5 text-xs">
            <h3 className="text-base font-bold text-vorq-ink mb-1">Import BOQ Schedule</h3>
            <p className="text-slate-500 mb-4">Upload standardized CSV with CostCode, Description, UOM, Qty, MaterialRate, LabourRate.</p>
            
            <div className="border-2 border-dashed border-vorq-border rounded-lg p-6 text-center hover:bg-slate-50 transition cursor-pointer">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Click or drag CSV file to upload</p>
              <p className="text-[11px] text-slate-400 mt-1">Accepts UTF-8 encoded .csv up to 5MB</p>
            </div>

            <div className="mt-4 p-3 bg-blue-50 text-slate-700 rounded-lg text-[11px] space-y-1">
              <div className="font-semibold text-vorq-primary">Import Validation Rules:</div>
              <div>• Duplicate cost codes are flagged before insert</div>
              <div>• Strict UOM matching against master catalog</div>
              <div>• All amounts computed with integer decimal precision</div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
