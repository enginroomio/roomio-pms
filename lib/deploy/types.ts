export type DeployCheckCategory = 'infra' | 'security' | 'module';

export type DeployCheck = {
  id: string;
  label: string;
  category: DeployCheckCategory;
  ok: boolean;
  warn?: boolean;
  detail?: string;
};

export type ProductionReadiness = {
  ok: boolean;
  checkedAt: string;
  checks: DeployCheck[];
  summary: {
    passed: number;
    failed: number;
    warned: number;
    total: number;
  };
  release?: {
    version?: string;
    builtAt?: string;
    gitSha?: string | null;
  };
};
