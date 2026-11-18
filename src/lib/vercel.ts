/**
 * Minimal Vercel REST API client covering just what the Vercel tab needs:
 * list recent deployments, trigger a redeploy, and cancel an in-progress one.
 * Docs: https://vercel.com/docs/rest-api
 */

export type VercelDeployment = {
  uid: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED' | string;
  target?: string | null;
  createdAt: number;
};

export type VercelCredentials = {
  token: string;
  projectId: string;
  teamId?: string;
};

class VercelApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'VercelApiError';
  }
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function request<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = body?.error?.message ?? response.statusText;
    throw new VercelApiError(message, response.status);
  }

  return body as T;
}

export async function listDeployments(
  creds: VercelCredentials,
  limit = 10
): Promise<VercelDeployment[]> {
  const query = buildQuery({
    projectId: creds.projectId,
    teamId: creds.teamId,
    limit: String(limit),
  });
  const data = await request<{ deployments: VercelDeployment[] }>(
    `/v7/deployments${query}`,
    creds.token
  );
  return data.deployments ?? [];
}

export async function redeployDeployment(
  creds: VercelCredentials,
  deployment: Pick<VercelDeployment, 'uid' | 'name'>
): Promise<VercelDeployment> {
  const query = buildQuery({ teamId: creds.teamId });
  return request<VercelDeployment>(`/v13/deployments${query}`, creds.token, {
    method: 'POST',
    body: JSON.stringify({
      name: deployment.name,
      deploymentId: deployment.uid,
    }),
  });
}

export async function cancelDeployment(
  creds: VercelCredentials,
  deploymentUid: string
): Promise<VercelDeployment> {
  const query = buildQuery({ teamId: creds.teamId });
  return request<VercelDeployment>(
    `/v12/deployments/${deploymentUid}/cancel${query}`,
    creds.token,
    { method: 'PATCH' }
  );
}

export { VercelApiError };
