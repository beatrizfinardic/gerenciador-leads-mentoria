const LEADS_KEY = "leads_mentoria_titulares";

const STATUSES = [
  { key: "prospect", label: "Prospect" },
  { key: "qualificado", label: "Qualificado" },
  { key: "em_conversa", label: "Em conversa" },
  { key: "apresentacao", label: "Apresentação" },
  { key: "convertido", label: "Convertido" },
  { key: "perdido", label: "Perdido" },
];

const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]));

const form = document.getElementById("lead-form");
const leadIdInput = document.getElementById("lead-id");
const nomeInput = document.getElementById("nome");
const emailInput = document.getElementById("email");
const whatsappInput = document.getElementById("whatsapp");
const profissaoInput = document.getElementById("profissao");
const contextoInput = document.getElementById("contexto");
const origemInput = document.getElementById("origem");
const abordadoPorInput = document.getElementById("abordado-por");
const statusInput = document.getElementById("status");
const dificuldadeInput = document.getElementById("dificuldade");
const onlineInput = document.getElementById("online");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const origemFilter = document.getElementById("origem-filter");
const statusFilter = document.getElementById("status-filter");
const abordadoFilter = document.getElementById("abordado-filter");

const tbody = document.getElementById("leads-tbody");
const emptyState = document.getElementById("empty-state");
const dashboardEl = document.getElementById("dashboard");
const reportTbody = document.getElementById("report-tbody");

/* ---------- Storage: leads ---------- */

function getLeads() {
  const raw = localStorage.getItem(LEADS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLeads(leads) {
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function updateStatusSelectColor() {
  statusInput.classList.remove(...STATUSES.map((s) => `color-${s.key}`));
  statusInput.classList.add(`color-${statusInput.value}`);
}

statusInput.addEventListener("change", updateStatusSelectColor);

function resetForm() {
  form.reset();
  leadIdInput.value = "";
  statusInput.value = "prospect";
  submitBtn.textContent = "Cadastrar lead";
  cancelEditBtn.hidden = true;
  updateStatusSelectColor();
}

/* ---------- Dashboard (automático, calculado a partir da tabela de leads) ---------- */

function renderDashboard(leads) {
  dashboardEl.innerHTML = STATUSES.map((status) => {
    const count = leads.filter((l) => l.status === status.key).length;
    return `
      <div class="dashboard-card status-${status.key}">
        <span class="label">${escapeHtml(status.label)}</span>
        <span class="count">${count}</span>
      </div>
    `;
  }).join("");
}

/* ---------- Relatório de conversão por período ---------- */

function getPeriodStarts() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dayOfWeek = (now.getDay() + 6) % 7; // segunda = 0
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - dayOfWeek);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  return { semana: startOfWeek, mes: startOfMonth, ano: startOfYear };
}

function renderReport(leads) {
  const starts = getPeriodStarts();
  const periods = [
    { key: "semana", label: "Semana" },
    { key: "mes", label: "Mês" },
    { key: "ano", label: "Ano" },
  ];

  reportTbody.innerHTML = periods
    .map((period) => {
      const leadsPeriodo = leads.filter((l) => l.criadoEm && new Date(l.criadoEm) >= starts[period.key]);
      const convertidos = leadsPeriodo.filter((l) => l.status === "convertido").length;
      const taxa = leadsPeriodo.length ? ((convertidos / leadsPeriodo.length) * 100).toFixed(1) : "0.0";
      return `
        <tr>
          <td>${period.label}</td>
          <td>${leadsPeriodo.length}</td>
          <td>${convertidos}</td>
          <td>${taxa}%</td>
        </tr>
      `;
    })
    .join("");
}

/* ---------- Tabela de leads ---------- */

function render() {
  const leads = getLeads();

  renderDashboard(leads);
  renderReport(leads);

  const origemValue = origemFilter.value;
  const statusValue = statusFilter.value;
  const abordadoValue = abordadoFilter.value;

  const filtered = leads.filter((lead) => {
    const matchesOrigem = !origemValue || lead.origem === origemValue;
    const matchesStatus = !statusValue || lead.status === statusValue;
    const matchesAbordado = !abordadoValue || lead.abordadoPor === abordadoValue;
    return matchesOrigem && matchesStatus && matchesAbordado;
  });

  tbody.innerHTML = "";
  emptyState.hidden = filtered.length !== 0;

  filtered
    .slice()
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .forEach((lead) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(lead.nome)}</td>
        <td>${escapeHtml(lead.email)}</td>
        <td>${escapeHtml(lead.whatsapp || "-")}</td>
        <td>${escapeHtml(lead.profissao)}</td>
        <td>${escapeHtml(lead.contexto)}</td>
        <td>${escapeHtml(lead.origem)}</td>
        <td><span class="badge status-${lead.status}">${escapeHtml(STATUS_LABEL[lead.status] || lead.status)}</span></td>
        <td>${escapeHtml(lead.abordadoPor)}</td>
        <td class="actions-cell">
          <button class="btn btn-secondary btn-small" data-action="edit" data-id="${lead.id}">Editar</button>
          <button class="btn btn-danger btn-small" data-action="delete" data-id="${lead.id}">Deletar</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
}

/* ---------- Form submit (criar / editar) ---------- */

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();

  if (!nome || !email) {
    alert("Nome e e-mail são obrigatórios.");
    return;
  }

  const leads = getLeads();
  const editingId = leadIdInput.value;

  const leadData = {
    nome,
    email,
    whatsapp: whatsappInput.value.trim(),
    profissao: profissaoInput.value,
    contexto: contextoInput.value,
    origem: origemInput.value,
    abordadoPor: abordadoPorInput.value,
    status: statusInput.value,
    dificuldade: dificuldadeInput.value.trim(),
    online: onlineInput.value,
  };

  if (editingId) {
    const lead = leads.find((l) => l.id === editingId);
    if (lead) Object.assign(lead, leadData);
  } else {
    leads.push({
      id: crypto.randomUUID(),
      criadoEm: new Date().toISOString(),
      ...leadData,
    });
  }

  saveLeads(leads);
  resetForm();
  render();
});

/* ---------- Ações da tabela ---------- */

tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;
  const leads = getLeads();

  if (action === "delete") {
    if (confirm("Tem certeza que deseja deletar este lead?")) {
      saveLeads(leads.filter((l) => l.id !== id));
      render();
    }
  }

  if (action === "edit") {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    leadIdInput.value = lead.id;
    nomeInput.value = lead.nome;
    emailInput.value = lead.email;
    whatsappInput.value = lead.whatsapp || "";
    profissaoInput.value = lead.profissao;
    contextoInput.value = lead.contexto;
    origemInput.value = lead.origem;
    abordadoPorInput.value = lead.abordadoPor;
    statusInput.value = lead.status;
    updateStatusSelectColor();
    dificuldadeInput.value = lead.dificuldade || "";
    onlineInput.value = lead.online;

    submitBtn.textContent = "Salvar alterações";
    cancelEditBtn.hidden = false;
    nomeInput.focus();
    nomeInput.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

cancelEditBtn.addEventListener("click", resetForm);

/* ---------- Filtros ---------- */

origemFilter.addEventListener("change", render);
statusFilter.addEventListener("change", render);
abordadoFilter.addEventListener("change", render);

/* ---------- Init ---------- */

resetForm();
render();
