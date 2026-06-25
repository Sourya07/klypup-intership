import { Request, Response, NextFunction } from 'express';
import * as orgService from './service';
import { sendSuccess } from '../../utils';

export async function getMyOrg(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgService.getOrganization(req.user!.orgId);
    sendSuccess(res, org);
  } catch (err) {
    next(err);
  }
}

export async function invite(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orgService.createInvite(req.user!.orgId, req.body);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function joinByCode(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orgService.joinByCode(req.user!.userId, req.body.inviteCode);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function joinByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orgService.joinByToken(req.user!.userId, req.body.inviteToken);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await orgService.getMembers(req.user!.orgId);
    sendSuccess(res, members);
  } catch (err) {
    next(err);
  }
}
