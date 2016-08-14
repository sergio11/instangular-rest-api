import express from 'express';
import paramValidation from '../validations/media';
import mediaCtrl from '../controllers/media';

const router = express.Router();	// eslint-disable-line new-cap

router.route('/:id')
  /** GET /media/media-id - Get information about media object */
  .get(paramValidation(paramValidation.get), mediaCtrl.get);

/** Load media when API with id route parameter is hit */
router.param('id', mediaCtrl.load);

export default router;
