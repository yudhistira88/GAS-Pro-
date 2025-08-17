


export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'OBM' | 'GAS Project' | 'Manager GAS' | 'Purchasing';
  lastLogin: string;
  status: 'Active' | 'Inactive';
  password?: string;
  photoUrl?: string;
}

export interface RabItem {
  item: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface ProjectPhase {
  id: string;
  name: string;
  plan: { start: string | null; end: string | null };
  actual: { start: string | null; end: string | null };
  color: string;
}

export interface Project {
  id: string;
  name: string;
  team: string[];
  status: 'Completed' | 'In Progress' | 'Not Started';
  dueDate: string;
  progress: number;
  phases?: ProjectPhase[];
  group?: string;
}

export interface ScheduleWormItem {
  id: string;
  name: string;
  date: string;
  phase: string;
  status: 'complete' | 'inProgress' | 'notStarted';
}

export interface AhsComponent {
    id: string;
    componentName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    category: string;
    source: 'db' | 'ai' | 'manual';
}

export interface RabDetailItem {
    id: string;
    type: 'category' | 'item';
    uraianPekerjaan: string;
    volume: number;
    satuan: string;
    hargaSatuan: number; // This will be the FINAL calculated price from AHS
    keterangan: string;
    isEditing: boolean;
    isSaved: boolean;
    isAiLoading?: boolean; // Note: Kept for potential future AI features in row
    ahs?: AhsComponent[] | null;
    // New fields for advanced AHS calculation
    pph?: number;
    overhead?: number;
    margin?: number;
    // New fields for price source management
    priceSource?: 'db' | 'ahs' | 'combined' | 'manual';
    priceSourceDetail?: string; // e.g., '📁 DB', '📐 AHS'
    isPricingLoading?: boolean;
    // New fields for deletion and addition tracking
    isDeleted?: boolean;
    isNew?: boolean;
}

export interface RabDocument {
    id: string;
    eMPR: string;
    projectName: string;
    pic: string;
    approvedDate: string | null;
    receivedRejectedDate: string;
    finishDate: string | null;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Completed' | 'Menunggu Approval' | 'Terkunci';
    sla: number; // in days
    tenderValue: number | null;
    keterangan: string | null;
    detailItems: RabDetailItem[];
    pdfReady?: boolean;
    creatorName?: string;
    approverName?: string;
    workDuration?: number;
    revisionText?: string;
    isLocked?: boolean;
    revisionHistory?: {
        timestamp: string;
        items: RabDetailItem[];
    }[];
    approvalRequestDetails?: {
        requestedAt: string;
        requestedBy: string;
        sentTo: string;
    } | null;
}

export interface PriceDatabaseItem {
  id: string;
  category: string;
  itemName: string;
  unit: string;
  unitPrice: number;
  priceSource?: string;
  lastUpdated: string;
}

export type WorkItemCategory = string;

export interface WorkItem {
  id:string;
  name: string;
  category: WorkItemCategory;
  unit: string;
  defaultPrice: number;
  source: 'AHS' | 'Manual' | 'AI' | 'Import';
  lastUpdated: string;
  defaultAhs?: AhsComponent[];
}
