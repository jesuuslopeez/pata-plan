const { Router } = require('express');
const { getAll, getById, create, update, remove } = require('../controllers/animal.controller');
const { authorize } = require('../middlewares/roles');
const { uploadAnimalPhoto } = require('../middlewares/upload');

const router = Router();

router.get('/', authorize('ADMIN', 'COLLABORATOR'), getAll);
router.get('/:id', authorize('ADMIN', 'COLLABORATOR'), getById);
router.post('/', authorize('ADMIN'), uploadAnimalPhoto, create);
router.put('/:id', authorize('ADMIN'), uploadAnimalPhoto, update);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
