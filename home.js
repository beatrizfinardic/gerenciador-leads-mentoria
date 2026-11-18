const MESES_HOME = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

let homeMes = new Date();
let homeLeads = [];
let homeEventos = [];

const homeCalendarioEl = document.getElementById("home-calendario");
const homeProximosEl = document.getElementById("home-proximos");
const homeResumoEl = document.getElementById("home-resumo");
const homePendenciasEl = document.getElementById("home-pendencias");

async function carregarEventosHome() {
  const { data, error } = await sb.from("eventos").select("*").order("data", { ascending: true });
  homeEventos = error ? [] : data;
}

function mapaDiasHome(leads, eventos) {
  const mapa = {};
  const add = (chave, tipo) => {
    mapa[chave] = mapa[chave] || { agendamento: 0, evento: 0, renovacao: 0 };
    mapa[chave][tipo] += 1;
  };
  leads.forEach((l) => {
    if (l.agendamento_em) {
      const d = parseTimestamp(l.agendamento_em);
      if (d) add(isoFromDate(d), "agendamento");
    }
    if (l.status === "convertido") {
      const prazo = prazoRenovacao(l);
      if (prazo) add(prazo, "renovacao");
    }
  });
  eventos.forEach((e) => add(e.data, "evento"));
  return mapa;
}

function renderHomeResumo(leads, eventos) {
  const hoje = todayISO();
  const agendamentosHoje = leads.filter((l) => isToday(l.agendamento_em)).length;
  const followUps = leads.filter((l) => l.status === "follow_up").length;
  const renovacoes15 = leads.filter((l) => {
    if (l.status !== "convertido") return false;
    const prazo = prazoRenovacao(l);
    if (!prazo) return false;
    const dias = daysUntil(prazo);
    return dias >= 0 && dias <= 15;
  }).length;
  const eventos30 = eventos.filter((e) => {
    const dias = daysUntil(e.data);
    return e.data >= hoje && dias <= 30;
  }).length;

  homeResumoEl.innerHTML = [
    { label: "Agendamentos hoje", value: agendamentosHoje },
    { label: "Follow ups", value: followUps },
    { label: "Renovações em 15 dias", value: renovacoes15 },
    { label: "Eventos em 30 dias", value: eventos30 },
  ]
    .map(
      (t) => `
        <div class="summary-tile">
          <span class="label">${t.label}</span>
          <span class="value">${t.value}</span>
        </div>`
    )
    .join("");
}

function renderHomePendencias(leads) {
  const naoRenovados = leads.filter(
    (l) =>
      l.status === "nao_renovou" ||
      (l.status === "convertido" && l.renovou === false && l.reuniao_6m_feita === true && l.upgrade_emeritos !== true)
  ).length;

  const cards = [
    { titulo: "Alinhamento (3 meses)", valor: alertasContagem.m3, secao: "alertas", cor: "#2563eb" },
    { titulo: "Renovação (6 meses)", valor: alertasContagem.m6, secao: "alertas", cor: "#ea580c" },
    { titulo: "Eméritos (12 meses)", valor: alertasContagem.m12, secao: "alertas", cor: "#7c3aed" },
    { titulo: "Não renovados", valor: naoRenovados, secao: "mentorados", cor: "#6b7280" },
  ];

  homePendenciasEl.innerHTML = cards
    .map(
      (c) => `
        <button type="button" class="home-pendencia" data-secao="${c.secao}" style="border-left-color:${c.cor}">
          <span class="home-pendencia-titulo">${c.titulo}</span>
          <span class="home-pendencia-valor">${c.valor}</span>
          <span class="home-pendencia-acao">Ver lista →</span>
        </button>`
    )
    .join("");
}

function renderHomeCalendario(leads, eventos) {
  const ano = homeMes.getFullYear();
  const mes = homeMes.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const offset = (new Date(ano, mes, 1).getDay() + 6) % 7;
  const mapa = mapaDiasHome(leads, eventos);
  const hoje = todayISO();

  let html = `
    <div class="cal-cabecalho">
      <button type="button" class="btn btn-secondary btn-small" data-mes="-1">‹</button>
      <strong>${MESES_HOME[mes]} de ${ano}</strong>
      <button type="button" class="btn btn-secondary btn-small" data-mes="1">›</button>
    </div>
    <div class="cal-grade">
      ${["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => `<div class="cal-dia-semana">${d}</div>`).join("")}`;

  for (let i = 0; i < offset; i++) html += `<div class="cal-dia cal-vazio"></div>`;

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const chave = isoFromDate(new Date(ano, mes, dia));
    const m = mapa[chave] || {};
    html += `
      <div class="cal-dia${chave === hoje ? " cal-hoje" : ""}">
        <span class="cal-numero">${dia}</span>
        <div class="cal-marcas">
          ${m.agendamento ? `<span class="marca marca-ag">${m.agendamento}</span>` : ""}
          ${m.evento ? `<span class="marca marca-ev">${m.evento}</span>` : ""}
          ${m.renovacao ? `<span class="marca marca-re">${m.renovacao}</span>` : ""}
        </div>
      </div>`;
  }

  html += `</div>
    <div class="cal-legenda">
      <span class="marca marca-ag">Agendamentos</span>
      <span class="marca marca-ev">Eventos</span>
      <span class="marca marca-re">Renovações</span>
    </div>`;

  homeCalendarioEl.innerHTML = html;
}

function renderHomeProximos(eventos) {
  const hoje = todayISO();
  const proximos = eventos.filter((e) => e.data >= hoje).slice(0, 5);

  homeProximosEl.innerHTML = proximos.length
    ? proximos
        .map(
          (e) => `
            <div class="home-evento">
              <div class="home-evento-data">${formatDateBR(e.data)}</div>
              <div class="home-evento-info">
                <strong>${escapeHtml(e.tema)}</strong>
                <span>${escapeHtml(e.tipo)}${e.local_cidade ? ` · ${escapeHtml(e.local_cidade)}` : ""}</span>
              </div>
              <div class="home-evento-dias">${daysUntil(e.data) === 0 ? "Hoje" : `${daysUntil(e.data)} dias`}</div>
            </div>`
        )
        .join("")
    : `<p class="empty-state">Nenhum evento futuro cadastrado.</p>`;
}

async function renderHome(leads) {
  homeLeads = leads;
  try {
    await carregarEventosHome();
    renderHomeResumo(homeLeads, homeEventos);
    renderHomePendencias(homeLeads);
    renderHomeCalendario(homeLeads, homeEventos);
    renderHomeProximos(homeEventos);
  } catch (erro) {
    console.error(erro);
  }
}

homePendenciasEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-secao]");
  if (!btn) return;
  document.querySelector(`.nav-tab[data-section="${btn.dataset.secao}"]`).click();
});

homeCalendarioEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-mes]");
  if (!btn) return;
  homeMes = new Date(homeMes.getFullYear(), homeMes.getMonth() + parseInt(btn.dataset.mes, 10), 1);
  renderHomeCalendario(homeLeads, homeEventos);
});
