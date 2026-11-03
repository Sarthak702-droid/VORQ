import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  ArrowDownLeft, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck2,
  Layers,
  ArrowRight
} from 'lucide-react';

export const MaterialsManagement: React.FC = () => {
  const { 
    currentProject, 
    materialCatalog, 
    materialRequests, 
    purchaseOrders, 
    grns, 
    consumptions,
    addMaterialRequest,
    createGoodsReceipt,
    recordMaterialIssue,
    currentRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<'stock' | 'requests' | 'pos' | 'grns' | 'issues'>('stock');

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // New Request Form
  const [newRequest, setNewRequest] = useState({
    itemId: 'MAT-01',
    itemName: 'UltraTech Cement OPC 53 Grade',
    quantity: 200,
    uom: 'Bag (50kg)',
    costCode: '2020',
    requiredByDate: '2026-11-10',
    purpose: 'First floor beam deck pouring'
  });

  // GRN Form
  const [grnForm, setGrnForm] = useState({
    poId: purchaseOrders[0]?.id || '',
    qtyReceived: 100,
    challanNo: 'CH-99120',
    vehicleNo: 'OD-02-B-4412'
  });

  // Issue Form
  const [issueForm, setIssueForm] = useState({
    itemId: 'MAT-01',
    qty: 50,
    costCode: '2020',
    taskName: 'First floor slab casting'
  });

  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const item = materialCatalog.find(m => m.id === newRequest.itemId);
    addMaterialRequest({
      projectId: currentProject.id,
      costCode: newRequest.costCode,
      itemId: newRequest.itemId,
      itemName: item ? item.name : newRequest.itemName,
      quantity: Number(newRequest.quantity),
      uom: item ? item.uom : newRequest.uom,
      requiredByDate: newRequest.requiredByDate,
      requestedBy: 'Er. Alok Das (Site Engineer)',
      purpose: newRequest.purpose
    });
    setIsRequestModalOpen(false);
    setFeedback({ success: true, message: 'Material request submitted for procurement approval.' });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateGRN = (e: React.FormEvent) => {
    e.preventDefault();
    createGoodsReceipt(
      grnForm.poId,
      Number(grnForm.qtyReceived),
      grnForm.challanNo,
      grnForm.vehicleNo
    );
    setIsGRNModalOpen(false);
    setFeedback({ success: true, message: 'Goods receipt verified. Stock inventory incremented and recorded in ERP.' });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleIssueMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const res = recordMaterialIssue(
      issueForm.itemId,
      Number(issueForm.qty),
      issueForm.costCode,
      issueForm.taskName
    );
    if (res.success) {
      setIsIssueModalOpen(false);
    }
    setFeedback(res);
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-vorq-ink flex items-center gap-2">
            <Package className="w-6 h-6 text-vorq-primary" />
            Materials & Inventory Lifecycle
          </h1>
          <p className="text-xs text-vorq-slate mt-0.5">
            Strict accounting separation: Requested &ne; Ordered &ne; Received &ne; Stocked &ne; Consumed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['SiteEngineer', 'ProjectManager', 'Owner'].includes(currentRole) && (
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="px-3 py-1.5 bg-vorq-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Request</span>
            </button>
          )}

          {['Storekeeper', 'Owner'].includes(currentRole) && (
            <>
              <button
                onClick={() => setIsGRNModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
              >
                <Truck className="w-4 h-4" />
                <span>Receive GRN</span>
              </button>

              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition flex items-center gap-1.5 shadow-xs"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Issue to Task</span>
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-vorq border flex items-center gap-2 text-xs font-semibold ${
          feedback.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.success ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-vorq-border flex items-center gap-6 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 font-semibold transition border-b-2 whitespace-nowrap ${
            activeTab === 'stock' ? 'border-vorq-primary text-vorq-primary' : 'border-transparent text-vorq-slate hover:text-vorq-ink'
          }`}
        >
          Site Warehouse Stock ({materialCatalog.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 font-semibold transition border-b-2 whitespace-nowrap ${
            activeTab === 'requests' ? 'border-vorq-primary text-vorq-primary' : 'border-transparent text-vorq-slate hover:text-vorq-ink'
          }`}
        >
          Requests ({materialRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          className={`pb-3 font-semibold transition border-b-2 whitespace-nowrap ${
            activeTab === 'pos' ? 'border-vorq-primary text-vorq-primary' : 'border-transparent text-vorq-slate hover:text-vorq-ink'
          }`}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('grns')}
          className={`pb-3 font-semibold transition border-b-2 whitespace-nowrap ${
            activeTab === 'grns' ? 'border-vorq-primary text-vorq-primary' : 'border-transparent text-vorq-slate hover:text-vorq-ink'
          }`}
        >
          Goods Receipts GRN ({grns.length})
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`pb-3 font-semibold transition border-b-2 whitespace-nowrap ${
            activeTab === 'issues' ? 'border-vorq-primary text-vorq-primary' : 'border-transparent text-vorq-slate hover:text-vorq-ink'
          }`}
        >
          Consumption Issues ({consumptions.length})
        </button>
      </div>

      {/* Tab 1: Live Site Stock Balance */}
      {activeTab === 'stock' && (
        <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
          <div className="p-4 border-b border-vorq-border flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-vorq-ink">Physical Stock at Site Warehouse</h3>
              <p className="text-xs text-vorq-slate">Patia site inventory with real-time issue updates and reorder thresholds</p>
            </div>
            <span className="text-xs font-mono bg-blue-50 text-vorq-primary px-2 py-0.5 rounded border border-blue-200">
              WH-PATIA-01
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
              <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-3">Material Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">UOM</th>
                  <th className="py-2.5 px-3 text-right">Current Stock</th>
                  <th className="py-2.5 px-3 text-right">Reorder Threshold</th>
                  <th className="py-2.5 px-3 text-right">Avg Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Stock Valuation (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {materialCatalog.map((mat) => {
                  const isLow = mat.currentStock <= mat.reorderLevel;
                  const valuation = mat.currentStock * mat.averageRate;
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-semibold text-vorq-primary">{mat.code}</td>
                      <td className="py-3 px-3 font-semibold text-vorq-ink">{mat.name}</td>
                      <td className="py-3 px-3 text-slate-600">{mat.category}</td>
                      <td className="py-3 px-3 uppercase text-slate-500 font-medium">{mat.uom}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-tabular">
                        {mat.currentStock.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-500 font-tabular">
                        {mat.reorderLevel.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700 font-tabular">
                        ₹ {mat.averageRate.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-vorq-ink font-tabular">
                        ₹ {valuation.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {isLow ? 'Low Stock' : 'Adequate'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Material Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
              <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Request #</th>
                  <th className="py-2.5 px-3">Material Requested</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3">Cost Code</th>
                  <th className="py-2.5 px-3">Required By</th>
                  <th className="py-2.5 px-3">Requested By</th>
                  <th className="py-2.5 px-3">Purpose</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {materialRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-vorq-primary">{req.requestNo}</td>
                    <td className="py-3 px-3 font-medium text-vorq-ink">{req.itemName}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{req.quantity} {req.uom}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{req.costCode}</td>
                    <td className="py-3 px-3 text-slate-600">{req.requiredByDate}</td>
                    <td className="py-3 px-3 text-slate-600">{req.requestedBy}</td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{req.purpose}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        req.status === 'PO Issued' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Purchase Orders */}
      {activeTab === 'pos' && (
        <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
              <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">PO #</th>
                  <th className="py-2.5 px-3">Supplier / Vendor</th>
                  <th className="py-2.5 px-3">Items Ordered</th>
                  <th className="py-2.5 px-3">Cost Code</th>
                  <th className="py-2.5 px-3">Issued Date</th>
                  <th className="py-2.5 px-3">Delivery Date</th>
                  <th className="py-2.5 px-3 text-right">PO Total (₹ ex-tax)</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-vorq-primary">{po.poNo}</td>
                    <td className="py-3 px-3 font-medium text-vorq-ink">{po.vendorName}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {po.items.map(i => `${i.quantity} ${i.uom} ${i.itemName}`).join(', ')}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{po.costCode}</td>
                    <td className="py-3 px-3 text-slate-600">{po.issuedDate}</td>
                    <td className="py-3 px-3 text-slate-600">{po.deliveryDate}</td>
                    <td className="py-3 px-3 text-right font-bold text-vorq-ink font-tabular">
                      ₹ {po.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        po.status === 'Fulfilled' ? 'bg-green-100 text-green-800' :
                        po.status === 'Partially Received' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: GRNs */}
      {activeTab === 'grns' && (
        <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
              <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">GRN #</th>
                  <th className="py-2.5 px-3">Linked PO</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Challan & Vehicle</th>
                  <th className="py-2.5 px-3">Materials Received</th>
                  <th className="py-2.5 px-3">Receipt Date</th>
                  <th className="py-2.5 px-3">Received By</th>
                  <th className="py-2.5 px-3 text-right">Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {grns.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-vorq-primary">{grn.grnNo}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{grn.poNo}</td>
                    <td className="py-3 px-3 font-medium text-vorq-ink">{grn.vendorName}</td>
                    <td className="py-3 px-3 text-slate-600">{grn.challanNo} ({grn.vehicleNo})</td>
                    <td className="py-3 px-3 text-slate-800 font-medium">
                      {grn.items.map(i => `${i.quantityReceived} ${i.uom} ${i.itemName}`).join(', ')}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{grn.receivedDate}</td>
                    <td className="py-3 px-3 text-slate-600">{grn.receivedBy}</td>
                    <td className="py-3 px-3 text-right font-bold text-vorq-ink font-tabular">
                      ₹ {grn.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Material Consumption Issues */}
      {activeTab === 'issues' && (
        <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
              <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Issue Voucher</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Material Consumed</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Cost Code</th>
                  <th className="py-2.5 px-3">Task Executed</th>
                  <th className="py-2.5 px-3">Issued By</th>
                  <th className="py-2.5 px-3 text-right">Cost Charged (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {consumptions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-vorq-primary">{c.voucherNo}</td>
                    <td className="py-3 px-3 text-slate-600">{c.date}</td>
                    <td className="py-3 px-3 font-medium text-vorq-ink">{c.itemName}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{c.quantityConsumed} {c.uom}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{c.costCode}</td>
                    <td className="py-3 px-3 text-slate-600">{c.taskName}</td>
                    <td className="py-3 px-3 text-slate-600">{c.issuedBy}</td>
                    <td className="py-3 px-3 text-right font-bold text-vorq-ink font-tabular">
                      ₹ {c.totalCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Raise Material Request */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-vorq shadow-xl border border-vorq-border w-full max-w-md p-5 text-xs">
            <h3 className="text-base font-bold text-vorq-ink mb-1">Raise Site Material Request</h3>
            <p className="text-slate-500 mb-4">Request materials from procurement linked to project cost codes.</p>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Material</label>
                <select
                  value={newRequest.itemId}
                  onChange={(e) => {
                    const item = materialCatalog.find(m => m.id === e.target.value);
                    setNewRequest({
                      ...newRequest,
                      itemId: e.target.value,
                      itemName: item ? item.name : '',
                      uom: item ? item.uom : 'Nos'
                    });
                  }}
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg bg-slate-50"
                >
                  {materialCatalog.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.uom}) - Stock: {m.currentStock}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRequest.quantity}
                    onChange={(e) => setNewRequest({ ...newRequest, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Code</label>
                  <select
                    value={newRequest.costCode}
                    onChange={(e) => setNewRequest({ ...newRequest, costCode: e.target.value })}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg bg-slate-50"
                  >
                    <option value="2020">2020 - RCC Slabs and Beams</option>
                    <option value="2010">2010 - RCC Columns M25</option>
                    <option value="2030">2030 - Brick Masonry</option>
                    <option value="1030">1030 - Foundation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required On Site By</label>
                <input
                  type="date"
                  required
                  value={newRequest.requiredByDate}
                  onChange={(e) => setNewRequest({ ...newRequest, requiredByDate: e.target.value })}
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site Work Purpose</label>
                <input
                  type="text"
                  required
                  value={newRequest.purpose}
                  onChange={(e) => setNewRequest({ ...newRequest, purpose: e.target.value })}
                  placeholder="e.g. For casting first floor roof deck"
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-vorq-primary text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Receive Goods Receipt (GRN) */}
      {isGRNModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-vorq shadow-xl border border-vorq-border w-full max-w-md p-5 text-xs">
            <h3 className="text-base font-bold text-vorq-ink mb-1">Create Goods Receipt Note (GRN)</h3>
            <p className="text-slate-500 mb-4">Confirm physical delivery at site warehouse against open PO.</p>

            <form onSubmit={handleCreateGRN} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Purchase Order</label>
                <select
                  value={grnForm.poId}
                  onChange={(e) => setGrnForm({ ...grnForm, poId: e.target.value })}
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg bg-slate-50 font-mono"
                >
                  {purchaseOrders.map(p => (
                    <option key={p.id} value={p.id}>{p.poNo} - {p.vendorName} (₹{p.totalAmount.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity Received</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={grnForm.qtyReceived}
                    onChange={(e) => setGrnForm({ ...grnForm, qtyReceived: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Challan / Invoice #</label>
                  <input
                    type="text"
                    required
                    value={grnForm.challanNo}
                    onChange={(e) => setGrnForm({ ...grnForm, challanNo: e.target.value })}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Truck / Vehicle #</label>
                <input
                  type="text"
                  required
                  value={grnForm.vehicleNo}
                  onChange={(e) => setGrnForm({ ...grnForm, vehicleNo: e.target.value })}
                  placeholder="e.g. OD-02-AK-9812"
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGRNModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
                >
                  Confirm & Stock Materials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Issue Material to Site Task */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-vorq shadow-xl border border-vorq-border w-full max-w-md p-5 text-xs">
            <h3 className="text-base font-bold text-vorq-ink mb-1">Issue Material to Site Task</h3>
            <p className="text-slate-500 mb-4">Stock will be decremented and charged to cost code in ERP.</p>

            <form onSubmit={handleIssueMaterial} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select In-Stock Item</label>
                <select
                  value={issueForm.itemId}
                  onChange={(e) => setIssueForm({ ...issueForm, itemId: e.target.value })}
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg bg-slate-50"
                >
                  {materialCatalog.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.uom}) - In Stock: {m.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity to Issue</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={issueForm.qty}
                    onChange={(e) => setIssueForm({ ...issueForm, qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Cost Code</label>
                  <select
                    value={issueForm.costCode}
                    onChange={(e) => setIssueForm({ ...issueForm, costCode: e.target.value })}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg bg-slate-50"
                  >
                    <option value="2020">2020 - RCC Slabs and Beams</option>
                    <option value="2010">2010 - RCC Columns M25</option>
                    <option value="2030">2030 - Brick Masonry</option>
                    <option value="3010">3010 - Internal Plastering</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Executing Task Name</label>
                <input
                  type="text"
                  required
                  value={issueForm.taskName}
                  onChange={(e) => setIssueForm({ ...issueForm, taskName: e.target.value })}
                  placeholder="e.g. First floor roof slab casting"
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700"
                >
                  Record Consumption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
