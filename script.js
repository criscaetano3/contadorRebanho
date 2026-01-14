// Bloqueio acesso
const usuarioLogado = localStorage.getItem("usuarioLogado");
if (!usuarioLogado) {
  window.location.href = "login.html";
}

// Sair
function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}


const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const totalSpan = document.getElementById("total")
const listaDatas = document.getElementById("listaDatas")


let FazendaAtual="";
let animaisContados = new Set();
let linhaY;

video.addEventListener("loadedmetadata", () => {
  linhaY = canvas.height * 0.6; // 60% da tela
});

// CÂMERA
async function iniciarCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false
  });

  video.srcObject = stream;

  video.addEventListener("loadedmetadata", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    linhaY = canvas.height * 0.6;
  });
}



// Data
function dataHoje() {
  return new Date().toISOString().split("T")[0];
}

// Usuário
function carregarDados() {
  return JSON.parse(localStorage.getItem("dados_" + usuarioLogado)) || {};
}

function salvarDados(dados) {
  localStorage.setItem("dados_" + usuarioLogado, JSON.stringify(dados));
}

function salvarContagem(fazenda, total) {
  const hoje = new Date().toLocaleDateString();
  const dados = JSON.parse(localStorage.getItem("contagens")) || [];

  dados.push({
    fazenda,
    data: hoje,
    total
  });

  localStorage.setItem("contagens", JSON.stringify(dados));
}


let dados = carregarDados();
let hoje = dataHoje();


//selecionar fazenda
function selecionarFazenda() {
  const nome = document.getElementById("fazenda").value.trim();
  if (!nome) {
    alert("Digite o nome da fazenda");
    return;
  }

  fazendaAtual = nome;

  if (!dados[fazendaAtual]) dados[fazendaAtual] = {};
  if (!dados[fazendaAtual][hoje]) dados[fazendaAtual][hoje] = 0;

  total = dados[fazendaAtual][hoje];
  totalSpan.innerText = total;

  atualizarHistorico();
}


//Histórico
function carregarHistorico() {
  const lista = document.getElementById("listaHistorico");
  lista.innerHTML = "";

  const dados = JSON.parse(localStorage.getItem("contagens")) || [];

  dados.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.data} - ${item.fazenda}: ${item.total} animais`;
    lista.appendChild(li);
  });
}


//IA
async function iniciarIA() {
  const model = await cocoSsd.load();

  setInterval(async () => {
    if (!fazendaAtual) return;

    const predictions = await model.detect(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(0, linhaY);
    ctx.lineTo(canvas.width, linhaY);
    ctx.stroke();

    predictions.forEach(p => {
      if (p.class === "cow") {
        const [x, y, w, h] = p.bbox;
        ctx.strokeStyle = "lime";
        ctx.strokeRect(x, y, w, h);

        const id = Math.round(x + y + w + h);
        if (y + h > linhaY && !animaisContados.has(id)) {
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

// Play
iniciarCamera().then(iniciarIA);


// TEMA ESCURO

function toggleDarkMode() {
  document.body.classList.toggle("dark");

  // Salvar preferência
  if (document.body.classList.contains("dark")) {
    localStorage.setItem("modo", "dark");
  } else {
    localStorage.setItem("modo", "light");
  }
}

// Carregar modo salvo
window.onload = () => {
  if (localStorage.getItem("modo") === "dark") {
    document.body.classList.add("dark");
  }
};

// MODO  OFFLINE

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("Modo offline ativado"))
    .catch(err => console.log("Erro:", err));
}

