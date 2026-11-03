import { 
  CompanyTenant, 
  Project, 
  CostCode, 
  BOQRevision, 
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

export const initialTenant: CompanyTenant = {
  id: 'TENANT-001',
  name: 'Utkal Construction & Infrastructure Pvt. Ltd.',
  shortName: 'Utkal Infra',
  gstin: '21AAACU1234F1Z5',
  address: 'Plot 412/A, Infocity Avenue, Patia',
  city: 'Bhubaneswar',
  state: 'Odisha',
  currency: 'INR',
};

export const initialProjects: Project[] = [
  {
    id: 'PRJ-001',
    code: 'PRJ-NH-01',
    name: 'Niladri Heights - Duplex Villa Enclave',
    clientName: 'Niladri Housing Co-op Society',
    location: 'Patia Phase II, Bhubaneswar',
    contractValue: 18500000, // ₹1.85 Cr
    budget: 14800000,        // ₹1.48 Cr ex-tax approved baseline
    spentCost: 8940000,      // ₹89.4 Lakh actual posted
    committedCost: 2150000,  // ₹21.5 Lakh open POs
    status: 'In Progress',
    projectManager: 'Er. Debabrata Jena',
    startDate: '2026-03-15',
    targetDate: '2027-04-30',
    completionPercent: 58,
    assignedRoles: [
      { userId: 'usr-1', userName: 'Siddharth Patnaik', role: 'Owner' },
      { userId: 'usr-2', userName: 'Er. Debabrata Jena', role: 'ProjectManager' },
      { userId: 'usr-3', userName: 'Soumya Ranjan Mohanty', role: 'QuantitySurveyor' },
      { userId: 'usr-4', userName: 'Er. Alok Das', role: 'SiteEngineer' },
      { userId: 'usr-5', userName: 'Bipin Bihari Nayak', role: 'Storekeeper' },
      { userId: 'usr-6', userName: 'Ramesh Ch. Sahoo', role: 'Accountant' },
      { userId: 'usr-7', userName: 'Pradeep Swain', role: 'ProcurementOfficer' },
    ]
  },
  {
    id: 'PRJ-002',
    code: 'PRJ-MV-02',
    name: 'Mahanadi View Apartments (G+4)',
    clientName: 'Silver City Realty Consortium',
    location: 'CDA Sector 9, Cuttack',
    contractValue: 34000000, // ₹3.40 Cr
    budget: 27500000,        // ₹2.75 Cr
    spentCost: 14200000,     // ₹1.42 Cr
    committedCost: 4800000,  // ₹48 Lakh
    status: 'On Track',
    projectManager: 'Er. Pradipta Nayak',
    startDate: '2026-01-10',
    targetDate: '2027-08-31',
    completionPercent: 42,
    assignedRoles: [
      { userId: 'usr-1', userName: 'Siddharth Patnaik', role: 'Owner' },
      { userId: 'usr-8', userName: 'Er. Pradipta Nayak', role: 'ProjectManager' },
      { userId: 'usr-3', userName: 'Soumya Ranjan Mohanty', role: 'QuantitySurveyor' },
      { userId: 'usr-9', userName: 'Er. Tanmay Behera', role: 'SiteEngineer' },
      { userId: 'usr-6', userName: 'Ramesh Ch. Sahoo', role: 'Accountant' },
    ]
  },
  {
    id: 'PRJ-003',
    code: 'PRJ-LC-03',
    name: 'Lingaraj Commercial Annex',
    clientName: 'Odisha Retail Enterprises',
    location: 'Saheed Nagar, Bhubaneswar',
    contractValue: 11000000, // ₹1.10 Cr
    budget: 8800000,         // ₹88 Lakh
    spentCost: 7920000,      // ₹79.2 Lakh
    committedCost: 950000,   // ₹9.5 Lakh
    status: 'Delayed',
    projectManager: 'Er. Debabrata Jena',
    startDate: '2025-10-01',
    targetDate: '2026-12-15',
    completionPercent: 88,
    assignedRoles: [
      { userId: 'usr-1', userName: 'Siddharth Patnaik', role: 'Owner' },
      { userId: 'usr-2', userName: 'Er. Debabrata Jena', role: 'ProjectManager' },
      { userId: 'usr-4', userName: 'Er. Alok Das', role: 'SiteEngineer' },
      { userId: 'usr-6', userName: 'Ramesh Ch. Sahoo', role: 'Accountant' },
    ]
  }
];

export const initialCostCodes: CostCode[] = [
  { id: 'CC-1010', code: '1010', name: 'Earthwork excavation & backfilling in foundation', category: 'Substructure', allocatedBudget: 620000, spentCost: 615000, committedCost: 0 },
  { id: 'CC-1020', code: '1020', name: 'PCC 1:4:8 base bed beneath footings', category: 'Substructure', allocatedBudget: 480000, spentCost: 472000, committedCost: 0 },
  { id: 'CC-1030', code: '1030', name: 'RCC M25 Footings & Pedestals with TMT Rebars', category: 'Substructure', allocatedBudget: 1850000, spentCost: 1820000, committedCost: 0 },
  { id: 'CC-1040', code: '1040', name: 'Plinth beams and DPC damp proof course', category: 'Substructure', allocatedBudget: 940000, spentCost: 928000, committedCost: 0 },
  { id: 'CC-2010', code: '2010', name: 'RCC Columns M25 with shuttering & steel', category: 'Superstructure', allocatedBudget: 2200000, spentCost: 1840000, committedCost: 260000 },
  { id: 'CC-2020', code: '2020', name: 'RCC Roof Slabs and Beams M25 complete', category: 'Superstructure', allocatedBudget: 3600000, spentCost: 2150000, committedCost: 890000 },
  { id: 'CC-2030', code: '2030', name: 'Brick masonry 250mm thick with flyash bricks', category: 'Superstructure', allocatedBudget: 1450000, spentCost: 680000, committedCost: 420000 },
  { id: 'CC-3010', code: '3010', name: 'Internal cement plastering 12mm 1:6 mix', category: 'Finishes', allocatedBudget: 780000, spentCost: 210000, committedCost: 180000 },
  { id: 'CC-3020', code: '3020', name: 'Vitrified tile flooring 600x600mm premium', category: 'Finishes', allocatedBudget: 1250000, spentCost: 0, committedCost: 250000 },
  { id: 'CC-4010', code: '4010', name: 'Concealed PVC electrical conduits & wiring', category: 'MEP', allocatedBudget: 850000, spentCost: 225000, committedCost: 150000 },
];

export const initialBOQRevisions: BOQRevision[] = [
  {
    id: 'BOQ-REV-01',
    projectId: 'PRJ-001',
    revisionNumber: 'REV-1.0 (Baseline)',
    status: 'Approved Baseline',
    baselineHash: 'bl_8a92f09c62b47',
    approvedAt: '2026-03-18 11:30 AM',
    approvedBy: 'Siddharth Patnaik (Director)',
    totalAmount: 13970000,
    items: [
      { id: 'BOQ-01', costCode: '1010', description: 'Earthwork excavation in foundation trenches in hard soil', uom: 'cum', quantity: 1240, materialRate: 0, labourRate: 480, totalRate: 480, amount: 595200 },
      { id: 'BOQ-02', costCode: '1020', description: 'PCC (1:4:8) with 40mm hard granite metal including ramming', uom: 'cum', quantity: 98, materialRate: 3650, labourRate: 850, totalRate: 4500, amount: 441000 },
      { id: 'BOQ-03', costCode: '1030', description: 'RCC M25 isolated and combined footings including shuttering', uom: 'cum', quantity: 215, materialRate: 5400, labourRate: 1600, totalRate: 7000, amount: 1505000 },
      { id: 'BOQ-04', costCode: '1030', description: 'Thermo-Mechanically Treated (TMT) Fe550D reinforcement rebars', uom: 'ton', quantity: 24.5, materialRate: 58500, labourRate: 7500, totalRate: 66000, amount: 1617000 },
      { id: 'BOQ-05', costCode: '1040', description: 'Plinth beam RCC M25 including centering and curing', uom: 'cum', quantity: 112, materialRate: 5350, labourRate: 1750, totalRate: 7100, amount: 795200 },
      { id: 'BOQ-06', costCode: '2010', description: 'RCC Column M25 up to first floor level with steel props', uom: 'cum', quantity: 145, materialRate: 5600, labourRate: 2100, totalRate: 7700, amount: 1116500 },
      { id: 'BOQ-07', costCode: '2020', description: 'RCC Roof slab and beams casting 125mm with ready mix concrete', uom: 'cum', quantity: 280, materialRate: 5750, labourRate: 2200, totalRate: 7950, amount: 2226000 },
      { id: 'BOQ-08', costCode: '2030', description: 'Class-I Flyash brick masonry 250mm thick in cement mortar 1:6', uom: 'cum', quantity: 420, materialRate: 2600, labourRate: 950, totalRate: 3550, amount: 1491000 },
      { id: 'BOQ-09', costCode: '3010', description: '12mm thick cement plaster on walls in cement mortar 1:6', uom: 'sqm', quantity: 3800, materialRate: 115, labourRate: 85, totalRate: 200, amount: 760000 },
      { id: 'BOQ-10', costCode: '3020', description: 'Vitrified tile flooring 600x600mm double charged Somany/Kajaria', uom: 'sqft', quantity: 14500, materialRate: 62, labourRate: 24, totalRate: 86, amount: 1247000 },
      { id: 'BOQ-11', costCode: '4010', description: 'Concealed wiring with FRLS copper wire in rigid PVC conduit', uom: 'point', quantity: 850, materialRate: 550, labourRate: 280, totalRate: 830, amount: 705500 },
    ]
  }
];

export const initialTasks: TaskSchedule[] = [
  { id: 'TSK-01', projectId: 'PRJ-001', name: 'Site clearance and foundation excavation', costCode: '1010', startDate: '2026-03-20', endDate: '2026-04-10', progressPercent: 100, dependencies: [], status: 'Completed' },
  { id: 'TSK-02', projectId: 'PRJ-001', name: 'PCC bed laying under isolated footings', costCode: '1020', startDate: '2026-04-12', endDate: '2026-04-28', progressPercent: 100, dependencies: ['TSK-01'], status: 'Completed' },
  { id: 'TSK-03', projectId: 'PRJ-001', name: 'RCC Footing casting & pedestal construction', costCode: '1030', startDate: '2026-05-02', endDate: '2026-05-30', progressPercent: 100, dependencies: ['TSK-02'], status: 'Completed' },
  { id: 'TSK-04', projectId: 'PRJ-001', name: 'Plinth beam casting and backfilling', costCode: '1040', startDate: '2026-06-05', endDate: '2026-06-28', progressPercent: 100, dependencies: ['TSK-03'], status: 'Completed' },
  { id: 'TSK-05', projectId: 'PRJ-001', name: 'Ground floor RCC columns & shuttering', costCode: '2010', startDate: '2026-07-05', endDate: '2026-08-15', progressPercent: 90, dependencies: ['TSK-04'], status: 'In Progress' },
  { id: 'TSK-06', projectId: 'PRJ-001', name: 'First floor RCC slab shuttering & casting', costCode: '2020', startDate: '2026-08-20', endDate: '2026-10-10', progressPercent: 65, dependencies: ['TSK-05'], status: 'In Progress' },
  { id: 'TSK-07', projectId: 'PRJ-001', name: 'Flyash brick masonry on Ground floor', costCode: '2030', startDate: '2026-10-15', endDate: '2026-11-25', progressPercent: 40, dependencies: ['TSK-06'], status: 'In Progress' },
  { id: 'TSK-08', projectId: 'PRJ-001', name: 'Internal plastering and electrical piping', costCode: '3010', startDate: '2026-11-15', endDate: '2026-12-30', progressPercent: 15, dependencies: ['TSK-07'], status: 'In Progress' },
];

export const initialMaterialCatalog: MaterialItem[] = [
  { id: 'MAT-01', code: 'CEMT-OPC53', name: 'UltraTech Cement OPC 53 Grade', category: 'Cement', uom: 'Bag (50kg)', currentStock: 340, reorderLevel: 100, averageRate: 380 },
  { id: 'MAT-02', code: 'STEL-TMT12', name: 'Jindal Panther TMT Rebar 12mm Fe550D', category: 'Steel', uom: 'MT', currentStock: 8.5, reorderLevel: 4.0, averageRate: 62500 },
  { id: 'MAT-03', code: 'STEL-TMT16', name: 'Jindal Panther TMT Rebar 16mm Fe550D', category: 'Steel', uom: 'MT', currentStock: 6.2, reorderLevel: 3.0, averageRate: 62500 },
  { id: 'MAT-04', code: 'SAND-RIV', name: 'Coarse River Sand (Mahanadi River Bed)', category: 'Aggregates & Sand', uom: 'Cu.ft', currentStock: 850, reorderLevel: 400, averageRate: 46 },
  { id: 'MAT-05', code: 'AGGR-20MM', name: 'Blue Granite Crushed Aggregate 20mm', category: 'Aggregates & Sand', uom: 'Cu.ft', currentStock: 1200, reorderLevel: 500, averageRate: 52 },
  { id: 'MAT-06', code: 'BRK-FLY250', name: 'High-Density Flyash Bricks 230x110x75mm', category: 'Bricks & Blocks', uom: 'Nos', currentStock: 8500, reorderLevel: 3000, averageRate: 6.2 },
  { id: 'MAT-07', code: 'TILE-VT60', name: 'Somany 600x600mm Vitrified Floor Tiles', category: 'Finishes', uom: 'Box (4 pcs)', currentStock: 120, reorderLevel: 50, averageRate: 920 },
];

export const initialDailyReports: DailySiteReport[] = [
  {
    id: 'DSR-2026-11-03',
    projectId: 'PRJ-001',
    siteDate: '2026-11-03',
    submittedBy: 'Er. Alok Das (Site Engineer)',
    weather: 'Clear / Sunny',
    temperature: '31°C',
    blockers: 'None. Ready mix transit mixer arrived on schedule at 10:15 AM.',
    taskProgress: [
      { taskId: 'TSK-06', taskName: 'First floor slab casting - Grid C to F', progressPercent: 70, notes: 'Poured 42 cum concrete; vibrated thoroughly.' },
      { taskId: 'TSK-07', taskName: 'Ground floor brick masonry outer wall', progressPercent: 45, notes: '3 mason pairs completed 35 rft of 250mm brickwork.' },
    ],
    materialsReceived: [
      { item: 'UltraTech Cement OPC 53 Grade', qty: 200, uom: 'Bag (50kg)', supplier: 'Kalinga Cement Distributors' },
      { item: 'River Sand', qty: 450, uom: 'Cu.ft', supplier: 'Mahanadi Sand Supply Co.' }
    ],
    materialsConsumed: [
      { item: 'UltraTech Cement OPC 53 Grade', qty: 120, uom: 'Bag (50kg)', costCode: '2020' },
      { item: 'Flyash Bricks', qty: 1600, uom: 'Nos', costCode: '2030' },
      { item: 'River Sand', qty: 180, uom: 'Cu.ft', costCode: '2030' }
    ],
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600', caption: 'Slab reinforcement inspection before pouring', timestamp: '10:45 AM' },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600', caption: 'Concrete pumping on 1st floor deck', timestamp: '01:15 PM' }
    ],
    status: 'synced',
    createdAt: '2026-11-03 05:40 PM'
  },
  {
    id: 'DSR-2026-11-02',
    projectId: 'PRJ-001',
    siteDate: '2026-11-02',
    submittedBy: 'Er. Alok Das (Site Engineer)',
    weather: 'Clear / Sunny',
    temperature: '32°C',
    blockers: 'Power outage for 45 minutes; backup generator used for dewatering pump.',
    taskProgress: [
      { taskId: 'TSK-06', taskName: 'Centering and staging for first floor beam deck', progressPercent: 60, notes: 'Acro jacks and shuttering plywood checked for plumb.' }
    ],
    materialsReceived: [],
    materialsConsumed: [
      { item: 'Jindal Panther TMT 12mm', qty: 1.2, uom: 'MT', costCode: '2020' }
    ],
    photos: [],
    status: 'synced',
    createdAt: '2026-11-02 06:10 PM'
  }
];

