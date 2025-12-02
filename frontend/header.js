// Ensure a global API_BASE_URL exists, but don't redeclare a const to avoid collisions
window.API_BASE_URL = window.API_BASE_URL || 'http://localhost:3001';

// Monta o HTML do header/menu
document.getElementById('header').insertAdjacentHTML('beforeend', `
  <div class="topo">
    <h3></h3>
    <select id="oUsuario" onchange="handleUserAction(this.value)" onclick="handleLogin()">
      <option value="">usuario</option>
      <option value="gerenciar-conta">Gerenciar Conta</option>
      <option value="sair">Sair</option>
    </select>
  </div>
  <nav class="nav">
    <ul class="nav__menu">
      <li class="nav__menu-item"><a href="/">Home</a></li>
    </ul>
  </nav>
`);

// Inicializa o header: mostra nome do usuário e itens do menu conforme permissão
async function nomeUsuarioHeader() {
  const combobox = document.getElementById('oUsuario');
  const primeiraOpcao = combobox && combobox.options && combobox.options[0];
  const navMenu = document.querySelector('.nav__menu');

  try {
    const res = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();

    if (data.status === 'ok') {
      if (primeiraOpcao) primeiraOpcao.text = data.nome || 'Usuário';

      if (data.ehFuncionario && navMenu) {
        const cadastroMenu = document.createElement('li');
        cadastroMenu.className = 'nav__menu-item';
        cadastroMenu.innerHTML = `
          <a href="#">Cadastros</a>
          <ul class="nav__submenu">
            <li class="nav__submenu-item"><a href="/cargo/abrirCrudCargo">Cargo</a></li>
            <li class="nav__submenu-item"><a href="/pessoa/abrirCrudPessoa">Pessoa</a></li>
            <li class="nav__submenu-item"><a href="/produto/abrirCrudProduto">Produto</a></li>
            <li class="nav__submenu-item"><a href="/pedido/crudPedido">Pedido</a></li>
          </ul>
        `;
        navMenu.appendChild(cadastroMenu);
        // Menu "Relatórios" (igual ao dropdown Cadastros)
        const relatoriosMenu = document.createElement('li');
        relatoriosMenu.className = 'nav__menu-item';
        relatoriosMenu.innerHTML = `
          <a href="#">Relatórios</a>
          <ul class="nav__submenu">
            <li class="nav__submenu-item"><a href="/relatorios/estatisticas">Relatório de Estatísticas</a></li>
            <li class="nav__submenu-item"><a href="/relatorios/vendas">Relatório de Vendas</a></li>
          </ul>
        `;
        navMenu.appendChild(relatoriosMenu);
      }

      // Se usuário não tem pedido atual, cria um e atualiza na tabela pessoa
      if (!data.id_pedido_atual) {
        const novoPedidoRes = await fetch(`${API_BASE_URL}/pedido`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data_do_pedido: new Date().toISOString().split('T')[0],
            id_cliente: data.id_pessoa,
            id_funcionario: null
          })
        });

        if (novoPedidoRes.ok) {
          const novoPedido = await novoPedidoRes.json();
          await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_pessoa: data.id_pessoa, id_pedido: novoPedido.id_pedido })
          });
        }
      }
    } else if (primeiraOpcao) {
      primeiraOpcao.text = 'Fazer Login';
    }
  } catch (err) {
    console.error('Erro ao inicializar header:', err);
    if (primeiraOpcao) primeiraOpcao.text = 'Fazer Login';
  }
}

// Executa a inicialização do header sem sobrescrever outros onload handlers
document.addEventListener('DOMContentLoaded', nomeUsuarioHeader);

// Funções de controle do menu
async function logout() {
  try {
    const res = await fetch(`${API_BASE_URL}/login/logout`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (data.status === 'deslogado') window.location.href = '/login/login';
  } catch (err) {
    console.error('Erro ao desconectar:', err);
  }
}

function handleUserAction(action) {
  if (action === 'gerenciar-conta') window.location.href = '/pessoa/gerenciarConta';
  else if (action === 'sair') logout();
}

function handleLogin(){
  const combobox = document.getElementById('oUsuario');
  const primeiraOpcao = combobox && combobox.options && combobox.options[0];
  if (primeiraOpcao && primeiraOpcao.text === 'Fazer Login') window.location.href = '/login/login';
}
