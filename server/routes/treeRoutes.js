import express from 'express';
import { getTree, saveTree, updateTreeName } from '../controllers/treeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All tree operations require authentication

router.get('/', getTree);
router.put('/', saveTree);
router.patch('/name', updateTreeName);

export default router;
