const acompBuscaInput = document.getElementById("acomp-busca");
const acompTipoSelect = document.getElementById("acomp-tipo");
const acompImportarInput = document.getElementById("acomp-importar");
const acompStatusEl = document.getElementById("acomp-status");
const acompTbody = document.getElementById("acomp-tbody");
const acompEmptyEl = document.getElementById("acomp-empty");
const acompDetalheEl = document.getElementById("acomp-detalhe");
const acompDetalheNomeEl = document.getElementById("acomp-detalhe-nome");
const acompDetalheDadosEl = document.getElementById("acomp-detalhe-dados");
const acomp3mFeitaInput = document.getElementById("acomp-3m-feita");
const acomp3mDataInput = document.getElementById("acomp-3m-data");
const acomp3mObsInput = document.getElementById("acomp-3m-obs");
const acomp6mFeitaInput = document.getElementById("acomp-6m-feita");
const acomp6mDataInput = document.getElementById("acomp-6m-data");
const acomp6mObsInput = document.getElementById("acomp-6m-obs");
const acompRenovouInput = document.getElementById("acomp-renovou");
const acompSalvarBtn = document.getElementById("acomp-salvar-btn");
const acompFecharBtn = document.getElementById("acomp-fechar-btn");

let acompCache = [];
let acompAbertoId = null;

