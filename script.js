//BLOQUEIO DE LOGIN
const usuarioLogado = localStorage.getItem("usuarioLogado");
if (!usuarioLogado) {
  window.location.replace("login.html");
}


// LOGIN

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}


//ELEMENTOS

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const totalSpan = document.getElementById("totalSpan");
const listaDatas = document.getElementById("listaDatas");


// VARIÁVEIS

let fazendaAtual = "";
let total = 0;
let linhaX = 0;
let contagemAtiva = false;
let animaisContados = new Set();
let intervaloIA = null;
let model = null;
let rastreioAnimais= {};


//DATA

function dataHoje() {
  return new Date().toISOString().split("T")[0];
}
const hoje = dataHoje();


// DADOS

function carregarDados() {
  return JSON.parse(localStorage.getItem("dados_" + usuarioLogado)) || {};
}

function salvarDados(dados) {
  localStorage.setItem("dados_" + usuarioLogado, JSON.stringify(dados));
}

let dados = carregarDados();

// FAZENDAS

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

// SELECIONAR FAZENDA

function selecionarFazenda() {
  const select = document.getElementById("listaFazendas");
  if (!select.value) return;

  fazendaAtual = select.value;
  animaisContados.clear();

  if (!dados[fazendaAtual]) dados[fazendaAtual] = {};
  if (!dados[fazendaAtual][hoje]) dados[fazendaAtual][hoje] = 0;

  total = dados[fazendaAtual][hoje];
  totalSpan.textContent = total;
  atualizarHistorico();
}

// HISTÓRICO

function atualizarHistorico() {
  listaDatas.innerHTML = "";
  if (!fazendaAtual) return;

  for (let d in dados[fazendaAtual]) {
    const li = document.createElement("li");
    li.textContent = `📅 ${d} → 🐄 ${dados[fazendaAtual][d]} animais`;
    listaDatas.appendChild(li);
  }
}

// CÂMERA
async function iniciarCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false
  });

  video.srcObject = stream;

  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    linhaX = canvas.width * 0.5;
  };
}

// IA + LINHA + CONTAGEM
async function iniciarIA() {
  model = await cocoSsd.load();

  intervaloIA = setInterval(async () => {
    if (!canvas.width || !canvas.height) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🔴 LINHA VERMELHA
    ctx.beginPath();
    ctx.moveTo(linhaX, 0);
    ctx.lineTo(linhaX, canvas.height);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.stroke();

    if (!contagemAtiva || !fazendaAtual) return;

    const predictions = await model.detect(video);

    predictions.forEach(p => {
      if (p.class === "cow") {
        const [x, y, w, h] = p.bbox;
        const centroX = x + w / 2;
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        const id = Math.round(x + y + w + h);

        // Primeira vez detectado
        if (!rastreioAnimais[id]) {
          rastreioAnimais[id] = centroX;
          return;
        }

        const anterior = rastreioAnimais[id];

        // 🐄 CRUZOU A LINHA (esquerda → direita)
        if (anterior < linhaX && centroX >= linhaX) {
          total++;
          dados[fazendaAtual][hoje] = total;
          salvarDados(dados);
          totalSpan.textContent = total;
          atualizarHistorico();
           delete rastreioAnimais[id];
        } else {
          rastreioAnimais[id] = centroX;
        }
      }
    });
  }, 800);
}

//  INICIAR CONTAGEM

function iniciarContagem() {
  if (!fazendaAtual) return alert("Selecione a fazenda");

  contagemAtiva = true;
  document.getElementById("btnIniciar").disabled = true;
  document.getElementById("btnParar").disabled = false;
}


// PARAR CONTAGEM

function pararContagem() {
  contagemAtiva = false;
  animaisContados.clear();

  document.getElementById("btnIniciar").disabled = false;
  document.getElementById("btnParar").disabled = true;
}

//MODO ESCURO

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "modo",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
}


// INICIAR APP

document.addEventListener("DOMContentLoaded", async () => {
  atualizarListaFazendas();
  await iniciarCamera();
  iniciarIA();

  if (localStorage.getItem("modo") === "dark") {
    document.body.classList.add("dark");
  }
});
