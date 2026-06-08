const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';

function cleanupUploads(req) {
  const files = req.files || (req.file ? [req.file] : []);
  for (const file of files) {
    const filePath = file.path || path.join(uploadDir, file.filename);
    if (filePath) {
      fs.unlink(filePath, () => {});
    }
  }
}

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    cleanupUploads(req);
    return res.status(422).json({
      success: false,
      message: 'Dados inválidos.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Arquivo muito grande. Tamanho máximo: 5MB.',
    });
  }

  if (err.message?.includes('Tipo de arquivo')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Este registro já existe.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor.' : err.message,
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { validateRequest, errorHandler, notFound };
