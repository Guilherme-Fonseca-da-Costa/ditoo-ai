export type InitialAdminFields = {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export class SetupError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function loadSetupStatus(): Promise<{ required: boolean }> {
  const response = await fetch('/setup/status', { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível verificar o primeiro acesso. Tente novamente.');
  const data = await response.json();
  if (typeof data.required !== 'boolean') throw new Error('Resposta de configuração inválida. Confira o servidor.');
  return { required: data.required };
}

export async function createInitialAdmin(fields: InitialAdminFields, token: string): Promise<void> {
  const response = await fetch('/setup/admin', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Bootstrap-Token': token.trim() },
    body: JSON.stringify(fields),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new SetupError(typeof data?.detail === 'string' ? data.detail : 'Não foi possível criar o administrador. Tente novamente.', response.status);
  }
}
