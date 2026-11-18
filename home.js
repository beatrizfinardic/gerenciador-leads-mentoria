const MESES_HOME = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

let homeMes = new Date();
let homeLeads = [];
let homeEventos = [];

const homeCalendarioEl = document.getElementById("evt-calendario");
const evtDiaDetalhesEl = document.getElementById("evt-dia-detalhes");
const evtProximosEl = document.getElementById("evt-proximos");
let diaSelecionado = null;




async function carregarEventosHome() {
  const { data, error } = await sb.from("eventos").select("*").order("data", { ascending: true });
  homeEventos = error ? [] : data;
}

function mapaDiasHome(eventos) {
  const mapa = {};
  eventos.forEach((e) => {
    mapa[e.data] = (mapa[e.data] || 0) + 1;
  });
  return mapa;
}

function renderHomeCalendario(leads, eventos) {
  const ano = homeMes.getFullYear();
  const mes = homeMes.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const offset = (new Date(ano, mes, 1).getDay() + 6) % 7;
  const mapa = mapaDiasHome(eventos);
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
    const m = { evento: mapa[chave] || 0 };
    html += `
      <div class="cal-dia cal-dia-clicavel${chave === hoje ? " cal-hoje" : ""}${chave === diaSelecionado ? " cal-selecionado" : ""}" data-dia="${chave}">
        <span class="cal-numero">${dia}</span>
        <div class="cal-marcas">
          ${m.evento ? `<span class="marca marca-ev">${m.evento}</span>` : ""}
        </div>
      </div>`;
  }

  html += `</div>
    <div class="cal-legenda">
      <span class="marca marca-ev">Eventos</span>
    </div>`;

  homeCalendarioEl.innerHTML = html;
}

async function renderHome(leads) {
  homeLeads = leads;
  try {
    await carregarEventosHome();
    renderHomeCalendario(homeLeads, homeEventos);
    renderEvtProximos(homeEventos);
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
  const eventosDia = homeEventos.filter((e) => e.data === chave);
  evtDiaDetalhesEl.innerHTML = `
    <div class="dia-detalhes-cabecalho">Eventos em ${formatDateBR(chave)}</div>
    <div class="dia-bloco" style="border-left-color:#7c3aed">
      ${eventosDia.length
        ? eventosDia
            .map(
              (e) => `<div class="dia-item"><strong>${escapeHtml(e.tema)}</strong><span>${escapeHtml(e.tipo)}${e.local_cidade ? " · " + escapeHtml(e.local_cidade) : ""}${e.organizador ? " · " + escapeHtml(e.organizador) : ""}</span></div>`
            )
            .join("")
        : `<p class="empty-state">Nenhum evento neste dia.</p>`}
    </div>`;
}

homeCalendarioEl.addEventListener("click", (e) => {
  const dia = e.target.closest("[data-dia]");
  if (!dia) return;
  diaSelecionado = dia.dataset.dia;
  renderHomeCalendario(homeLeads, homeEventos);
  renderDiaDetalhes(diaSelecionado);
});

function renderEvtProximos(eventos) {
  const hoje = todayISO();
  const proximos = eventos.filter((e) => e.data >= hoje).slice(0, 8);
  evtProximosEl.innerHTML = proximos.length
    ? proximos
        .map(
          (e) => `
            <div class="home-evento">
              <div class="home-evento-data">${formatDateBR(e.data)}</div>
              <div class="home-evento-info">
                <strong>${escapeHtml(e.tema)}</strong>
                <span>${escapeHtml(e.tipo)}${e.local_cidade ? " · " + escapeHtml(e.local_cidade) : ""}</span>
              </div>
              <div class="home-evento-dias">${daysUntil(e.data) === 0 ? "Hoje" : daysUntil(e.data) + " dias"}</div>
            </div>`
        )
        .join("")
    : `<p class="empty-state">Nenhum evento futuro cadastrado.</p>`;
}
