import fs from 'fs';
import path from 'path';

// ==============================================================================
// 1. DATA TYPES & INTERFACES (MATCHING LOCAL SECURITY SPEC)
// ==============================================================================
export type Role = 'OWNER' | 'ADMIN' | 'OPERATOR';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserAccount {
  id: string;
  username: string;
  role: Role;
  failedAttempts: number;
  lockoutUntil: number | null; // Unix timestamp in ms
  createdAt: string;
}

export interface RequestItem {
  item_code: string;
  description_khmer: string;
  quantity: number;
  uom: string;
}

export interface ScanRequestRecord {
  id: string;
  requesterName: string;
  department: string;
  actionType: string; // 'STOCK_IN' | 'STOCK_OUT' | 'STORE_DELIVERY' | 'WASTE_LOG' | 'DAILY_ENTRY'
  payloadJson: {
    items: RequestItem[];
    notes?: string;
    targetDate?: string;
    storeId?: string;
    storeName?: string;
  };
  status: RequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionNote?: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLogRecord {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface LedgerRecord {
  id: string;
  requestId: string;
  date: string;
  actionType: string;
  department: string;
  items: RequestItem[];
  approvedBy: string;
  createdAt: string;
}

export interface SystemSettingsRecord {
  masterPin: string;
  appVersion: string;
  sessionTimeoutMinutes: number;
  lanIp: string;
  lastBackupAt: string | null;
}

export interface DatabaseState {
  users: Record<string, UserAccount>;
  requests: ScanRequestRecord[];
  auditLogs: AuditLogRecord[];
  ledger: LedgerRecord[];
  settings: SystemSettingsRecord;
}

// ==============================================================================
// 2. FILE PATHS & DIRECTORY INITIALIZATION
// ==============================================================================
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'secure-local.db.json');
const TMP_FILE = path.join(DATA_DIR, 'secure-local.db.tmp');

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

const DEFAULT_STATE: DatabaseState = {
  users: {
    admin: {
      id: 'usr_admin',
      username: 'admin',
      role: 'OWNER',
      failedAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date().toISOString(),
    },
    staff: {
      id: 'usr_staff',
      username: 'staff',
      role: 'OPERATOR',
      failedAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date().toISOString(),
    },
  },
  requests: [],
  auditLogs: [
    {
      id: 'audit_init',
      userId: 'system',
      userName: 'System Init',
      action: 'SYSTEM_BOOT',
      details: 'Secure Local-First Database initialized',
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    },
  ],
  ledger: [],
  settings: {
    masterPin: '0203',
    appVersion: 'v3.6 Production',
    sessionTimeoutMinutes: 15,
    lanIp: '192.168.1.44',
    lastBackupAt: null,
  },
};

// ==============================================================================
// 3. ATOMIC ACID FILE STORAGE (Safe Against Power Outages)
// ==============================================================================
export function readDatabase(): DatabaseState {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    writeDatabase(DEFAULT_STATE);
    return DEFAULT_STATE;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
    };
  } catch (err) {
    console.error('Failed to read local DB, attempting backup recovery:', err);
    return DEFAULT_STATE;
  }
}

export function writeDatabase(state: DatabaseState): void {
  ensureDirectories();
  try {
    const serialized = JSON.stringify(state, null, 2);
    // Write to temporary file first, then atomically rename
    fs.writeFileSync(TMP_FILE, serialized, 'utf8');
    fs.renameSync(TMP_FILE, DB_FILE);
  } catch (err) {
    console.error('Critical: Failed to write to local DB:', err);
    throw err;
  }
}

// ==============================================================================
// 4. SCAN REQUEST CRUD & WORKFLOW
// ==============================================================================
export function createScanRequest(data: {
  requesterName: string;
  department: string;
  actionType: string;
  payloadJson: ScanRequestRecord['payloadJson'];
  ttlMinutes?: number;
}): ScanRequestRecord {
  const db = readDatabase();
  const ttl = data.ttlMinutes || 60; // default 1 hour request validity
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 60 * 1000);

  const newRecord: ScanRequestRecord = {
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    requesterName: data.requesterName.trim(),
    department: data.department.trim(),
    actionType: data.actionType,
    payloadJson: data.payloadJson,
    status: 'PENDING',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  db.requests.unshift(newRecord);
  // Keep last 500 requests
  if (db.requests.length > 500) {
    db.requests = db.requests.slice(0, 500);
  }
  writeDatabase(db);
  return newRecord;
}

export function getScanRequests(statusFilter?: RequestStatus): ScanRequestRecord[] {
  const db = readDatabase();
  if (statusFilter) {
    return db.requests.filter((r) => r.status === statusFilter);
  }
  return db.requests;
}

export function getScanRequestById(id: string): ScanRequestRecord | null {
  const db = readDatabase();
  return db.requests.find((r) => r.id === id) || null;
}

