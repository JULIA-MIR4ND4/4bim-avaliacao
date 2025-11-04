document.getElementById("header").insertAdjacentHTML('beforeend',`
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
              <li class="nav__menu-item"><a href="http://localhost:3001/">Home</a></li>
      
      
            
      
            </ul>
          </nav>
        
  `)

  // const API_BASE_URL = 'http://localhost:3001';
  // Selecionar pessoa da tabela
async function selecionarPessoa(id) {
  searchId.value = id;
  await buscarPessoa();
}
async function nomeUsuario() {
  const combobox = document.getElementById("oUsuario");
  const primeiraOpcao = combobox.options[0];
  const navMenu = document.querySelector(".nav__menu");

  try {
    const res = await fetch('http://localhost:3001/login/verificaSeUsuarioEstaLogado', {
      method: 'POST',
      credentials: 'include' // MUITO IMPORTANTE: envia cookies
    });

    const data = await res.json();

    if (data.status === 'ok') {
      primeiraOpcao.text = data.nome; // usuário logado

      if (data.ehFuncionario) {
        const cadastroMenu = document.createElement("li");
        cadastroMenu.className = "nav__menu-item";
        cadastroMenu.innerHTML = `
          <a href="#">Cadastros</a>
          <ul class="nav__submenu">
            <li class="nav__submenu-item"><a href="http://localhost:3001/cargo/abrirCrudCargo">Cargo</a></li>
            <li class="nav__submenu-item"><a href="http://localhost:3001/pessoa/abrirCrudPessoa">Pessoa</a></li>
            <li class="nav__submenu-item"><a href="http://localhost:3001/produto/abrirCrudProduto">Produto</a></li>
            <li class="nav__submenu-item"><a href="http://localhost:3001/pedido/crudPedido">Pedido</a></li>
          </ul>
        `;
        navMenu.appendChild(cadastroMenu);
      }

      if (!data.id_pedido_atual) {
        // Criar um novo pedido
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

          // Atualizar o id_pedido_atual da pessoa
          await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_pessoa: data.id_pessoa,
              id_pedido: novoPedido.id_pedido
            })
          });

          console.log('Novo pedido criado e id_pedido_atual atualizado:', novoPedido);
        } else {
          console.error('Erro ao criar novo pedido');
        }
      } else {
        console.log('Pedido atual já existe:', data.id_pedido_atual);
      }
    } else {
      primeiraOpcao.text = "Fazer Login"; // fallback
    }

  } catch (err) {
    console.error(err);
    primeiraOpcao.text = "Fazer Login";
  }
}

  
  
  // Chame a função quando a página carregar
  window.onload = nomeUsuario;
  
  async function usuarioAutorizado() {
  
  const rota = API_BASE_URL + '/login/verificaSeUsuarioEstaLogado';
  alert('Rota: ' + rota);
  
  const res = await fetch(rota, { credentials: 'include' });
  alert(JSON.stringify(data));
  
  
  
  
  const data = await res.json();
  if (data.status === 'ok') {
      document.getElementById('boasVindas').innerText =
      `${data.nome} - ${data.mnemonicoProfessor ? `Professor: ${data.mnemonicoProfessor}` : ''}`;
      if (data.mnemonicoProfessor) ehProfessor = true;
  } else {
      alert("Você precisa fazer login.");
      window.location.href = "./login/login";
  }
  }
  async function logout() {
    try {
      const res = await fetch('http://localhost:3001/login/logout', {
        method: 'POST',
        credentials: 'include', // envia cookies para o backend
      });
  
      const data = await res.json();
  
      if (data.status === 'deslogado') {
        window.location.href = 'http://localhost:3001/login/login'; // redireciona para login
      } else {
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao desconectar. Tente novamente.");
    }
  }
  function handleUserAction(action) {
    if (action === "gerenciar-conta") {
      // alert("Redirecionando para a página de Gerenciar Conta...");
      window.location.href = "/pessoa/gerenciarConta";
    } else if (action === "sair") {
      
      logout();
    }
  }
  
  function handleLogin(){
    const combobox = document.getElementById("oUsuario");
    const primeiraOpcao = combobox.options[0];
    if(primeiraOpcao.text=="Fazer Login"){
  
      window.location.href = 'http://localhost:3001/login/login'; // redireciona para login
    }
  }
  
  async function logout() {
    try {
      const res = await fetch('http://localhost:3001/login/logout', {
        method: 'POST',
        credentials: 'include', // envia cookies para o backend
      });
  
      const data = await res.json();
  
      if (data.status === 'deslogado') {
        window.location.href = 'http://localhost:3001/login/login'; // redireciona para login
      } else {
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao desconectar. Tente novamente.");
    }
  }
