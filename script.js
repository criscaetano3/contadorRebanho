const usuarioLogado = localStorage.getItem("usuarioLogado");
if (!usuarioLogado) window.location.href = "login.html";

// Logout
function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

// Elementos
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const totalSpan = document.getElementById("total");
const listaDatas = document.getElementById("listaDatas");

let fazendaAtual = "";
let total = 0;
let animaisContados = new Set();
let linhaY = 0;

// Data
function dataHoje() {
  return new Date().toISOString().split("T")[0];
}

let hoje = dataHoje();

// Dados
function carregarDados() {
  return JSON.parse(localStorage.getItem("dados_" + usuarioLogado)) || {};
}

function salvarDados(dados) {
  localStorage.setItem("dados_" + usuarioLogado, JSON.stringify(dados));
}

let dados = carregarDados();

// Fazenda
function selecionarFazenda() {
  const nome = document.getElementById("fazenda").value.trim();
  if (!nome) return alert("Digite a fazenda");

  fazendaAtual = nome;
  animaisContados.clear();

  if (!dados[fazendaAtual]) dados[fazendaAtual] = {};
  if (!dados[fazendaAtual][hoje]) dados[fazendaAtual][hoje] = 0;

  total = dados[fazendaAtual][hoje];
  totalSpan.innerText = total;
  atualizarHistorico();
}

// Histórico
function atualizarHistorico() {
  listaDatas.innerHTML = "";
  for (let d in dados[fazendaAtual]) {
    const li = document.createElement("li");
    li.textContent = `${d} → ${dados[fazendaAtual][d]} animais`;
    listaDatas.appendChild(li);
  }
}

// Câmera + IA
async function iniciar() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });
  video.srcObject = stream;

  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    linhaY = canvas.height * 0.6;
  };

  const model = await cocoSsd.load();

  setInterval(async () => {
    if (!fazendaAtual) return;

    const preds = await model.detect(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    preds.forEach(p => {
      if (p.class === "cow") {
        const [x,y,w,h] = p.bbox;
        ctx.strokeRect(x,y,w,h);

        const id = Math.round(x+y+w+h);
        if (y+h > linhaY && !animaisContados.has(id)) {
          animaisContados.add(id);
          total++;
          dados[fazendaAtual][hoje] = total;
          salvarDados(dados);
          totalSpan.innerText = total;
          atualizarHistorico();
        }
      }
    });
  }, 1000);
}

// Tema escuro
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("modo", document.body.classList.contains("dark") ? "dark":"light");
}

if (localStorage.getItem("modo")==="dark") document.body.classList.add("dark");

iniciar();
