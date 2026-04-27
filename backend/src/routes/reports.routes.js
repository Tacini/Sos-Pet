const { Router } = require('express');
const { body } = require('express-validator');
const QuickReportController = require('../controllers/quickReport.controller');
const upload = require('../config/upload');
const { validateRequest } = require('../middlewares/error.middleware');

const router = Router();

// POST /reports/quick — endpoint público
router.post(
  '/quick',
  upload.single('photo'),
  [
    body('location_text').trim().notEmpty().withMessage('Localização é obrigatória.'),
    body('animal_type').optional().isIn(['dog', 'cat', 'bird', 'other']),
    body('reporter_phone').optional().isMobilePhone('pt-BR'),
    body('reporter_email').optional().isEmail().normalizeEmail(),
    body('accepts_contact').optional().isBoolean(),
    body('wants_updates').optional().isBoolean(),
  ],
  validateRequest,
  QuickReportController.create
);

// GET /reports/quick — listagem pública
router.get('/quick', QuickReportController.list);
router.get('/quick/:id', QuickReportController.getById);

module.exports = router;
