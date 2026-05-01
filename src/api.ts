type ApiResult<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
};

type LoginResponse = {
  token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
  };
};

type MeResponse = {
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
  };
};

export type ApprovalItem = {
  id: string;
  ref: string;
  type: string;
  subject: string;
  owner: string;
  status: string;
  requested_date?: string | null;
};

export type ApprovalDetail = {
  id: string;
  ref: string;
  type: string;
  subject: string;
  owner: string;
  status: string;
  approval_comment?: string | null;
  requested_date?: string | null;
  priority?: string;
  lines: Array<{
    id: string;
    category: string;
    item: string;
    quantity: number;
    unit: string;
  }>;
};

type ApprovalActionResponse = {
  id: string;
  status: string;
  comment?: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  module?: string;
  target_id?: string | null;
  action?: string;
  data?: Record<string, unknown>;
  read: boolean;
  read_at?: string | null;
  created_at?: string | null;
};

export type LeaveTypeItem = {
  id: string;
  name: string;
};

export type LeaveRequestItem = {
  id: string;
  leave_type: string;
  date_start?: string | null;
  date_end?: string | null;
  days_requested?: number | null;
  status: string;
  notes?: string | null;
  approver?: string;
  created_at?: string | null;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
};

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 10000;

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  if (!API_BASE_URL) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_BASE_URL. Add it to erp-mobile/.env and restart Expo with -c.'
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as ApiResult<T>) : undefined;

    if (!response.ok) {
      throw new Error(payload?.message ?? `Request failed (${response.status}).`);
    }

    if (!payload) {
      throw new Error('Empty response from server.');
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Ensure Laravel is reachable at ${API_BASE_URL}.`
      );
    }

    if (error instanceof SyntaxError) {
      throw new Error('Server returned a non-JSON response. Confirm API URL points to Laravel /api/v1.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function login(username: string, password: string, deviceName = 'expo-dev') {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      device_name: deviceName,
    }),
  });
}

export function me(token: string) {
  return request<MeResponse>('/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function logout(token: string) {
  return request<null>('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}

export function getApprovals(token: string, page = 1, perPage = 10) {
  return request<{ items: ApprovalItem[]; pagination: PaginationMeta }>(`/approvals?page=${page}&per_page=${perPage}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function approveItem(token: string, id: string, comment?: string) {
  return request<ApprovalActionResponse>(`/approvals/${id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      comment: comment?.trim() ? comment.trim() : undefined,
    }),
  });
}

export function getApprovalDetail(token: string, id: string) {
  return request<ApprovalDetail>(`/approvals/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function rejectItem(token: string, id: string, comment?: string) {
  return request<ApprovalActionResponse>(`/approvals/${id}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      comment: comment?.trim() ? comment.trim() : undefined,
    }),
  });
}

export function getNotifications(token: string, page = 1, perPage = 10) {
  return request<{ items: NotificationItem[]; unread_count: number; pagination: PaginationMeta }>(
    `/notifications?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function markNotificationRead(token: string, id: string) {
  return request<null>(`/notifications/${id}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}

export function markAllNotificationsRead(token: string) {
  return request<null>('/notifications/mark-all-read', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}

export function getLeaveTypes(token: string) {
  return request<{ items: LeaveTypeItem[] }>('/leave-types', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getLeaveRequests(token: string, page = 1, perPage = 10) {
  return request<{ items: LeaveRequestItem[]; pagination: PaginationMeta }>(
    `/leave-requests?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export function createLeaveRequest(
  token: string,
  payload: { leave_type_id?: string; leave_type?: string; date_start: string; date_end: string; notes?: string }
) {
  return request<{ id: string; status: string; leave_type: string }>('/leave-requests', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export { API_BASE_URL };
