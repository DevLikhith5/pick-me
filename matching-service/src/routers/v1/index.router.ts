import express from 'express';
import pingRouter from './ping.router';
import matchRouter from './match.router';

import driverRouter from './driver.router';
const v1Router = express.Router();

v1Router.use('/ping', pingRouter);
v1Router.use('/match', matchRouter)
v1Router.use('/driver', driverRouter)
export default v1Router;
