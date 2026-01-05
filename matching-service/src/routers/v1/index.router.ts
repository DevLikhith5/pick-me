import express from 'express';
import pingRouter from './ping.router';
import { geoAddressValidator } from '../../validators/geo-address.validator';
import matchRouter from './match.router';
import { validate } from '../../middlewares/validation.middleware';
const v1Router = express.Router();

v1Router.use('/ping', pingRouter);
v1Router.use('/match', matchRouter)

export default v1Router;