export const initialLabourMusters: DailyLabourMuster[] = [
  {
    id: 'LBR-2026-11-03',
    projectId: 'PRJ-001',
    date: '2026-11-03',
    submittedBy: 'Er. Alok Das',
    linkedCostCode: '2020',
    entries: [
      { trade: 'Head Mason (Mistri)', workerCount: 3, dailyRate: 850, shiftHours: 8, totalWages: 2550, costCode: '2030' },
      { trade: 'Skilled Mason', workerCount: 5, dailyRate: 750, shiftHours: 8, totalWages: 3750, costCode: '2030' },
      { trade: 'Bar Benders', workerCount: 6, dailyRate: 700, shiftHours: 8, totalWages: 4200, costCode: '2020' },
      { trade: 'Carpenters (Shuttering)', workerCount: 8, dailyRate: 720, shiftHours: 8, totalWages: 5760, costCode: '2020' },
      { trade: 'Male Unskilled Helper', workerCount: 14, dailyRate: 480, shiftHours: 8, totalWages: 6720, costCode: '2020' },
      { trade: 'Female Unskilled Helper', workerCount: 10, dailyRate: 480, shiftHours: 8, totalWages: 4800, costCode: '2030' },
    ],
    totalWages: 27780,
    totalWorkers: 46,
    status: 'Verified',
    auditNote: 'Verified by PM Er. Debabrata Jena on 03 Nov 18:00'
  },
  {
    id: 'LBR-2026-11-02',
    projectId: 'PRJ-001',
    date: '2026-11-02',
    submittedBy: 'Er. Alok Das',
    linkedCostCode: '2020',
    entries: [
      { trade: 'Head Mason', workerCount: 2, dailyRate: 850, shiftHours: 8, totalWages: 1700, costCode: '2030' },
      { trade: 'Bar Benders', workerCount: 6, dailyRate: 700, shiftHours: 8, totalWages: 4200, costCode: '2020' },
      { trade: 'Carpenters', workerCount: 8, dailyRate: 720, shiftHours: 8, totalWages: 5760, costCode: '2020' },
      { trade: 'Unskilled Helpers', workerCount: 20, dailyRate: 480, shiftHours: 8, totalWages: 9600, costCode: '2020' }
    ],
    totalWages: 21260,
    totalWorkers: 36,
    status: 'Verified'
  }
];

