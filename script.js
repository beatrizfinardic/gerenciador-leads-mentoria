const SUPABASE_URL = "https://pvnycbsqfdkgcoseuhik.supabase.co";
const SUPABASE_KEY = "sb_publishable_18RknyEYfjUNXKH8jn_3IA_tX7Zl6Si";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const STATUS_META = {
  prospect: { label: "Prospect", bg: "#86efac", text: "#14532d", cardBg: "#dcfce7", cardText: "#14532d" },
  abordado: { label: "Abordado", bg: "#f97316", text: "#ffffff", cardBg: "#ffedd5", cardText: "#7c2d12" },
  agendado: { label: "Agendado", bg: "#3b82f6", text: "#ffffff", cardBg: "#dbeafe", cardText: "#1e3a8a" },
  confirmado: { label: "Confirmado", bg: "#facc15", text: "#1a1a1a", cardBg: "#fef9c3", cardText: "#713f12" },
  convertido: { label: "Convertido", bg: "#166534", text: "#ffffff", cardBg: "#166534", cardText: "#ffffff" },
  nao_compareceu: { label: "Não compareceu", bg: "#f87171", text: "#ffffff", cardBg: "#fee2e2", cardText: "#7f1d1d" },
  nao_respondeu: { label: "Não respondeu/Desmarcado", bg: "#fbbf24", text: "#78350f", cardBg: "#fef3c7", cardText: "#78350f" },
  desqualificado: { label: "Desqualificado/Desmarcado", bg: "#78716c", text: "#ffffff", cardBg: "#f5f5f4", cardText: "#44403c" },
  follow_up: { label: "Follow up", bg: "#8b5cf6", text: "#ffffff", cardBg: "#ede9fe", cardText: "#5b21b6" },
  perdido: { label: "Perdido", bg: "#9ca3af", text: "#1a1a1a", cardBg: "#e5e7eb", cardText: "#374151" },
};

const ORGANICO_STATUSES = ["agendado", "convertido", "nao_compareceu", "nao_respondeu", "desqualificado", "follow_up", "perdido"];
const FLUXO_STATUSES = ["agendado", "convertido", "nao_compareceu", "nao_respondeu", "desqualificado", "follow_up", "perdido"];

const PESSOA_META = {
  Gabi: { bg: "#f472b6", text: "#ffffff" },
  Paulo: { bg: "#60a5fa", text: "#ffffff" },
  Igor: { bg: "#34d399", text: "#065f46" },
};

function pessoaBadge(nome) {
  const meta = PESSOA_META[nome];
  if (!meta) return "-";
  return `<span class="badge" style="background:${meta.bg};color:${meta.text}">${escapeHtml(nome)}</span>`;
}

const TIPOS_MENTORIA = ["Mentoria Titulares", "Mentoria Eméritos"];
const MENTORIA_META = {
  "Mentoria Titulares": { bg: "#c4b5fd", text: "#4c1d95" },
  "Mentoria Eméritos": { bg: "#fde68a", text: "#78350f" },
};

function mentoriaBadge(tipo) {
  const meta = MENTORIA_META[tipo];
  if (!meta) return "-";
  return `<span class="badge" style="background:${meta.bg};color:${meta.text}">${escapeHtml(tipo)}</span>`;
}

// Eduzz cobra taxa fixa + percentual por transacao no credito (juros da parcela fica com o cliente).
// No cartao recorrente a taxa fixa incide a cada cobranca mensal (taxaFixaPorCiclo), nao uma vez so no total.
const FORMA_PAGAMENTO_META = {
  a_vista: { label: "PIX", taxaFixa: 0, taxaPercentual: 0 },
  parcelado_eduzz: { label: "Eduzz", taxaFixa: 2.49, taxaPercentual: 0.0459 },
  parcelado_sumup: { label: "Sumup", taxaFixa: 0, taxaPercentual: 0 },
  recorrente_cartao: { label: "Cartão Recorrente", taxaFixa: 2.49, taxaPercentual: 0.0459, taxaFixaPorCiclo: true },
};

const form = document.getElementById("lead-form");
const leadIdInput = document.getElementById("lead-id");
const nomeInput = document.getElementById("nome");
const emailInput = document.getElementById("email");
const instagramInput = document.getElementById("instagram");
const whatsappInput = document.getElementById("whatsapp");
const profissaoInput = document.getElementById("profissao");
const origemInput = document.getElementById("origem");
const abordadoPorInput = document.getElementById("abordado-por");
const statusInput = document.getElementById("status");
const dificuldadeInput = document.getElementById("dificuldade");
const onlineInput = document.getElementById("online");
const cadastroDataInput = document.getElementById("cadastro-data");
const agendamentoEmInput = document.getElementById("agendamento-em");
const pagamentoFormaInput = document.getElementById("pagamento-forma");
const pagamentoParcelasInput = document.getElementById("pagamento-parcelas");
const valorFechadoInput = document.getElementById("valor-fechado");
const faturamento3mesesInput = document.getElementById("faturamento-3meses");
const faturamento3mesesFieldInput = document.getElementById("faturamento-3meses-input");
const faturamento3mesesField = document.getElementById("faturamento-3meses-field");
const dataVencimentoInput = document.getElementById("data-vencimento");
const pagamentoDetailsSection = document.getElementById("pagamento-details-section");
const formValorFechadoInput = document.getElementById("form-valor-fechado");
const formPagamentoFormaInput = document.getElementById("form-pagamento-forma");
const formPagamentoParcelasInput = document.getElementById("form-pagamento-parcelas");
const formFechadoPorInput = document.getElementById("form-fechado-por");
const formTipoMentoriaInput = document.getElementById("form-tipo-mentoria");
const formDataVencimentoInput = document.getElementById("form-data-vencimento");
const fechadoPorInput = document.getElementById("fechado-por");
const tipoMentoriaInput = document.getElementById("tipo-mentoria");
const perdidoMotivoInput = document.getElementById("perdido-motivo");
const perdidoFollowupInput = document.getElementById("perdido-followup");
const perdidoFollowupDataInput = document.getElementById("perdido-followup-data");
const followupDataField = document.getElementById("followup-data-field");
const followupDataInput = document.getElementById("followup-data");
const followupDataValueInput = document.getElementById("followup-data-value");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const origemFilter = document.getElementById("origem-filter");
const abordadoFilter = document.getElementById("abordado-filter");
const leadsSearchInput = document.getElementById("leads-search");
const statusTabsEl = document.getElementById("status-tabs");
const leadsPromptState = document.getElementById("leads-prompt-state");
let activeStatusTab = "";

