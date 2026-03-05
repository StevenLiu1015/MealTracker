import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_CONFIG } from '../config';

const AUTO_SIGNIN_KEY = 'mealtracker_autosignin';

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
              // 靜默登入失敗（token 過期或被撤銷），清除記錄，等使用者手動登入
              if (response.error === 'interaction_required' ||
                  response.error === 'access_denied') {
                localStorage.removeItem(AUTO_SIGNIN_KEY);
              }
              setError(response.error);
              setIsSignedIn(false);
              setIsLoading(false);
            } else {
              localStorage.setItem(AUTO_SIGNIN_KEY, '1'); // 記住已授權
              setIsSignedIn(true);
              setError(null);
              setIsLoading(false);
            }
          },
        });

        setTokenClient(client);

        // 嘗試自動登入（曾授權過 → 靜默取得 token，不彈視窗）
        const hasAutoSignIn = localStorage.getItem(AUTO_SIGNIN_KEY);
        if (hasAutoSignIn) {
          client.requestAccessToken({ prompt: '' });
          // isLoading 維持 true，等 callback 回來再設定
        } else {
          setIsLoading(false);
        }

      } catch (err) {
        setError('Google API 初始化失敗：' + err.message);
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
      // 手動登入：第一次用 consent，之後用 select_account 讓使用者選帳號
      const hasAutoSignIn = localStorage.getItem(AUTO_SIGNIN_KEY);
      tokenClient.requestAccessToken({
        prompt: hasAutoSignIn ? 'select_account' : 'consent',
      });
    }
  }, [tokenClient]);

  const signOut = useCallback(() => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
    }
    localStorage.removeItem(AUTO_SIGNIN_KEY); // 登出時清除自動登入記錄
    setIsSignedIn(false);
  }, []);

  return { isSignedIn, isLoading, error, signIn, signOut };
}
