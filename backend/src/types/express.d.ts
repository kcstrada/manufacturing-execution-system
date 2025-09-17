import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id?: string;
      sub?: string;
      email?: string;
      name?: string;
      roles?: string[];
      tenant_id?: string;
      tenantId?: string;
      realm_access?: {
        roles?: string[];
      };
    }

    interface Request {
      tenant?: {
        id?: string;
        subdomain?: string;
        customDomain?: string;
      };
    }
  }
}

export {};
