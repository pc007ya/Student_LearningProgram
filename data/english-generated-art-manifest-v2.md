# 英文生成式插圖圖庫 v2

本次英文一～三年級字卡不再以 emoji 作為主要圖片。`images/english-generated-v2/` 收錄一張 4×4 教學插圖圖集及 16 張裁切後的 WebP 圖片；所有圖片均為無文字、無 emoji 的繪本式物件插圖。

## 對應方式

- `atlas-01` 蘋果
- `atlas-02` 書本
- `atlas-03` 狗
- `atlas-04` 校車
- `atlas-05` 房子
- `atlas-06` 樹木
- `atlas-07` 腳踏車
- `atlas-08` 餐點
- `atlas-09` 鉛筆
- `atlas-10` 貓
- `atlas-11` 教室桌椅
- `atlas-12` 雨雲
- `atlas-13` 跑步孩子
- `atlas-14` 紅花
- `atlas-15` 書包
- `atlas-16` 足球

`index.html` 的 `englishImageForWord()` 會優先採用既有的專用 v1 插圖；原本指向 emoji SVG 的字卡則依單字與分類改用本圖庫，三年級新增 500 字庫直接沿用同一套非 emoji 視覺系統。
