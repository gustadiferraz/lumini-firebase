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

document.addEventListener('click', e => {
  const menu = document.getElementById('user-menu');
  if (menu && !menu.classList.contains('hidden') && !e.target.closest('.topbar-right')) {
    menu.classList.add('hidden');
  }
});

function uuid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  return isNaN(date) ? dateStr : date.toLocaleDateString('pt-BR');
}

function formatMonth(monthValue) {
  if (!monthValue) return '—';
  const [year, month] = monthValue.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLatestMonth() {
  const months = getPayrolls().map(item => item.month).filter(Boolean).sort();
  return months[months.length - 1] || currentMonthValue();
}

function calcTenure(admissionDate) {
  const now = new Date();
  const adm = new Date(admissionDate + 'T00:00:00');
  let months = (now.getFullYear() - adm.getFullYear()) * 12 + (now.getMonth() - adm.getMonth());
  if (months < 0) months = 0;
  return months;
}

function tenureText(months) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y > 0) parts.push(`${y} ano${y > 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} mês${m > 1 ? 'es' : ''}`);
  return parts.length ? parts.join(' e ') : 'Recém admitido';
}

function getStatusInfo(employee) {
  const months = calcTenure(employee.admission);
  const pct = Math.min(100, Math.round((months / Number(employee.minMonths || 1)) * 100));
}

