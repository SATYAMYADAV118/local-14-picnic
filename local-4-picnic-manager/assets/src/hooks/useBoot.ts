export interface BootPayload {
  nonce: string;
  restUrl: string;
  currentUser: {
    id: number;
    name: string;
    email: string;
    roles: string[];
    caps: string[];
    avatar?: string;
  } | null;
  settings: Record<string, any>;
  isAdmin: boolean;
}

declare global {
  interface Window {
    l4pDashboard: BootPayload;
  }
}

export function useBoot() {
  const payload = window.l4pDashboard;
  const currentUser = payload?.currentUser ?? null;
  const isCoordinator = currentUser?.caps?.includes('manage_l4p_funding') ?? false;

  return {
    nonce: payload?.nonce ?? '',
    restUrl: payload?.restUrl ?? '/wp-json/l4p/v1',
    currentUser,
    settings: payload?.settings ?? {},
    isCoordinator
  };
}