export const initialMaterialRequests: MaterialRequest[] = [
  {
    id: 'MR-0104',
    requestNo: 'MR-2026-0042',
    projectId: 'PRJ-001',
    costCode: '2020',
    itemId: 'MAT-01',
    itemName: 'UltraTech Cement OPC 53 Grade',
    quantity: 300,
    uom: 'Bag (50kg)',
    requiredByDate: '2026-11-07',
    requestedBy: 'Er. Alok Das (Site Engineer)',
    purpose: 'For second-stage roof beam casting on first floor',
    status: 'Pending Approval',
    createdAt: '2026-11-03 14:15'
  },
  {
    id: 'MR-0103',
    requestNo: 'MR-2026-0038',
    projectId: 'PRJ-001',
    costCode: '2030',
    itemId: 'MAT-06',
    itemName: 'High-Density Flyash Bricks',
    quantity: 6000,
    uom: 'Nos',
    requiredByDate: '2026-11-10',
    requestedBy: 'Er. Alok Das',
    purpose: 'First floor partition wall masonry',
    status: 'Approved',
    createdAt: '2026-11-02 11:20'
  }
];

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO-2026-089',
    poNo: 'PO-UI-2026-089',
    projectId: 'PRJ-001',
    vendorName: 'Kalinga Cement Distributors',
    vendorGSTIN: '21BBLPK5481C1Z4',
    costCode: '2020',
    items: [
      { itemId: 'MAT-01', itemName: 'UltraTech Cement OPC 53 Grade', quantity: 400, uom: 'Bag (50kg)', unitPrice: 380, totalAmount: 152000 }
    ],
    totalAmount: 152000,
    status: 'Partially Received',
    issuedDate: '2026-11-01',
    deliveryDate: '2026-11-05',
    paymentTerms: '30 days net from verified GRN'
  },
  {
    id: 'PO-2026-084',
    poNo: 'PO-UI-2026-084',
    projectId: 'PRJ-001',
    vendorName: 'Shree Jagannath Steels Pvt Ltd',
    vendorGSTIN: '21AABCS9912D1ZR',
    costCode: '2020',
    items: [
      { itemId: 'MAT-02', itemName: 'Jindal Panther TMT Rebar 12mm', quantity: 10, uom: 'MT', unitPrice: 62500, totalAmount: 625000 },
      { itemId: 'MAT-03', itemName: 'Jindal Panther TMT Rebar 16mm', quantity: 8, uom: 'MT', unitPrice: 62500, totalAmount: 500000 }
    ],
    totalAmount: 1125000,
    status: 'Fulfilled',
    issuedDate: '2026-10-18',
    deliveryDate: '2026-10-25',
    paymentTerms: '15 days net'
  }
];

