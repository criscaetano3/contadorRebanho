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
let linhaY = 0;
let contagemAtiva = false;
let rastreio = {};
let model = null;

// 📅 DATA
function dataHoje() {
  return new Date().toISOString().split("T")[0];
}
const hoje = dataHoje();

// 📊 DADOS
function carregarDados() {
  return JSON.parse(localStorage.getItem("dados_" + usuarioLogado)) || {};
}
function salvarDados(dados) {
  localStorage.setItem("dados_" + usuarioLogado, JSON.stringify(dados));
}
let dados = carregarDados();

// 🌾 FAZENDAS E PASTOS
function carregarFazendas() {
  return JSON.parse(localStorage.getItem("fazendas_" + usuarioLogado)) || {};
}
function salvarFazendas(fazendas) {
  localStorage.setItem("fazendas_" + usuarioLogado, JSON.stringify(fazendas));
}

// 🔄 ATUALIZAR SELECT FAZENDA
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

// 🔄 ATUALIZAR SELECT PASTO
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

// ➕ ADICIONAR FAZENDA
function adicionarFazenda() {
  const input = document.getElementById("novaFazenda");
  const nome = input.value.trim();
  if (!nome) return alert("Digite o nome da fazenda");

  const fazendas = carregarFazendas();
  if (fazendas[nome]) return alert("Fazenda já existe");

  fazendas[nome] = [];
  salvarFazendas(fazendas);
  input.value = "";
  atualizarSelectFazendas();
}

// ➕ ADICIONAR PASTO
function adicionarPasto() {
  if (!fazendaAtual) return alert("Selecione a fazenda");

  const input = document.getElementById("novoPasto");
  const nome = input.value.trim();
  if (!nome) return alert("Digite o nome do pasto");

  const fazendas = carregarFazendas();
  if (fazendas[fazendaAtual].includes(nome))
    return alert("Pasto já existe");

  fazendas[fazendaAtual].push(nome);
  salvarFazendas(fazendas);
  input.value = "";
  atualizarSelectPastos();
}

// 🎯 SELEÇÕES
function selecionarFazenda() {
  fazendaAtual = document.getElementById("selectFazenda").value;
  pastoAtual = "";
  atualizarSelectPastos();
}

function selecionarPasto() {
  pastoAtual = document.getElementById("selectPasto").value;
  if (!pastoAtual) return;

  if (!dados[fazendaAtual]) dados[fazendaAtual] = {};
  if (!dados[fazendaAtual][pastoAtual]) dados[fazendaAtual][pastoAtual] = {};
  if (!dados[fazendaAtual][pastoAtual][hoje])
    dados[fazendaAtual][pastoAtual][hoje] = [];

  total = dados[fazendaAtual][pastoAtual][hoje].length;
  totalSpan.textContent = total;
  atualizarHistorico();
}

// 📜 HISTÓRICO COMPLETO
function atualizarHistorico() {
  listaDatas.innerHTML = "";

  Object.keys(dados).forEach(fazenda => {
    Object.keys(dados[fazenda]).forEach(pasto => {
      Object.keys(dados[fazenda][pasto]).forEach(data => {
        const qtd = dados[fazenda][pasto][data].length;
        if (qtd > 0) {
          const li = document.createElement("li");
          li.textContent = `🏡 ${fazenda} | 🌱 ${pasto} | 📅 ${data} → 🐄 ${qtd}`;
          listaDatas.appendChild(li);
        }
      });
    });
  });
}

// 📷 CÂMERA
async function iniciarCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false
  });
  video.srcObject = stream;

  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    linhaY = canvas.height * 0.6;
  };
}

// 🧠 IA – CRUZAMENTO DE LINHA
function cruzouLinha(id, centroY) {
  if (!rastreio[id]) {
    rastreio[id] = centroY;
    return false;
  }
  const anterior = rastreio[id];
  rastreio[id] = centroY;
  return anterior < linhaY && centroY >= linhaY;
}

async function iniciarIA() {
  model = await cocoSsd.load();

  setInterval(async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // linha vermelha
    ctx.beginPath();
    ctx.moveTo(0, linhaY);
    ctx.lineTo(canvas.width, linhaY);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.stroke();

    if (!contagemAtiva || !fazendaAtual || !pastoAtual) return;

    const preds = await model.detect(video);
    preds.forEach(p => {
      if (p.class === "cow" && p.score > 0.6) {
        const [x, y, w, h] = p.bbox;
        const centroY = y + h / 2;
        const id = Math.round(x + y + w + h);

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
  }, 800);
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

// 🚀 INICIAR APP
document.addEventListener("DOMContentLoaded", async () => {
  atualizarSelectFazendas();
  await iniciarCamera();
  iniciarIA();
});
