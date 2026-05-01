export type SignedInUser = {
  id: number;
  name: string;
  username: string;
  email: string;
};

export type AppTab = 'dashboard' | 'modules' | 'payroll' | 'account';
