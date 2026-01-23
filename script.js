// 🔒 BLOQUEIO DE LOGIN
const usuarioLogado = localStorage.getItem("usuarioLogado");
if (!usuarioLogado) {
  window.location.replace("login.html");
}

// 🔓 LOGOUT
function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

// 📦 ELEMENTOS
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const totalSpan = document.getElementById("totalSpan");
const listaDatas = document.getElementById("listaDatas");

// 🔧 VARIÁVEIS
let fazendaAtual = "";
let pastoAtual = "";
let total = 0;
let linhaY = null; // linha horizontal
let contagemAtiva = false;
let rastreio = {};
let model = null;

// 📅 DATA
const hoje = new Date().toISOString().split("T")[0];

// 📊 DADOS
function carregarDados() {
  return JSON.parse(localStorage.getItem("dados_" + usuarioLogado)) || {};
}
function salvarDados(dados) {
  localStorage.setItem("dados_" + usuarioLogado, JSON.stringify(dados));
}
let dados = carregarDados();

// 🌾 FAZENDAS
function carregarFazendas() {
  return JSON.parse(localStorage.getItem("fazendas_" + usuarioLogado)) || {};
}
function salvarFazendas(fazendas) {
  localStorage.setItem("fazendas_" + usuarioLogado, JSON.stringify(fazendas));
}

// 🔄 SELECTS
function atualizarSelectFazendas() {
  const select = document.getElementById("selectFazenda");
  select.innerHTML = `<option value="">Selecione a fazenda</option>`;
  Object.keys(carregarFazendas()).forEach(nome => {
    select.innerHTML += `<option value="${nome}">${nome}</option>`;
  });
}

function atualizarSelectPastos() {
  const select = document.getElementById("selectPasto");
  select.innerHTML = `<option value="">Selecione o pasto</option>`;
  if (!fazendaAtual) return;

  carregarFazendas()[fazendaAtual].forEach(p =>
    select.innerHTML += `<option value="${p}">${p}</option>`
  );
}

// ➕ FAZENDA / PASTO
function adicionarFazenda() {
  const nome = document.getElementById("novaFazenda").value.trim();
  if (!nome) return alert("Digite o nome da fazenda");

  const fazendas = carregarFazendas();
  if (fazendas[nome]) return alert("Fazenda já existe");

  fazendas[nome] = [];
  salvarFazendas(fazendas);
  atualizarSelectFazendas();
}

function adicionarPasto() {
  if (!fazendaAtual) return alert("Selecione a fazenda");
  const nome = document.getElementById("novoPasto").value.trim();
  if (!nome) return alert("Digite o nome do pasto");

  const fazendas = carregarFazendas();
  if (fazendas[fazendaAtual].includes(nome))
    return alert("Pasto já existe");

  fazendas[fazendaAtual].push(nome);
  salvarFazendas(fazendas);
  atualizarSelectPastos();
}

// 🎯 SELEÇÃO
function selecionarFazenda() {
  fazendaAtual = document.getElementById("selectFazenda").value;
  pastoAtual = "";
  atualizarSelectPastos();
}

function selecionarPasto() {
  pastoAtual = document.getElementById("selectPasto").value;
  if (!pastoAtual) return;

  dados[fazendaAtual] ??= {};
  dados[fazendaAtual][pastoAtual] ??= {};
  dados[fazendaAtual][pastoAtual][hoje] ??= [];

  total = dados[fazendaAtual][pastoAtual][hoje].length;
  totalSpan.textContent = total;
  atualizarHistorico();
}

// 📜 HISTÓRICO
function atualizarHistorico() {
  listaDatas.innerHTML = "";
  Object.keys(dados).forEach(f =>
    Object.keys(dados[f]).forEach(p =>
      Object.keys(dados[f][p]).forEach(d => {
        const q = dados[f][p][d].length;
        if (q > 0)
          listaDatas.innerHTML +=
            `<li>🏡 ${f} | 🌱 ${p} | 📅 ${d} → 🐄 ${q}</li>`;
      })
    )
  );
}

// 📷 CÂMERA (CELULAR EM PÉ)
async function iniciarCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false
  });

  video.srcObject = stream;
  video.onloadedmetadata = () => {
    video.play();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    linhaY = canvas.height * 0.6;
  };
}

// 🧠 CRUZAMENTO (CIMA → BAIXO)
function cruzouLinha(id, y) {
  if (!rastreio[id]) {
    rastreio[id] = y;
    return false;
  }
  const anterior = rastreio[id];
  rastreio[id] = y;
  return anterior < linhaY && y >= linhaY;
}

// 🤖 IA
async function iniciarIA() {
  model = await cocoSsd.load();

  setInterval(async () => {
    if (!linhaY) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🔴 linha
    ctx.beginPath();
    ctx.moveTo(0, linhaY);
    ctx.lineTo(canvas.width, linhaY);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.stroke();

    if (!contagemAtiva) return;

    const preds = await model.detect(video);
    preds.forEach(p => {
      if (p.class === "cow" && p.score > 0.6) {
        const [x, y, w, h] = p.bbox;
        const centroY = y + h / 2;
        const id = Math.round(x / 60) + "_" + Math.round(centroY / 60);

        ctx.strokeStyle = "lime";
        ctx.strokeRect(x, y, w, h);

        if (cruzouLinha(id, centroY)) {
          dados[fazendaAtual][pastoAtual][hoje].push(Date.now());
          salvarDados(dados);
          total++;
          totalSpan.textContent = total;
          atualizarHistorico();
        }
      }
    });
  }, 600);
}

// ▶ CONTROLES
function iniciarContagem() {
  if (!fazendaAtual || !pastoAtual)
    return alert("Selecione fazenda e pasto");

  contagemAtiva = true;
  rastreio = {};
}

function pararContagem() {
  contagemAtiva = false;
}

function zerarContagem() {
  if (!fazendaAtual || !pastoAtual) return;
  dados[fazendaAtual][pastoAtual][hoje] = [];
  salvarDados(dados);
  total = 0;
  totalSpan.textContent = 0;
  atualizarHistorico();
}

// 🚀 START
document.addEventListener("DOMContentLoaded", async () => {
  atualizarSelectFazendas();
  await iniciarCamera();
  iniciarIA();
});
