import { DeleteAccountError, DeleteAccountErrorCode } from './types';

export class AccountDeleteError extends Error {
  code: DeleteAccountErrorCode;

  constructor(code: DeleteAccountErrorCode, message: string) {
    super(message);
    this.name = 'AccountDeleteError';
    this.code = code;
  }
}

export const deleteAccount = async (token: string): Promise<void> => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new AccountDeleteError('config_error', 'API URL not configured');
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new AccountDeleteError(
      'server_error',
      'Could not reach the server. Please try again.'
    );
  }

  if (!response.ok) {
    let code: DeleteAccountErrorCode = 'server_error';
    let message = 'Failed to delete account. Please try again.';

    try {
      const errorBody = (await response.json()) as DeleteAccountError;
      code = errorBody.error.code;
      message = errorBody.error.message;
    } catch {
      // Keep the default error if the body isn't valid JSON.
    }

    throw new AccountDeleteError(code, message);
  }
};
