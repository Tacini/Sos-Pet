const { Router } = require('express');
const SearchController = require('../controllers/search.controller');

const router = Router();

router.get('/', SearchController.search);
router.get('/feed', SearchController.feed);

module.exports = router;
