const API_BASE_URL = 'http://localhost:3001'; // servidor
let emailGlobal = '';

// Elementos do DOM
const loginFrame = document.getElementById('loginFrame');
const senhaFrame = document.getElementById('senhaFrame');
const nomeUsuario = document.getElementById('nomeUsuario');
const btnAvancar = document.getElementById('btnAvancar');
const btnEntrar = document.getElementById('btnEntrar');

// Evento botão Avançar
btnAvancar.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  if (!email) return alert('Digite um e-mail válido.');

  emailGlobal = email;

  try {
    const res = await fetch(`${API_BASE_URL}/login/verificarEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (data.status === 'existe') {
      loginFrame.style.display = 'none';
      senhaFrame.style.display = 'block';
      nomeUsuario.innerText = `Olá, ${data.nome}`;
    } else {
      const cadastrar = confirm("E-mail não encontrado. Deseja se cadastrar?");
      if (cadastrar) {
        alert("Redirecionando para tela de cadastro... (não implementado)");
      }
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao verificar e-mail. Tente novamente.');
  }
});

// Evento botão Entrar
btnEntrar.addEventListener('click', async () => {
  const senha = document.getElementById('senha').value.trim();
  if (!senha) return alert('Digite sua senha.');

  try {
    const res = await fetch(`${API_BASE_URL}/login/verificarSenha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // para cookies
      body: JSON.stringify({ email: emailGlobal, senha })
    });

    const data = await res.json();

    if (data.status === 'ok') {
      window.location.href = `${API_BASE_URL}/menu`; // redireciona após login
    } else {
      alert("Senha incorreta!");
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao verificar senha. Tente novamente.');
  }
});
