// ===============================
// 🔐 BLOQUEIO DE LOGIN
// ===============================
const usuarioLogado = localStorage.getItem("usuarioLogado");
if (!usuarioLogado) {
  window.location.replace("login.html");
}

// ===============================
// 🚪 LOGOUT
// ===============================
function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

// ===============================
// 📦 ELEMENTOS
// ===============================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const totalSpan = document.getElementById("totalSpan");
const listaDatas = document.getElementById("listaDatas");

// ===============================
// 🧠 VARIÁVEIS
// ===============================
let fazendaAtual = "";
let pastoAtual = "";
let total = 0;
let linhaY = 0;
let contagemAtiva = false;
let rastreio = {};
let model = null;

// ===============================
// 📅 DATA
// ===============================
function dataHoje() {
  return new Date().toISOString().split("T")[0];
}
const hoje = dataHoje();

// ===============================
// 💾 DADOS
// ===============================
function carregarDados() {
  return JSON.parse(localStorage.getItem("dados_" + usuarioLogado)) || {};
}

function salvarDados(dados) {
  localStorage.setItem("dados_" + usuarioLogado, JSON.stringify(dados));
}

let dados = carregarDados();

// ===============================
// 🌾 FAZENDA / PASTO
// ===============================
function selecionarFazenda() {
  fazendaAtual = document.getElementById("fazenda").value.trim();
  pastoAtual = document.getElementById("pasto").value.trim();

  if (!fazendaAtual || !pastoAtual) {
    alert("Informe a fazenda e o pasto");
    return;
  }

  if (!dados[fazendaAtual]) dados[fazendaAtual] = {};
  if (!dados[fazendaAtual][pastoAtual]) dados[fazendaAtual][pastoAtual] = {};
  if (!dados[fazendaAtual][pastoAtual][hoje]) dados[fazendaAtual][pastoAtual][hoje] = [];

  total = dados[fazendaAtual][pastoAtual][hoje].length;
  totalSpan.textContent = total;

  atualizarHistorico();
}

// ===============================
// 📜 HISTÓRICO
// ===============================
function atualizarHistorico() {
  listaDatas.innerHTML = "";
  if (!fazendaAtual || !pastoAtual) return;

  const registros = dados[fazendaAtual][pastoAtual];

  for (let data in registros) {
    const li = document.createElement("li");
    li.textContent = `📅 ${data} → 🐄 ${registros[data].length} animais`;
    listaDatas.appendChild(li);
  }
}

// ===============================
// 📷 CÂMERA
// ===============================
async function iniciarCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false
  });

  video.srcObject = stream;

  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    linhaY = canvas.height * 0.6; // linha horizontal
  };
}

// ===============================
// 🧠 IA + CONTAGEM CORRETA
// ===============================
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
    if (!canvas.width || !canvas.height) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🔴 Linha vermelha
    ctx.beginPath();
    ctx.moveTo(0, linhaY);
    ctx.lineTo(canvas.width, linhaY);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.stroke();

    if (!contagemAtiva || !fazendaAtual || !pastoAtual) return;

    const predictions = await model.detect(video);

    predictions.forEach(p => {
      if (p.class === "cow" && p.score > 0.6) {
        const [x, y, w, h] = p.bbox;
        const centroY = y + h / 2;
        const id = Math.round(x + y + w + h);

        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        if (cruzouLinha(id, centroY)) {
          total++;
          dados[fazendaAtual][pastoAtual][hoje].push(Date.now());
          salvarDados(dados);
          totalSpan.textContent = total;
          atualizarHistorico();
          navigator.vibrate(100);
        }
      }
    });
  }, 800);
}

// ===============================
// ▶ INICIAR / ⏹ PARAR / 🔄 ZERAR
// ===============================
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

// ===============================
// 🌙 MODO ESCURO
// ===============================
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("modo",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
}

// ===============================
// 🚀 INICIAR APP
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  if (localStorage.getItem("modo") === "dark") {
    document.body.classList.add("dark");
  }

  await iniciarCamera();
  iniciarIA();
});
