function carregarUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios")) || {};
}

function salvarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function cadastrar() {
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;
  const confirmar = document.getElementById("confirmar").value;

  if (!usuario || !senha || !confirmar) {
    alert("Preencha todos os campos");
    return;
  }

  if (senha !== confirmar) {
    alert("As senhas não conferem");
    return;
  }

  let usuarios = carregarUsuarios();

  if (usuarios[usuario]) {
    alert("Usuário já existe");
    return;
  }

  usuarios[usuario] = { senha };
  salvarUsuarios(usuarios);

  alert("Usuário cadastrado com sucesso!");
  window.location.href = "login.html";
}
