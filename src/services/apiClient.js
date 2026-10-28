const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Token storage key
const TOKEN_KEY = 'amstech_auth_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // If unauthorized (401), session token is expired or invalid -> clear token
    if (response.status === 401) {
      if (endpoint !== '/auth/login') {
        setStoredToken(null);
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.errors = data?.errors;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
    switchRole: (role) => request('/auth/switch-role', { method: 'POST', body: { role } }),
  },

  // Dashboard & Settings
  dashboard: {
    getSummary: () => request('/dashboard/summary'),
    getActivities: () => request('/dashboard/activities'),
  },
  settings: {
    getHealth: () => request('/settings/health'),
    testDispatch: (targetNumber) => request('/settings/test-dispatch', { method: 'POST', body: { targetNumber } }),
  },

  // Academic Structure & Classes
  academics: {
    getYears: () => request('/academic-years'),
    createYear: (data) => request('/academic-years', { method: 'POST', body: data }),
    activateYear: (id) => request(`/academic-years/${id}/activate`, { method: 'PATCH' }),
    getClasses: () => request('/academic-years/classes'),
    getSections: (classId) => request(`/academic-years/sections${classId ? `?classId=${classId}` : ''}`),
    getSubjects: () => request('/academic-years/subjects'),
    simulateRollover: () => request('/academic-years/rollover', { method: 'POST' }),
  },

  // Class & Section Management
  classes: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/classes${q ? `?${q}` : ''}`);
    },
    get: (id) => request(`/classes/${id}`),
    create: (data) => request('/classes', { method: 'POST', body: data }),
    update: (id, data) => request(`/classes/${id}`, { method: 'PATCH', body: data }),
    delete: (id, force = false) => request(`/classes/${id}?force=${force}`, { method: 'DELETE' }),
    createSection: (classId, data) => request(`/classes/${classId}/sections`, { method: 'POST', body: data }),
    updateSection: (sectionId, data) => request(`/classes/sections/${sectionId}`, { method: 'PATCH', body: data }),
    deleteSection: (sectionId, force = false) => request(`/classes/sections/${sectionId}?force=${force}`, { method: 'DELETE' }),
  },

  // Students & Admissions
  students: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/students${q ? `?${q}` : ''}`);
    },
    get: (id) => request(`/students/${id}`),
    admit: (data) => request('/students', { method: 'POST', body: data }),
    bulkImport: (students) => request('/students/bulk-import', { method: 'POST', body: { students } }),
    update: (id, fields) => request(`/students/${id}`, { method: 'PATCH', body: fields }),
    updateStatus: (id, status, reason) => request(`/students/${id}/status`, { method: 'PATCH', body: { status, reason } }),
    delete: (id) => request(`/students/${id}`, { method: 'DELETE' }),
    promote: (data) => request('/students/promotion/execute', { method: 'POST', body: data }),
    exportUrl: () => `${API_BASE_URL}/students/export`,
  },

  // Staff
  staff: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/staff${q ? `?${q}` : ''}`);
    },
    create: (data) => request('/staff', { method: 'POST', body: data }),
    delete: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
  },

  // Timetable Engine
  timetable: {
    get: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/timetable${q ? `?${q}` : ''}`);
    },
    create: (data) => request('/timetable', { method: 'POST', body: data }),
    generate: (payload) => request('/timetable/generate', { method: 'POST', body: payload }),
    validate: (payload) => request('/timetable/validate', { method: 'POST', body: payload }),
    publish: (payload) => request('/timetable/publish', { method: 'POST', body: payload }),
    getConfigs: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/timetable/configs${q ? `?${q}` : ''}`);
    },
  },

  // Attendance
  attendance: {
    getRoster: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/attendance${q ? `?${q}` : ''}`);
    },
    submitBatch: (data) => request('/attendance/batch', { method: 'POST', body: data }),
    updateRecord: (id, data) => request(`/attendance/${id}`, { method: 'PATCH', body: data }),
  },

  // Gradebook & Exams
  gradebook: {
    getGrades: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/gradebook${q ? `?${q}` : ''}`);
    },
    updateScore: (id, field, value) => request(`/gradebook/${id}`, { method: 'PATCH', body: { field, value } }),
    batchSave: (data) => request('/gradebook/batch-save', { method: 'POST', body: data }),
    generatePdfs: (data) => request('/gradebook/generate-pdfs', { method: 'POST', body: data }),
  },
  exams: {
    list: () => request('/exams'),
    create: (data) => request('/exams', { method: 'POST', body: data }),
  },

  // Finance
  finance: {
    getSummary: () => request('/finance/summary'),
    getInvoices: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/finance/invoices${q ? `?${q}` : ''}`);
    },
    createInvoice: (data) => request('/finance/invoices', { method: 'POST', body: data }),
    bulkGenerate: (data) => request('/finance/invoices/bulk-generate', { method: 'POST', body: data }),
    payInvoice: (id, payload) =>
      request(`/finance/invoices/${id}/pay`, {
        method: 'POST',
        body: typeof payload === 'object' ? payload : { receiptNo: payload },
      }),
    cancelInvoice: (id, reason) => request(`/finance/invoices/${id}/cancel`, { method: 'POST', body: { reason } }),
    getPayments: () => request('/finance/payments'),
    getFeeStructures: () => request('/finance/fee-structures'),
    getWaivers: () => request('/finance/waivers'),
  },

  // Documents
  documents: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/documents${q ? `?${q}` : ''}`);
    },
    upload: (data) => request('/documents', { method: 'POST', body: data }),
    delete: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  },

  // Portal
  portal: {
    getChildren: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/portal/students${q ? `?${q}` : ''}`);
    },
    getGuardians: () => request('/portal/guardians'),
    sendExcuseNote: (studentId, excuseNote) =>
      request(`/portal/students/${studentId}/excuse-note`, { method: 'POST', body: { excuseNote } }),
  },

  // Notifications & Queue
  notifications: {
    list: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
    clearAll: () => request('/notifications', { method: 'DELETE' }),
    getQueueJobs: () => request('/notifications/queue-jobs'),
  },

  // Users & RBAC
  users: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/users${q ? `?${q}` : ''}`);
    },
    create: (data) => request('/users', { method: 'POST', body: data }),
    toggleStatus: (id) => request(`/users/${id}/status`, { method: 'PATCH' }),
    sendReset: (id) => request(`/users/${id}/send-reset`, { method: 'POST' }),
  },
  rbac: {
    getMatrix: () => request('/rbac/matrix'),
    updateMatrix: (matrix) => request('/rbac/matrix', { method: 'PUT', body: { matrix } }),
    resetMatrix: () => request('/rbac/matrix/reset', { method: 'POST' }),
  },

  // Audit Logs
  audit: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/audit-logs${q ? `?${q}` : ''}`);
    },
    exportUrl: () => `${API_BASE_URL}/audit-logs/export`,
  },
};