function getInitials(name) {
  return (name || 'U').split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function getSupervisorName(email) {
  return getUsers().find(user => user.email === email)?.name || email;
}

function getEmployeeById(id) {
  return getEmployees().find(emp => emp.id === id);
}

function getPayrollById(id) {
  return getPayrolls().find(item => item.id === id);
}

function getAccessibleEmployees() {
  const employees = getEmployees();
  if (!currentUser) return [];
  return currentUser.role === 'admin' ? employees : employees.filter(emp => emp.supervisor === currentUser.email);
}

function getAccessiblePayrolls() {
  const payrolls = getPayrolls();
  if (!currentUser) return [];
  return currentUser.role === 'admin' ? payrolls : payrolls.filter(item => item.supervisorEmail === currentUser.email);
}

function updateNotifBadge() {
  const latestMonth = getLatestMonth();
  const pending = getAccessiblePayrolls().filter(item => item.month === latestMonth && item.status !== 'conferido').length;
  const badge = document.getElementById('badge-count');
  badge.textContent = pending;
  badge.style.display = pending > 0 ? 'flex' : 'none';
}

async function syncAllNow() {
  if (!window.firebaseSync?.enabled) {
    alert('O projeto está em modo local. Para sincronizar, preencha as credenciais em js/firebase.js.');
    return;
  }
  await Promise.all([
    window.firebaseSync.syncCollection('users', getUsers()),
    window.firebaseSync.syncCollection('employees', getEmployees()),
    window.firebaseSync.syncCollection('careers', getCareers()),
    window.firebaseSync.syncCollection('evaluations', getEvaluations()),
    window.firebaseSync.syncCollection('payrolls', getPayrolls())
  ]);
  alert('Sincronização concluída com o Firebase.');
}

function populateSupervisorSelect(selectedValue = '') {
  const select = document.getElementById('emp-supervisor');
  if (!select) return;
  const supervisors = getUsers().filter(user => user.role === 'supervisor');
  select.innerHTML = supervisors.map(user => `<option value="${user.email}">${user.name} (${user.email})</option>`).join('');
  if (selectedValue) select.value = selectedValue;
}

function renderAdminDashboard() {
  const employees = getEmployees();
  const payrolls = getPayrolls();
  const latestMonth = getLatestMonth();
  const monthPayrolls = payrolls.filter(item => item.month === latestMonth);
  const pending = monthPayrolls.filter(item => item.status !== 'conferido');
  const absences = monthPayrolls.reduce((sum, item) => sum + Number(item.absences || 0), 0);
  const verified = monthPayrolls.filter(item => item.status === 'conferido').length;

  document.getElementById('stat-total-employees').textContent = employees.length;
  document.getElementById('stat-payroll-pending').textContent = pending.length;
  document.getElementById('stat-absences-month').textContent = absences;
  document.getElementById('stat-verified-month').textContent = verified;

  const statusCount = {
    period: employees.filter(emp => getStatusInfo(emp).cls === 'status-period').length,
  };

  
  const absenceList = document.getElementById('dashboard-absence-list');
  const absenceEmployees = monthPayrolls.filter(item => Number(item.absences || 0) > 0);
  absenceList.innerHTML = absenceEmployees.length
    ? absenceEmployees.map(item => `
      <div class="recent-item">
        <div class="recent-avatar">${getInitials(item.employeeName)}</div>
        <div class="recent-info">
          <div class="recent-name">${item.employeeName}</div>
          <div class="recent-detail">${getEmployeeById(item.employeeId)?.sector || 'Setor não informado'} · ${getSupervisorName(item.supervisorEmail)}</div>
        </div>
        <span class="recent-badge danger">${item.absences} falta(s)</span>
      </div>
    `).join('')
    : `<div class="empty-state"><i class="fas fa-check-circle"></i><p>Nenhuma falta registrada em ${formatMonth(latestMonth)}.</p></div>`;

  const pendingList = document.getElementById('dashboard-payroll-pending-list');
  pendingList.innerHTML = pending.length
    ? pending.map(item => `
      <div class="recent-item clickable" onclick="openPayrollModal('${item.id}')">
        <div class="recent-avatar">${getInitials(item.employeeName)}</div>
        <div class="recent-info">
          <div class="recent-name">${item.employeeName}</div>
          <div class="recent-detail">${formatMonth(item.month)} · ${getSupervisorName(item.supervisorEmail)}</div>
        </div>
        <span class="recent-badge warning">Pendente</span>
      </div>
    `).join('')
    : `<div class="empty-state"><i class="fas fa-file-circle-check"></i><p>Todas as folhas do mês já foram conferidas.</p></div>`;
}

function renderEmployeesTable() {
  const search = (document.getElementById('search-employees')?.value || '').toLowerCase();
  const employees = getEmployees().filter(emp => {
    return !search || [emp.name, emp.sector, emp.currentRole, emp.desiredRole, getSupervisorName(emp.supervisor)]
      .join(' ')
      .toLowerCase()
      .includes(search);
  });

  const tbody = document.getElementById('employees-tbody');
  if (!tbody) return;

  tbody.innerHTML = employees.length ? employees.map(emp => {
    const status = getStatusInfo(emp);
    return `
      <tr>
        <td>
          <div class="emp-name-cell">
            <div class="emp-table-avatar">${getInitials(emp.name)}</div>
            <div>
              <div class="emp-table-name">${emp.name}</div>
              <div class="emp-table-sector">${emp.sector}</div>
            </div>
          </div>
        </td>
        <td>${getSupervisorName(emp.supervisor)}</td>
        <td>${emp.currentRole}<br><span class="data-muted">→ ${emp.desiredRole}</span></td>
        <td>${formatCurrency(emp.baseSalary)}</td>
        <td><span class="status-badge ${status.cls}">${status.label}</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn-outline btn-sm" onclick="viewEmployee('${emp.id}')"><i class="fas fa-eye"></i></button>
            <button class="btn-outline btn-sm" onclick="goToEmployeePayroll('${emp.id}')"><i class="fas fa-file-invoice-dollar"></i></button>
            <button class="btn-primary btn-sm" onclick="openEditEmployee('${emp.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-danger btn-sm" onclick="deleteEmployee('${emp.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('') : `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-search"></i><p>Nenhum funcionário encontrado.</p></div></td></tr>`;
}

function openAddEmployee() {
  populateSupervisorSelect();
  document.getElementById('modal-employee-title').textContent = 'Novo Funcionário';
  document.getElementById('emp-id').value = '';
  document.getElementById('emp-name').value = '';
  document.getElementById('emp-sector').value = '';
  document.getElementById('emp-current-role').value = '';
  document.getElementById('emp-desired-role').value = '';
  document.getElementById('emp-admission').value = '';
  document.getElementById('emp-min-months').value = 12;
  document.getElementById('emp-base-salary').value = '';
  openModal('modal-employee');
}

function openEditEmployee(id) {
  const emp = getEmployeeById(id);
  if (!emp) return;
  populateSupervisorSelect(emp.supervisor);
  document.getElementById('modal-employee-title').textContent = 'Editar Funcionário';
  document.getElementById('emp-id').value = emp.id;
  document.getElementById('emp-name').value = emp.name;
  document.getElementById('emp-sector').value = emp.sector;
  document.getElementById('emp-current-role').value = emp.currentRole;
  document.getElementById('emp-desired-role').value = emp.desiredRole;
  document.getElementById('emp-admission').value = emp.admission;
  document.getElementById('emp-min-months').value = emp.minMonths;
  document.getElementById('emp-base-salary').value = emp.baseSalary;
  openModal('modal-employee');
}

function saveEmployee() {
  const id = document.getElementById('emp-id').value;
  const payload = {
    id: id || uuid('emp'),
    name: document.getElementById('emp-name').value.trim(),
    sector: document.getElementById('emp-sector').value.trim(),
    currentRole: document.getElementById('emp-current-role').value.trim(),
    desiredRole: document.getElementById('emp-desired-role').value.trim(),
    admission: document.getElementById('emp-admission').value,
    minMonths: Number(document.getElementById('emp-min-months').value || 12),
    supervisor: document.getElementById('emp-supervisor').value,
    baseSalary: Number(document.getElementById('emp-base-salary').value || 0)
  };

  if (!payload.name || !payload.sector || !payload.currentRole || !payload.desiredRole || !payload.admission || !payload.supervisor || !payload.baseSalary) {
    alert('Preencha todos os campos obrigatórios do funcionário.');
    return;
  }

  const months = calcTenure(payload.admission);
  const employees = getEmployees();
  const existing = employees.find(emp => emp.id === payload.id);
  const newEmployee = {
    ...existing,
    ...payload,
    status: existing?.status || (months >= payload.minMonths ? 'ready' : 'period'),
    skills: existing?.skills || {}
  };

  const updated = existing
    ? employees.map(emp => emp.id === payload.id ? newEmployee : emp)
    : [...employees, newEmployee];

  saveEmployees(updated);
  closeModal('modal-employee');
  populateSupervisorSelect();
  renderEmployeesTable();
  renderAdminDashboard();
}

function deleteEmployee(id) {
  if (!confirm('Deseja realmente excluir este funcionário?')) return;
  saveEmployees(getEmployees().filter(emp => emp.id !== id));
  savePayrolls(getPayrolls().filter(item => item.employeeId !== id));
  renderEmployeesTable();
  renderAdminDashboard();
  updateNotifBadge();
}

function viewEmployee(id) {
  const emp = getEmployeeById(id);
  if (!emp) return;

  const payrolls = getPayrolls().filter(item => item.employeeId === id).sort((a, b) => b.month.localeCompare(a.month));
  const totalAbsences = payrolls.reduce((sum, item) => sum + Number(item.absences || 0), 0);
  const lastPayroll = payrolls[0];
  const status = getStatusInfo(emp);

  document.getElementById('modal-employee-view-body').innerHTML = `
    <div class="employee-view-header">
      <div class="emp-avatar large">${getInitials(emp.name)}</div>
      <div>
        <div class="view-title-row">
          <h3>${emp.name}</h3>
          <span class="status-badge ${status.cls}">${status.label}</span>
        </div>
        <p class="data-muted">${emp.currentRole} → ${emp.desiredRole}</p>
        <p class="data-muted">Supervisor: ${getSupervisorName(emp.supervisor)}</p>
      </div>
    </div>

    <div class="employee-view-grid">
      <div class="view-card"><span class="view-label">Setor</span><strong>${emp.sector}</strong></div>
      <div class="view-card"><span class="view-label">Admissão</span><strong>${formatDate(emp.admission)}</strong></div>
      <div class="view-card"><span class="view-label">Tempo de casa</span><strong>${tenureText(calcTenure(emp.admission))}</strong></div>
      <div class="view-card"><span class="view-label">Salário base</span><strong>${formatCurrency(emp.baseSalary)}</strong></div>
      <div class="view-card"><span class="view-label">Total de faltas</span><strong>${totalAbsences}</strong></div>
      <div class="view-card"><span class="view-label">Última folha</span><strong>${lastPayroll ? formatMonth(lastPayroll.month) : 'Sem registro'}</strong></div>
    </div>

    <div class="section-block">
      <div class="section-block-head">
        <h4><i class="fas fa-file-invoice-dollar"></i> Histórico individual de folha e faltas</h4>
        <button class="btn-outline btn-sm" onclick="closeModal('modal-employee-view'); goToEmployeePayroll('${emp.id}')">Abrir tela mensal</button>
      </div>
      ${payrolls.length ? `
        <div class="table-wrapper">
          <table class="data-table compact-table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Salário Líquido</th>
                <th>Faltas</th>
                <th>Bonificações</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${payrolls.slice(0, 6).map(item => `
                <tr>
                  <td>${formatMonth(item.month)}</td>
                  <td>${formatCurrency(item.netSalary)}</td>
                  <td>${item.absences} (${item.justifiedAbsences} justificadas)</td>
                  <td>${formatCurrency(item.bonuses)}</td>
                  <td><span class="status-badge ${item.status === 'conferido' ? 'status-approved' : 'status-ready'}">${item.status === 'conferido' ? 'Conferido' : 'Pendente'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`
      : `<div class="empty-state"><i class="fas fa-file-circle-plus"></i><p>Ainda não há folhas registradas para este funcionário.</p></div>`}
    </div>
  `;

  openModal('modal-employee-view');
}

function renderAdminPayroll() {
  const latestMonth = getLatestMonth();
  const monthInput = document.getElementById('admin-payroll-month');
  if (!monthInput.value) monthInput.value = latestMonth;

  const supervisors = getUsers().filter(user => user.role === 'supervisor');
  const supervisorSelect = document.getElementById('admin-payroll-supervisor');
  const currentValue = supervisorSelect.value;
  supervisorSelect.innerHTML = `<option value="">Todos</option>${supervisors.map(user => `<option value="${user.email}">${user.name}</option>`).join('')}`;
  supervisorSelect.value = currentValue;

  const selectedMonth = monthInput.value || latestMonth;
  const selectedSupervisor = supervisorSelect.value;
  const search = (document.getElementById('admin-payroll-search').value || '').toLowerCase();

  let records = getPayrolls().filter(item => item.month === selectedMonth);
  if (selectedSupervisor) records = records.filter(item => item.supervisorEmail === selectedSupervisor);
  if (search) records = records.filter(item => item.employeeName.toLowerCase().includes(search));

  renderPayrollSummary('admin-payroll-summary', records, true);
  renderPayrollCards('admin-payroll-list', records, true);
}

function renderSupervisorHome() {
  const employees = getAccessibleEmployees();
  const latestMonth = getLatestMonth();
  const payrolls = getAccessiblePayrolls().filter(item => item.month === latestMonth);
  const pending = payrolls.filter(item => item.status !== 'conferido');
  const withAbsences = payrolls.filter(item => Number(item.absences || 0) > 0);

  document.getElementById('supervisor-greeting').textContent = `Olá, ${currentUser.name}! Você acompanha ${employees.length} colaborador(es).`;
  document.getElementById('sup-total-team').textContent = employees.length;
  document.getElementById('sup-payroll-pending').textContent = pending.length;
  document.getElementById('sup-absences-month').textContent = withAbsences.reduce((sum, item) => sum + item.absences, 0);

  const alertEl = document.getElementById('supervisor-alert');
  const alertText = document.getElementById('supervisor-alert-text');
  if (pending.length) {
    alertEl.classList.remove('hidden');
    alertText.textContent = `Você possui ${pending.length} folha(s) pendente(s) de conferência em ${formatMonth(latestMonth)}.`;
  } else {
    alertEl.classList.add('hidden');
  }

  document.getElementById('sup-pending-payrolls').innerHTML = pending.length
    ? pending.map(item => `
      <div class="recent-item clickable" onclick="openPayrollModal('${item.id}')">
        <div class="recent-avatar">${getInitials(item.employeeName)}</div>
        <div class="recent-info">
          <div class="recent-name">${item.employeeName}</div>
          <div class="recent-detail">${formatCurrency(item.netSalary)} · ${item.overtimeHours}h extras</div>
        </div>
        <span class="recent-badge warning">Pendente</span>
      </div>
    `).join('')
    : `<div class="empty-state"><i class="fas fa-check-circle"></i><p>Nenhuma folha pendente neste mês.</p></div>`;

  document.getElementById('sup-absence-employees').innerHTML = withAbsences.length
    ? withAbsences.map(item => `
      <div class="recent-item clickable" onclick="goToEmployeePayroll('${item.employeeId}')">
        <div class="recent-avatar">${getInitials(item.employeeName)}</div>
        <div class="recent-info">
          <div class="recent-name">${item.employeeName}</div>
          <div class="recent-detail">${formatMonth(item.month)} · ${item.justifiedAbsences} justificadas</div>
        </div>
        <span class="recent-badge danger">${item.absences} falta(s)</span>
      </div>
    `).join('')
    : `<div class="empty-state"><i class="fas fa-user-check"></i><p>Sem faltas registradas no mês atual.</p></div>`;
}

function renderSupervisorEmployees() {
  const list = document.getElementById('sup-team-list');
  const employees = getAccessibleEmployees();
  const latestMonth = getLatestMonth();
  const payrolls = getAccessiblePayrolls().filter(item => item.month === latestMonth);

  list.innerHTML = employees.length ? employees.map(emp => {
    const payroll = payrolls.find(item => item.employeeId === emp.id);
    const status = getStatusInfo(emp);
    return `
      <div class="emp-card">
        <div class="emp-card-header">
          <div class="emp-avatar">${getInitials(emp.name)}</div>
          <div class="emp-meta">
            <div class="emp-name">${emp.name}</div>
            <div class="emp-role">${emp.currentRole} → ${emp.desiredRole}</div>
            <div class="emp-tenure"><i class="fas fa-calendar-alt"></i> ${tenureText(calcTenure(emp.admission))}</div>
          </div>
          <span class="status-badge ${status.cls}">${status.label}</span>
        </div>
        <div class="emp-card-body">
          <div class="emp-card-info info-grid-3">
            <div class="emp-info-item"><div class="emp-info-label">Salário base</div><div class="emp-info-value">${formatCurrency(emp.baseSalary)}</div></div>
            <div class="emp-info-item"><div class="emp-info-label">Faltas no mês</div><div class="emp-info-value">${payroll ? payroll.absences : 0}</div></div>
            <div class="emp-info-item"><div class="emp-info-label">Folha</div><div class="emp-info-value">${payroll?.status === 'conferido' ? 'Conferida' : 'Pendente'}</div></div>
          </div>
          <div class="emp-card-actions">
            <button class="btn-outline" onclick="viewEmployee('${emp.id}')"><i class="fas fa-eye"></i> Ver ficha</button>
            <button class="btn-primary" onclick="goToEmployeePayroll('${emp.id}')"><i class="fas fa-file-invoice-dollar"></i> Folha & faltas</button>
          </div>
        </div>
      </div>
    `;
  }).join('') : `<div class="empty-state"><i class="fas fa-users"></i><p>Nenhum colaborador vinculado ao seu usuário.</p></div>`;
}

function renderSupervisorPayroll() {
  const monthInput = document.getElementById('supervisor-payroll-month');
  if (!monthInput.value) monthInput.value = getLatestMonth();

  const employeeSelect = document.getElementById('supervisor-payroll-employee');
  const selected = employeeSelect.value;
  employeeSelect.innerHTML = `<option value="">Todos da equipe</option>${getAccessibleEmployees().map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('')}`;
  employeeSelect.value = selected;

  const selectedMonth = monthInput.value || getLatestMonth();
  const selectedEmployee = employeeSelect.value;

  let records = getAccessiblePayrolls().filter(item => item.month === selectedMonth);
  if (selectedEmployee) records = records.filter(item => item.employeeId === selectedEmployee);

  renderPayrollSummary('supervisor-payroll-summary', records, false);
  renderPayrollCards('supervisor-payroll-list', records, false);
}

function renderPayrollSummary(containerId, records, showSupervisor) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalNet = records.reduce((sum, item) => sum + Number(item.netSalary || 0), 0);
  const totalBonuses = records.reduce((sum, item) => sum + Number(item.bonuses || 0), 0);
  const totalAbsences = records.reduce((sum, item) => sum + Number(item.absences || 0), 0);
  const pending = records.filter(item => item.status !== 'conferido').length;

  container.innerHTML = `
    <div class="mini-kpi-card">
      <span class="mini-kpi-label">Registros</span>
      <strong>${records.length}</strong>
    </div>
    <div class="mini-kpi-card">
      <span class="mini-kpi-label">Salário líquido total</span>
      <strong>${formatCurrency(totalNet)}</strong>
    </div>
    <div class="mini-kpi-card">
      <span class="mini-kpi-label">Bonificações</span>
      <strong>${formatCurrency(totalBonuses)}</strong>
    </div>
    <div class="mini-kpi-card">
      <span class="mini-kpi-label">Faltas</span>
      <strong>${totalAbsences}</strong>
    </div>
    <div class="mini-kpi-card ${pending ? 'pending' : 'ok'}">
      <span class="mini-kpi-label">Pendências</span>
      <strong>${pending}${showSupervisor ? ' folha(s)' : ''}</strong>
    </div>
  `;
}

function renderPayrollCards(containerId, records, canCreate) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const sorted = [...records].sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  container.innerHTML = sorted.length ? sorted.map(item => `
    <div class="payroll-card">
      <div class="payroll-card-head">
        <div>
          <h4>${item.employeeName}</h4>
          <p>${formatMonth(item.month)} · ${getSupervisorName(item.supervisorEmail)}</p>
        </div>
        <span class="status-badge ${item.status === 'conferido' ? 'status-approved' : 'status-ready'}">${item.status === 'conferido' ? 'Conferido' : 'Pendente'}</span>
      </div>
      <div class="payroll-metrics">
        <div><span>Salário base</span><strong>${formatCurrency(item.baseSalary)}</strong></div>
        <div><span>Líquido</span><strong>${formatCurrency(item.netSalary)}</strong></div>
        <div><span>Bônus</span><strong>${formatCurrency(item.bonuses)}</strong></div>
        <div><span>Descontos</span><strong>${formatCurrency(item.deductions)}</strong></div>
        <div><span>Horas extras</span><strong>${item.overtimeHours}h</strong></div>
        <div><span>Faltas</span><strong>${item.absences}</strong></div>
      </div>
      <div class="payroll-notes">${item.notes || 'Sem observações.'}</div>
      <div class="payroll-footer">
        <small>${item.verifiedBy ? `Conferido por ${item.verifiedBy} em ${formatDate(item.verifiedAt)}` : 'Ainda não conferido'}</small>
        <div class="actions-cell">
          <button class="btn-outline btn-sm" onclick="openPayrollModal('${item.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-primary btn-sm" onclick="togglePayrollVerification('${item.id}')"><i class="fas fa-check"></i> ${item.status === 'conferido' ? 'Reabrir' : 'Conferir'}</button>
        </div>
      </div>
    </div>
  `).join('') : `
    <div class="empty-state wide-empty">
      <i class="fas fa-file-circle-plus"></i>
      <p>Nenhum registro encontrado para os filtros selecionados.</p>
      ${canCreate ? '<button class="btn-primary" onclick="openAddPayroll()"><i class="fas fa-plus"></i> Criar folha</button>' : ''}
    </div>
  `;
}

function fillPayrollEmployeeSelect(selectedEmployeeId = '') {
  const select = document.getElementById('payroll-employee');
  const employees = currentUser?.role === 'admin' ? getEmployees() : getAccessibleEmployees();
  select.innerHTML = employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
  if (selectedEmployeeId) select.value = selectedEmployeeId;
}

function openAddPayroll() {
  const selectedEmployee = currentUser.role === 'admin' ? '' : (document.getElementById('supervisor-payroll-employee')?.value || '');
  fillPayrollEmployeeSelect(selectedEmployee);
  document.getElementById('modal-payroll-title').textContent = 'Nova Folha';
  document.getElementById('payroll-id').value = '';
  document.getElementById('payroll-month').value = currentPage === 'admin-payroll'
    ? (document.getElementById('admin-payroll-month').value || getLatestMonth())
    : (document.getElementById('supervisor-payroll-month').value || getLatestMonth());
  document.getElementById('payroll-bonuses').value = 0;
  document.getElementById('payroll-deductions').value = 0;
  document.getElementById('payroll-overtime').value = 0;
  document.getElementById('payroll-absences').value = 0;
  document.getElementById('payroll-justified-absences').value = 0;
  document.getElementById('payroll-status').value = 'pendente';
  document.getElementById('payroll-notes').value = '';
  applyEmployeeBaseSalary();
  document.getElementById('payroll-net-salary').value = document.getElementById('payroll-base-salary').value;
  openModal('modal-payroll');
}

function openPayrollModal(id) {
  const item = getPayrollById(id);
  if (!item) return;
  fillPayrollEmployeeSelect(item.employeeId);
  document.getElementById('modal-payroll-title').textContent = 'Editar Folha';
  document.getElementById('payroll-id').value = item.id;
  document.getElementById('payroll-month').value = item.month;
  document.getElementById('payroll-base-salary').value = item.baseSalary;
  document.getElementById('payroll-net-salary').value = item.netSalary;
  document.getElementById('payroll-bonuses').value = item.bonuses;
  document.getElementById('payroll-deductions').value = item.deductions;
  document.getElementById('payroll-overtime').value = item.overtimeHours;
  document.getElementById('payroll-absences').value = item.absences;
  document.getElementById('payroll-justified-absences').value = item.justifiedAbsences;
  document.getElementById('payroll-status').value = item.status;
  document.getElementById('payroll-notes').value = item.notes || '';
  openModal('modal-payroll');
}

function applyEmployeeBaseSalary() {
  const employeeId = document.getElementById('payroll-employee').value;
  const employee = getEmployeeById(employeeId);
  if (!employee) return;
  document.getElementById('payroll-base-salary').value = employee.baseSalary || 0;
}

document.addEventListener('change', event => {
  if (event.target.id === 'payroll-employee') applyEmployeeBaseSalary();
});

function savePayrollRecord() {
  const id = document.getElementById('payroll-id').value || uuid('pay');
  const employeeId = document.getElementById('payroll-employee').value;
  const employee = getEmployeeById(employeeId);
  if (!employee) {
    alert('Selecione um funcionário válido.');
    return;
  }

  if (currentUser.role !== 'admin' && employee.supervisor !== currentUser.email) {
    alert('Você não pode editar folhas de outro supervisor.');
    return;
  }

  const payload = {
    id,
    employeeId,
    employeeName: employee.name,
    supervisorEmail: employee.supervisor,
    month: document.getElementById('payroll-month').value,
    baseSalary: Number(document.getElementById('payroll-base-salary').value || 0),
    netSalary: Number(document.getElementById('payroll-net-salary').value || 0),
    bonuses: Number(document.getElementById('payroll-bonuses').value || 0),
    deductions: Number(document.getElementById('payroll-deductions').value || 0),
    overtimeHours: Number(document.getElementById('payroll-overtime').value || 0),
    absences: Number(document.getElementById('payroll-absences').value || 0),
    justifiedAbsences: Number(document.getElementById('payroll-justified-absences').value || 0),
    status: document.getElementById('payroll-status').value,
    notes: document.getElementById('payroll-notes').value.trim()
  };

  if (!payload.month || !payload.baseSalary || !payload.netSalary) {
    alert('Preencha mês, salário base e salário líquido.');
    return;
  }

  const existing = getPayrollById(id);
  if (payload.status === 'conferido') {
    payload.verifiedBy = currentUser.name;
    payload.verifiedAt = new Date().toISOString().split('T')[0];
  } else {
    payload.verifiedBy = existing?.verifiedBy || '';
    payload.verifiedAt = existing?.verifiedAt || '';
  }

  const payrolls = getPayrolls();
  const updated = existing
    ? payrolls.map(item => item.id === id ? { ...existing, ...payload } : item)
    : [...payrolls, payload];

  savePayrolls(updated);
  closeModal('modal-payroll');
  updateNotifBadge();
  rerenderCurrentPage();
}

function togglePayrollVerification(id) {
  const payrolls = getPayrolls();
  const updated = payrolls.map(item => {
    if (item.id !== id) return item;
    const nextStatus = item.status === 'conferido' ? 'pendente' : 'conferido';
    return {
      ...item,
      status: nextStatus,
      verifiedBy: nextStatus === 'conferido' ? currentUser.name : '',
      verifiedAt: nextStatus === 'conferido' ? new Date().toISOString().split('T')[0] : ''
    };
  });
  savePayrolls(updated);
  updateNotifBadge();
  rerenderCurrentPage();
}

function rerenderCurrentPage() {
  if (currentPage === 'admin-dashboard') renderAdminDashboard();
  if (currentPage === 'admin-employees') renderEmployeesTable();
  if (currentPage === 'admin-payroll') renderAdminPayroll();
  if (currentPage === 'supervisor-home') renderSupervisorHome();
  if (currentPage === 'supervisor-employees') renderSupervisorEmployees();
  if (currentPage === 'supervisor-payroll') renderSupervisorPayroll();
}

function goToEmployeePayroll(employeeId) {
  const targetPage = currentUser.role === 'admin' ? 'admin-payroll' : 'supervisor-payroll';
  navigateTo(targetPage);
  setTimeout(() => {
    if (targetPage === 'admin-payroll') {
      document.getElementById('admin-payroll-search').value = getEmployeeById(employeeId)?.name || '';
      renderAdminPayroll();
    } else {
      document.getElementById('supervisor-payroll-employee').value = employeeId;
      renderSupervisorPayroll();
    }
  }, 0);
}

function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function closeModalOverlay(event, id) {
  if (event.target === document.getElementById(id)) closeModal(id);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['modal-employee', 'modal-employee-view', 'modal-payroll'].forEach(closeModal);
  }
});