function parseCsv(texto) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let entreAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreAspas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreAspas = true;
    } else if (c === ",") {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

function parseDataBR(texto) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((texto || "").trim());
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function setAcompStatus(mensagem) {
  acompStatusEl.textContent = mensagem;
}

async function carregarAcompanhamento() {
  const { data, error } = await sb.from("mentorados_planilha").select("*").order("nome");
  if (error) {
    setAcompStatus(`Erro ao carregar mentorados: ${error.message}`);
    return;
  }
  acompCache = data;
  renderAcompanhamento();
}

async function importarPlanilhaCsv(arquivo) {
  const tipo = acompTipoSelect.value;
  if (!tipo) {
    setAcompStatus("Escolha Titulares ou Eméritos no filtro antes de importar.");
    return;
  }
  const { count, error: erroContagem } = await sb
    .from("mentorados_planilha")
    .select("id", { count: "exact", head: true })
    .eq("tipo_mentoria", tipo);
  if (erroContagem) {
    setAcompStatus(erroContagem.message);
    return;
  }
  if (count > 0) {
    setAcompStatus(`Já existem ${count} mentorados de ${tipo} cadastrados. A importação foi cancelada para não duplicar.`);
    return;
  }

  const linhas = parseCsv((await arquivo.text()).replace(/^﻿/, ""));
  const cabecalho = linhas[0].map((h) => h.trim());
  const contagem = {};
  const chaves = cabecalho.map((h) => {
    contagem[h] = (contagem[h] || 0) + 1;
    return contagem[h] === 1 ? h : `${h} (${contagem[h]})`;
  });

  const registros = linhas
    .slice(1)
    .filter((l) => l.some((c) => c.trim()))
    .map((l) => {
      const dados = {};
      chaves.forEach((k, i) => {
        const v = (l[i] ?? "").trim();
        if (v) dados[k] = v;
      });
      return {
        tipo_mentoria: tipo,
        nome: dados["Nome"],
        telefone: dados["Telefone"] || null,
        email: dados["E-mail"] || null,
        cpf: dados["CPF"] || null,
        rg: dados["RG"] || null,
        data_entrada: parseDataBR(dados["Data que entrou"]),
        data_encerra: parseDataBR(dados["Data que encerra"]),
        dados,
      };
    })
    .filter((r) => r.nome);

  for (let i = 0; i < registros.length; i += 50) {
    const { error } = await sb.from("mentorados_planilha").insert(registros.slice(i, i + 50));
    if (error) {
      setAcompStatus(`Erro ao importar: ${error.message}`);
      return;
    }
  }
  setAcompStatus(`${registros.length} mentorados importados de ${tipo}.`);
  await carregarAcompanhamento();
}

acompImportarInput.addEventListener("change", async () => {
  const arquivo = acompImportarInput.files[0];
  if (!arquivo) return;
  await importarPlanilhaCsv(arquivo);
  acompImportarInput.value = "";
});

function situacaoAcompanhamento(feita, dataPrevista, extra = "") {
  if (feita) return { texto: "Reunião feita", cor: "#16a34a", textoCor: "#ffffff" };
  if (!dataPrevista) return { texto: "Sem data", cor: "#9ca3af", textoCor: "#ffffff" };
  const dias = daysUntil(dataPrevista);
  if (dias < 0) return { texto: `Atrasada há ${-dias} dias${extra}`, cor: "#dc2626", textoCor: "#ffffff" };
  if (dias === 0) return { texto: `Vence hoje${extra}`, cor: "#dc2626", textoCor: "#ffffff" };
  if (dias <= 15) return { texto: `Faltam ${dias} dias${extra}`, cor: "#fb923c", textoCor: "#ffffff" };
  if (dias <= 20) return { texto: `Faltam ${dias} dias${extra}`, cor: "#fde68a", textoCor: "#1a1a1a" };
  return { texto: `Faltam ${dias} dias${extra}`, cor: "#e5e7eb", textoCor: "#1a1a1a" };
}

function badgeSituacao(s) {
  return `<span class="badge" style="background:${s.cor};color:${s.textoCor}">${s.texto}</span>`;
}

function situacoesDoMentorado(m) {
  const entrada = m.data_entrada ? new Date(m.data_entrada + "T00:00:00") : null;
  const prevista3 = entrada ? isoFromDate(addMonthsToDate(entrada, 3)) : null;
  const prevista6 = m.data_encerra || (entrada ? isoFromDate(addMonthsToDate(entrada, 6)) : null);
  const reuniao3 = situacaoAcompanhamento(m.reuniao_3m_feita === true, prevista3);
  const renovacao =
    m.renovou === true
      ? { texto: "Renovou", cor: "#16a34a", textoCor: "#ffffff" }
      : situacaoAcompanhamento(m.reuniao_6m_feita === true, prevista6);
  return { reuniao3, renovacao, prevista3, prevista6 };
}

function renderAcompanhamento() {
  const busca = acompBuscaInput.value.trim().toLowerCase();
  const tipo = acompTipoSelect.value;
  const filtrados = acompCache.filter(
    (m) => (!tipo || m.tipo_mentoria === tipo) && (!busca || m.nome.toLowerCase().includes(busca))
  );

  acompEmptyEl.hidden = acompCache.length !== 0;
  acompTbody.innerHTML = filtrados
    .map((m) => {
      const { reuniao3, renovacao, prevista3, prevista6 } = situacoesDoMentorado(m);
      return `
        <tr class="clickable-row" data-id="${m.id}">
          <td>${escapeHtml(m.nome)}<br /><small>${escapeHtml(m.tipo_mentoria)}</small></td>
          <td>${contatoAlertaCell({ whatsapp: m.telefone, email: m.email })}</td>
          <td>${formatDateBR(m.data_entrada)}</td>
          <td>${badgeSituacao(reuniao3)}<br /><small>${formatDateBR(prevista3)}</small></td>
          <td>${badgeSituacao(renovacao)}<br /><small>${formatDateBR(prevista6)}</small></td>
        </tr>`;
    })
    .join("");
}

function abrirDetalheAcompanhamento(id) {
  const m = acompCache.find((x) => String(x.id) === String(id));
  if (!m) return;
  acompAbertoId = m.id;
  acompDetalheNomeEl.textContent = m.nome;
  acompDetalheDadosEl.innerHTML = Object.entries(m.dados || {})
    .map(
      ([chave, valor]) => `
        <div class="summary-tile">
          <span class="label">${escapeHtml(chave)}</span>
          <span class="value" style="font-size: 14px;">${escapeHtml(valor)}</span>
        </div>`
    )
    .join("");
  acomp3mFeitaInput.checked = m.reuniao_3m_feita === true;
  acomp3mDataInput.value = m.reuniao_3m_data || "";
  acomp3mObsInput.value = m.reuniao_3m_obs || "";
  acomp6mFeitaInput.checked = m.reuniao_6m_feita === true;
  acomp6mDataInput.value = m.reuniao_6m_data || "";
  acomp6mObsInput.value = m.reuniao_6m_obs || "";
  acompRenovouInput.checked = m.renovou === true;
  acompDetalheEl.hidden = false;
  acompDetalheEl.scrollIntoView({ behavior: "smooth" });
}

acompTbody.addEventListener("click", (e) => {
  if (e.target.closest("a")) return;
  const linha = e.target.closest("tr[data-id]");
  if (linha) abrirDetalheAcompanhamento(linha.dataset.id);
});

acompSalvarBtn.addEventListener("click", async () => {
  if (!acompAbertoId) return;
  const { error } = await sb
    .from("mentorados_planilha")
    .update({
      reuniao_3m_feita: acomp3mFeitaInput.checked,
      reuniao_3m_data: acomp3mDataInput.value || null,
      reuniao_3m_obs: acomp3mObsInput.value || null,
      reuniao_6m_feita: acomp6mFeitaInput.checked,
      reuniao_6m_data: acomp6mDataInput.value || null,
      reuniao_6m_obs: acomp6mObsInput.value || null,
      renovou: acompRenovouInput.checked,
    })
    .eq("id", acompAbertoId);
  if (error) {
    setAcompStatus(`Erro ao salvar: ${error.message}`);
    return;
  }
  setAcompStatus("Salvo.");
  await carregarAcompanhamento();
});

acompFecharBtn.addEventListener("click", () => {
  acompDetalheEl.hidden = true;
  acompAbertoId = null;
});

acompBuscaInput.addEventListener("input", renderAcompanhamento);
acompTipoSelect.addEventListener("change", renderAcompanhamento);
