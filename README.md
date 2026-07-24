# 小一國語 200 單元互動學習庫

可直接部署至 GitHub Pages 的純靜態互動教材。

## 功能

- 200 個識字單元
- 注音、部首、語詞與圖示
- 搜尋、分類、複習收藏
- 描寫練習與隨機測驗
- 日期及積分紀錄
- JSON 教材匯入與匯出
- Service Worker 離線快取

## GitHub Pages 發布

1. 建立新的 GitHub repository。
2. 將本資料夾內所有檔案上傳至 repository 根目錄，包含 `.nojekyll` 與 `.github`。
3. 前往 `Settings` > `Pages`。
4. 在 `Build and deployment` 的 Source 選擇 `GitHub Actions`。
5. 推送至 `main` 後，工作流程會自動發布。

也可將 Source 設定為 `Deploy from a branch`，選擇 `main` 與 `/(root)`。

## 本機預覽

直接開啟 `index.html` 即可使用大部分功能。Service Worker 必須透過 HTTPS 或 localhost 才會啟用。

## 注意

- 學習紀錄保存在使用者目前瀏覽器的 localStorage，不會跨裝置同步。
- 教育部筆順按鈕為外部連結，需要網路。
- GitHub Pages 公開網站請勿放入學生姓名、帳號或其他個人資料。
