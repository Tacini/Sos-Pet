const { Router } = require('express');
const { body } = require('express-validator');
const QuickReportController = require('../controllers/quickReport.controller');
const upload = require('../config/upload');
const { validateRequest } = require('../middlewares/error.middleware');

const router = Router();

router.post(
  '/quick',
  upload.single('photo'),
  [
    body('location_text').trim().notEmpty().withMessage('Localização é obrigatória.'),
    body('animal_type').optional().isString(),
    body('reporter_phone').optional().isLength({ min: 8, max: 20 }),
    body('reporter_email').optional().isEmail().normalizeEmail(),
    body('accepts_contact').optional().isString(),
    body('wants_updates').optional().isString(),
  ],
  validateRequest,
  QuickReportController.create
);

router.get('/quick', QuickReportController.list);
router.get('/quick/:id', QuickReportController.getById);

module.exports = router;