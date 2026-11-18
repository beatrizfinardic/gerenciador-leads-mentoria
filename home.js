const MESES_HOME = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

let homeMes = new Date();
let homeLeads = [];
let homeEventos = [];

const homeCalendarioEl = document.getElementById("evt-calendario");
const evtDiaDetalhesEl = document.getElementById("evt-dia-detalhes");
let diaSelecionado = null;




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
      <div class="cal-dia cal-dia-clicavel${chave === hoje ? " cal-hoje" : ""}${chave === diaSelecionado ? " cal-selecionado" : ""}" data-dia="${chave}">
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

async function renderHome(leads) {
  homeLeads = leads;
  try {
    await carregarEventosHome();
    renderHomeCalendario(homeLeads, homeEventos);
  } catch (erro) {
    console.error(erro);
  }
}

homeCalendarioEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-mes]");
  if (!btn) return;
  homeMes = new Date(homeMes.getFullYear(), homeMes.getMonth() + parseInt(btn.dataset.mes, 10), 1);
  renderHomeCalendario(homeLeads, homeEventos);
});

function renderDiaDetalhes(chave) {
  const agendamentos = homeLeads.filter((l) => {
    if (!l.agendamento_em) return false;
    const d = parseTimestamp(l.agendamento_em);
    return d && isoFromDate(d) === chave;
  });
  const eventosDia = homeEventos.filter((e) => e.data === chave);
  const renovacoes = homeLeads.filter((l) => l.status === "convertido" && prazoRenovacao(l) === chave);

  const bloco = (titulo, cor, itens) => `
    <div class="dia-bloco" style="border-left-color:${cor}">
      <div class="dia-bloco-titulo">${titulo} (${itens.length})</div>
      ${itens.length ? itens.join("") : `<p class="empty-state">Nada neste dia.</p>`}
    </div>`;

  evtDiaDetalhesEl.innerHTML = `
    <div class="dia-detalhes-cabecalho">Dia ${formatDateBR(chave)}</div>
    ${bloco("Agendamentos", "#2563eb", agendamentos.map((l) => `<div class="dia-item"><strong>${escapeHtml(l.nome)}</strong><span>${escapeHtml(l.origem || "-")} · ${escapeHtml(l.status_label || (STATUS_META[l.status] || {}).label || l.status)}</span></div>`))}
    ${bloco("Eventos", "#7c3aed", eventosDia.map((e) => `<div class="dia-item"><strong>${escapeHtml(e.tema)}</strong><span>${escapeHtml(e.tipo)}${e.local_cidade ? " · " + escapeHtml(e.local_cidade) : ""}${e.organizador ? " · " + escapeHtml(e.organizador) : ""}</span></div>`))}
    ${bloco("Renovações", "#ea580c", renovacoes.map((l) => `<div class="dia-item"><strong>${escapeHtml(l.nome)}</strong><span>${escapeHtml(l.tipo_mentoria || "-")}</span></div>`))}
  `;
}

homeCalendarioEl.addEventListener("click", (e) => {
  const dia = e.target.closest("[data-dia]");
  if (!dia) return;
  diaSelecionado = dia.dataset.dia;
  renderHomeCalendario(homeLeads, homeEventos);
  renderDiaDetalhes(diaSelecionado);
});
