function cadastrar() {
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;

  if (!usuario || !senha) {
    alert("Preencha todos os campos");
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || {};

  if (usuarios[usuario]) {
    alert("Usuário já existe");
    return;
  }

  usuarios[usuario] = { senha };
  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  alert("Cadastro realizado!");
  window.location.href = "login.html";
}
