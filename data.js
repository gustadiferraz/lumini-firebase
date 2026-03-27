/* =============================================
   DATA.JS — Dados iniciais
   Lumini / Folha Mensal e Faltas
============================================= */

const USUARIOS = [
  { id: 'usr-001', email: 'samuelbandez@lumini.com', password: '123456', role: 'admin',      name: 'Samuel Bandez',  supervisor: false },
  { id: 'usr-002', email: 'danielsoares@lumini.com',  password: '123456', role: 'supervisor', name: 'Daniel Soares',  supervisor: true },
  { id: 'usr-003', email: 'kauelima@lumini.com',      password: '123456', role: 'supervisor', name: 'Kaue Lima',      supervisor: true },
  { id: 'usr-004', email: 'helciopacheco@lumini.com', password: '223344', role: 'supervisor', name: 'Helcio Pacheco', supervisor: true },
  { id: 'usr-005', email: 'tonicarlos@lumini.com',    password: '445566', role: 'supervisor', name: 'Toni Carlos',    supervisor: true },
];

const EMPLOYEES = [
  {
    id: 'emp-001',
    name: 'Carlos Silva',
    sector: 'Produção',
    currentRole: 'Auxiliar de Produção',
    desiredRole: 'Operador de Máquinas',
    admission: '2023-01-15',
    minMonths: 12,
    supervisor: 'danielsoares@lumini.com',
    baseSalary: 2480,
    status: 'ready',
    skills: {
      'Operação de Equipamentos': 2,
      'Leitura de Ordens': 1,
      'Segurança do Trabalho': 2,
      'Controle de Qualidade': 1,
      'Manutenção Básica': 0
    }
  },
  {
    id: 'emp-002',
    name: 'Ana Souza',
    sector: 'Produção',
    currentRole: 'Operador de Máquinas',
    desiredRole: 'Técnico de Produção',
    admission: '2024-07-01',
    minMonths: 18,
    supervisor: 'danielsoares@lumini.com',
    baseSalary: 3180,
    status: 'period',
    skills: {
      'Operação de Equipamentos': 3,
      'Leitura de Ordens': 2,
      'Segurança do Trabalho': 2,
      'Controle de Qualidade': 1,
      'Manutenção Básica': 1
    }
  },
  {
    id: 'emp-003',
    name: 'Roberto Lima',
    sector: 'Manutenção',
    currentRole: 'Técnico de Produção',
    desiredRole: 'Líder de Turno',
    admission: '2022-02-10',
    minMonths: 24,
    supervisor: 'kauelima@lumini.com',
    baseSalary: 4270,
    status: 'ready',
    skills: {
      'Operação de Equipamentos': 3,
      'Leitura de Ordens': 3,
      'Segurança do Trabalho': 3,
      'Controle de Qualidade': 2,
      'Manutenção Básica': 3
    }
  },
  {
    id: 'emp-004',
    name: 'Juliana Costa',
    sector: 'Logística',
    currentRole: 'Auxiliar de Logística',
    desiredRole: 'Operador de Logística',
    admission: '2024-09-10',
    minMonths: 12,
    supervisor: 'helciopacheco@lumini.com',
    baseSalary: 2360,
    status: 'period',
    skills: {
      'Operação de Equipamentos': 0,
      'Leitura de Ordens': 1,
      'Segurança do Trabalho': 1,
      'Controle de Qualidade': 0,
      'Manutenção Básica': 0
    }
  },
  {
    id: 'emp-005',
    name: 'Marcos Oliveira',
    sector: 'Produção',
    currentRole: 'Líder de Turno',
    desiredRole: 'Supervisor de Produção',
    admission: '2021-03-05',
    minMonths: 36,
    supervisor: 'tonicarlos@lumini.com',
    baseSalary: 6120,
    status: 'promoted',
    skills: {
      'Operação de Equipamentos': 3,
      'Leitura de Ordens': 3,
      'Segurança do Trabalho': 3,
      'Controle de Qualidade': 3,
      'Manutenção Básica': 2
    }
  },
  {
    id: 'emp-006',
    name: 'Fernanda Rocha',
    sector: 'Qualidade',
    currentRole: 'Auxiliar de Qualidade',
    desiredRole: 'Técnico de Qualidade',
    admission: '2023-11-20',
    minMonths: 12,
    supervisor: 'helciopacheco@lumini.com',
    baseSalary: 2890,
    status: 'approved',
    skills: {
      'Operação de Equipamentos': 1,
      'Leitura de Ordens': 2,
      'Segurança do Trabalho': 2,
      'Controle de Qualidade': 3,
      'Manutenção Básica': 0
    }
  }
];

