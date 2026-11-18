const eventosForm = document.getElementById("evento-form");
const eventoTipoInput = document.getElementById("evento-tipo");
const eventoTemaInput = document.getElementById("evento-tema");
const eventoLocalInput = document.getElementById("evento-local");
const eventoOrganizadorInput = document.getElementById("evento-organizador");
const eventoContatoInput = document.getElementById("evento-contato");
const eventoPagamentoInput = document.getElementById("evento-pagamento");
const eventoAcordoInput = document.getElementById("evento-acordo");
const eventoDataInput = document.getElementById("evento-data");
const eventoTempoInput = document.getElementById("evento-tempo");
const eventosTbody = document.getElementById("eventos-tbody");
const eventosEmpty = document.getElementById("eventos-empty");
const eventosProxima = document.getElementById("eventos-proxima");

async function carregarEventos() {
  const { data, error } = await sb.from("eventos").select("*").order("data", { ascending: true });
  if (error) {
    eventosTbody.innerHTML = "";
    eventosProxima.textContent = "";
    eventosEmpty.textContent = "Erro ao carregar eventos: " + error.message;
    eventosEmpty.hidden = false;
    return;
  }
  renderEventos(data);
  if (typeof renderHome === "function") renderHome(leadsCache);
}

function renderEventos(eventos) {
  const hoje = todayISO();
  const proxima = eventos.find((e) => e.data >= hoje);

  eventosProxima.textContent = proxima
    ? `Próximo: ${proxima.tema} (${proxima.tipo}) em ${formatDateBR(proxima.data)}, faltam ${daysUntil(proxima.data)} dias`
    : "";
  eventosEmpty.textContent = "Nenhum evento cadastrado.";
  eventosEmpty.hidden = eventos.length !== 0;

  eventosTbody.innerHTML = eventos
    .map((e) => {
      const estilo = e === proxima ? "background:#f0fdf4;font-weight:600" : e.data < hoje ? "color:#9ca3af" : "";
      return `
        <tr style="${estilo}">
          <td>${formatDateBR(e.data)}</td>
          <td>${escapeHtml(e.tipo)}</td>
          <td>${escapeHtml(e.tema)}</td>
          <td>${escapeHtml(e.local_cidade || "-")}</td>
          <td>${escapeHtml(e.organizador || "-")}</td>
          <td>${escapeHtml(e.contato || "-")}</td>
          <td>${escapeHtml(e.pagamento || "-")}</td>
          <td style="white-space:pre-wrap">${escapeHtml(e.acordo || "-")}</td>
          <td>${escapeHtml(e.tempo || "-")}</td>
          <td><button class="btn btn-danger btn-small" data-action="excluir-evento" data-id="${e.id}">Excluir</button></td>
        </tr>`;
    })
    .join("");
}

eventosForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const registro = {
    tipo: eventoTipoInput.value,
    tema: eventoTemaInput.value.trim(),
    local_cidade: eventoLocalInput.value.trim() || null,
    organizador: eventoOrganizadorInput.value.trim() || null,
    contato: eventoContatoInput.value.trim() || null,
    pagamento: eventoPagamentoInput.value.trim() || null,
    acordo: eventoAcordoInput.value.trim() || null,
    data: eventoDataInput.value,
    tempo: eventoTempoInput.value.trim() || null,
  };

  const { error } = await sb.from("eventos").insert([registro]);
  if (error) {
    alert("Erro ao salvar evento: " + error.message);
    return;
  }

  eventosForm.reset();
  await carregarEventos();
});

eventosTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action='excluir-evento']");
  if (!btn) return;
  if (!confirm("Excluir este evento?")) return;

  const { error } = await sb.from("eventos").delete().eq("id", btn.dataset.id);
  if (error) {
    alert("Erro ao excluir evento: " + error.message);
    return;
  }
  await carregarEventos();
});

document.querySelector('.nav-tab[data-section="eventos"]').addEventListener("click", carregarEventos);
