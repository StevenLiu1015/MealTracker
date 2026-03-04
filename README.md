# 🍱 餐費追蹤器

每日餐費預算追蹤 PWA，資料同步到 Google Sheets。

---

## 部署步驟

### Step 1：設定 Google Cloud Console

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你原本的專案（有 Drive API 的那個）
3. 左側 → **API 和服務** → **啟用 API**，搜尋啟用 **Google Sheets API**
4. 左側 → **憑證** → 點選你現有的 OAuth 2.0 用戶端 ID
5. 在「已授權的 JavaScript 來源」新增：`https://你的帳號.github.io`
6. 複製你的**用戶端 ID**

### Step 2：填入 Client ID

編輯 `src/config.js`：

```js
CLIENT_ID: '你的用戶端ID.apps.googleusercontent.com',
```

### Step 3：推上 GitHub

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/你的帳號/meal-tracker.git
git push -u origin main
```

### Step 4：開啟 GitHub Pages

repo → Settings → Pages → Source 選 **GitHub Actions**
約 1 分鐘後部署完成，取得網址。

### Step 5：安裝成 PWA

- **Android**：Chrome → 右上角選單 → 新增到主畫面
- **Windows**：Chrome 網址列右側安裝圖示 → 安裝

---

## 自訂每日預算

`src/config.js` 裡改 `DEFAULT_DAILY_BUDGET = 300`

## 本地開發

```bash
npm install
npm run dev
```
