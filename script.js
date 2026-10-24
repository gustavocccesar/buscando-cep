/* =============================================
   BUSCACEP — CONSULTA GRATUITA, TEMA E HISTÓRICO
   HTML + CSS + JavaScript puro
   ============================================= */

// 1. ELEMENTOS QUE EXISTEM NO HTML
const formulario = document.getElementById("form-cep");
const campoCep = document.getElementById("cep");
const campoNumero = document.getElementById("numero");
const botaoBuscar = document.getElementById("botao-buscar");
const textoBotao = document.getElementById("button-label");
const mensagem = document.getElementById("mensagem");
const resultado = document.getElementById("resultado");
const estadoVazio = document.getElementById("empty-state");
const linkMaps = document.getElementById("link-maps");
const temaBotao = document.getElementById("theme-toggle");
const temaTexto = document.getElementById("theme-label");
const listaHistorico = document.getElementById("historico");
const limparHistoricoBotao = document.getElementById("limpar-historico");

const CHAVE_TEMA = "buscacep-tema";
const CHAVE_HISTORICO = "buscacep-historico";
const LIMITE_HISTORICO = 6;

// 2. FUNÇÕES AUXILIARES
function somenteNumeros(valor) {
  return valor.replace(/\D/g, "");
}

function formatarCep(valor) {
  const digitos = somenteNumeros(valor).slice(0, 8);
  return digitos.length > 5
    ? digitos.slice(0, 5) + "-" + digitos.slice(5)
    : digitos;
}

function lerArmazenamento(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null; // O navegador pode bloquear o armazenamento.
  }
}

function salvarArmazenamento(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // O site continua funcionando, mesmo sem salvar preferências.
  }
}

function apagarArmazenamento(chave) {
  try {
    localStorage.removeItem(chave);
  } catch {
    // Armazenamento indisponível.
  }
}

function mostrarMensagem(texto) {
  mensagem.textContent = texto;
  mensagem.hidden = !texto;
}

// 3. MODO CLARO / ESCURO
function aplicarTema(tema) {
  const escuro = tema === "dark";
  document.documentElement.dataset.theme = escuro ? "dark" : "light";
  temaBotao.setAttribute("aria-pressed", String(escuro));
  temaBotao.setAttribute("aria-label", escuro ? "Ativar modo claro" : "Ativar modo escuro");
  temaTexto.textContent = escuro ? "Modo claro" : "Modo escuro";
  document.querySelector('meta[name="theme-color"]').content = escuro ? "#0c1222" : "#f4f7fc";
}

const temaSalvo = lerArmazenamento(CHAVE_TEMA);
const prefereEscuro = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
aplicarTema(temaSalvo === "dark" || temaSalvo === "light" ? temaSalvo : (prefereEscuro ? "dark" : "light"));

temaBotao.addEventListener("click", () => {
  const proximoTema = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  aplicarTema(proximoTema);
  salvarArmazenamento(CHAVE_TEMA, proximoTema);
});

// 4. MÁSCARA DO CEP (00000-000)
campoCep.addEventListener("input", () => {
  campoCep.value = formatarCep(campoCep.value);
});

// 5. HISTÓRICO DE PESQUISAS (salvo somente no navegador)
function recuperarHistorico() {
  try {
    const valor = JSON.parse(lerArmazenamento(CHAVE_HISTORICO) || "[]");
    return Array.isArray(valor) ? valor.filter(item => item && /^\d{8}$/.test(item.cep)).slice(0, LIMITE_HISTORICO) : [];
  } catch {
    return [];
  }
}

let historico = recuperarHistorico();

function renderizarHistorico() {
  listaHistorico.replaceChildren();
  limparHistoricoBotao.hidden = historico.length === 0;

  if (historico.length === 0) {
    const vazio = document.createElement("div");
    vazio.className = "history-empty";
    vazio.textContent = "↗ Suas pesquisas recentes aparecerão aqui.";
    listaHistorico.append(vazio);
    return;
  }

  historico.forEach(item => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "history-item";
    botao.setAttribute("aria-label", `Pesquisar novamente ${formatarCep(item.cep)}, número ${item.numero || "não informado"}`);

    const icone = document.createElement("span");
    icone.textContent = "↗";
    icone.setAttribute("aria-hidden", "true");
    icone.style.color = "var(--accent)";

    const textos = document.createElement("span");
    const cep = document.createElement("strong");
    cep.textContent = formatarCep(item.cep) + (item.numero ? ` · Nº ${item.numero}` : "");
    const local = document.createElement("small");
    local.textContent = item.localidade && item.uf ? `${item.localidade} / ${item.uf}` : "Pesquisar endereço";
    textos.append(cep, local);
    botao.append(icone, textos);

    botao.addEventListener("click", () => {
      campoCep.value = formatarCep(item.cep);
      campoNumero.value = item.numero || "";
      consultarCep();
      window.scrollTo({ top: 180, behavior: "smooth" });
    });
    listaHistorico.append(botao);
  });
}