const tbody = document.getElementById("leads-tbody");
const emptyState = document.getElementById("empty-state");
const reportTbody = document.getElementById("report-tbody");
const dashboardOrganicoEl = document.getElementById("dashboard-organico");
const dashboardFluxoEl = document.getElementById("dashboard-fluxo");
const custoDataInicialInput = document.getElementById("custo-data-inicial");
const custoDataFinalInput = document.getElementById("custo-data-final");
const custoValorInvestidoInput = document.getElementById("custo-valor-investido");
const custoAtualizarBtn = document.getElementById("custo-atualizar-btn");
const custoResumoEl = document.getElementById("custo-resumo");
const mentoriaTypeTabsEl = document.getElementById("mentoria-type-tabs");
let mentoriaTypeTab = "Mentoria Titulares";
const mentoradosMainTabsEl = document.getElementById("mentorados-main-tabs");
let mentoradosMainTab = "ativos";
const mentoradosResumoEl = document.getElementById("mentorados-resumo");
const mentoradosCardsEl = document.getElementById("mentorados-cards");
const mentoradosPaginationEl = document.getElementById("mentorados-pagination");
let mentoradosCurrentPage = 1;
const mentoradosPerPage = 6;
const mentoradosEmptyState = document.getElementById("mentorados-empty-state");
const mentoradosSaidosTbody = document.getElementById("mentorados-saidos-tbody");
const mentoradosSaidosEmptyState = document.getElementById("mentorados-saidos-empty-state");
const summaryTodayEl = document.getElementById("summary-today");
const renewalsTbody = document.getElementById("renewals-tbody");
const renewalsEmptyState = document.getElementById("renewals-empty-state");
const leadsTodayTbody = document.getElementById("leads-today-tbody");
const leadsTodayEmptyState = document.getElementById("leads-today-empty-state");
const leadsTodayOrigemTabsEl = document.getElementById("leads-today-origem-tabs");
let leadsTodayOrigemTab = "";

const fatDataInicialInput = document.getElementById("fat-data-inicial");
const fatDataFinalInput = document.getElementById("fat-data-final");
const fatAtualizarBtn = document.getElementById("fat-atualizar-btn");
const fatOrigemTabsEl = document.getElementById("fat-origem-tabs");
let fatOrigemTab = "";
const fatResumoEl = document.getElementById("fat-resumo");
const fatFormasTbody = document.getElementById("fat-formas-tbody");
const fatMentoriaTbody = document.getElementById("fat-mentoria-tbody");
const fatTransacoesTbody = document.getElementById("fat-transacoes-tbody");
const fatTransacoesEmptyState = document.getElementById("fat-transacoes-empty-state");

const trackingForm = document.getElementById("tracking-form");
const trkDateInput = document.getElementById("trk-date");
const trkAbordadosInput = document.getElementById("trk-abordados");
const trkAgendamentosInput = document.getElementById("trk-agendamentos");
const trackingTbody = document.getElementById("tracking-tbody");
const trackingEmptyState = document.getElementById("tracking-empty-state");

const paymentModal = document.getElementById("payment-modal");
const modalFechadoPorSelect = document.getElementById("modal-fechado-por");
const modalTipoMentoriaSelect = document.getElementById("modal-tipo-mentoria");
const modalValorFechadoInput = document.getElementById("modal-valor-fechado");
const modalDataVencimentoInput = document.getElementById("modal-data-vencimento");
const modalFormaSelect = document.getElementById("modal-forma-pagamento");
const modalParcelasField = document.getElementById("modal-parcelas-field");
const modalParcelasSelect = document.getElementById("modal-parcelas");
const modalRecorrenciaField = document.getElementById("modal-recorrencia-field");
const modalRecorrenciaQuantidadeInput = document.getElementById("modal-recorrencia-quantidade");
const modalRecorrenciaValorField = document.getElementById("modal-recorrencia-valor-field");
const modalRecorrenciaValorInput = document.getElementById("modal-recorrencia-valor");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

const lostModal = document.getElementById("lost-modal");
const lostMotivoSelect = document.getElementById("lost-motivo");
const lostFollowupSelect = document.getElementById("lost-followup");
const lostFollowupDataField = document.getElementById("lost-followup-data-field");
const lostFollowupDataInput = document.getElementById("lost-followup-data");
const lostConfirmBtn = document.getElementById("lost-confirm-btn");
const lostCancelBtn = document.getElementById("lost-cancel-btn");

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
  renderSummaryToday(leadsCache);
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
  if (!iso) return "-";
  const dateOnly = iso.split("T")[0];
  const [y, m, d] = dateOnly.split("-");
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

function toDatetimeLocalValue(isoTimestamp) {
  const d = parseTimestamp(isoTimestamp);
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatBRL(value) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTimeBR(isoTimestamp) {
  const d = parseTimestamp(isoTimestamp);
  if (!d) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
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
    valorFechadoInput.value = "";
    dataVencimentoInput.value = "";
    fechadoPorInput.value = "";
    tipoMentoriaInput.value = "";
  }
  if (value !== "perdido") {
    perdidoMotivoInput.value = "";
    perdidoFollowupInput.value = "";
    perdidoFollowupDataInput.value = "";
  }
  if (value !== "follow_up") {
    followupDataValueInput.value = "";
    followupDataInput.value = "";
  }
  followupDataField.hidden = value !== "follow_up";
  updateStatusSelectColor();
}