export const initialGRNs: GoodsReceiptNote[] = [
  {
    id: 'GRN-092',
    grnNo: 'GRN-2026-0092',
    poId: 'PO-2026-089',
    poNo: 'PO-UI-2026-089',
    projectId: 'PRJ-001',
    vendorName: 'Kalinga Cement Distributors',
    challanNo: 'CH-48192',
    items: [
      { itemId: 'MAT-01', itemName: 'UltraTech Cement OPC 53 Grade', quantityReceived: 200, uom: 'Bag (50kg)', unitPrice: 380, totalAmount: 76000 }
    ],
    totalAmount: 76000,
    receivedDate: '2026-11-03',
    receivedBy: 'Bipin Bihari Nayak (Storekeeper)',
    vehicleNo: 'OD-02-AK-9812',
    status: 'Verified & Stocked'
  }
];

export const initialConsumptions: MaterialConsumption[] = [
  {
    id: 'CNS-0081',
    voucherNo: 'ISS-2026-0081',
    projectId: 'PRJ-001',
    costCode: '2020',
    taskName: 'First floor roof slab casting',
    itemId: 'MAT-01',
    itemName: 'UltraTech Cement OPC 53 Grade',
    quantityConsumed: 120,
    uom: 'Bag (50kg)',
    unitCost: 380,
    totalCost: 45600,
    date: '2026-11-03',
    issuedBy: 'Bipin Bihari Nayak'
  },
  {
    id: 'CNS-0080',
    voucherNo: 'ISS-2026-0080',
    projectId: 'PRJ-001',
    costCode: '2030',
    taskName: 'Ground floor brick masonry outer wall',
    itemId: 'MAT-06',
    itemName: 'High-Density Flyash Bricks',
    quantityConsumed: 1600,
    uom: 'Nos',
    unitCost: 6.2,
    totalCost: 9920,
    date: '2026-11-03',
    issuedBy: 'Bipin Bihari Nayak'
  }
];