function adicionarAoHistorico(dados, numero) {
  const novoItem = {
    cep: somenteNumeros(dados.cep),
    numero,
    localidade: dados.localidade || "",
    uf: dados.uf || ""
  };
  historico = historico.filter(item => !(item.cep === novoItem.cep && item.numero === numero));
  historico.unshift(novoItem);
  historico = historico.slice(0, LIMITE_HISTORICO);
  salvarArmazenamento(CHAVE_HISTORICO, JSON.stringify(historico));
  renderizarHistorico();
}

limparHistoricoBotao.addEventListener("click", () => {
  historico = [];
  apagarArmazenamento(CHAVE_HISTORICO);
  renderizarHistorico();
});

renderizarHistorico();

// 6. FUNÇÃO QUE MOSTRA OS DADOS DO ENDEREÇO
function exibirEndereco(dados, cepPesquisado, numero) {
  const rua = dados.logradouro || "Rua não informada";
  const bairro = dados.bairro || "Não informado";
  const cidade = dados.localidade || "Não informada";
  const uf = dados.uf || "Não informado";
  const cepFormatado = dados.cep || formatarCep(cepPesquisado);

  document.getElementById("titulo-endereco").textContent = rua;
  document.getElementById("subtitulo-endereco").textContent = `${cidade} • ${uf}`;
  document.getElementById("rua").textContent = dados.logradouro || "Não informada";
  document.getElementById("bairro").textContent = bairro;
  document.getElementById("cidade").textContent = cidade;
  document.getElementById("estado").textContent = uf;
  document.getElementById("cep-resultado").textContent = cepFormatado;
  document.getElementById("numero-resultado").textContent = numero || "Não informado";

  // Se ViaCEP não retornar uma rua, usamos cidade, estado e CEP.
  // O número sozinho não é suficiente para identificar um local.
  const partesEndereco = [
    dados.logradouro ? `${dados.logradouro}${numero ? `, ${numero}` : ""}` : "",
    dados.bairro,
    dados.localidade,
    dados.uf,
    !dados.logradouro ? cepFormatado : "",
    "Brasil"
  ].filter(Boolean);

  const enderecoParaMaps = partesEndereco.join(", ");
  linkMaps.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(enderecoParaMaps);

  estadoVazio.hidden = true;
  resultado.hidden = false;
}

// 7. CONSULTA REAL DO CEP NA API GRATUITA VIACEP
let requisicaoAtual = null;

async function consultarCep() {
  const cep = somenteNumeros(campoCep.value);
  const numero = campoNumero.value.trim();

  mostrarMensagem("");
  resultado.hidden = true;
  estadoVazio.hidden = false;

  if (cep.length !== 8) {
    mostrarMensagem("Digite um CEP válido com 8 números.");
    campoCep.focus();
    return;
  }

  if (requisicaoAtual) requisicaoAtual.abort();
  const controle = new AbortController();
  requisicaoAtual = controle;

  botaoBuscar.disabled = true;
  textoBotao.textContent = "Buscando endereço...";

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controle.signal
    });
    if (!resposta.ok) throw new Error("Falha na consulta ao ViaCEP.");

    const dados = await resposta.json();
    if (controle.signal.aborted) return;

    if (dados.erro === true) {
      mostrarMensagem("Esse CEP não foi encontrado. Confira os números e tente novamente.");
      return;
    }
    if (!dados.localidade || !dados.uf) throw new Error("Dados incompletos na consulta.");

    exibirEndereco(dados, cep, numero);
    adicionarAoHistorico({ ...dados, cep: dados.cep || cep }, numero);
  } catch (erro) {
    if (erro.name !== "AbortError") {
      mostrarMensagem("Não foi possível consultar o CEP. Verifique sua internet e tente novamente.");
      console.error("Erro ao consultar CEP:", erro);
    }
  } finally {
    if (requisicaoAtual === controle) {
      botaoBuscar.disabled = false;
      textoBotao.textContent = "Buscar endereço";
      requisicaoAtual = null;
    }
  }
}

formulario.addEventListener("submit", evento => {
  evento.preventDefault(); // Evita que a página recarregue.
  consultarCep();
});

document.getElementById("cep-exemplo").addEventListener("click", () => {
  campoCep.value = "01001-000";
  campoNumero.value = "";
  consultarCep();
});
