import express from 'express';
import pingRouter from './ping.router';
import { geoAddressValidator } from '../../validators/geo-address.validator';
import { validate } from '../../middlewares/validation.middleware';
import { matchHandler } from '../../controllers/match.controller';
const matchRouter = express.Router();

matchRouter.use('/ping', pingRouter);
matchRouter.post('/', validate(geoAddressValidator), matchHandler)

export default matchRouter;
