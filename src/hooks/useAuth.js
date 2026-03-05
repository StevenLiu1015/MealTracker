import { useState, useEffect, useCallback, useRef } from 'react';
import { GOOGLE_CONFIG } from '../config';

/**
 * 管理 Google OAuth2 登入狀態
 *
 * 架構說明：
 *  - 自動登入（page load）：id.prompt() → One Tap cookie 識別 → requestAccessToken
 *  - 手動登入（按鈕）：requestAccessToken({ prompt: '' }) 靜默識別 Chrome 帳號
 *                      → 若需互動 → requestAccessToken({ prompt: 'select_account' })
 *
 * 兩條路完全分開，不互相干擾
 */
export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const tokenClientRef = useRef(null);

  useEffect(() => {
    const initGapi = async () => {
      try {
        await new Promise((resolve) => window.gapi.load('client', resolve));
        await window.gapi.client.init({
          discoveryDocs: [GOOGLE_CONFIG.DISCOVERY_DOC],
        });

        // ── Token client：只負責取 access token ──
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          scope: GOOGLE_CONFIG.SCOPES,
          callback: '', // callback 在呼叫時動態設定
        });
        tokenClientRef.current = client;

        // ── One Tap：只用於 page load 自動登入 ──
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          auto_select: true,
          cancel_on_tap_outside: false,
          callback: () => {
            // One Tap 身分確認成功 → 靜默取 access token
            client.callback = (response) => {
              if (response.error) {
                setIsSignedIn(false);
                setError(response.error);
              } else {
                setIsSignedIn(true);
                setError(null);
              }
              setIsLoading(false);
            };
            client.requestAccessToken({ prompt: '' });
          },
        });

        window.google.accounts.id.prompt((notification) => {
          // 只要 One Tap 沒有自動完成（不論原因），就結束 loading 讓使用者手動登入
          if (
            notification.isNotDisplayed() ||
            notification.isSkippedMoment() ||
            notification.isDismissedMoment()
          ) {
            setIsLoading(false);
          }
          // isDisplayed：One Tap UI 顯示中，等使用者確認，不動 loading
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

  // 手動登入：靜默識別 Chrome 目前帳號 → 失敗才跳選帳號視窗
  const signIn = useCallback(() => {
    const client = tokenClientRef.current;
    if (!client) return;

    const onToken = (response) => {
      if (response.error) {
        if (response.error === 'interaction_required' || response.error === 'access_denied') {
          // 靜默失敗 → 跳出選帳號視窗
          client.callback = (r) => {
            setIsSignedIn(!r.error);
            if (!r.error) setError(null);
            else setError(r.error);
            setIsLoading(false);
          };
          client.requestAccessToken({ prompt: 'select_account' });
        } else {
          setError(response.error);
          setIsLoading(false);
        }
      } else {
        setIsSignedIn(true);
        setError(null);
        setIsLoading(false);
      }
    };

    client.callback = onToken;
    setIsLoading(true);
    client.requestAccessToken({ prompt: '' });
  }, []);

  // 登出：撤銷 token + 清除 One Tap 記憶
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
