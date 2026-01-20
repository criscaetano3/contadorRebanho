// BLOQUEIO DE LOGIN

const usuarioLogado = localStorage.getItem("usuarioLogado");
if (!usuarioLogado) {
  window.location.replace("login.html");
}

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

// ELEMENTOS

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const totalSpan = document.getElementById("totalSpan");
const listaDatas = document.getElementById("listaDatas");

// VARIÁVEIS

let fazendaAtual = "";
let pastoAtual = "";
let total = 0;
let linhaY = 0;
let contagemAtiva = false;
let rastreio = {};
let model = null;

// DATA

function dataHoje() {
  return new Date().toISOString().split("T")[0];
}
const hoje = dataHoje();


// DADOS DE CONTAGEM

function carregarDados() {
  return JSON.parse(localStorage.getItem("dados_" + usuarioLogado)) || {};
}

function salvarDados(dados) {
  localStorage.setItem("dados_" + usuarioLogado, JSON.stringify(dados));
}

let dados = carregarDados();

// FAZENDAS E PASTOS

function carregarFazendas() {
  return JSON.parse(localStorage.getItem("fazendas_" + usuarioLogado)) || {};
}

function salvarFazendas(fazendas) {
  localStorage.setItem("fazendas_" + usuarioLogado, JSON.stringify(fazendas));
}

// ATUALIZAR SELECTS

function atualizarSelectFazendas() {
  const select = document.getElementById("selectFazenda");
  select.innerHTML = `<option value="">Selecione a fazenda</option>`;

  const fazendas = carregarFazendas();
  Object.keys(fazendas).forEach(nome => {
    const opt = document.createElement("option");
    opt.value = nome;
    opt.textContent = nome;
    select.appendChild(opt);
  });
}

function atualizarSelectPastos() {
  const select = document.getElementById("selectPasto");
  select.innerHTML = `<option value="">Selecione o pasto</option>`;

  if (!fazendaAtual) return;

  const fazendas = carregarFazendas();
  fazendas[fazendaAtual].forEach(pasto => {
    const opt = document.createElement("option");
    opt.value = pasto;
    opt.textContent = pasto;
    select.appendChild(opt);
  });
}

// ADICIONAR FAZENDA

function adicionarFazenda() {
  const nome = document.getElementById("novaFazenda").value.trim();
  if (!nome) return alert("Digite o nome da fazenda");

  const fazendas = carregarFazendas();

  if (fazendas[nome]) {
    alert("Fazenda já cadastrada");
    return;
  }

  fazendas[nome] = [];
  salvarFazendas(fazendas);

  document.getElementById("novaFazenda").value = "";
  atualizarSelectFazendas();
}


// ADICIONAR PASTO

function adicionarPasto() {
  const nome = document.getElementById("novoPasto").value.trim();
  if (!fazendaAtual || !nome) {
    alert("Selecione a fazenda e digite o nome do pasto");
    return;
  }

  const fazendas = carregarFazendas();
  if (fazendas[fazendaAtual].includes(nome)) {
    alert("Pasto já existe");
    return;
  }

  fazendas[fazendaAtual].push(nome);
  salvarFazendas(fazendas);

  document.getElementById("novoPasto").value = "";
  atualizarSelectPastos();
}


// SELEÇÃO

function selecionarFazenda() {
  fazendaAtual = document.getElementById("selectFazenda").value;
  pastoAtual = "";
  atualizarSelectPastos();
}

function selecionarPasto() {
  pastoAtual = document.getElementById("selectPasto").value;

  if (!dados[fazendaAtual]) dados[fazendaAtual] = {};
  if (!dados[fazendaAtual][pastoAtual]) dados[fazendaAtual][pastoAtual] = {};
  if (!dados[fazendaAtual][pastoAtual][hoje]) dados[fazendaAtual][pastoAtual][hoje] = [];

  total = dados[fazendaAtual][pastoAtual][hoje].length;
  totalSpan.textContent = total;
  atualizarHistorico();
}

// HISTÓRICO COMPLETO

function atualizarHistorico() {
  listaDatas.innerHTML = "";

  Object.keys(dados).forEach(fazenda => {
    const liFazenda = document.createElement("li");
    liFazenda.innerHTML = `<strong>🏡 Fazenda: ${fazenda}</strong>`;
    listaDatas.appendChild(liFazenda);

    Object.keys(dados[fazenda]).forEach(pasto => {
      const liPasto = document.createElement("li");
      liPasto.style.marginLeft = "15px";
      liPasto.textContent = `🌱 Pasto: ${pasto}`;
      listaDatas.appendChild(liPasto);

      Object.keys(dados[fazenda][pasto]).forEach(data => {
        const liData = document.createElement("li");
        liData.style.marginLeft = "30px";
        liData.textContent =
          `📅 ${data} → 🐄 ${dados[fazenda][pasto][data].length} animais`;
        listaDatas.appendChild(liData);
      });
    });
  });
}

// CONTROLE

function iniciarContagem() {
  if (!fazendaAtual || !pastoAtual) {
    alert("Selecione fazenda e pasto");
    return;
  }
  contagemAtiva = true;
  rastreio = {};
}

function pararContagem() {
  contagemAtiva = false;
}

function zerarContagem() {
  if (!fazendaAtual || !pastoAtual) return;

  dados[fazendaAtual][pastoAtual][hoje] = [];
  total = 0;
  totalSpan.textContent = 0;
  salvarDados(dados);
  atualizarHistorico();
}

// INICIAR APP

document.addEventListener("DOMContentLoaded", () => {
  atualizarSelectFazendas();
  atualizarHistorico();
});
