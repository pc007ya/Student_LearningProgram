# 英文生活關聯心智圖 v2

## 內容

- 題庫：100 組生活主題，每組 1 張生活大圖 + 4 張英文部件子圖卡。
- 每輪只抽 3 組（12 張子圖卡），完成後按「下一輪關聯」換題；題庫以輪次循環，避免一次載入過多卡片。
- 主題涵蓋：家中空間、客廳、廚房、臥室、浴室、陽台、便利商店、街道、學校用品、汽車與交通工具、自然、食物、身體與衣物、運動動作、社區場所。
- 圖片規格：每張 `scene-001.webp`～`scene-100.webp` 為 480×480 WebP；來源為 10 張生成圖集，各圖集 5×2 格裁切。
- 生成圖集：`images/english-association-v2/atlas-01.jpg`～`atlas-10.jpg`。
- 核心部件配對圖：`images/english-association-v2/child-001.webp`～`child-040.webp`，涵蓋家中部件、商店物件與交通工具零件；程式以 `ASSOCIATION_CHILD_IMAGE_MAP` 依英文單字與主題精準對應。

## 資料來源與教學範圍

詞彙範圍參考 Cambridge English A1 Movers 的兒童活動與主題字彙，並依本專案的生活部件配對玩法改寫；圖片為本專案重新生成的教育插畫，不使用 emoji 代替圖片。

## 程式對應

- 題庫定義：`index.html` 的 `ASSOCIATION_TOPIC_GROUPS`。
- 題目轉換：`EN_ASSOCIATION_SETS`。
- 每輪狀態：`englishAssociationRound`、`englishAssociationSetIds`。
- 圖片目錄：`images/english-association-v2/scene-*.webp`。
