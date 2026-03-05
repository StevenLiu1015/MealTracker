import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_CONFIG } from '../config';

/**
 * 管理 Google OAuth2 登入狀態
 *
 * 自動登入架構（兩層）：
 *  1. google.accounts.id (One Tap) — 用瀏覽器 cookie 確認身分，可跨分頁存活
 *  2. oauth2.initTokenClient     — 取得 Sheets API 用的 Access Token
 *
 * 流程：One Tap 靜默確認身分 → token client 靜默取 access token → 登入完成
 * 若 One Tap 無法自動選擇帳號 → 顯示登入畫面，等使用者手動點擊
 */
export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenClient, setTokenClient] = useState(null);

  useEffect(() => {
    const initGapi = async () => {
      try {
        await new Promise((resolve) => window.gapi.load('client', resolve));
        await window.gapi.client.init({
          discoveryDocs: [GOOGLE_CONFIG.DISCOVERY_DOC],
        });

        // ── Token client：拿到 access token 後設為已登入 ──
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
            setIsLoading(false);
          },
        });
        setTokenClient(client);

        // ── One Tap：用 cookie 靜默確認身分，成功後觸發 token client ──
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          auto_select: true,           // 有唯一帳號時完全靜默
          cancel_on_tap_outside: false,
          callback: () => {
            // 身分確認，靜默取 access token（不彈任何視窗）
            client.requestAccessToken({ prompt: '' });
          },
        });

        // prompt() 嘗試自動選帳號；若無法自動選則觸發 notification callback
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // One Tap 無法自動選帳號（未登入 Google 或需要互動）→ 顯示登入畫面
            setIsLoading(false);
          }
          // isDisplayMoment = 顯示了 One Tap UI，等使用者點擊，不動 loading
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
  }, []);

  // 手動登入：點按鈕後跳出 Google 帳號選擇
  const signIn = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    }
  }, [tokenClient]);

  // 登出：撤銷 token + 清除 One Tap cookie session
  const signOut = useCallback(() => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
    }
    window.google.accounts.id.disableAutoSelect(); // 清除 One Tap 記憶，下次不自動登入
    setIsSignedIn(false);
  }, []);

  return { isSignedIn, isLoading, error, signIn, signOut };
}