const DEMO_PAYROLLS = [
  { id: 'pay-001', employeeId: 'emp-001', employeeName: 'Carlos Silva',   supervisorEmail: 'danielsoares@lumini.com', month: '2026-01', baseSalary: 2480, bonuses: 180, deductions: 90,  overtimeHours: 12, absences: 1, justifiedAbsences: 1, netSalary: 2570, status: 'conferido', notes: 'Fechamento mensal validado sem divergências.', verifiedBy: 'Daniel Soares', verifiedAt: '2026-02-03' },
  { id: 'pay-002', employeeId: 'emp-001', employeeName: 'Carlos Silva',   supervisorEmail: 'danielsoares@lumini.com', month: '2026-02', baseSalary: 2480, bonuses: 240, deductions: 120, overtimeHours: 16, absences: 0, justifiedAbsences: 0, netSalary: 2600, status: 'pendente',  notes: 'Aguardando validação do RH.', verifiedBy: '', verifiedAt: '' },
  { id: 'pay-003', employeeId: 'emp-002', employeeName: 'Ana Souza',      supervisorEmail: 'danielsoares@lumini.com', month: '2026-01', baseSalary: 3180, bonuses: 210, deductions: 140, overtimeHours: 10, absences: 2, justifiedAbsences: 1, netSalary: 3250, status: 'conferido', notes: 'Conferido com ajuste de desconto de vale.', verifiedBy: 'Daniel Soares', verifiedAt: '2026-02-03' },
  { id: 'pay-004', employeeId: 'emp-002', employeeName: 'Ana Souza',      supervisorEmail: 'danielsoares@lumini.com', month: '2026-02', baseSalary: 3180, bonuses: 160, deductions: 210, overtimeHours: 6,  absences: 1, justifiedAbsences: 0, netSalary: 3130, status: 'pendente',  notes: 'Revisar banco de horas.', verifiedBy: '', verifiedAt: '' },
  { id: 'pay-005', employeeId: 'emp-003', employeeName: 'Roberto Lima',   supervisorEmail: 'kauelima@lumini.com',     month: '2026-01', baseSalary: 4270, bonuses: 320, deductions: 170, overtimeHours: 15, absences: 0, justifiedAbsences: 0, netSalary: 4420, status: 'conferido', notes: 'Mês sem faltas.', verifiedBy: 'Kaue Lima', verifiedAt: '2026-02-02' },
  { id: 'pay-006', employeeId: 'emp-003', employeeName: 'Roberto Lima',   supervisorEmail: 'kauelima@lumini.com',     month: '2026-02', baseSalary: 4270, bonuses: 280, deductions: 120, overtimeHours: 11, absences: 0, justifiedAbsences: 0, netSalary: 4430, status: 'conferido', notes: 'Conferido e aprovado.', verifiedBy: 'Kaue Lima', verifiedAt: '2026-03-02' },
  { id: 'pay-007', employeeId: 'emp-004', employeeName: 'Juliana Costa',  supervisorEmail: 'helciopacheco@lumini.com', month: '2026-01', baseSalary: 2360, bonuses: 140, deductions: 80,  overtimeHours: 8,  absences: 1, justifiedAbsences: 1, netSalary: 2420, status: 'conferido', notes: 'Sem pendências.', verifiedBy: 'Helcio Pacheco', verifiedAt: '2026-02-01' },
  { id: 'pay-008', employeeId: 'emp-004', employeeName: 'Juliana Costa',  supervisorEmail: 'helciopacheco@lumini.com', month: '2026-02', baseSalary: 2360, bonuses: 110, deductions: 150, overtimeHours: 5,  absences: 2, justifiedAbsences: 1, netSalary: 2320, status: 'pendente',  notes: 'Validar duas ocorrências de ausência.', verifiedBy: '', verifiedAt: '' },
  { id: 'pay-009', employeeId: 'emp-005', employeeName: 'Marcos Oliveira',supervisorEmail: 'tonicarlos@lumini.com',    month: '2026-01', baseSalary: 6120, bonuses: 540, deductions: 260, overtimeHours: 9,  absences: 0, justifiedAbsences: 0, netSalary: 6400, status: 'conferido', notes: 'Folha aprovada.', verifiedBy: 'Toni Carlos', verifiedAt: '2026-02-02' },
  { id: 'pay-010', employeeId: 'emp-005', employeeName: 'Marcos Oliveira',supervisorEmail: 'tonicarlos@lumini.com',    month: '2026-02', baseSalary: 6120, bonuses: 610, deductions: 250, overtimeHours: 11, absences: 0, justifiedAbsences: 0, netSalary: 6480, status: 'conferido', notes: 'Indicadores mantidos.', verifiedBy: 'Toni Carlos', verifiedAt: '2026-03-01' },
  { id: 'pay-011', employeeId: 'emp-006', employeeName: 'Fernanda Rocha', supervisorEmail: 'helciopacheco@lumini.com', month: '2026-01', baseSalary: 2890, bonuses: 190, deductions: 70,  overtimeHours: 7,  absences: 0, justifiedAbsences: 0, netSalary: 3010, status: 'conferido', notes: 'Sem inconsistências.', verifiedBy: 'Helcio Pacheco', verifiedAt: '2026-02-01' },
  { id: 'pay-012', employeeId: 'emp-006', employeeName: 'Fernanda Rocha', supervisorEmail: 'helciopacheco@lumini.com', month: '2026-02', baseSalary: 2890, bonuses: 230, deductions: 95,  overtimeHours: 9,  absences: 1, justifiedAbsences: 1, netSalary: 3025, status: 'pendente',  notes: 'Confirmar justificativa médica anexada.', verifiedBy: '', verifiedAt: '' },
];