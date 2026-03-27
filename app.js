/* =============================================
   APP.JS — Lumini
   folha mensal e faltas
============================================= */

let currentUser = null;
let currentPage = 'login';
let chartStatus = null;
let chartPayroll = null;
let appReadyPromise = null;

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(`cp_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(`cp_${key}`, JSON.stringify(value));
  if (window.firebaseSync?.enabled) {
    window.firebaseSync.syncCollection(key, value).catch(() => {});
  }
}

function getUsers() { return loadData('users', USUARIOS); }
function saveUsers(data) { saveData('users', data); }
function getEmployees() { return loadData('employees', EMPLOYEES); }
function saveEmployees(data) { saveData('employees', data); }
function getCareers() { return loadData('careers', DEMO_CAREERS); }
function saveCareers(data) { saveData('careers', data); }
function getEvaluations() { return loadData('evaluations', DEMO_EVALUATIONS); }
function saveEvaluations(data) { saveData('evaluations', data); }
function getPayrolls() { return loadData('payrolls', DEMO_PAYROLLS); }
function savePayrolls(data) { saveData('payrolls', data); }

function ensureInitialData() {
  if (!localStorage.getItem('cp_users')) saveUsers(USUARIOS);
  if (!localStorage.getItem('cp_employees')) saveEmployees(EMPLOYEES);
  if (!localStorage.getItem('cp_careers')) saveCareers(DEMO_CAREERS);
  if (!localStorage.getItem('cp_evaluations')) saveEvaluations(DEMO_EVALUATIONS);
  if (!localStorage.getItem('cp_payrolls')) savePayrolls(DEMO_PAYROLLS);
  normalizeStoredData();
}

function normalizeStoredData() {
  const employees = getEmployees().map(emp => ({
    ...emp,
    baseSalary: Number(emp.baseSalary || 0),
    minMonths: Number(emp.minMonths || 12),
    skills: emp.skills || {}
  }));
  saveEmployees(employees);

  const payrolls = getPayrolls().map(item => ({
    ...item,
    baseSalary: Number(item.baseSalary || 0),
    bonuses: Number(item.bonuses || 0),
    deductions: Number(item.deductions || 0),
    overtimeHours: Number(item.overtimeHours || 0),
    absences: Number(item.absences || 0),
    justifiedAbsences: Number(item.justifiedAbsences || 0),
    netSalary: Number(item.netSalary || 0),
    status: item.status || 'pendente',
    verifiedBy: item.verifiedBy || '',
    verifiedAt: item.verifiedAt || ''
  }));
  savePayrolls(payrolls);
}

async function initializeApp() {
  ensureInitialData();
  if (window.firebaseSync?.init) {
    await window.firebaseSync.init();
    normalizeStoredData();
  }
  populateSupervisorSelect();
}

window.addEventListener('DOMContentLoaded', async () => {
  appReadyPromise = initializeApp();
  await appReadyPromise;

  const saved = sessionStorage.getItem('cp_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    startApp();
  }
});

async function doLogin() {
  await appReadyPromise;
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-password').value.trim();
  const errEl = document.getElementById('login-error');

  const user = getUsers().find(u => u.email === email && u.password === pass);
  if (!user) {
    errEl.classList.remove('hidden');
    return;
  }

  errEl.classList.add('hidden');
  currentUser = user;
  sessionStorage.setItem('cp_user', JSON.stringify(user));
  startApp();
}

function startApp() {
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  const initials = getInitials(currentUser.name);
  document.getElementById('user-initials').textContent = initials;
  document.getElementById('user-menu-name').textContent = currentUser.name;
  document.getElementById('user-menu-role').textContent = currentUser.role === 'admin' ? 'RH / Administrador' : 'Supervisor';

  document.getElementById('menu-admin').classList.toggle('hidden', currentUser.role !== 'admin');
  document.getElementById('menu-supervisor').classList.toggle('hidden', currentUser.role !== 'supervisor');

  updateNotifBadge();
  navigateTo(currentUser.role === 'admin' ? 'admin-dashboard' : 'supervisor-home');
}

function doLogout() {
  sessionStorage.removeItem('cp_user');
  currentUser = null;
  location.reload();
}

function togglePass() {
  const inp = document.getElementById('login-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function navigateTo(page) {
  document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.remove('hidden');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(el => el.classList.add('active'));
  currentPage = page;
  closeSidebar();
  window.scrollTo(0, 0);

  const renders = {
    'admin-dashboard': renderAdminDashboard,
    'admin-employees': renderEmployeesTable,
    'admin-payroll': renderAdminPayroll,
    'supervisor-home': renderSupervisorHome,
    'supervisor-employees': renderSupervisorEmployees,
    'supervisor-payroll': renderSupervisorPayroll
  };
  if (renders[page]) renders[page]();
}

function goToDefaultPayrollPage() {
  navigateTo(currentUser?.role === 'admin' ? 'admin-payroll' : 'supervisor-payroll');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}

function toggleUserMenu() {
  document.getElementById('user-menu').classList.toggle('hidden');
}