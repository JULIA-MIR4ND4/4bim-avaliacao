"use strict";
/*
Ativa o modo estrito para evitar erros silenciosos e garantir boas práticas.
*/

/* 
Atributos disponíveis para pesquisa 
 (id e nome — o banco não possui CPF nesta tabela).
*/
const atributosParaPesquisar = ['nome', 'id'];

/* 
Array global que receberá os dados dos clientes vindos do backend.
*/
let dadosParaFiltrar = [];

/* 
Busca os clientes no backend e formata os dados para uso na pesquisa dinâmica.
*/
fetch('http://localhost:3001/cliente')
  .then(response => response.json())
  .then(data => {
    // Mapeia os dados para conter id e nome
    window.osClientes = data.map(item => ({
      id: item.id_pessoa,
      nome: item.nome_pessoa
    }));
    dadosParaFiltrar = window.osClientes || [];
    console.log("Clientes carregados para busca dinâmica:", dadosParaFiltrar);
  })
  .catch(error => {
    console.error("Erro ao buscar clientes:", error);
    window.osClientes = [];
  });

/* 
Função que cria o componente de busca dinâmica.
É reaproveitável: você pode usar em outros cadastros futuramente (ex: fornecedor, funcionário).
*/
function createBuscaDinamica({
  searchTypeId = 'searchType',
  searchInputId = 'cliente_pessoa_cpf_pessoa',
  resultsListId = 'resultsList',
  atributosParaPesquisar,
  dadosParaFiltrar
}) {
  const searchTypeElement = document.getElementById(searchTypeId);
  const searchInputElement = document.getElementById(searchInputId);
  const resultsList = document.getElementById(resultsListId);

  let currentResolve = null;

  function hideList() {
    resultsList.classList.remove('show');
    resultsList.innerHTML = '';
  }

  function renderList(filtered) {
    resultsList.innerHTML = '';
    if (!filtered.length) {
      hideList();
      return;
    }

    filtered.forEach(dado => {
      const li = document.createElement('li');
      li.className = 'result-item';
      li.innerHTML = `
        <span class="result-main">${dado.nome}</span>
        <span class="result-type">(id:${dado.id})</span>
      `;

      // Quando o usuário clica num cliente da lista
      li.addEventListener('click', () => {
        const resp = {};
        atributosParaPesquisar.forEach(attr => {
          resp[attr] = dado[attr];
        });

        hideList();
  // grava o id do cliente no campo de entrada (backend espera id_cliente)
  searchInputElement.value = dado.id || '';
  searchInputElement.blur();

        if (currentResolve) {
          currentResolve(resp);
          currentResolve = null;
        }
      });

      resultsList.appendChild(li);
    });

    resultsList.classList.add('show');
  }

  function filterBase() {
    const query = searchInputElement.value.trim().toLowerCase();
    const type = searchTypeElement ? searchTypeElement.value : 'nome';
    if (query.length === 0) {
      hideList();
      return;
    }

    const filtered = dadosParaFiltrar.filter(dado => {
      const valor = String(dado[type] || dado['nome'] || dado['id'] || '').toLowerCase();
      return valor.includes(query);
    });

    renderList(filtered);
  }

  // Eventos principais
  searchInputElement.addEventListener('input', filterBase);
  searchInputElement.addEventListener('focus', filterBase);

  // Fecha a lista quando clica fora
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-bar-container')) {
      if (currentResolve) {
        currentResolve(null);
        currentResolve = null;
      }
      hideList();
    }
  });

  // Retorna a função que espera pela escolha do usuário
  return {
    waitForSelection() {
      return new Promise(resolve => {
        currentResolve = resolve;
      });
    }
  };
}

/* 
Função principal chamada no HTML via onfocus="buscaDinamica()"
Ela cria a busca dinâmica e aguarda o usuário selecionar um cliente.
*/
async function buscaDinamica() {
  console.log("buscaDinamica chamada...");
  window.bdBusca = createBuscaDinamica({ atributosParaPesquisar, dadosParaFiltrar });

  if (!window.bdBusca) {
    console.error("Erro: bdBusca não inicializado.");
    return;
  }

  const resposta = await window.bdBusca.waitForSelection();

  if (!resposta) {
    console.log("Busca cancelada ou sem seleção.");
    return;
  }

  // Mostra no console o retorno
  console.log("Cliente selecionado:", resposta);

  // Preenche o campo do cliente com o ID escolhido (backend espera id_cliente)
  document.getElementById('cliente_pessoa_cpf_pessoa').value = resposta.id || '';
  // Define o tipo de busca como id
  if (document.getElementById('searchType')) document.getElementById('searchType').value = 'id';
}