origemInput.addEventListener("change", () => renderStatusOptions(statusInput.value));

formValorFechadoInput.addEventListener("input", () => {
  valorFechadoInput.value = formValorFechadoInput.value;
});

formPagamentoFormaInput.addEventListener("change", () => {
  pagamentoFormaInput.value = formPagamentoFormaInput.value;
});

formPagamentoParcelasInput.addEventListener("input", () => {
  pagamentoParcelasInput.value = formPagamentoParcelasInput.value;
});

formFechadoPorInput.addEventListener("change", () => {
  fechadoPorInput.value = formFechadoPorInput.value;
});

formTipoMentoriaInput.addEventListener("change", () => {
  tipoMentoriaInput.value = formTipoMentoriaInput.value;
});

formDataVencimentoInput.addEventListener("change", () => {
  dataVencimentoInput.value = formDataVencimentoInput.value;
});

statusInput.addEventListener("change", () => {
  if (statusInput.value === "convertido") {
    faturamento3mesesField.hidden = cancelEditBtn.hidden;
    pagamentoDetailsSection.hidden = cancelEditBtn.hidden;
    if (cancelEditBtn.hidden) {
      openPaymentModal();
    }
  } else if (statusInput.value === "perdido") {
    faturamento3mesesField.hidden = true;
    pagamentoDetailsSection.hidden = true;
    openLostModal();
  } else if (statusInput.value === "follow_up") {
    confirmedStatusValue = statusInput.value;
    faturamento3mesesField.hidden = true;
    pagamentoDetailsSection.hidden = true;
    followupDataField.hidden = false;
    pagamentoFormaInput.value = "";
    pagamentoParcelasInput.value = "";
    valorFechadoInput.value = "";
    dataVencimentoInput.value = "";
    fechadoPorInput.value = "";
    tipoMentoriaInput.value = "";
    formPagamentoFormaInput.value = "";
    formPagamentoParcelasInput.value = "";
    formValorFechadoInput.value = "";
    formDataVencimentoInput.value = "";
    formFechadoPorInput.value = "";
    perdidoMotivoInput.value = "";
    perdidoFollowupInput.value = "";
    perdidoFollowupDataInput.value = "";
    updateStatusSelectColor();
  } else {
    confirmedStatusValue = statusInput.value;
    pagamentoDetailsSection.hidden = true;
    pagamentoFormaInput.value = "";
    pagamentoParcelasInput.value = "";
    valorFechadoInput.value = "";
    dataVencimentoInput.value = "";
    fechadoPorInput.value = "";
    tipoMentoriaInput.value = "";
    formPagamentoFormaInput.value = "";
    formPagamentoParcelasInput.value = "";
    formValorFechadoInput.value = "";
    formDataVencimentoInput.value = "";
    formFechadoPorInput.value = "";
    followupDataField.hidden = true;
    followupDataValueInput.value = "";
    followupDataInput.value = "";
    perdidoMotivoInput.value = "";
    perdidoFollowupInput.value = "";
    perdidoFollowupDataInput.value = "";
    updateStatusSelectColor();
  }
});

/* ---------- Modal de pagamento (ao converter) ---------- */

function updateModalFormaFields() {
  const forma = modalFormaSelect.value;
  modalParcelasField.hidden = forma !== "parcelado_eduzz" && forma !== "parcelado_sumup";
  modalRecorrenciaField.hidden = forma !== "recorrente_cartao";
  modalRecorrenciaValorField.hidden = forma !== "recorrente_cartao";
}

function syncValorFechadoRecorrencia() {
  if (modalFormaSelect.value !== "recorrente_cartao") return;
  const quantidade = Number(modalRecorrenciaQuantidadeInput.value) || 0;
  const valorParcela = Number(modalRecorrenciaValorInput.value) || 0;
  if (quantidade && valorParcela) {
    modalValorFechadoInput.value = (quantidade * valorParcela).toFixed(2);
  }
}

function openPaymentModal() {
  modalFechadoPorSelect.value = fechadoPorInput.value || "Paulo";
  modalTipoMentoriaSelect.value = tipoMentoriaInput.value || "Mentoria Titulares";
  modalValorFechadoInput.value = valorFechadoInput.value || "";
  modalDataVencimentoInput.value = dataVencimentoInput.value || "";
  modalFormaSelect.value = pagamentoFormaInput.value || "a_vista";
  modalParcelasSelect.value = pagamentoParcelasInput.value || "2";
  if (modalFormaSelect.value === "recorrente_cartao") {
    const quantidade = Number(pagamentoParcelasInput.value) || "";
    modalRecorrenciaQuantidadeInput.value = quantidade;
    modalRecorrenciaValorInput.value =
      quantidade && valorFechadoInput.value ? (Number(valorFechadoInput.value) / quantidade).toFixed(2) : "";
  } else {
    modalRecorrenciaQuantidadeInput.value = "";
    modalRecorrenciaValorInput.value = "";
  }
  updateModalFormaFields();
  paymentModal.hidden = false;
}

function closePaymentModal() {
  paymentModal.hidden = true;
}

modalFormaSelect.addEventListener("change", () => {
  updateModalFormaFields();
  syncValorFechadoRecorrencia();
});

modalRecorrenciaQuantidadeInput.addEventListener("input", syncValorFechadoRecorrencia);
modalRecorrenciaValorInput.addEventListener("input", syncValorFechadoRecorrencia);

followupDataInput.addEventListener("input", () => {
  followupDataValueInput.value = followupDataInput.value;
});

