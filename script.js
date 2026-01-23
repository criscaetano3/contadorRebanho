// 🔒 BLOQUEIO DE LOGIN
const usuarioLogado = localStorage.getItem("usuarioLogado");
if (!usuarioLogado) window.location.replace("login.html");

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
let linhaY = null;
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

// 📷 CÂMERA (CELULAR EM PÉ)
async function iniciarCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "environment",
      width: { ideal: 720 },
      height: { ideal: 1280 }
    },
    audio: false
  });

  video.srcObject = stream;

  video.onloadedmetadata = () => {
    video.play();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 🔴 linha horizontal fixa (nível do peito)
    linhaY = canvas.height * 0.6;
  };
}

// 🧠 VERIFICA SE A LINHA CRUZA O CORPO
function linhaCortaCorpo(id, topo, base) {
  if (rastreio[id]) return false;

  if (topo < linhaY && base > linhaY) {
    rastreio[id] = true;
    return true;
  }
  return false;
}

// 🤖 IA + CONTAGEM
async function iniciarIA() {
  model = await cocoSsd.load();

  setInterval(async () => {
    if (!linhaY) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🔴 DESENHA LINHA
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

        const topo = y;
        const base = y + h;

        // ID simples por posição
        const id = Math.round(x / 80) + "_" + Math.round(y / 80);

        // 🟩 CAIXA
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // ✅ CONTAGEM REAL
        if (linhaCortaCorpo(id, topo, base)) {
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

// 🚀 START
document.addEventListener("DOMContentLoaded", async () => {
  await iniciarCamera();
  iniciarIA();
});
