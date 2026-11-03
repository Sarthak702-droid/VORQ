import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, 
  CompanyTenant, 
  Project, 
  CostCode, 
  BOQRevision, 
  BOQItem,
  TaskSchedule, 
  DailySiteReport, 
  DailyLabourMuster, 
  MaterialItem, 
  MaterialRequest, 
  PurchaseOrder, 
  GoodsReceiptNote, 
  MaterialConsumption, 
  SubcontractAgreement, 
  SubcontractBill, 
  ClientInvoice, 
  ApprovalItem,
  SourceDocumentDrilldown
} from '../types';
import { 
  initialTenant, 
  initialProjects, 
  initialCostCodes, 
  initialBOQRevisions, 
  initialTasks, 
  initialMaterialCatalog, 
  initialDailyReports, 
  initialLabourMusters, 
  initialMaterialRequests, 
  initialPurchaseOrders, 
  initialGRNs, 
  initialConsumptions, 
  initialSubcontracts, 
  initialSubcontractBills, 
  initialClientInvoices, 
  initialApprovals,
  initialDrilldownLedger
} from '../data/mockDatabase';

interface AppContextType {
  tenant: CompanyTenant;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  projects: Project[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  currentProject: Project;
  costCodes: CostCode[];
  tasks: TaskSchedule[];
  
  // BOQ
  boqRevisions: BOQRevision[];
  approveBOQRevision: (revId: string, approverName: string) => void;
  addBOQItem: (item: Omit<BOQItem, 'id' | 'amount'>) => void;
  
  // Site & Offline PWA
  isOnline: boolean;
  toggleOnlineStatus: () => void;
  dailyReports: DailySiteReport[];
  offlineDraftsCount: number;
  saveDailyReportDraft: (report: Partial<DailySiteReport>) => void;
  submitDailyReport: (report: Omit<DailySiteReport, 'id' | 'createdAt' | 'status'>) => { success: boolean; message: string };
  syncOfflineQueue: () => Promise<void>;
  
  // Labour
  labourMusters: DailyLabourMuster[];
  submitLabourMuster: (muster: Omit<DailyLabourMuster, 'id' | 'status'>) => { success: boolean; message: string };
  
  // Materials
  materialCatalog: MaterialItem[];
  materialRequests: MaterialRequest[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceiptNote[];
  consumptions: MaterialConsumption[];
  addMaterialRequest: (req: Omit<MaterialRequest, 'id' | 'requestNo' | 'status' | 'createdAt'>) => void;
  createPurchaseOrderFromRequest: (reqId: string, vendorName: string, unitPrice: number) => void;
  createGoodsReceipt: (poId: string, qtyReceived: number, challanNo: string, vehicleNo: string) => void;
  recordMaterialIssue: (itemId: string, qty: number, costCode: string, taskName: string) => { success: boolean; message: string };
  
  // Subcontracts
  subcontracts: SubcontractAgreement[];
  subcontractBills: SubcontractBill[];
  submitSubcontractBill: (bill: Omit<SubcontractBill, 'id' | 'billNo' | 'status'>) => void;
  approveSubcontractBill: (billId: string) => void;
  
  // Finance & Client Billing
  clientInvoices: ClientInvoice[];
  recordClientInvoicePayment: (invoiceId: string, amount: number) => void;
  
  // Approvals
  approvals: ApprovalItem[];
  handleApprovalAction: (approvalId: string, action: 'Approve' | 'Reject', reason?: string) => void;
  
  // Drilldown
  drilldownLedger: SourceDocumentDrilldown[];
  activeDrilldownModal: string | null;
  setActiveDrilldownModal: (category: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant] = useState<CompanyTenant>(initialTenant);
  const [currentRole, setCurrentRole] = useState<UserRole>('Owner');
  const [projects] = useState<Project[]>(initialProjects);
  const [currentProjectId, setCurrentProjectId] = useState<string>('PRJ-001');
  const [costCodes] = useState<CostCode[]>(initialCostCodes);
  const [tasks] = useState<TaskSchedule[]>(initialTasks);

  // Network State (Simulate poor mobile connectivity on site)
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineDrafts, setOfflineDrafts] = useState<DailySiteReport[]>(() => {
    try {
      const saved = localStorage.getItem('vorq_offline_drafts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // BOQ Revisions
  const [boqRevisions, setBOQRevisions] = useState<BOQRevision[]>(initialBOQRevisions);

  // Operations
  const [dailyReports, setDailyReports] = useState<DailySiteReport[]>(initialDailyReports);
  const [labourMusters, setLabourMusters] = useState<DailyLabourMuster[]>(initialLabourMusters);
  
  // Materials
  const [materialCatalog, setMaterialCatalog] = useState<MaterialItem[]>(initialMaterialCatalog);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>(initialMaterialRequests);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [grns, setGRNs] = useState<GoodsReceiptNote[]>(initialGRNs);
  const [consumptions, setConsumptions] = useState<MaterialConsumption[]>(initialConsumptions);

  // Subcontracts
  const [subcontracts] = useState<SubcontractAgreement[]>(initialSubcontracts);
  const [subcontractBills, setSubcontractBills] = useState<SubcontractBill[]>(initialSubcontractBills);

  // Client Invoices
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>(initialClientInvoices);

  // Approvals & Ledger
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals);
  const [drilldownLedger, setDrilldownLedger] = useState<SourceDocumentDrilldown[]>(initialDrilldownLedger);
  const [activeDrilldownModal, setActiveDrilldownModal] = useState<string | null>(null);

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  // Save offline drafts to localStorage
  useEffect(() => {
    localStorage.setItem('vorq_offline_drafts', JSON.stringify(offlineDrafts));
  }, [offlineDrafts]);

  const toggleOnlineStatus = () => {
    setIsOnline(prev => !prev);
  };

  // BOQ Functions
  const approveBOQRevision = (revId: string, approverName: string) => {
    setBOQRevisions(prev => prev.map(rev => {
      if (rev.id === revId) {
        return {
          ...rev,
          status: 'Approved Baseline',
          approvedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          approvedBy: approverName,
          baselineHash: 'bl_' + Math.random().toString(36).substring(2, 12),
        };
      }
      return rev;
    }));
  };

  const addBOQItem = (newItem: Omit<BOQItem, 'id' | 'amount'>) => {
    const itemAmount = newItem.quantity * newItem.totalRate;
    const itemWithId: BOQItem = {
      ...newItem,
      id: `BOQ-${Date.now()}`,
      amount: itemAmount
    };

    setBOQRevisions(prev => prev.map(rev => {
      if (rev.projectId === currentProjectId) {
        return {
          ...rev,
          totalAmount: rev.totalAmount + itemAmount,
          items: [...rev.items, itemWithId]
        };
      }
      return rev;
    }));
  };

  // Daily Site Report
  const saveDailyReportDraft = (reportDraft: Partial<DailySiteReport>) => {
    const draft: DailySiteReport = {
      id: `DRAFT-${Date.now()}`,
      projectId: currentProjectId,
      siteDate: reportDraft.siteDate || new Date().toISOString().split('T')[0],
      submittedBy: reportDraft.submittedBy || 'Site Engineer',
      weather: reportDraft.weather || 'Clear / Sunny',
      temperature: reportDraft.temperature || '31°C',
      blockers: reportDraft.blockers || '',
      taskProgress: reportDraft.taskProgress || [],
      materialsReceived: reportDraft.materialsReceived || [],
      materialsConsumed: reportDraft.materialsConsumed || [],
      photos: reportDraft.photos || [],
      status: 'draft',
      offlineDraftId: `local-draft-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    setOfflineDrafts(prev => [draft, ...prev]);
  };

  const submitDailyReport = (reportData: Omit<DailySiteReport, 'id' | 'createdAt' | 'status'>) => {
    if (!isOnline) {
      // Offline mode: save as pending sync
      const pendingReport: DailySiteReport = {
        ...reportData,
        id: `OFFLINE-${Date.now()}`,
        status: 'pending_sync',
        offlineDraftId: `offline-${Date.now()}`,
        createdAt: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      };
      setOfflineDrafts(prev => [pendingReport, ...prev]);
      return { success: true, message: 'Saved on device in Offline Queue. Will sync when online.' };
    }

    const newReport: DailySiteReport = {
      ...reportData,
      id: `DSR-${Date.now()}`,
      status: 'synced',
      createdAt: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setDailyReports(prev => [newReport, ...prev]);
    return { success: true, message: 'Daily Site Report submitted and synchronized with server.' };
  };

  const syncOfflineQueue = async () => {
    if (!isOnline || offlineDrafts.length === 0) return;

    // Simulate async server sync
    const syncedReports = offlineDrafts.map(draft => ({
      ...draft,
      id: `DSR-SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'synced' as const,
      createdAt: new Date().toLocaleString('en-IN')
    }));

    setDailyReports(prev => [...syncedReports, ...prev]);
    setOfflineDrafts([]);
  };

  // Labour Muster
  const submitLabourMuster = (musterData: Omit<DailyLabourMuster, 'id' | 'status'>) => {
    // Check duplicate-date protection
    const existing = labourMusters.find(m => m.projectId === musterData.projectId && m.date === musterData.date);
    if (existing) {
      return { 
        success: false, 
        message: `A labour muster for site date ${musterData.date} already exists (ID: ${existing.id}). Use authorized amendment workflow.` 
      };
    }

    const newMuster: DailyLabourMuster = {
      ...musterData,
      id: `LBR-${musterData.date}`,
      status: 'Verified',
      auditNote: `Submitted by ${musterData.submittedBy} on ${new Date().toLocaleDateString('en-IN')}`
    };

    setLabourMusters(prev => [newMuster, ...prev]);

    // Record source document for financial audit trail
    const ledgerEntry: SourceDocumentDrilldown = {
      voucherType: 'Labour Muster',
      voucherNo: newMuster.id,
      date: musterData.date,
      projectId: musterData.projectId,
      costCode: musterData.linkedCostCode,
      party: `Site Crew (${musterData.totalWorkers} workers)`,
      amount: musterData.totalWages,
      status: 'Verified for Wage Payout',
      description: `Daily muster wages across ${musterData.entries.length} trades`
    };
    setDrilldownLedger(prev => [ledgerEntry, ...prev]);

    return { success: true, message: 'Labour muster logged and verified. Wage costing allocated to cost code.' };
  };

  // Materials Lifecycle
  const addMaterialRequest = (req: Omit<MaterialRequest, 'id' | 'requestNo' | 'status' | 'createdAt'>) => {
    const newReq: MaterialRequest = {
      ...req,
      id: `MR-${Date.now()}`,
      requestNo: `MR-2026-00${materialRequests.length + 43}`,
      status: 'Pending Approval',
      createdAt: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMaterialRequests(prev => [newReq, ...prev]);

    // Add to approval inbox
    const approval: ApprovalItem = {
      id: `APP-MR-${Date.now()}`,
      type: 'Material Request',
      referenceNo: newReq.requestNo,
      projectId: req.projectId,
      projectName: currentProject.name,
      title: `${req.quantity} ${req.uom} ${req.itemName}`,
      requestedBy: req.requestedBy,
      requestedAt: newReq.createdAt,
      amount: null,
      budgetImpact: `Target cost code: ${req.costCode} for ${req.purpose}`,
      status: 'Pending'
    };
    setApprovals(prev => [approval, ...prev]);
  };

  const createPurchaseOrderFromRequest = (reqId: string, vendorName: string, unitPrice: number) => {
    const req = materialRequests.find(r => r.id === reqId);
    if (!req) return;

    const total = req.quantity * unitPrice;
    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      poNo: `PO-UI-2026-0${purchaseOrders.length + 90}`,
      projectId: req.projectId,
      vendorName,
      vendorGSTIN: '21AAACV9812A1Z3',
      requestId: req.id,
      costCode: req.costCode,
      items: [
        { itemId: req.itemId, itemName: req.itemName, quantity: req.quantity, uom: req.uom, unitPrice, totalAmount: total }
      ],
      totalAmount: total,
      status: 'Issued',
      issuedDate: new Date().toISOString().split('T')[0],
      deliveryDate: req.requiredByDate,
      paymentTerms: '30 days net from verified GRN'
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    setMaterialRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'PO Issued' } : r));
  };

