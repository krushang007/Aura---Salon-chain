export interface SignInFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'CUSTOMER' | 'STAFF' | 'TENANT_ADMIN';
    tenantId?: string | null;
  };
  token: string;
}
