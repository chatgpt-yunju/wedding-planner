const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function register(email: string, password: string, name: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function refreshToken(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
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
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getCoupleInfo(accessToken: string) {
  const res = await fetch(`${API_BASE}/couple`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function generateInvite(accessToken: string) {
  const res = await fetch(`${API_BASE}/couple/invite`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
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
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
