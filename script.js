const SUPABASE_URL = "https://pvnycbsqfdkgcoseuhik.supabase.co";
const SUPABASE_KEY = "sb_publishable_18RknyEYfjUNXKH8jn_3IA_tX7Zl6Si";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
const pagamentoFormaInput = document.getElementById("pagamento-forma");
const pagamentoParcelasInput = document.getElementById("pagamento-parcelas");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const origemFilter = document.getElementById("origem-filter");
const statusFilter = document.getElementById("status-filter");
const abordadoFilter = document.getElementById("abordado-filter");

const tbody = document.getElementById("leads-tbody");
const emptyState = document.getElementById("empty-state");
const reportTbody = document.getElementById("report-tbody");
const dashboardOrganicoEl = document.getElementById("dashboard-organico");
const dashboardFluxoEl = document.getElementById("dashboard-fluxo");
const summaryTodayEl = document.getElementById("summary-today");

const trackingForm = document.getElementById("tracking-form");
const trkDateInput = document.getElementById("trk-date");
const trkAbordadosInput = document.getElementById("trk-abordados");
const trkAgendamentosInput = document.getElementById("trk-agendamentos");
const trackingTbody = document.getElementById("tracking-tbody");
const trackingEmptyState = document.getElementById("tracking-empty-state");

const paymentModal = document.getElementById("payment-modal");
const modalFormaSelect = document.getElementById("modal-forma-pagamento");
const modalParcelasField = document.getElementById("modal-parcelas-field");
const modalParcelasSelect = document.getElementById("modal-parcelas");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

let leadsCache = [];
let trackingCache = [];
let confirmedStatusValue = "prospect";

/* ---------- Supabase: leads ---------- */

async function fetchLeads() {
  const { data, error } = await sb.from("leads").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    alert("Erro ao carregar leads: " + error.message);
    return [];
  }
  return data;
}

async function refreshLeads() {
  leadsCache = await fetchLeads();
  renderAll();
}

/* ---------- Supabase: rastreamento diário ---------- */

async function fetchTracking() {
  const { data, error } = await sb
    .from("daily_tracking")
    .select("*")
    .order("data", { ascending: false })
    .limit(7);
  if (error) {
    console.error(error);
    alert("Erro ao carregar rastreamento: " + error.message);
    return [];
  }
  return data;
}

