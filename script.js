// ===============================
// 🔒 BLOQUEIO DE LOGIN
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
// 🎥 ELEMENTOS
// ===============================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const totalSpan = document.getElementById("totalSpan");
const listaDatas = document.getElementById("listaDatas");

// ===============================
// ⚙️ VARIÁVEIS
// ===============================
let fazendaAtual = "";
let total = 0;
let contagemAtiva = false;
let linhaY = 0;
let model = null;
let intervaloIA = null;

let ultimoRegistro = 0;
const INTERVALO_MIN = 3000; // 3 segundos entre contagens

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
// 🌾 FAZENDAS
// ===============================
function carregarFazendas() {
  return JSON.parse(localStorage.getItem("fazendas_" + usuarioLogado)) || [];
}

function salvarFazendas(fazendas) {
  localStorage.setItem("fazendas_" + usuarioLogado, JSON.stringify(fazendas));
}

function atualizarListaFazendas() {
  const select = document.getElementById("listaFazendas");
  select.innerHTML = '<option value="">Selecione a fazenda</option>';

  carregarFazendas().forEach(f => {
    const option = document.createElement("option");
    option.value = f;
    option.textContent = f;
    select.appendChild(option);
  });
}

function adicionarFazenda() {
  const input = document.getElementById("novaFazenda");
  const nome = input.value.trim();

  if (!nome) return alert("Digite o nome da fazenda");

  const fazendas = carregarFazendas();
  if (fazendas.includes(nome)) return alert("Essa fazenda já existe");

  fazendas.push(nome);
  salvarFazendas(fazendas);
  input.value = "";
  atualizarListaFazendas();
}

// ===============================
// 🌾 SELECIONAR FAZENDA
// ===============================
function selecionarFazenda() {
  const select = document.getElementById("listaFazendas");
  if (!select.value) return;

  fazendaAtual = select.value;

  if (!dados[fazendaAtual]) dados[fazendaAtual] = {};
  if (!dados[fazendaAtual][hoje]) dados[fazendaAtual][hoje] = 0;

  total = dados[fazendaAtual][hoje];
  totalSpan.textContent = total;
  atualizarHistorico();
}

// ===============================
// 📜 HISTÓRICO
// ===============================
function atualizarHistorico() {
  listaDatas.innerHTML = "";
  if (!fazendaAtual) return;

  for (let d in dados[fazendaAtual]) {
    const li = document.createElement("li");
    li.textContent = `📅 ${d} → 🐄 ${dados[fazendaAtual][d]} animais`;
    listaDatas.appendChild(li);
  }
}

// ===============================
// 🎥 CÂMERA
// ===============================
async function iniciarCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false
  });

  video.srcObject = stream;

  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 🔴 Linha horizontal (ideal para curral)
    linhaY = canvas.height * 0.6;
  };
}

// ===============================
// 🤖 IA + CONTAGEM REAL
// ===============================
async function iniciarIA() {
  model = await cocoSsd.load();

  intervaloIA = setInterval(async () => {
    if (!canvas.width || !canvas.height) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🔴 DESENHA LINHA
    ctx.beginPath();
    ctx.moveTo(0, linhaY);
    ctx.lineTo(canvas.width, linhaY);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.stroke();

    if (!contagemAtiva || !fazendaAtual) return;

    const predictions = await model.detect(video);

    predictions.forEach(p => {
      if (["cow", "horse", "person"].includes(p.class) && p.score > 0.6) {

        const [x, y, w, h] = p.bbox;
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        const centroY = y + h / 2;
        const agora = Date.now();

        // ✅ CONTA SOMENTE SE CRUZAR A LINHA
        if (centroY >= linhaY && agora - ultimoRegistro > INTERVALO_MIN) {
          ultimoRegistro = agora;
          total++;

          dados[fazendaAtual][hoje] = total;
          salvarDados(dados);

          totalSpan.textContent = total;
          atualizarHistorico();
        }
      }
    });
  }, 700);
}

// ===============================
// ▶️ INICIAR CONTAGEM
// ===============================
function iniciarContagem() {
  if (!fazendaAtual) return alert("Selecione a fazenda");
  contagemAtiva = true;
  ultimoRegistro = 0;

  document.getElementById("btnIniciar").disabled = true;
  document.getElementById("btnParar").disabled = false;
}

// ===============================
// ⏹️ PARAR CONTAGEM
// ===============================
function pararContagem() {
  contagemAtiva = false;

  document.getElementById("btnIniciar").disabled = false;
  document.getElementById("btnParar").disabled = true;
}

// ===============================
// 🌙 MODO ESCURO
// ===============================
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "modo",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
}

// ===============================
// 🚀 INICIAR APP
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  atualizarListaFazendas();
  await iniciarCamera();
  iniciarIA();

  if (localStorage.getItem("modo") === "dark") {
    document.body.classList.add("dark");
  }
});
