const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  let data: any;
  if (isJson) {
    try {
      data = await res.json();
    } catch (e) {
      // JSON 解析失败，但 HTTP 状态码可能提供线索
      throw new Error(`Server returned ${res.status} ${res.statusText} (invalid JSON)`);
    }
  } else {
    // 非 JSON 响应，读取文本
    const text = await res.text();
    throw new Error(`Server returned ${res.status} ${res.statusText}: ${text.substring(0, 100)}`);
  }

  if (!res.ok) {
    const message = data?.error || data?.message || 'Unknown error';
    throw new Error(message);
  }

  return data as T;
}

export async function register(email: string, password: string, name: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return handleResponse(res);
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function refreshToken(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return handleResponse(res);
}

export async function logout(refreshToken: string, accessToken: string) {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });
  return handleResponse(res);
}

export async function getCoupleInfo(accessToken: string) {
  const res = await fetch(`${API_BASE}/couple`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse(res);
}

export async function generateInvite(accessToken: string) {
  const res = await fetch(`${API_BASE}/couple/invite`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return handleResponse(res);
}

export async function joinCouple(accessToken: string, inviteCode: string) {
  const res = await fetch(`${API_BASE}/couple/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ inviteCode }),
  });
  return handleResponse(res);
}