async function refreshTracking() {
  trackingCache = await fetchTracking();
  renderTracking();
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

// Supabase/PostgREST retorna timestamptz sem sufixo "Z"; sem isso o JS
// interpreta a string como horário local em vez de UTC, desalinhando "hoje".
function parseTimestamp(ts) {
  if (!ts) return null;
  const hasTimezone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(ts);
  return new Date(hasTimezone ? ts : ts + "Z");
}

function isToday(isoTimestamp) {
  const d = parseTimestamp(isoTimestamp);
  if (!d) return false;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}` === todayISO();
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
  confirmedStatusValue = value;
  if (value !== "convertido") {
    pagamentoFormaInput.value = "";
    pagamentoParcelasInput.value = "";
  }
  updateStatusSelectColor();
}

origemInput.addEventListener("change", () => renderStatusOptions(statusInput.value));

statusInput.addEventListener("change", () => {
  if (statusInput.value === "convertido") {
    openPaymentModal();
  } else {
    confirmedStatusValue = statusInput.value;
    pagamentoFormaInput.value = "";
    pagamentoParcelasInput.value = "";
    updateStatusSelectColor();
  }
});

/* ---------- Modal de pagamento (ao converter) ---------- */

function openPaymentModal() {
  modalFormaSelect.value = pagamentoFormaInput.value || "a_vista";
  modalParcelasSelect.value = pagamentoParcelasInput.value || "2";
  modalParcelasField.hidden = modalFormaSelect.value === "a_vista";
  paymentModal.hidden = false;
}

function closePaymentModal() {
  paymentModal.hidden = true;
}

modalFormaSelect.addEventListener("change", () => {
  modalParcelasField.hidden = modalFormaSelect.value === "a_vista";
});

modalConfirmBtn.addEventListener("click", () => {
  pagamentoFormaInput.value = modalFormaSelect.value;
  pagamentoParcelasInput.value = modalFormaSelect.value === "a_vista" ? "" : modalParcelasSelect.value;
  confirmedStatusValue = "convertido";
  statusInput.value = "convertido";
  updateStatusSelectColor();
  closePaymentModal();
});

modalCancelBtn.addEventListener("click", () => {
  statusInput.value = confirmedStatusValue;
  updateStatusSelectColor();
  closePaymentModal();
});

function resetForm() {
  form.reset();
  leadIdInput.value = "";
  pagamentoFormaInput.value = "";
  pagamentoParcelasInput.value = "";
  renderStatusOptions("prospect");
  submitBtn.textContent = "Cadastrar lead";
  cancelEditBtn.hidden = true;
}

/* ---------- Resumo hoje ---------- */

function renderSummaryToday(leads) {
  const leadsAbordadosHoje = leads.filter((l) => l.status === "abordado" && isToday(l.status_changed_at)).length;
  const reunioesAgendadasHoje = leads.filter((l) => l.status === "agendado" && isToday(l.status_changed_at)).length;
  const reunioesFeitasHoje = leads.filter((l) => l.status === "confirmado" && isToday(l.status_changed_at)).length;
  const vendasConvertidasHoje = leads.filter((l) => l.status === "convertido" && isToday(l.status_changed_at)).length;

  const tiles = [
    { label: "Leads abordados", value: leadsAbordadosHoje },
    { label: "Reuniões agendadas", value: reunioesAgendadasHoje },
    { label: "Reuniões feitas", value: reunioesFeitasHoje },
    { label: "Vendas convertidas", value: vendasConvertidasHoje },
  ];

  summaryTodayEl.innerHTML = tiles
    .map(
      (t) => `
        <div class="summary-tile">
          <span class="label">${t.label}</span>
          <span class="value">${t.value}</span>
        </div>
      `
    )
    .join("");
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
      const leadsPeriodo = leads.filter((l) => l.created_at && parseTimestamp(l.created_at) >= starts[period.key]);
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
  trackingEmptyState.hidden = trackingCache.length !== 0;

  trackingTbody.innerHTML = trackingCache
    .map(
      (r) => `
        <tr>
          <td>${formatDateBR(r.data)}</td>
          <td>${r.leads_abordados}</td>
          <td>${r.agendamentos_conseguidos}</td>
        </tr>
      `
    )
    .join("");
}

trackingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = trkDateInput.value || todayISO();
  const leads_abordados = Number(trkAbordadosInput.value) || 0;
  const agendamentos_conseguidos = Number(trkAgendamentosInput.value) || 0;

  const { error } = await sb
    .from("daily_tracking")
    .upsert({ data, leads_abordados, agendamentos_conseguidos }, { onConflict: "data" });
  if (error) {
    alert("Erro ao salvar rastreamento: " + error.message);
    return;
  }

  trkAbordadosInput.value = "";
  trkAgendamentosInput.value = "";
  trkDateInput.value = todayISO();

  await refreshTracking();
});

/* ---------- Tabela de leads ---------- */

function renderTable(leads) {
  const origemValue = origemFilter.value;
  const statusValue = statusFilter.value;
  const abordadoValue = abordadoFilter.value;

  const filtered = leads.filter((lead) => {
    const matchesOrigem = !origemValue || lead.origem === origemValue;
    const matchesStatus = !statusValue || lead.status === statusValue;
    const matchesAbordado = !abordadoValue || lead.abordado_por === abordadoValue;
    return matchesOrigem && matchesStatus && matchesAbordado;
  });

  tbody.innerHTML = "";
  emptyState.hidden = filtered.length !== 0;

  filtered
    .slice()
    .sort((a, b) => parseTimestamp(b.created_at) - parseTimestamp(a.created_at))
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
        <td>${escapeHtml(lead.abordado_por)}</td>
        <td class="actions-cell">
          <button class="btn btn-secondary btn-small" data-action="edit" data-id="${lead.id}">Editar</button>
          <button class="btn btn-danger btn-small" data-action="delete" data-id="${lead.id}">Deletar</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
}

function renderAll() {
  renderSummaryToday(leadsCache);
  renderDashboards(leadsCache);
  renderReport(leadsCache);
  renderTable(leadsCache);
}

/* ---------- Form submit (criar / editar) ---------- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();

  if (!nome || !email) {
    alert("Nome e e-mail são obrigatórios.");
    return;
  }

  const editingId = leadIdInput.value;

  const leadData = {
    nome,
    email,
    whatsapp: whatsappInput.value.trim(),
    profissao: profissaoInput.value,
    contexto: contextoInput.value,
    origem: origemInput.value,
    abordado_por: abordadoPorInput.value,
    status: statusInput.value,
    dificuldade: dificuldadeInput.value.trim(),
    online: onlineInput.value,
    pagamento_forma: statusInput.value === "convertido" ? pagamentoFormaInput.value || null : null,
    pagamento_parcelas:
      statusInput.value === "convertido" && pagamentoParcelasInput.value ? Number(pagamentoParcelasInput.value) : null,
  };

  if (editingId) {
    const existing = leadsCache.find((l) => l.id === editingId);
    if (existing && existing.status !== leadData.status) {
      leadData.status_changed_at = new Date().toISOString();
    }
    const { error } = await sb.from("leads").update(leadData).eq("id", editingId);
    if (error) {
      alert("Erro ao salvar lead: " + error.message);
      return;
    }
  } else {
    leadData.status_changed_at = new Date().toISOString();
    const { error } = await sb.from("leads").insert([leadData]);
    if (error) {
      alert("Erro ao cadastrar lead: " + error.message);
      return;
    }
  }

  resetForm();
  await refreshLeads();
});

/* ---------- Ações da tabela ---------- */

tbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;

  if (action === "delete") {
    if (confirm("Tem certeza que deseja deletar este lead?")) {
      const { error } = await sb.from("leads").delete().eq("id", id);
      if (error) {
        alert("Erro ao deletar lead: " + error.message);
        return;
      }
      await refreshLeads();
    }
  }

  if (action === "edit") {
    const lead = leadsCache.find((l) => l.id === id);
    if (!lead) return;

    leadIdInput.value = lead.id;
    nomeInput.value = lead.nome;
    emailInput.value = lead.email;
    whatsappInput.value = lead.whatsapp || "";
    profissaoInput.value = lead.profissao;
    contextoInput.value = lead.contexto;
    origemInput.value = lead.origem;
    abordadoPorInput.value = lead.abordado_por;
    renderStatusOptions(lead.status);
    pagamentoFormaInput.value = lead.pagamento_forma || "";
    pagamentoParcelasInput.value = lead.pagamento_parcelas || "";
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

origemFilter.addEventListener("change", () => renderTable(leadsCache));
statusFilter.addEventListener("change", () => renderTable(leadsCache));
abordadoFilter.addEventListener("change", () => renderTable(leadsCache));

/* ---------- Realtime (sincroniza Gabi e Paulo) ---------- */

function setupRealtime() {
  sb.channel("leads-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => refreshLeads())
    .subscribe();

  sb.channel("tracking-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "daily_tracking" }, () => refreshTracking())
    .subscribe();
}

/* ---------- Init ---------- */

(async function init() {
  resetForm();
  trkDateInput.value = todayISO();
  await refreshLeads();
  await refreshTracking();
  setupRealtime();
})();