modalConfirmBtn.addEventListener("click", () => {
  fechadoPorInput.value = modalFechadoPorSelect.value;
  tipoMentoriaInput.value = modalTipoMentoriaSelect.value;
  valorFechadoInput.value = modalValorFechadoInput.value;
  dataVencimentoInput.value = modalDataVencimentoInput.value;
  pagamentoFormaInput.value = modalFormaSelect.value;
  if (modalFormaSelect.value === "recorrente_cartao") {
    pagamentoParcelasInput.value = modalRecorrenciaQuantidadeInput.value;
  } else {
    pagamentoParcelasInput.value = modalFormaSelect.value === "a_vista" ? "" : modalParcelasSelect.value;
  }
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

/* ---------- Modal de motivo da perda (ao marcar Perdido) ---------- */

function openLostModal() {
  lostMotivoSelect.value = perdidoMotivoInput.value || "Sem orçamento";
  lostFollowupSelect.value = perdidoFollowupInput.value || "Não";
  lostFollowupDataInput.value = perdidoFollowupDataInput.value || "";
  lostFollowupDataField.hidden = lostFollowupSelect.value !== "Sim";
  lostModal.hidden = false;
}

function closeLostModal() {
  lostModal.hidden = true;
}

lostFollowupSelect.addEventListener("change", () => {
  lostFollowupDataField.hidden = lostFollowupSelect.value !== "Sim";
});

lostConfirmBtn.addEventListener("click", () => {
  perdidoMotivoInput.value = lostMotivoSelect.value;
  perdidoFollowupInput.value = lostFollowupSelect.value;
  perdidoFollowupDataInput.value = lostFollowupSelect.value === "Sim" ? lostFollowupDataInput.value : "";
  confirmedStatusValue = "perdido";
  statusInput.value = "perdido";
  updateStatusSelectColor();
  closeLostModal();
});

lostCancelBtn.addEventListener("click", () => {
  statusInput.value = confirmedStatusValue;
  updateStatusSelectColor();
  closeLostModal();
});

function resetForm() {
  form.reset();
  leadIdInput.value = "";
  cadastroDataInput.value = todayISO();
  agendamentoEmInput.value = "";
  pagamentoFormaInput.value = "";
  pagamentoParcelasInput.value = "";
  valorFechadoInput.value = "";
  dataVencimentoInput.value = "";
  fechadoPorInput.value = "";
  tipoMentoriaInput.value = "";
  formValorFechadoInput.value = "";
  formDataVencimentoInput.value = "";
  formFechadoPorInput.value = "";
  formTipoMentoriaInput.value = "";
  formPagamentoFormaInput.value = "";
  formPagamentoParcelasInput.value = "";
  perdidoMotivoInput.value = "";
  perdidoFollowupInput.value = "";
  perdidoFollowupDataInput.value = "";
  followupDataValueInput.value = "";
  followupDataInput.value = "";
  faturamento3mesesInput.value = "";
  faturamento3mesesFieldInput.value = "";
  faturamento3mesesField.hidden = true;
  pagamentoDetailsSection.hidden = true;
  renderStatusOptions("prospect");
  submitBtn.textContent = "Cadastrar lead";
  cancelEditBtn.hidden = true;
}

/* ---------- Utilitários temporários ---------- */

window.updateAllToTitulares = async () => {
  const leads = leadsCache.filter((l) => l.status === "convertido" && l.nome !== "Gisele");
  let updated = 0;
  for (const lead of leads) {
    const { error } = await sb.from("leads").update({ tipo_mentoria: "Mentoria Titulares" }).eq("id", lead.id);
    if (!error) updated++;
  }
  alert(`${updated} mentorados atualizados para Mentoria Titulares`);
  await refreshLeads();
};

/* ---------- Resumo hoje ---------- */

function renderSummaryToday(leads) {
  const trackingHoje = trackingCache.find((r) => r.data === todayISO());
  const leadsAbordadosHoje = trackingHoje ? trackingHoje.leads_abordados : 0;
  const reunioesAgendadasHoje = leads.filter((l) => isToday(l.agendamento_em)).length;
  const reunioesFeitasHoje = leads.filter(
    (l) => (l.status === "convertido" || l.status === "perdido") && isToday(l.status_changed_at)
  ).length;
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

/* ---------- Leads do dia ---------- */

function renderLeadsToday(leads) {
  const todayLeads = leads
    .filter((l) => isToday(l.agendamento_em))
    .filter((l) => {
      if (leadsTodayOrigemTab === "fluxo") return l.origem === "Fluxo";
      if (leadsTodayOrigemTab === "organico") return l.origem !== "Fluxo";
      return true;
    })
    .sort((a, b) => parseTimestamp(a.agendamento_em) - parseTimestamp(b.agendamento_em));
  leadsTodayEmptyState.hidden = todayLeads.length !== 0;

  leadsTodayTbody.innerHTML = todayLeads
    .map((l) => {
      const meta = STATUS_META[l.status];
      return `
        <tr data-id="${l.id}" class="clickable-row">
          <td>${formatDateTimeBR(l.agendamento_em)}</td>
          <td>${escapeHtml(l.nome)}</td>
          <td>${escapeHtml(l.instagram || "-")}</td>
          <td>${escapeHtml(l.email || "-")}</td>
          <td>${escapeHtml(l.whatsapp || "-")}</td>
          <td>${escapeHtml(l.profissao)}</td>
          <td><span class="badge" style="background:${meta.bg};color:${meta.text}">${escapeHtml(meta.label)}</span></td>
          <td>${escapeHtml(l.abordado_por)}</td>
          <td>${escapeHtml(l.dificuldade || "-")}</td>
        </tr>
      `;
    })
    .join("");
}

leadsTodayTbody.addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-id]");
  if (!row) return;
  loadLeadIntoForm(leadsCache.find((l) => l.id === row.dataset.id));
  nomeInput.scrollIntoView({ behavior: "smooth", block: "center" });
});

leadsTodayOrigemTabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".status-tab");
  if (!btn) return;
  leadsTodayOrigemTab = btn.dataset.origem;
  leadsTodayOrigemTabsEl.querySelectorAll(".status-tab").forEach((el) => el.classList.toggle("active", el === btn));
  renderLeadsToday(leadsCache);
});

/* ---------- Faturamento ---------- */

