// VORQ Core Domain Types & Contracts

export type UserRole = 
  | 'Owner'
  | 'ProjectManager'
  | 'QuantitySurveyor'
  | 'SiteEngineer'
  | 'Storekeeper'
  | 'ProcurementOfficer'
  | 'Accountant'
  | 'Subcontractor';

export interface CompanyTenant {
  id: string;
  name: string;
  shortName: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  currency: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  clientName: string;
  location: string;
  contractValue: number; // ex-tax
  budget: number;        // ex-tax approved baseline
  spentCost: number;     // actual posted cost
  committedCost: number; // open POs
  status: 'In Progress' | 'On Track' | 'Delayed' | 'Planning' | 'Completed';
  projectManager: string;
  startDate: string;
  targetDate: string;
  completionPercent: number;
  assignedRoles: {
    userId: string;
    userName: string;
    role: UserRole;
  }[];
}

export interface CostCode {
  id: string;
  code: string;
  name: string;
  category: 'Substructure' | 'Superstructure' | 'Finishes' | 'MEP' | 'Prelims & Overheads';
  allocatedBudget: number;
  spentCost: number;
  committedCost: number;
}

export interface BOQItem {
  id: string;
  costCode: string;
  description: string;
  uom: string; // 'cum' | 'sqft' | 'rft' | 'ton' | 'bag' | 'nos' | 'sqm'
  quantity: number;
  materialRate: number;
  labourRate: number;
  totalRate: number;
  amount: number;
}

export interface BOQRevision {
  id: string;
  projectId: string;
  revisionNumber: string; // e.g. "REV-1.0 (Baseline)", "REV-1.1 (Draft)"
  status: 'Draft' | 'Under Review' | 'Approved Baseline';
  baselineHash: string;
  approvedAt: string | null;
  approvedBy: string | null;
  totalAmount: number;
  items: BOQItem[];
}

export interface TaskSchedule {
  id: string;
  projectId: string;
  name: string;
  costCode: string;
  startDate: string;
  endDate: string;
  progressPercent: number;
  dependencies: string[];
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
}

export interface DailySiteReport {
  id: string;
  projectId: string;
  siteDate: string;
  submittedBy: string;
  weather: 'Clear / Sunny' | 'Light Rain' | 'Heavy Rain / Monsoon' | 'Cloudy' | 'Extreme Heat';
  temperature: string;
  blockers: string;
  taskProgress: {
    taskId: string;
    taskName: string;
    progressPercent: number;
    notes: string;
  }[];
  materialsReceived: {
    item: string;
    qty: number;
    uom: string;
    supplier: string;
  }[];
  materialsConsumed: {
    item: string;
    qty: number;
    uom: string;
    costCode: string;
  }[];
  photos: {
    id: string;
    url: string;
    caption: string;
    timestamp: string;
  }[];
  status: 'draft' | 'pending_sync' | 'synced';
  offlineDraftId?: string;
  createdAt: string;
}

export interface LabourMusterEntry {
  trade: string;
  workerCount: number;
  dailyRate: number;
  shiftHours: number;
  totalWages: number;
  costCode: string;
}

export interface DailyLabourMuster {
  id: string;
  projectId: string;
  date: string;
  submittedBy: string;
  entries: LabourMusterEntry[];
  totalWages: number;
  totalWorkers: number;
  status: 'Submitted' | 'Verified' | 'Amended';
  linkedCostCode: string;
  auditNote?: string;
}

export interface MaterialItem {
  id: string;
  code: string;
  name: string;
  category: 'Cement' | 'Steel' | 'Aggregates & Sand' | 'Bricks & Blocks' | 'Plumbing & MEP' | 'Finishes';
  uom: string;
  currentStock: number;
  reorderLevel: number;
  averageRate: number;
}

export interface MaterialRequest {
  id: string;
  requestNo: string;
  projectId: string;
  costCode: string;
  itemId: string;
  itemName: string;
  quantity: number;
  uom: string;
  requiredByDate: string;
  requestedBy: string;
  purpose: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'PO Issued' | 'Rejected';
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  projectId: string;
  vendorName: string;
  vendorGSTIN: string;
  requestId?: string;
  costCode: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    totalAmount: number;
  }[];
  totalAmount: number; // ex-tax
  status: 'Draft' | 'Issued' | 'Partially Received' | 'Fulfilled' | 'Cancelled';
  issuedDate: string;
  deliveryDate: string;
  paymentTerms: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNo: string;
  poId: string;
  poNo: string;
  projectId: string;
  vendorName: string;
  challanNo: string;
  items: {
    itemId: string;
    itemName: string;
    quantityReceived: number;
    uom: string;
    unitPrice: number;
    totalAmount: number;
  }[];
  totalAmount: number;
  receivedDate: string;
  receivedBy: string;
  vehicleNo: string;
  status: 'Verified & Stocked';
}

export interface MaterialConsumption {
  id: string;
  voucherNo: string;
  projectId: string;
  costCode: string;
  taskName: string;
  itemId: string;
  itemName: string;
  quantityConsumed: number;
  uom: string;
  unitCost: number;
  totalCost: number;
  date: string;
  issuedBy: string;
}

export interface SubcontractAgreement {
  id: string;
  contractNo: string;
  projectId: string;
  subcontractorName: string;
  trade: string;
  scopeOfWork: string;
  contractValue: number;
  retentionPercent: number; // typically 5%
  advanceAmount: number;
  advanceRecovered: number;
  status: 'Active' | 'Under Review' | 'Completed';
  startDate: string;
}

export interface SubcontractBill {
  id: string;
  billNo: string;
  agreementId: string;
  contractNo: string;
  projectId: string;
  subcontractorName: string;
  period: string;
  cumulativeMeasured: number;
  previousCertified: number;
  currentGrossMeasured: number;
  retentionDeduction: number;
  advanceRecoveryDeduction: number;
  otherDeductions: number;
  netPayable: number;
  status: 'Submitted' | 'Verified' | 'Approved' | 'Invoiced' | 'Paid';
  linkedPurchaseInvoiceNo?: string;
  submittedDate: string;
}

export interface ClientInvoice {
  id: string;
  invoiceNo: string;
  projectId: string;
  milestoneTitle: string;
  contractReference: string;
  grossAmount: number;
  gstAmount: number; // 18% GST typical
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  status: 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue';
  paidAmount: number;
  agingDays: number;
  erpSalesInvoiceRef: string;
}

export interface ApprovalItem {
  id: string;
  type: 'Material Request' | 'Purchase Order' | 'Subcontract Bill' | 'BOQ Revision' | 'Site Daily Report';
  referenceNo: string;
  projectId: string;
  projectName: string;
  title: string;
  requestedBy: string;
  requestedAt: string;
  amount: number | null;
  budgetImpact: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  auditReason?: string;
}

export interface SourceDocumentDrilldown {
  voucherType: string;
  voucherNo: string;
  date: string;
  projectId: string;
  costCode: string;
  party: string;
  amount: number;
  status: string;
  description: string;
}
