import { useState, useEffect, useCallback, useRef } from 'react';
import { GOOGLE_CONFIG } from '../config';

/**
 * 管理 Google OAuth2 登入狀態
 *
 * 自動登入架構（兩層）：
 *  1. google.accounts.id (One Tap) — 用瀏覽器 cookie 確認身分，可跨分頁存活
 *  2. oauth2.initTokenClient       — 取得 Sheets API 用的 Access Token
 *
 * 手動登入流程：
 *  按下登入 → prompt: '' 靜默用 Chrome 目前帳號取 token
 *           → 若失敗 → fallback 到 select_account 讓使用者選
 */
export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const tokenClientRef = useRef(null);

  // 共用的 token response handler
  const handleTokenResponse = useCallback((response) => {
    if (response.error) {
      setError(response.error);
      setIsSignedIn(false);
    } else {
      setIsSignedIn(true);
      setError(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const initGapi = async () => {
      try {
        await new Promise((resolve) => window.gapi.load('client', resolve));
        await window.gapi.client.init({
          discoveryDocs: [GOOGLE_CONFIG.DISCOVERY_DOC],
        });

        // ── Token client ──
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          scope: GOOGLE_CONFIG.SCOPES,
          callback: handleTokenResponse,
        });
        tokenClientRef.current = client;

        // ── One Tap：自動登入（跨分頁，用 cookie）──
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          auto_select: true,
          cancel_on_tap_outside: false,
          callback: () => {
            client.requestAccessToken({ prompt: '' });
          },
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setIsLoading(false);
          }
        });

      } catch (err) {
        setError('Google API 初始化失敗：' + err.message);
        setIsLoading(false);
      }
    };

    const checkReady = setInterval(() => {
      if (window.gapi && window.google?.accounts?.oauth2 && window.google?.accounts?.id) {
        clearInterval(checkReady);
        initGapi();
      }
    }, 100);

    return () => clearInterval(checkReady);
  }, [handleTokenResponse]);

  // 手動登入：優先靜默用 Chrome 目前帳號，失敗再跳選帳號視窗
  const signIn = useCallback(() => {
    const client = tokenClientRef.current;
    if (!client) return;

    client.callback = (response) => {
      if (response.error) {
        // 靜默失敗 → 恢復正常 callback，再跳選帳號
        client.callback = handleTokenResponse;
        client.requestAccessToken({ prompt: 'select_account' });
      } else {
        handleTokenResponse(response);
      }
    };

    client.requestAccessToken({ prompt: '' });
  }, [handleTokenResponse]);

  // 登出：撤銷 token + 清除 One Tap cookie（下次不自動登入）
  const signOut = useCallback(() => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
    }
    window.google.accounts.id.disableAutoSelect();
    setIsSignedIn(false);
  }, []);

  return { isSignedIn, isLoading, error, signIn, signOut };
}
