const path = require('path');

// Função chamada pela rota
exports.uploadImagem = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
  }

  return res.status(200).json({
    mensagem: 'Upload realizado com sucesso!',
    arquivo: req.file.filename,
    caminho: `/imagens/${req.file.filename}`
  });
};
