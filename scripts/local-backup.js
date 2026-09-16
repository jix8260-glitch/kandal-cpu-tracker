const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'secure-local.db.json');

const DEFAULT_STATE = {
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

function runBackup() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf8');
    console.log('[Init] Created initial secure-local.db.json');
  }

  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const db = JSON.parse(raw);
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup_${dateStr}.json`;
  const backupPath = path.join(BACKUPS_DIR, backupFileName);

  const snapshot = {
    metadata: {
      version: db.settings?.appVersion || 'v3.6 Production',
      createdAt: now.toISOString(),
      triggerSource: 'STANDALONE_SCRIPT',
      recordsCount: {
        requests: db.requests?.length || 0,
        ledger: db.ledger?.length || 0,
        auditLogs: db.auditLogs?.length || 0,
      },
    },
    database: db,
  };

  fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`[Backup Success] Snapshot saved to: ${backupPath}`);

  // Update last backup timestamp in DB
  db.settings = db.settings || {};
  db.settings.lastBackupAt = now.toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');

  // Prune older than 30 backups
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 30) {
      files.slice(30).forEach(f => {
        fs.unlinkSync(path.join(BACKUPS_DIR, f.name));
        console.log(`[Backup Prune] Removed old backup: ${f.name}`);
      });
    }
  } catch (e) {
    console.warn('[Backup Warning] Error pruning:', e.message);
  }
}

runBackup();
