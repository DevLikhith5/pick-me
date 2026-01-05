import express, { Request, Response } from 'express';
const pingRouter = express.Router();

pingRouter.use('/', (req: Request, res: Response) => {
    res.json({
        message: 'pong'
    });
});

export default pingRouter;