export const initialSubcontracts: SubcontractAgreement[] = [
  {
    id: 'SBC-01',
    contractNo: 'SC-2026-012',
    projectId: 'PRJ-001',
    subcontractorName: 'M/s Maa Tarini Rebar & Fabrication Works',
    trade: 'Bar Bending and Steel Fixing',
    scopeOfWork: 'Cutting, bending and fixing TMT steel for footings, columns and slabs',
    contractValue: 540000,
    retentionPercent: 5.0,
    advanceAmount: 50000,
    advanceRecovered: 35000,
    status: 'Active',
    startDate: '2026-04-01'
  },
  {
    id: 'SBC-02',
    contractNo: 'SC-2026-018',
    projectId: 'PRJ-001',
    subcontractorName: 'Biswal Shuttering & Scaffolding Services',
    trade: 'Formwork & Shuttering',
    scopeOfWork: 'Centering, staging and shuttering for columns, beams and slabs with steel plates',
    contractValue: 880000,
    retentionPercent: 5.0,
    advanceAmount: 80000,
    advanceRecovered: 40000,
    status: 'Active',
    startDate: '2026-05-10'
  }
];

export const initialSubcontractBills: SubcontractBill[] = [
  {
    id: 'SB-003',
    billNo: 'SC-BILL-2026-003',
    agreementId: 'SBC-01',
    contractNo: 'SC-2026-012',
    projectId: 'PRJ-001',
    subcontractorName: 'M/s Maa Tarini Rebar & Fabrication Works',
    period: 'RA Bill #3 (01 Oct - 31 Oct 2026)',
    cumulativeMeasured: 395000,
    previousCertified: 280000,
    currentGrossMeasured: 115000,
    retentionDeduction: 5750,      // 5% retention
    advanceRecoveryDeduction: 15000,
    otherDeductions: 1200,         // Safety non-compliance deduction
    netPayable: 93050,
    status: 'Approved',
    linkedPurchaseInvoiceNo: 'PINV-2026-1049',
    submittedDate: '2026-11-01'
  }
];

