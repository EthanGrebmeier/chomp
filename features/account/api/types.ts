export type DeleteAccountErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'config_error'
  | 'server_error';

export type DeleteAccountError = {
  error: {
    code: DeleteAccountErrorCode;
    message: string;
  };
};
