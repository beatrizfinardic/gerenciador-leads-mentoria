const LEADS_KEY = "leads_mentoria_titulares";
const TRACKING_KEY = "rastreamento_gabi_mentoria_titulares";

const STATUS_META = {
  prospect: { label: "Prospect", bg: "#86efac", text: "#14532d", cardBg: "#dcfce7", cardText: "#14532d" },
  abordado: { label: "Abordado", bg: "#f97316", text: "#ffffff", cardBg: "#ffedd5", cardText: "#7c2d12" },
  agendado: { label: "Agendado", bg: "#3b82f6", text: "#ffffff", cardBg: "#dbeafe", cardText: "#1e3a8a" },
  confirmado: { label: "Confirmado", bg: "#facc15", text: "#1a1a1a", cardBg: "#fef9c3", cardText: "#713f12" },
  convertido: { label: "Convertido", bg: "#166534", text: "#ffffff", cardBg: "#166534", cardText: "#ffffff" },
  perdido: { label: "Perdido", bg: "#9ca3af", text: "#1a1a1a", cardBg: "#e5e7eb", cardText: "#374151" },
};

const ORGANICO_STATUSES = ["prospect", "abordado", "agendado", "confirmado", "convertido", "perdido"];
const FLUXO_STATUSES = ["prospect", "confirmado", "convertido", "perdido"];

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
const reportTbody = document.getElementById("report-tbody");
const summaryTodayEl = document.getElementById("summary-today");
const dashboardOrganicoEl = document.getElementById("dashboard-organico");
const dashboardFluxoEl = document.getElementById("dashboard-fluxo");

const trackingForm = document.getElementById("tracking-form");
const trkDateInput = document.getElementById("trk-date");
const trkAbordadosInput = document.getElementById("trk-abordados");
const trkAgendamentosInput = document.getElementById("trk-agendamentos");
const trackingTbody = document.getElementById("tracking-tbody");
const trackingEmptyState = document.getElementById("tracking-empty-state");

/* ---------- Storage: leads ---------- */

function getLeads() {
  const raw = localStorage.getItem(LEADS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLeads(leads) {
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

/* ---------- Storage: rastreamento diário ---------- */

function getTracking() {
  const raw = localStorage.getItem(TRACKING_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveTracking(records) {
  localStorage.setItem(TRACKING_KEY, JSON.stringify(records));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateBR(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ---------- Status dinâmico (depende da origem) ---------- */

function statusKeysForOrigem(origem) {
  return origem === "Fluxo" ? FLUXO_STATUSES : ORGANICO_STATUSES;
}

function updateStatusSelectColor() {
  const meta = STATUS_META[statusInput.value];
  if (!meta) return;
  statusInput.style.backgroundColor = meta.bg;
  statusInput.style.color = meta.text;
}

function renderStatusOptions(preferredStatus) {
  const allowed = statusKeysForOrigem(origemInput.value);
  const value = allowed.includes(preferredStatus) ? preferredStatus : allowed[0];
  statusInput.innerHTML = allowed
    .map((key) => `<option value="${key}">${STATUS_META[key].label}</option>`)
    .join("");
  statusInput.value = value;
  updateStatusSelectColor();
}

origemInput.addEventListener("change", () => renderStatusOptions(statusInput.value));
statusInput.addEventListener("change", updateStatusSelectColor);

function resetForm() {
  form.reset();
  leadIdInput.value = "";
  renderStatusOptions("prospect");
  submitBtn.textContent = "Cadastrar lead";
  cancelEditBtn.hidden = true;
}

/* ---------- Dashboards (automáticos, calculados a partir da tabela) ---------- */

function dashboardCardHtml(key, leads) {
  const meta = STATUS_META[key];
  const count = leads.filter((l) => l.status === key).length;
  return `
    <div class="dashboard-card" style="background:${meta.cardBg};color:${meta.cardText}">
      <span class="label">${meta.label}</span>
      <span class="count">${count}</span>
    </div>
  `;
}

function renderDashboards(leads) {
  const organico = leads.filter((l) => l.origem !== "Fluxo");
  const fluxo = leads.filter((l) => l.origem === "Fluxo");

  dashboardOrganicoEl.innerHTML = ORGANICO_STATUSES.map((key) => dashboardCardHtml(key, organico)).join("");
  dashboardFluxoEl.innerHTML = FLUXO_STATUSES.map((key) => dashboardCardHtml(key, fluxo)).join("");
}

/* ---------- Resumo de hoje ---------- */

function renderSummaryToday(leads) {
  const { hoje } = getPeriodStarts();
  const leadsHoje = leads.filter((l) => l.criadoEm && new Date(l.criadoEm) >= hoje);
  const convertidos = leadsHoje.filter((l) => l.status === "convertido").length;
  const taxa = leadsHoje.length ? ((convertidos / leadsHoje.length) * 100).toFixed(1) : "0.0";

  summaryTodayEl.innerHTML = `
    <div class="summary-tile">
      <span class="label">Total de leads</span>
      <span class="value">${leadsHoje.length}</span>
    </div>
    <div class="summary-tile">
      <span class="label">Convertidos</span>
      <span class="value">${convertidos}</span>
    </div>
    <div class="summary-tile">
      <span class="label">Taxa</span>
      <span class="value">${taxa}%</span>
    </div>
  `;
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

  return { hoje: startOfToday, semana: startOfWeek, mes: startOfMonth, ano: startOfYear };
}

function renderReport(leads) {
  const starts = getPeriodStarts();
  const periods = [
    { key: "hoje", label: "Hoje" },
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

/* ---------- Rastreamento diário Gabi ---------- */

function renderTracking() {
  const records = getTracking()
    .slice()
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 7);

  trackingEmptyState.hidden = records.length !== 0;

  trackingTbody.innerHTML = records
    .map(
      (r) => `
        <tr>
          <td>${formatDateBR(r.data)}</td>
          <td>${r.leadsAbordados}</td>
          <td>${r.agendamentos}</td>
        </tr>
      `
    )
    .join("");
}

trackingForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = trkDateInput.value || todayISO();
  const leadsAbordados = Number(trkAbordadosInput.value) || 0;
  const agendamentos = Number(trkAgendamentosInput.value) || 0;

  const records = getTracking();
  const existing = records.find((r) => r.data === data);
  if (existing) {
    existing.leadsAbordados = leadsAbordados;
    existing.agendamentos = agendamentos;
  } else {
    records.push({ data, leadsAbordados, agendamentos });
  }

  saveTracking(records);
  renderTracking();

  trkAbordadosInput.value = "";
  trkAgendamentosInput.value = "";
  trkDateInput.value = todayISO();
});

/* ---------- Tabela de leads ---------- */

function render() {
  const leads = getLeads();

  renderSummaryToday(leads);
  renderDashboards(leads);
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
      const meta = STATUS_META[lead.status];

      tr.innerHTML = `
        <td>${escapeHtml(lead.nome)}</td>
        <td>${escapeHtml(lead.email)}</td>
        <td>${escapeHtml(lead.whatsapp || "-")}</td>
        <td>${escapeHtml(lead.profissao)}</td>
        <td>${escapeHtml(lead.contexto)}</td>
        <td>${escapeHtml(lead.origem)}</td>
        <td><span class="badge" style="background:${meta.bg};color:${meta.text}">${escapeHtml(meta.label)}</span></td>
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
    renderStatusOptions(lead.status);
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
trkDateInput.value = todayISO();
render();
renderTracking();
