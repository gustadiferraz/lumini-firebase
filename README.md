# 🚀 Lumini — Gestão de Carreira, Folha & Faltas

Base do projeto original preservada, com foco em:

- tela de login com contas por usuário
- dashboards separados para **RH/Admin** e **Supervisor**
- cadastro individual de funcionários
- conferência mensal de **folha de pagamento**
- controle de **faltas por funcionário**
- sincronização com **Firebase Firestore**

---

## ✅ O que foi implementado

### Login e perfis
- Login mantido com sistema de contas por usuário.
- Perfis separados:
  - **Administrador / RH**
  - **Supervisor**

### RH / Admin
- Dashboard com indicadores de:
  - total de funcionários
  - folhas pendentes
  - faltas do mês
  - folhas conferidas
- Gráficos com Chart.js.
- Gestão de funcionários com:
  - cadastro
  - edição
  - exclusão
  - salário-base
  - vínculo com supervisor
- Tela de **Folhas & Faltas** com filtros por:
  - mês
  - supervisor
  - funcionário
- Visualização individual do histórico mensal por colaborador.

### Supervisor
- Painel com resumo da própria equipe.
- Lista de folhas pendentes de conferência.
- Lista de funcionários com faltas no mês.
- Tela de **Conferência Mensal** somente da equipe do supervisor.

### Folha mensal
Cada registro mensal possui:
- funcionário
- mês de referência
- salário-base
- salário líquido
- bonificações
- descontos
- horas extras
- faltas
- faltas justificadas
- observações
- status da conferência

### Firebase
Foi adicionada estrutura de integração com **Firebase Firestore** via `js/firebase.js`.

Coleções esperadas:
- `users`
- `employees`
- `careers`
- `evaluations`
- `payrolls`

Se o Firebase não estiver configurado, o sistema funciona em **modo local** com dados demo.

---

## 🔧 Como conectar ao Firebase

Abra o arquivo:

```bash
js/firebase.js
```

Substitua os valores abaixo pelos dados do seu projeto Firebase:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

Depois disso, o badge no topo deve mudar para **Firebase conectado**.

---

## 👤 Contas demo

### RH
- `samuelbandez@lumini.com`
- senha: `123456`

### Supervisor
- `danielsoares@lumini.com`
- senha: `123456`

Também há outros supervisores demo já cadastrados no `data.js`.

---

## 📁 Arquivos principais

- `index.html` → estrutura principal da interface
- `css/style.css` → estilo visual
- `js/data.js` → dados demo iniciais
- `js/firebase.js` → integração com Firestore
- `js/app.js` → regras de negócio e navegação

---

## 💡 Próximas melhorias sugeridas

- autenticação real com **Firebase Auth**
- upload de comprovantes / holerites em PDF
- exportação de relatórios em Excel/PDF
- histórico de banco de horas
- assinatura digital de conferência da folha
- registro de advertências e afastamentos
- permissões por área ou unidade
- aprovação em múltiplos níveis (Supervisor → RH → Diretoria)
