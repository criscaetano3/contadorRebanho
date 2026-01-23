// 🔒 BLOQUEIO DE LOGIN
const usuarioLogado = localStorage.getItem("usuarioLogado");
if (!usuarioLogado) window.location.replace("login.html");

// 📦 ELEMENTOS
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const totalSpan = document.getElementById("totalSpan");
const listaDatas = document.getElementById("listaDatas");

// 🔧 VARIÁVEIS
let fazendaAtual = "Padrao";
let pastoAtual = "Curral";
let total = 0;
let linhaY = null;
let contagemAtiva = false;
let vacasContadas = new Set();
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

dados[fazendaAtual] ??= {};
dados[fazendaAtual][pastoAtual] ??= {};
dados[fazendaAtual][pastoAtual][hoje] ??= [];

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

    // 🔴 linha horizontal
    linhaY = canvas.height * 0.6;
  };
}

// 🧠 DETECTA CRUZAMENTO REAL
function cruzouLinha(topo, base) {
  return topo < linhaY && base > linhaY;
}

// 🤖 IA + CONTAGEM
async function iniciarIA() {
  model = await cocoSsd.load();

  setInterval(async () => {
    if (!linhaY) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🔴 LINHA
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
        const topo = y;
        const base = y + h;

        // ID estável (centro X)
        const id = Math.round((x + w / 2) / 50);

        // 🟩 CAIXA
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // ✅ CONTAGEM CORRETA
        if (cruzouLinha(topo, base) && !vacasContadas.has(id)) {
          vacasContadas.add(id);

          dados[fazendaAtual][pastoAtual][hoje].push(Date.now());
          salvarDados(dados);

          total++;
          totalSpan.textContent = total;
          atualizarHistorico();
        }
      }
    });
  }, 500);
}

// ▶ CONTROLES
function iniciarContagem() {
  contagemAtiva = true;
  vacasContadas.clear();
}

function pararContagem() {
  contagemAtiva = false;
}

function zerarContagem() {
  dados[fazendaAtual][pastoAtual][hoje] = [];
  salvarDados(dados);
  total = 0;
  totalSpan.textContent = 0;
  vacasContadas.clear();
  atualizarHistorico();
}

// 📜 HISTÓRICO
function atualizarHistorico() {
  listaDatas.innerHTML = "";
  Object.keys(dados).forEach(f =>
    Object.keys(dados[f]).forEach(p =>
      Object.keys(dados[f][p]).forEach(d => {
        const q = dados[f][p][d].length;
        if (q > 0) {
          listaDatas.innerHTML +=
            `<li>🏡 ${f} | 🌱 ${p} | 📅 ${d} → 🐄 ${q}</li>`;
        }
      })
    )
  );
}

// 🚀 START
document.addEventListener("DOMContentLoaded", async () => {
  await iniciarCamera();
  iniciarIA();
});
