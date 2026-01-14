document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("usuarioLogado")) {
    window.location.href = "index.html";
  }
});

function carregarUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios")) || {};
}

function login() {
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;

  if (!usuario || !senha) {
    alert("Preencha todos os campos");
    return;
  }

  const usuarios = carregarUsuarios();

  if (!usuarios[usuario]) {
    alert("Usuário não encontrado");
    return;
  }

  if (usuarios[usuario].senha === senha) {
    localStorage.setItem("usuarioLogado", usuario);
    window.location.href = "index.html";
  } else {
    alert("Senha incorreta");
  }
}
