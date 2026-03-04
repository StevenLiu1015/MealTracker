import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_CONFIG } from '../config';

/**
 * 管理 Google OAuth2 登入狀態
 * 使用 Google Identity Services (GIS) + gapi
 */
export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenClient, setTokenClient] = useState(null);

  // 初始化 gapi + GIS
  useEffect(() => {
    const initGapi = async () => {
      try {
        // 等待 gapi 載入
        await new Promise((resolve) => window.gapi.load('client', resolve));

        // 初始化 gapi client
        await window.gapi.client.init({
          discoveryDocs: [GOOGLE_CONFIG.DISCOVERY_DOC],
        });

        // 初始化 GIS token client
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          scope: GOOGLE_CONFIG.SCOPES,
          callback: (response) => {
            if (response.error) {
              setError(response.error);
              setIsSignedIn(false);
            } else {
              setIsSignedIn(true);
              setError(null);
            }
          },
        });

        setTokenClient(client);

        // 檢查是否已有有效的 token（頁面重整後）
        const token = window.gapi.client.getToken();
        if (token) setIsSignedIn(true);

      } catch (err) {
        setError('Google API 初始化失敗：' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // 確保 gapi 和 google 都已載入
    const checkReady = setInterval(() => {
      if (window.gapi && window.google?.accounts?.oauth2) {
        clearInterval(checkReady);
        initGapi();
      }
    }, 100);

    return () => clearInterval(checkReady);
  }, []);

  const signIn = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  }, [tokenClient]);

  const signOut = useCallback(() => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
    }
    setIsSignedIn(false);
  }, []);

  return { isSignedIn, isLoading, error, signIn, signOut };
}
