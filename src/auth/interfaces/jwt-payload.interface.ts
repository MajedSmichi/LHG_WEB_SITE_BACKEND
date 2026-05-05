export interface JwtPayload {
  sub: number;
  email: string;
  role: 'admin' | 'user';
}
