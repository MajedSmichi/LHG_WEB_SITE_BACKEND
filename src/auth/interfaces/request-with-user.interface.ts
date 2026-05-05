import { Request } from 'express';
import { AuthUser } from './auth-user.interface.js';

export interface RequestWithUser extends Request {
  user: AuthUser;
}
