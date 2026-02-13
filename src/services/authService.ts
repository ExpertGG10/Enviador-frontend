// API base URL
const API_BASE = '/api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ErrorResponse {
  non_field_errors?: string[];
  [key: string]: string[] | string | undefined;
}

/**
 * Serviço de autenticação com API do backend
 */
export const authService = {
  /**
   * Registrar novo usuário
   */
  register: async (
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password,
        password2: password,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(
        Object.values(error).flat().join(', ') || 'Erro ao registrar'
      );
    }

    return response.json();
  },

  /**
   * Fazer login
   */
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(
        error.non_field_errors?.[0] || 'Credenciais inválidas'
      );
    }

    return response.json();
  },

  /**
   * Fazer logout
   */
  logout: async (token: string): Promise<void> => {
    await fetch(`${API_BASE}/auth/logout/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
      },
    });
  },

  /**
   * Obter dados do usuário autenticado
   */
  getCurrentUser: async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/auth/me/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Falha ao obter dados do usuário');
    }

    return response.json();
  },

  /**
   * Atualizar dados do usuário
   */
  updateUser: async (
    token: string,
    data: Partial<User>
  ): Promise<User> => {
    const response = await fetch(`${API_BASE}/auth/me/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar usuário');
    }

    return response.json();
  },

  /**
   * Mudar senha
   */
  changePassword: async (
    token: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ message: string; token: string }> => {
    const response = await fetch(`${API_BASE}/auth/change-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        new_password2: newPassword,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(
        Object.values(error).flat().join(', ') || 'Erro ao mudar senha'
      );
    }

    return response.json();
  },
};