export const initialClientInvoices: ClientInvoice[] = [
  {
    id: 'CINV-01',
    invoiceNo: 'INV-UI-2026-01',
    projectId: 'PRJ-001',
    milestoneTitle: 'Milestone 1: Completion of Substructure & Plinth Beam',
    contractReference: 'Clause 4.1.a',
    grossAmount: 3700000,
    gstAmount: 666000,
    totalAmount: 4366000,
    issueDate: '2026-06-30',
    dueDate: '2026-07-30',
    status: 'Paid',
    paidAmount: 4366000,
    agingDays: 0,
    erpSalesInvoiceRef: 'SINV-2026-0012'
  },
  {
    id: 'CINV-02',
    invoiceNo: 'INV-UI-2026-02',
    projectId: 'PRJ-001',
    milestoneTitle: 'Milestone 2: Ground Floor Columns & Shuttering',
    contractReference: 'Clause 4.1.b',
    grossAmount: 3700000,
    gstAmount: 666000,
    totalAmount: 4366000,
    issueDate: '2026-09-15',
    dueDate: '2026-10-15',
    status: 'Partially Paid',
    paidAmount: 2500000,
    agingDays: 19,
    erpSalesInvoiceRef: 'SINV-2026-0048'
  },
  {
    id: 'CINV-03',
    invoiceNo: 'INV-UI-2026-03',
    projectId: 'PRJ-001',
    milestoneTitle: 'Milestone 3: First Floor Slab Casting (50% progress)',
    contractReference: 'Clause 4.1.c',
    grossAmount: 2800000,
    gstAmount: 504000,
    totalAmount: 3304000,
    issueDate: '2026-10-28',
    dueDate: '2026-11-28',
    status: 'Issued',
    paidAmount: 0,
    agingDays: 0,
    erpSalesInvoiceRef: 'SINV-2026-0073'
  }
];

