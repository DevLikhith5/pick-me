import express from 'express';
import { driverCurrentJobEndedHandler, driverHeartbeatHandler } from '../../controllers/driver.controller';

const driverRouter = express.Router();
driverRouter.post('/status/available',driverHeartbeatHandler)
driverRouter.post('/trip/ended',driverCurrentJobEndedHandler)
export default driverRouter
