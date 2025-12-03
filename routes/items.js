const controller = require('../controllers/itemController');
const validateItem = require('../middleware/validateItem');
const express = require('express');
const router = express.Router();

// 1.get all items
router.get('/', controller.getItems);

// 2.create new item
router.post('/', validateItem, controller.createItem);

// 3.search items
router.get('/search', controller.searchItems);

// 4. get items by id
router.get('/:id', controller.getItemById);

// 5. update
router.put('/:id', validateItem, controller.updateItem);

// 6. partial update
router.patch('/:id', controller.partialUpdateItem); 

// 7. delete
router.delete('/:id', controller.deleteItem);

module.exports = router;