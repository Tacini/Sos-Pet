const { Router } = require('express');
const GeocodeController = require('../controllers/geocode.controller');

const router = Router();

router.get('/reverse', GeocodeController.reverse);

module.exports = router;