export const initialApprovals: ApprovalItem[] = [
  {
    id: 'APP-01',
    type: 'Material Request',
    referenceNo: 'MR-2026-0042',
    projectId: 'PRJ-001',
    projectName: 'Niladri Heights',
    title: '300 Bags UltraTech OPC 53 Grade Cement',
    requestedBy: 'Er. Alok Das (Site Engineer)',
    requestedAt: '03 Nov 2026 14:15',
    amount: 114000,
    budgetImpact: 'Within remaining cost code 2020 budget (₹5,60,000 remaining)',
    status: 'Pending'
  },
  {
    id: 'APP-02',
    type: 'Purchase Order',
    referenceNo: 'PO-UI-2026-089',
    projectId: 'PRJ-001',
    projectName: 'Niladri Heights',
    title: 'PO Release for 400 Bags Cement - Kalinga Cement Distributors',
    requestedBy: 'Pradeep Swain (Procurement)',
    requestedAt: '01 Nov 2026 16:30',
    amount: 152000,
    budgetImpact: 'Pre-approved rate ₹380/bag matching baseline rate',
    status: 'Approved'
  },
  {
    id: 'APP-03',
    type: 'Subcontract Bill',
    referenceNo: 'SC-BILL-2026-003',
    projectId: 'PRJ-001',
    projectName: 'Niladri Heights',
    title: 'Maa Tarini Rebar RA Bill #3 - Net ₹93,050',
    requestedBy: 'Soumya Ranjan Mohanty (QS)',
    requestedAt: '01 Nov 2026 17:45',
    amount: 93050,
    budgetImpact: 'Retention ₹5,750 withheld as per contract clause',
    status: 'Approved'
  }
];

