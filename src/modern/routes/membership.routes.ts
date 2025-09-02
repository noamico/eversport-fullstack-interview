import express, { Request, Response } from 'express';
import memberships from '../../data/memberships.json';
import membershipPeriods from '../../data/membership-periods.json';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  throw new Error('not implemented');
});

router.post('/', (req: Request, res: Response) => {
  throw new Error('not implemented');
});

export default router;