  const createGoodsReceipt = (poId: string, qtyReceived: number, challanNo: string, vehicleNo: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    const item = po.items[0];
    const totalAmount = qtyReceived * item.unitPrice;

    const newGRN: GoodsReceiptNote = {
      id: `GRN-${Date.now()}`,
      grnNo: `GRN-2026-00${grns.length + 93}`,
      poId: po.id,
      poNo: po.poNo,
      projectId: po.projectId,
      vendorName: po.vendorName,
      challanNo,
      items: [
        { itemId: item.itemId, itemName: item.itemName, quantityReceived: qtyReceived, uom: item.uom, unitPrice: item.unitPrice, totalAmount }
      ],
      totalAmount,
      receivedDate: new Date().toISOString().split('T')[0],
      receivedBy: 'Bipin Bihari Nayak (Storekeeper)',
      vehicleNo,
      status: 'Verified & Stocked'
    };

    setGRNs(prev => [newGRN, ...prev]);

    // Update physical site warehouse stock
    setMaterialCatalog(prev => prev.map(m => {
      if (m.id === item.itemId) {
        return { ...m, currentStock: m.currentStock + qtyReceived };
      }
      return m;
    }));

    // Update PO status
    setPurchaseOrders(prev => prev.map(p => {
      if (p.id === poId) {
        return { ...p, status: qtyReceived >= item.quantity ? 'Fulfilled' : 'Partially Received' };
      }
      return p;
    }));

    // Record in ledger
    const ledgerEntry: SourceDocumentDrilldown = {
      voucherType: 'Goods Receipt Note',
      voucherNo: newGRN.grnNo,
      date: newGRN.receivedDate,
      projectId: newGRN.projectId,
      costCode: po.costCode,
      party: po.vendorName,
      amount: totalAmount,
      status: 'Stock Ledger Updated',
      description: `${qtyReceived} ${item.uom} ${item.itemName} received on PO ${po.poNo}`
    };
    setDrilldownLedger(prev => [ledgerEntry, ...prev]);
  };

