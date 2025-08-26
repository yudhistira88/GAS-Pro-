export type LogLevel = 'INFO' | 'WARNING' | 'ERROR';

export type LogAction =
  // Auth
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE'
  // User Management
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED'
  // BQ
  | 'BQ_CREATED' | 'BQ_UPDATED' | 'BQ_DELETED' | 'BQ_LOCKED' | 'BQ_REVISION' | 'BQ_IMPORTED'
  // RAB
  | 'RAB_CREATED' | 'RAB_UPDATED' | 'RAB_DELETED' | 'RAB_LOCKED' | 'RAB_REVISION' | 'RAB_IMPORTED'
  // Project
  | 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'PROJECT_DELETED' | 'PROJECT_IMPORTED'
  // Database
  | 'DB_PRICE_ITEM_CREATED' | 'DB_PRICE_ITEM_UPDATED' | 'DB_PRICE_ITEM_DELETED'
  | 'DB_WORK_ITEM_CREATED' | 'DB_WORK_ITEM_UPDATED' | 'DB_WORK_ITEM_DELETED'
  // System
  | 'DATA_EXPORTED' | 'DATA_IMPORTED' | 'DATA_RESET' | 'DATA_FORMATTED'
  // AI
  | 'AI_BQ_GENERATED' | 'AI_AHS_GENERATION_SUCCESS' | 'AI_AHS_GENERATION_FAILURE'
  | 'API_TIMEOUT'
  ;

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  user: string;
  action: LogAction | string; // Allow string for flexibility
  details: string;
}

export type PermissionId = 
  'bq:view' | 'bq:create' | 'bq:edit' | 'bq:delete' | 'bq:approve' |
  'rab:view' | 'rab:create' | 'rab:edit' | 'rab:delete' | 'rab:approve' |
  'proyek:view' | 'proyek:create' | 'proyek:edit' | 'proyek:delete' |
  'database:view' | 'database:edit' |
  'admin:access' | 'admin:users' | 'admin:data' | 'admin:logs';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'Admin' | 'OBM' | 'GAS Project' | 'Manager GAS' | 'Purchasing' | 'Custom';
  lastLogin: string;
  status: 'Active' | 'Inactive';
  password?: string;
  photoUrl?: string;
  permissions: PermissionId[];
  plant: string[];
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
  description?: string;
  finishDate?: string | null;
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
    id:string;
    type: 'category' | 'item';
    uraianPekerjaan: string;
    volume: number | null;
    satuan: string;
    hargaSatuan: number; // This will be the FINAL calculated price from AHS
    keterangan: string;
    isEditing: boolean;
    isSaved: boolean;
    indent?: number;
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
    surveyDate: string;
    receivedDate: string | null;
    finishDate: string | null;
    status: 'Survey' | 'Diterima' | 'Ditolak' | 'Approval' | 'Selesai' | 'Pending' | 'Menunggu Approval';
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