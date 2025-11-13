// cadastro.js - validação do formulário e envio para backend
(function(){
  const API = window.API_BASE_URL || 'http://localhost:3001';

  window.finalizarCadastro = async function(){
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const rendaRaw = document.getElementById('renda').value;
    const renda = parseFloat(rendaRaw);

    // Validações
    if(!nome){ alert('Nome é obrigatório.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){ alert('E-mail inválido.'); return; }
    if(!senha || senha.length < 6){ alert('Senha deve ter pelo menos 6 caracteres.'); return; }
    if(isNaN(renda) || renda <= 0){ alert('Renda deve ser um número maior que zero.'); return; }

    // Monta payload
    const payload = {
      nome_pessoa: nome,
      email_pessoa: email,
      senha_pessoa: senha,
      renda_cliente: renda
    };

    try{
      const res = await fetch(`${API}/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if(!res.ok){
        alert(data.error || data.mensagem || 'Erro ao cadastrar.');
        return;
      }

      alert(data.mensagem || 'Cadastro realizado com sucesso!');
      // Redireciona para a página de login (rota já existente)
      window.location.href = '/login/login';

    }catch(err){
      console.error('Erro ao contatar backend:', err);
      alert('Erro na comunicação com o servidor. Tente novamente.');
    }
  };
})();
