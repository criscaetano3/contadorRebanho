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
let linhaY = 220;

//Camera
async function iniciarCamera(){
    const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });
  video.srcObject = stream;
    
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

let dados = carregarDados();
let hoje = dataHoje();
let total = 0;

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
function atualizarHistorico() {
  listaDatas.innerHTML = "";
  if (!fazendaAtual) return;

  for (let data in dados[fazendaAtual]) {
    const li = document.createElement("li");
    li.innerText = `📅 ${data} → 🐄 ${dados[fazendaAtual][data]}`;
    listaDatas.appendChild(li);
  }
}

//IA
async function iniciarIA() {
  const model = await cocoSsd.load();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

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
        ctx.strokeStyle = "green";
        ctx.strokeRect(x, y, w, h);

        const id = Math.round(x + y);

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

//play
iniciarCamera().then(iniciarIA);