function renderFaturamento(leads) {
  const startDate = fatDataInicialInput.value;
  const endDate = fatDataFinalInput.value;
  if (!startDate || !endDate) return;

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T23:59:59");

  const vendas = leads
    .filter((l) => l.status === "convertido" && typeof l.valor_fechado === "number")
    .filter((l) => {
      if (fatOrigemTab === "fluxo") return l.origem === "Fluxo";
      if (fatOrigemTab === "organico") return l.origem !== "Fluxo";
      return true;
    })
    .filter((l) => {
      const d = parseTimestamp(l.status_changed_at);
      return d && d >= start && d <= end;
    })
    .map((l) => {
      const formaKey = l.pagamento_forma || "a_vista";
      const meta = FORMA_PAGAMENTO_META[formaKey] || FORMA_PAGAMENTO_META.a_vista;
      const isRecorrente = formaKey === "recorrente_cartao";
      const bruto = isRecorrente ? l.valor_fechado / (l.pagamento_parcelas || 1) : l.valor_fechado;
      const bruteTotal = isRecorrente ? l.valor_fechado : bruto;
      const ciclos = isRecorrente ? 1 : (meta.taxaFixaPorCiclo ? l.pagamento_parcelas || 1 : 1);
      const liquido = Math.max(0, bruto - bruto * meta.taxaPercentual - meta.taxaFixa * ciclos);
      const taxa = bruto ? (bruto - liquido) / bruto : 0;
      return { ...l, formaKey, formaLabel: meta.label, taxa, bruto, bruteTotal, liquido };
    })
    .sort((a, b) => parseTimestamp(b.status_changed_at) - parseTimestamp(a.status_changed_at));

  const faturamentoBruto = vendas.reduce((sum, v) => sum + v.bruto, 0);
  const faturamentoLiquido = vendas.reduce((sum, v) => sum + v.liquido, 0);
  const quantidadeVendas = vendas.length;
  const ticketMedio = quantidadeVendas ? faturamentoBruto / quantidadeVendas : 0;

  fatResumoEl.innerHTML = [
    { label: "Faturamento Bruto", value: formatBRL(faturamentoBruto) },
    { label: "Faturamento Líquido", value: formatBRL(faturamentoLiquido) },
    { label: "Quantidade de Vendas", value: quantidadeVendas },
    { label: "Ticket Médio", value: formatBRL(ticketMedio) },
  ]
    .map(
      (t) => `
        <div class="summary-tile">
          <span class="label">${t.label}</span>
          <span class="value">${t.value}</span>
        </div>
      `
    )
    .join("");

  fatFormasTbody.innerHTML = Object.keys(FORMA_PAGAMENTO_META)
    .map((key) => {
      const meta = FORMA_PAGAMENTO_META[key];
      const grupo = vendas.filter((v) => v.formaKey === key);
      const quantidade = grupo.length;
      const bruto = grupo.reduce((sum, v) => sum + v.bruto, 0);
      const liquido = grupo.reduce((sum, v) => sum + v.liquido, 0);
      const isRecorrente = key === "recorrente_cartao";
      const bruteTotal = isRecorrente ? grupo.reduce((sum, v) => sum + v.bruteTotal, 0) : 0;
      const mediaParcelas =
        key === "a_vista"
          ? "-"
          : quantidade
          ? (grupo.reduce((sum, v) => sum + (v.pagamento_parcelas || 1), 0) / quantidade).toFixed(1) + "x"
          : "-";
      const observacao = isRecorrente && bruteTotal ? `Valor total da venda: ${formatBRL(bruteTotal)}` : "-";
      return `
        <tr>
          <td>${meta.label}</td>
          <td>${quantidade}</td>
          <td>${formatBRL(bruto)}</td>
          <td>${formatBRL(liquido)}</td>
          <td>${mediaParcelas}</td>
          <td>${observacao}</td>
        </tr>
      `;
    })
    .join("");

  const tiposComVendas = vendas.some((v) => !v.tipo_mentoria) ? [...TIPOS_MENTORIA, null] : TIPOS_MENTORIA;
  fatMentoriaTbody.innerHTML = tiposComVendas
    .map((tipo) => {
      const grupo = vendas.filter((v) => (v.tipo_mentoria || null) === tipo);
      const quantidade = grupo.length;
      const bruto = grupo.reduce((sum, v) => sum + v.bruto, 0);
      const liquido = grupo.reduce((sum, v) => sum + v.liquido, 0);
      return `
        <tr>
          <td>${tipo ? escapeHtml(tipo) : "Não informado"}</td>
          <td>${quantidade}</td>
          <td>${formatBRL(bruto)}</td>
          <td>${formatBRL(liquido)}</td>
        </tr>
      `;
    })
    .join("");

  fatTransacoesEmptyState.hidden = vendas.length !== 0;
  fatTransacoesTbody.innerHTML = vendas
    .map(
      (v) => `
        <tr>
          <td>${escapeHtml(v.nome)}</td>
          <td>${mentoriaBadge(v.tipo_mentoria)}</td>
          <td>${pessoaBadge(v.abordado_por)}</td>
          <td>${pessoaBadge(v.fechado_por)}</td>
          <td>${formatBRL(v.bruto)}</td>
          <td>${v.formaLabel}</td>
          <td>${v.pagamento_parcelas || "-"}</td>
          <td>${(v.taxa * 100).toFixed(2)}%</td>
          <td>${formatBRL(v.liquido)}</td>
          <td>${formatDateTimeBR(v.status_changed_at)}</td>
        </tr>
      `
    )
    .join("");
}

fatAtualizarBtn.addEventListener("click", () => renderFaturamento(leadsCache));

fatOrigemTabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".status-tab");
  if (!btn) return;
  fatOrigemTab = btn.dataset.origem;
  fatOrigemTabsEl.querySelectorAll(".status-tab").forEach((el) => el.classList.toggle("active", el === btn));
  renderFaturamento(leadsCache);
});

/* ---------- Renovações próximas ---------- */

function daysUntil(dateStr) {
  const today = new Date(todayISO() + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target - today) / 86400000);
}