  const recordMaterialIssue = (itemId: string, qty: number, costCode: string, taskName: string) => {
    const item = materialCatalog.find(m => m.id === itemId);
    if (!item) return { success: false, message: 'Item not found in catalog.' };
    if (item.currentStock < qty) {
      return { 
        success: false, 
        message: `Insufficient site stock! Available: ${item.currentStock} ${item.uom}, requested: ${qty} ${item.uom}. (Negative inventory prevented)` 
      };
    }

    const totalCost = qty * item.averageRate;
    const consumption: MaterialConsumption = {
      id: `CNS-${Date.now()}`,
      voucherNo: `ISS-2026-00${consumptions.length + 82}`,
      projectId: currentProjectId,
      costCode,
      taskName,
      itemId: item.id,
      itemName: item.name,
      quantityConsumed: qty,
      uom: item.uom,
      unitCost: item.averageRate,
      totalCost,
      date: new Date().toISOString().split('T')[0],
      issuedBy: 'Storekeeper'
    };

    setConsumptions(prev => [consumption, ...prev]);
    setMaterialCatalog(prev => prev.map(m => m.id === itemId ? { ...m, currentStock: m.currentStock - qty } : m));

    return { success: true, message: `Issued ${qty} ${item.uom} of ${item.name} to cost code ${costCode}. Stock reduced.` };
  };

