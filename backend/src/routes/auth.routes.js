const { Router } = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/error.middleware');

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ min: 2, max: 255 }),
    body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres.'),
    body('phone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido.'),
  ],
  validateRequest,
  AuthController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
    body('password').notEmpty().withMessage('Senha é obrigatória.'),
  ],
  validateRequest,
  AuthController.login
);

router.get('/me', authenticate, AuthController.me);

module.exports = router;