function renderRenewals(leads) {
  const upcoming = leads
    .filter((l) => l.status === "convertido" && l.data_vencimento)
    .map((l) => ({ ...l, diasRestantes: daysUntil(l.data_vencimento) }))
    .filter((l) => l.diasRestantes <= 15)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  renewalsEmptyState.hidden = upcoming.length !== 0;

  renewalsTbody.innerHTML = upcoming
    .map((l) => {
      const urgente = l.diasRestantes <= 5;
      return `
        <tr class="clickable-row" data-id="${l.id}">
          <td>${escapeHtml(l.nome)}</td>
          <td>${escapeHtml(l.email || "-")}</td>
          <td>${escapeHtml(l.whatsapp || "-")}</td>
          <td>${formatDateBR(l.data_vencimento)}</td>
          <td><span class="badge" style="background:${urgente ? "#ef4444" : "#fb923c"};color:#ffffff">${l.diasRestantes}</span></td>
        </tr>
      `;
    })
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

/* ---------- Custo de tráfego (Fluxo) ---------- */

function getCurrentCostPeriodDates() {
  const now = new Date();
  const day = now.getDate();
  const start = day >= 15 ? new Date(now.getFullYear(), now.getMonth(), 15) : new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const end = day >= 15 ? new Date(now.getFullYear(), now.getMonth() + 1, 15) : new Date(now.getFullYear(), now.getMonth(), 15);
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: toISO(start), end: toISO(end) };
}

function renderCusto(leads) {
  const startDate = custoDataInicialInput.value;
  const endDate = custoDataFinalInput.value;
  if (!startDate || !endDate) return;

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T23:59:59");
  const valorInvestido = Number(custoValorInvestidoInput.value) || 0;

  const fluxoPeriodo = leads.filter((l) => {
    if (l.origem !== "Fluxo") return false;
    const d = parseTimestamp(l.created_at);
    return d && d >= start && d <= end;
  });

  const totalAgendamentos = fluxoPeriodo.length;
  const totalVendas = fluxoPeriodo.filter((l) => l.status === "convertido").length;
  const totalReunioesFeitas = fluxoPeriodo.filter((l) => l.status === "convertido" || l.status === "perdido").length;
  const totalDesqualificados = fluxoPeriodo.filter((l) => l.status === "desqualificado").length;
  const totalAgendamentoQualificado = totalAgendamentos - totalDesqualificados;
  const totalNoShow = fluxoPeriodo.filter((l) => l.status === "nao_compareceu").length;

  const custoPor = (total) => (total ? valorInvestido / total : 0);

  custoResumoEl.innerHTML = [
    { label: "Total de agendamentos", value: totalAgendamentos },
    { label: "Custo por agendamento", value: formatBRL(custoPor(totalAgendamentos)) },
    { label: "Total de vendas", value: totalVendas },
    { label: "Custo por venda", value: formatBRL(custoPor(totalVendas)) },
    { label: "Total de reuniões feitas", value: totalReunioesFeitas },
    { label: "Custo por reunião feita", value: formatBRL(custoPor(totalReunioesFeitas)) },
    { label: "Total de agendamento qualificado", value: totalAgendamentoQualificado },
    { label: "Custo por agendamento qualificado", value: formatBRL(custoPor(totalAgendamentoQualificado)) },
    { label: "Total de no show", value: totalNoShow },
  ]
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

custoAtualizarBtn.addEventListener("click", () => renderCusto(leadsCache));

/* ---------- CRM Mentorados ---------- */

function renderMentorados(leads) {
  const mentorados = leads.filter((l) => l.status === "convertido" && l.tipo_mentoria === mentoriaTypeTab);

  const ativos = mentorados;
  const totalConvertidos = mentorados.length;
  const totalFaturamento = mentorados.reduce((sum, l) => sum + (l.valor_fechado || 0), 0);
  const ticketMedio = totalConvertidos ? totalFaturamento / totalConvertidos : 0;

  const titularesCount = leads.filter((l) => l.status === "convertido" && l.tipo_mentoria === "Mentoria Titulares").length;
  const emeritosCount = leads.filter((l) => l.status === "convertido" && l.tipo_mentoria === "Mentoria Eméritos").length;

  mentoriaTypeTabsEl.querySelectorAll(".status-tab").forEach((btn) => {
    const mentoria = btn.dataset.mentoria;
    const count = mentoria === "Mentoria Titulares" ? titularesCount : emeritosCount;
    const countEl = btn.querySelector(".status-tab-count");
    if (countEl) countEl.textContent = count;
  });

  mentoradosResumoEl.innerHTML = [
    { label: "Total de mentorados ativos", value: totalConvertidos },
    { label: "Faturamento total", value: formatBRL(totalFaturamento) },
    { label: "Ticket médio", value: formatBRL(ticketMedio) },
    { label: "Mentorados em acompanhamento", value: mentorados.filter((l) => l.data_vencimento && new Date(l.data_vencimento) > new Date()).length },
  ]
    .map(
      (t) => `
        <div class="summary-tile">
          <span class="label">${t.label}</span>
          <span class="value">${t.value}</span>
        </div>
      `
    )
    .join("");

  mentoradosEmptyState.hidden = ativos.length !== 0;

  const totalPages = Math.ceil(ativos.length / mentoradosPerPage);
  const startIdx = (mentoradosCurrentPage - 1) * mentoradosPerPage;
  const pageAtivos = ativos.slice(startIdx, startIdx + mentoradosPerPage);

  mentoradosCardsEl.innerHTML = pageAtivos
    .map((l) => `
      <div class="mentorado-card" data-id="${l.id}" style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; cursor: pointer; margin-bottom: 8px;">
        <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #1a1a1a;">${escapeHtml(l.nome)}</div>
        <div style="font-size: 12px; color: #6b6b6b; line-height: 1.6; margin-bottom: 4px;">Email: <span style="font-weight: 600; color: #1a1a1a;">${escapeHtml(l.email || "-")}</span></div>
        <div style="font-size: 12px; color: #6b6b6b; line-height: 1.6; margin-bottom: 4px;">WhatsApp: <span style="font-weight: 600; color: #1a1a1a;">${escapeHtml(l.whatsapp || "-")}</span></div>
        <div style="font-size: 12px; color: #6b6b6b; line-height: 1.6; margin-bottom: 4px;">Faturamento: <span style="font-weight: 600; color: #1a1a1a;">${formatBRL(l.valor_fechado || 0)}</span></div>
      </div>
    `)
    .join("");

  mentoradosPaginationEl.innerHTML = Array.from({ length: totalPages }, (_, i) => `
    <button type="button" class="pagination-tab ${i + 1 === mentoradosCurrentPage ? "active" : ""}" data-page="${i + 1}">${i + 1}</button>
  `).join("");

  mentoradosSaidosEmptyState.hidden = true;
  mentoradosSaidosTbody.innerHTML = "";
}

document.addEventListener("click", (e) => {
  const card = e.target.closest(".mentorado-card");
  if (!card) return;
  console.log("Card clicked:", card);
  const leadId = card.dataset.id;
  if (!leadId) return;
  const lead = leadsCache.find((l) => l.id === leadId);
  if (lead) {
    loadLeadIntoForm(lead);
    const leadsSection = document.querySelector("#section-leads");
    if (leadsSection) leadsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

mentoradosPaginationEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".pagination-tab");
  if (!btn) return;
  mentoradosCurrentPage = parseInt(btn.dataset.page, 10);
  renderMentorados(leadsCache);
});

mentoriaTypeTabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".status-tab");
  if (!btn) return;
  mentoriaTypeTab = btn.dataset.mentoria;
  mentoriaTypeTabsEl.querySelectorAll(".status-tab").forEach((el) => el.classList.toggle("active", el === btn));
  renderMentorados(leadsCache);
});

mentoradosMainTabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".status-tab");
  if (!btn) return;
  mentoradosMainTab = btn.dataset.tab;
  mentoradosMainTabsEl.querySelectorAll(".status-tab").forEach((el) => el.classList.toggle("active", el === btn));

  document.getElementById("tab-ativos").hidden = mentoradosMainTab !== "ativos";
  document.getElementById("tab-renovacoes").hidden = mentoradosMainTab !== "renovacoes";
  document.getElementById("tab-saidos").hidden = mentoradosMainTab !== "saidos";
});

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
    { key: "hoje", label: "Diário" },
    { key: "semana", label: "Semana" },
    { key: "mes", label: "Mês" },
    { key: "ano", label: "Ano" },
  ];

  reportTbody.innerHTML = periods
    .map((period) => {
      const leadsPeriodo = leads.filter((l) => l.created_at && parseTimestamp(l.created_at) >= starts[period.key]);
      const naoCompareceram = leadsPeriodo.filter((l) => l.status === "nao_compareceu").length;
      const convertidos = leadsPeriodo.filter((l) => l.status === "convertido").length;
      const taxa = leadsPeriodo.length ? ((convertidos / leadsPeriodo.length) * 100).toFixed(1) : "0.0";
      return `
        <tr>
          <td>${period.label}</td>
          <td>${leadsPeriodo.length}</td>
          <td>${naoCompareceram}</td>
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

function renderStatusTabs(leads) {
  const origemValue = origemFilter.value;
  const abordadoValue = abordadoFilter.value;

  const preFiltered = leads.filter((lead) => {
    const matchesOrigem = !origemValue || lead.origem === origemValue;
    const matchesAbordado = !abordadoValue || lead.abordado_por === abordadoValue;
    return matchesOrigem && matchesAbordado;
  });

  statusTabsEl.querySelectorAll(".status-tab").forEach((btn) => {
    const status = btn.dataset.status;
    const count = status ? preFiltered.filter((l) => l.status === status).length : preFiltered.length;
    btn.querySelector(".status-tab-count").textContent = count;
    btn.classList.toggle("active", status === activeStatusTab);
  });
}

function renderTable(leads) {
  renderStatusTabs(leads);

  const origemValue = origemFilter.value;
  const abordadoValue = abordadoFilter.value;
  const searchValue = leadsSearchInput.value.trim().toLowerCase();

  const hasActiveFilter = !!activeStatusTab || !!origemValue || !!abordadoValue || !!searchValue;

  if (!hasActiveFilter) {
    tbody.innerHTML = "";
    emptyState.hidden = true;
    leadsPromptState.hidden = false;
    return;
  }
  leadsPromptState.hidden = true;

  const filtered = leads.filter((lead) => {
    const matchesOrigem = !origemValue || lead.origem === origemValue;
    const matchesStatus = !activeStatusTab || lead.status === activeStatusTab;
    const matchesAbordado = !abordadoValue || lead.abordado_por === abordadoValue;
    const matchesSearch =
      !searchValue ||
      (lead.nome && lead.nome.toLowerCase().includes(searchValue)) ||
      (lead.whatsapp && lead.whatsapp.toLowerCase().includes(searchValue)) ||
      (lead.email && lead.email.toLowerCase().includes(searchValue));
    return matchesOrigem && matchesStatus && matchesAbordado && matchesSearch;
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
        <td>${escapeHtml(lead.origem)}</td>
        <td><span class="badge" style="background:${meta.bg};color:${meta.text}">${escapeHtml(meta.label)}</span></td>
        <td>${formatDateTimeBR(lead.agendamento_em)}</td>
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
  renderRenewals(leadsCache);
  renderLeadsToday(leadsCache);
  renderFaturamento(leadsCache);
  renderCusto(leadsCache);
  renderMentorados(leadsCache);
}

/* ---------- Form submit (criar / editar) ---------- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = nomeInput.value.trim();
  const whatsapp = whatsappInput.value.trim();
  const email = emailInput.value.trim();

  if (!nome || !whatsapp) {
    alert("Nome e WhatsApp são obrigatórios.");
    return;
  }

  const editingId = leadIdInput.value;

  const leadData = {
    nome,
    email,
    instagram: instagramInput.value.trim(),
    whatsapp,
    profissao: profissaoInput.value,
    origem: origemInput.value,
    abordado_por: abordadoPorInput.value,
    status: statusInput.value,
    dificuldade: dificuldadeInput.value.trim(),
    online: onlineInput.value,
    agendamento_em: agendamentoEmInput.value ? new Date(agendamentoEmInput.value).toISOString() : null,
    valor_fechado: statusInput.value === "convertido" && valorFechadoInput.value ? Number(valorFechadoInput.value) : null,
    data_vencimento: statusInput.value === "convertido" ? dataVencimentoInput.value || null : null,
    pagamento_forma: statusInput.value === "convertido" ? pagamentoFormaInput.value || null : null,
    fechado_por: statusInput.value === "convertido" ? fechadoPorInput.value || null : null,
    tipo_mentoria: statusInput.value === "convertido" ? tipoMentoriaInput.value || null : null,
    pagamento_parcelas:
      statusInput.value === "convertido" && pagamentoParcelasInput.value ? Number(pagamentoParcelasInput.value) : null,
    perdido_motivo: statusInput.value === "perdido" ? perdidoMotivoInput.value || null : null,
    perdido_followup: statusInput.value === "perdido" ? perdidoFollowupInput.value || null : null,
    perdido_followup_data:
      statusInput.value === "perdido" && perdidoFollowupInput.value === "Sim" ? perdidoFollowupDataInput.value || null : null,
    followup_data: statusInput.value === "follow_up" ? followupDataValueInput.value || null : null,
    faturamento_3meses: statusInput.value === "convertido" && faturamento3mesesFieldInput.value ? Number(faturamento3mesesFieldInput.value) : null,
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

function loadLeadIntoForm(lead) {
  if (!lead) return;

  leadIdInput.value = lead.id;
  nomeInput.value = lead.nome;
  emailInput.value = lead.email;
  instagramInput.value = lead.instagram || "";
  whatsappInput.value = lead.whatsapp || "";
  profissaoInput.value = lead.profissao;
  origemInput.value = lead.origem;
  abordadoPorInput.value = lead.abordado_por;
  renderStatusOptions(lead.status);
  cadastroDataInput.value = lead.created_at ? toDatetimeLocalValue(lead.created_at).slice(0, 10) : todayISO();
  agendamentoEmInput.value = toDatetimeLocalValue(lead.agendamento_em);
  valorFechadoInput.value = lead.valor_fechado || "";
  dataVencimentoInput.value = lead.data_vencimento || "";
  fechadoPorInput.value = lead.fechado_por || "";
  tipoMentoriaInput.value = lead.tipo_mentoria || "";
  pagamentoFormaInput.value = lead.pagamento_forma || "";
  pagamentoParcelasInput.value = lead.pagamento_parcelas || "";
  formValorFechadoInput.value = lead.valor_fechado || "";
  formDataVencimentoInput.value = lead.data_vencimento || "";
  formFechadoPorInput.value = lead.fechado_por || "";
  formTipoMentoriaInput.value = lead.tipo_mentoria || "";
  formPagamentoFormaInput.value = lead.pagamento_forma || "";
  formPagamentoParcelasInput.value = lead.pagamento_parcelas || "";
  perdidoMotivoInput.value = lead.perdido_motivo || "";
  perdidoFollowupInput.value = lead.perdido_followup || "";
  perdidoFollowupDataInput.value = lead.perdido_followup_data || "";
  followupDataValueInput.value = lead.followup_data || "";
  followupDataInput.value = lead.followup_data || "";
  faturamento3mesesInput.value = lead.faturamento_3meses || "";
  faturamento3mesesFieldInput.value = lead.faturamento_3meses || "";
  dificuldadeInput.value = lead.dificuldade || "";
  onlineInput.value = lead.online;

  if (lead.status === "convertido") {
    faturamento3mesesField.hidden = false;
    pagamentoDetailsSection.hidden = false;
  } else if (lead.status === "follow_up") {
    followupDataField.hidden = false;
    pagamentoDetailsSection.hidden = true;
  } else {
    faturamento3mesesField.hidden = true;
    pagamentoDetailsSection.hidden = true;
    followupDataField.hidden = true;
  }

  submitBtn.textContent = "Salvar alterações";
  cancelEditBtn.hidden = false;
  nomeInput.focus();
  nomeInput.scrollIntoView({ behavior: "smooth", block: "center" });
}

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
    loadLeadIntoForm(leadsCache.find((l) => l.id === id));
  }
});

renewalsTbody.addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-id]");
  if (!row) return;
  loadLeadIntoForm(leadsCache.find((l) => l.id === row.dataset.id));
});

cancelEditBtn.addEventListener("click", resetForm);

/* ---------- Filtros ---------- */

origemFilter.addEventListener("change", () => renderTable(leadsCache));
abordadoFilter.addEventListener("change", () => renderTable(leadsCache));
leadsSearchInput.addEventListener("input", () => renderTable(leadsCache));

statusTabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".status-tab");
  if (!btn) return;
  activeStatusTab = btn.dataset.status;
  renderTable(leadsCache);
});

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

/* ---------- Main navigation ---------- */

document.querySelectorAll(".nav-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.dataset.section;

    document.querySelectorAll(".nav-tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".section-container").forEach((s) => s.hidden = true);

    btn.classList.add("active");
    document.getElementById(`section-${section}`).hidden = false;
  });
});

(async function init() {
  resetForm();
  trkDateInput.value = todayISO();
  const now = new Date();
  fatDataInicialInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  fatDataFinalInput.value = todayISO();
  const costPeriod = getCurrentCostPeriodDates();
  custoDataInicialInput.value = costPeriod.start;
  custoDataFinalInput.value = costPeriod.end;
  await refreshLeads();
  await refreshTracking();
  setupRealtime();
})();