export const initialDrilldownLedger: SourceDocumentDrilldown[] = [
  { voucherType: 'Purchase Invoice', voucherNo: 'PINV-2026-1049', date: '2026-11-01', projectId: 'PRJ-001', costCode: '2020', party: 'Maa Tarini Rebar Works', amount: 93050, status: 'Posted in ERPNext GL', description: 'Subcontract RA Bill #3 Steel fixing' },
  { voucherType: 'Goods Receipt Note', voucherNo: 'GRN-2026-0092', date: '2026-11-03', projectId: 'PRJ-001', costCode: '2020', party: 'Kalinga Cement Distributors', amount: 76000, status: 'Stock Ledger Updated', description: '200 Bags UltraTech OPC 53 Cement' },
  { voucherType: 'Labour Muster', voucherNo: 'LBR-2026-11-03', date: '2026-11-03', projectId: 'PRJ-001', costCode: '2020', party: 'Site Daily Crew (46 workers)', amount: 27780, status: 'Approved for Payroll', description: 'Daily muster: 1st floor deck slab casting & masonry' },
  { voucherType: 'Purchase Order (Open)', voucherNo: 'PO-UI-2026-089', date: '2026-11-01', projectId: 'PRJ-001', costCode: '2020', party: 'Kalinga Cement Distributors', amount: 76000, status: 'Pending GRN Delivery', description: 'Balance 200 bags cement on PO #89' },
  { voucherType: 'Sales Invoice', voucherNo: 'SINV-2026-0048', date: '2026-09-15', projectId: 'PRJ-001', costCode: 'General', party: 'Niladri Housing Co-op Society', amount: 4366000, status: 'Partially Settled', description: 'Milestone 2 - ₹18.66 Lakh pending collection' },
  { voucherType: 'Sales Invoice', voucherNo: 'SINV-2026-0073', date: '2026-10-28', projectId: 'PRJ-001', costCode: 'General', party: 'Niladri Housing Co-op Society', amount: 3304000, status: 'Due 28 Nov 2026', description: 'Milestone 3 - First floor casting' },
];