  // Subcontract Bills
  const submitSubcontractBill = (bill: Omit<SubcontractBill, 'id' | 'billNo' | 'status'>) => {
    const billId = `SB-${Date.now()}`;
    const billNo = `SC-BILL-2026-00${subcontractBills.length + 4}`;
    const newBill: SubcontractBill = {
      ...bill,
      id: billId,
      billNo,
      status: 'Submitted'
    };

    setSubcontractBills(prev => [newBill, ...prev]);

    // Send for approval
    const approval: ApprovalItem = {
      id: `APP-SC-${Date.now()}`,
      type: 'Subcontract Bill',
      referenceNo: billNo,
      projectId: bill.projectId,
      projectName: currentProject.name,
      title: `${bill.subcontractorName} - ${bill.period}`,
      requestedBy: 'Soumya Ranjan Mohanty (QS)',
      requestedAt: new Date().toLocaleString('en-IN'),
      amount: bill.netPayable,
      budgetImpact: `Gross measured: ₹${bill.currentGrossMeasured.toLocaleString('en-IN')}, 5% Retention: ₹${bill.retentionDeduction.toLocaleString('en-IN')}`,
      status: 'Pending'
    };
    setApprovals(prev => [approval, ...prev]);
  };

  const approveSubcontractBill = (billId: string) => {
    const bill = subcontractBills.find(b => b.id === billId);
    if (!bill) return;

    const pinvNo = `PINV-2026-10${subcontractBills.length + 50}`;
    setSubcontractBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'Approved', linkedPurchaseInvoiceNo: pinvNo } : b));

    // Ledger posting entry (ERPNext Purchase Invoice idempotency)
    const ledgerEntry: SourceDocumentDrilldown = {
      voucherType: 'Purchase Invoice',
      voucherNo: pinvNo,
      date: new Date().toISOString().split('T')[0],
      projectId: bill.projectId,
      costCode: '2020',
      party: bill.subcontractorName,
      amount: bill.netPayable,
      status: 'Posted in ERPNext GL',
      description: `Subcontract RA Bill ${bill.billNo} with 5% retention withheld`
    };
    setDrilldownLedger(prev => [ledgerEntry, ...prev]);
  };

  // Client Billing
  const recordClientInvoicePayment = (invoiceId: string, amount: number) => {
    setClientInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const newPaid = inv.paidAmount + amount;
        return {
          ...inv,
          paidAmount: newPaid,
          status: newPaid >= inv.totalAmount ? 'Paid' : 'Partially Paid'
        };
      }
      return inv;
    }));
  };

  // Approvals Action
  const handleApprovalAction = (approvalId: string, action: 'Approve' | 'Reject', reason?: string) => {
    const item = approvals.find(a => a.id === approvalId);
    if (!item) return;

    setApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status: action === 'Approve' ? 'Approved' : 'Rejected', auditReason: reason } : a));

    if (action === 'Approve') {
      if (item.type === 'Subcontract Bill') {
        const bill = subcontractBills.find(b => b.billNo === item.referenceNo);
        if (bill) approveSubcontractBill(bill.id);
      } else if (item.type === 'Material Request') {
        setMaterialRequests(prev => prev.map(r => r.requestNo === item.referenceNo ? { ...r, status: 'Approved' } : r));
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        tenant,
        currentRole,
        setCurrentRole,
        projects,
        currentProjectId,
        setCurrentProjectId,
        currentProject,
        costCodes,
        tasks,
        
        boqRevisions,
        approveBOQRevision,
        addBOQItem,
        
        isOnline,
        toggleOnlineStatus,
        dailyReports,
        offlineDraftsCount: offlineDrafts.length,
        saveDailyReportDraft,
        submitDailyReport,
        syncOfflineQueue,
        
        labourMusters,
        submitLabourMuster,
        
        materialCatalog,
        materialRequests,
        purchaseOrders,
        grns,
        consumptions,
        addMaterialRequest,
        createPurchaseOrderFromRequest,
        createGoodsReceipt,
        recordMaterialIssue,
        
        subcontracts,
        subcontractBills,
        submitSubcontractBill,
        approveSubcontractBill,
        
        clientInvoices,
        recordClientInvoicePayment,
        
        approvals,
        handleApprovalAction,
        
        drilldownLedger,
        activeDrilldownModal,
        setActiveDrilldownModal
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