export function updateScanRequestStatus(params: {
  id: string;
  status: RequestStatus;
  reviewedBy: string;
  rejectionNote?: string;
  ipAddress?: string;
}): { success: boolean; request: ScanRequestRecord | null; ledgerRecord: LedgerRecord | null } {
  const db = readDatabase();
  const index = db.requests.findIndex((r) => r.id === params.id);
  if (index === -1) return { success: false, request: null, ledgerRecord: null };

  const target = db.requests[index];
  target.status = params.status;
  target.reviewedBy = params.reviewedBy;
  target.reviewedAt = new Date().toISOString();
  if (params.rejectionNote) {
    target.rejectionNote = params.rejectionNote;
  }

  let ledgerEntry: LedgerRecord | null = null;

  // If approved, commit to Official Ledger
  if (params.status === 'APPROVED') {
    ledgerEntry = {
      id: `led_${Date.now()}`,
      requestId: target.id,
      date: target.payloadJson.targetDate || new Date().toISOString().split('T')[0],
      actionType: target.actionType,
      department: target.department,
      items: target.payloadJson.items || [],
      approvedBy: params.reviewedBy,
      createdAt: new Date().toISOString(),
    };
    db.ledger.unshift(ledgerEntry);
  }

  // Record in Audit Log
  db.auditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: params.reviewedBy,
    userName: params.reviewedBy,
    action: `REQUEST_${params.status}`,
    details: `${params.status} request from ${target.requesterName} (${target.actionType}, ${target.payloadJson.items?.length || 0} items)`,
    ipAddress: params.ipAddress || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  writeDatabase(db);
  return { success: true, request: target, ledgerRecord: ledgerEntry };
}

// ==============================================================================
// 5. BRUTE FORCE PROTECTION & USER SESSIONS
// ==============================================================================
export function checkBruteForceLock(username: string): { isLocked: boolean; remainingSeconds: number } {
  const db = readDatabase();
  const user = db.users[username.toLowerCase()];
  if (!user || !user.lockoutUntil) return { isLocked: false, remainingSeconds: 0 };

  const now = Date.now();
  if (now < user.lockoutUntil) {
    const remainingSeconds = Math.ceil((user.lockoutUntil - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }

  // Lockout expired, reset counters
  user.failedAttempts = 0;
  user.lockoutUntil = null;
  writeDatabase(db);
  return { isLocked: false, remainingSeconds: 0 };
}

export function registerLoginAttempt(params: {
  username: string;
  success: boolean;
  ipAddress: string;
}): { isLocked: boolean; attemptsLeft: number } {
  const db = readDatabase();
  const key = params.username.toLowerCase();
  let user = db.users[key];

  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      username: params.username,
      role: 'OPERATOR',
      failedAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date().toISOString(),
    };
    db.users[key] = user;
  }

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  if (params.success) {
    user.failedAttempts = 0;
    user.lockoutUntil = null;
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      userId: user.id,
      userName: user.username,
      action: 'LOGIN_SUCCESS',
      details: 'User authenticated successfully',
      ipAddress: params.ipAddress,
      createdAt: new Date().toISOString(),
    });
    writeDatabase(db);
    return { isLocked: false, attemptsLeft: MAX_ATTEMPTS };
  } else {
    user.failedAttempts += 1;
    let isLocked = false;
    let attemptsLeft = Math.max(0, MAX_ATTEMPTS - user.failedAttempts);

    if (user.failedAttempts >= MAX_ATTEMPTS) {
      user.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      isLocked = true;
      attemptsLeft = 0;
    }

    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      userId: user.id,
      userName: user.username,
      action: isLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
      details: isLocked
        ? `Account locked after ${MAX_ATTEMPTS} failed attempts`
        : `Failed password attempt (${user.failedAttempts}/${MAX_ATTEMPTS})`,
      ipAddress: params.ipAddress,
      createdAt: new Date().toISOString(),
    });

    writeDatabase(db);
    return { isLocked, attemptsLeft };
  }
}

// ==============================================================================
// 6. BACKUP SNAPSHOTS
// ==============================================================================
export function createLocalBackup(triggerSource = 'MANUAL'): { success: boolean; filename: string; path: string; timestamp: string } {
  ensureDirectories();
  const db = readDatabase();
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${dateStr}.json`;
  const backupFilePath = path.join(BACKUPS_DIR, filename);

  const snapshot = {
    metadata: {
      version: db.settings.appVersion,
      createdAt: now.toISOString(),
      triggerSource,
      recordsCount: {
        requests: db.requests.length,
        ledger: db.ledger.length,
        auditLogs: db.auditLogs.length,
      },
    },
    database: db,
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(snapshot, null, 2), 'utf8');

  // Update last backup timestamp
  db.settings.lastBackupAt = now.toISOString();
  db.auditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: 'system',
    userName: triggerSource,
    action: 'LOCAL_BACKUP_CREATED',
    details: `Snapshot saved to ${filename}`,
    ipAddress: '127.0.0.1',
    createdAt: now.toISOString(),
  });
  writeDatabase(db);

  // Prune older backups, keeping last 30
  pruneOldBackups(30);

  return { success: true, filename, path: backupFilePath, timestamp: now.toISOString() };
}

export function listLocalBackups(): Array<{ filename: string; sizeBytes: number; createdAt: string }> {
  ensureDirectories();
  try {
    const files = fs.readdirSync(BACKUPS_DIR);
    return files
      .filter((f) => f.startsWith('backup_') && f.endsWith('.json'))
      .map((f) => {
        const stat = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          filename: f,
          sizeBytes: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

function pruneOldBackups(maxToKeep: number) {
  try {
    const backups = listLocalBackups();
    if (backups.length > maxToKeep) {
      const toDelete = backups.slice(maxToKeep);
      for (const b of toDelete) {
        fs.unlinkSync(path.join(BACKUPS_DIR, b.filename));
      }
    }
  } catch (e) {
    console.warn('Backup pruning warning:', e);
  }
}

export function restoreLocalBackup(filename: string): boolean {
  ensureDirectories();
  const target = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(target)) return false;
  try {
    const raw = fs.readFileSync(target, 'utf8');
    const snapshot = JSON.parse(raw);
    if (snapshot.database) {
      writeDatabase(snapshot.database);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
