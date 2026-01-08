import express from 'express';
import { driverCurrentJobEndedHandler, driverHeartbeatHandler, driverAcceptHandler } from '../../controllers/driver.controller';

const driverRouter = express.Router();
driverRouter.post('/status/available', driverHeartbeatHandler)
driverRouter.post('/trip/ended', driverCurrentJobEndedHandler)
driverRouter.post('/accept', driverAcceptHandler)
export default driverRouter
