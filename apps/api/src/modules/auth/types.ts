import { UserRole } from '@prisma/client';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: UserRole;
  tokens: TokenPair;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: UserRole;
}
