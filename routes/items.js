const controller = require('../controllers/itemController');
const validateItem = require('../middleware/validateItem');
const express = require('express');
const router = express.Router();

router.get('/', controller.getItems);
router.post('/', validateItem, controller.createItem);
router.put('/:id', validateItem, controller.updateItem);
router.delete('/:id', controller.deleteItem);
router.get('/search', controller.searchItems);

module.exports = router;
