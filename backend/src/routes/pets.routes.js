const { Router } = require('express');
const { body } = require('express-validator');
const LostPetController = require('../controllers/lostPet.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const upload = require('../config/upload');
const { validateRequest } = require('../middlewares/error.middleware');

const router = Router();

// GET /pets/lost — público
router.get('/lost', LostPetController.list);
router.get('/lost/:id', LostPetController.getById);

// Rotas autenticadas
router.use(authenticate);

router.get('/my', LostPetController.myPets);

router.post(
  '/lost',
  upload.array('photos', 5),
  [
    body('name').trim().notEmpty().withMessage('Nome do animal é obrigatório.'),
    body('type')
      .isIn(['dog', 'cat', 'bird', 'rabbit', 'other'])
      .withMessage('Tipo inválido.'),
    body('color').trim().notEmpty().withMessage('Cor é obrigatória.'),
    body('last_seen_location').trim().notEmpty().withMessage('Último local visto é obrigatório.'),
  ],
  validateRequest,
  LostPetController.create
);

router.patch(
  '/lost/:id/status',
  [body('status').isIn(['lost', 'found', 'closed']).withMessage('Status inválido.')],
  validateRequest,
  LostPetController.updateStatus
);

module.exports = router;
