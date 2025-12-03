// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: 'popup' | 'redirect';
            redirect_uri: string;
            state?: string;
            callback?: (response: { code: string; state?: string }) => void;
          }) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

export {};