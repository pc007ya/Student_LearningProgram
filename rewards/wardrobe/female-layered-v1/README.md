# 女性全畫布服裝疊加

`female_Base.png` 是所有女性全畫布套件共用的基底來源；目前已直接複製到每個套件的 `base.png`。`sports-bra-cargo-shorts/`、`sheet-*` 與 `set-*` 都是女性專用的 1000×1900 疊圖素材。每一張穿戴層都保留相同畫布尺寸與原始像素座標，瀏覽器不再對服裝做獨立縮放或裁切：

```text
female base (z-index 1)
└─ bottom / 下身 (z-index 2)
   └─ top / 上衣 (z-index 3)
      ├─ CSS 錨點鞋子 (z-index 4)
      ├─ 1000×1900 髮型畫布 (z-index 5)
      └─ 1000×1900 帽子畫布 (z-index 6)
```

`coordinates.json` 是這套素材的尺寸與 alpha 邊界來源；可用 `python3 tools/validate_female_layered_outfit.py` 驗證。商城卡片使用 `shop-top.png`、`shop-bottom.png`，不把人物身體帶進商品圖。

後來生成的髮型與帽子現在恢復提供 1000×1900 全畫布疊加圖，並另外保留商店預覽圖，方便你在其他工具調整像素位置；鞋履仍使用商店圖搭配 CSS 固定錨點：

```json
{
  "category": "hair | hat | shoe | hand | top | bot (bottom) | set",
  "canvasAsset": "<已驗證部位>/item_1000x1900.png",
  "shopAsset": "<部位>/shop/item.png",
  "canvasSize": [1000, 1900],
  "anchor": { "x": 0.5, "y": 0.5 },
  "zIndex": 4
}
```

`canvasAsset` 用於人物實際疊加，`shopAsset` 只給獎勵商店、櫥窗與衣櫃小圖使用。現在髮型與帽子也會以 1000×1900 畫布直接疊加，鞋履則由 CSS 錨點定位。`set` 是可購買、可穿上的整套商品；穿上後以一張完整 1000×1900 畫布取代 top／bottom／shoe／hair 的個別選擇，避免部位交界或重疊走樣。切換回任一獨立部位時會自動離開套裝模式，並保留原先各部位的選擇。商城已下架所有舊的 512×800 服裝與鞋子卡片，只保留帶有 `layeredRoot`、`canvasAsset` 與 1000×1900 基底的新版素材。

`hair` 商品卡與衣櫃小圖仍使用 `hair-face-*.png`（臉＋髮型），但人物實際疊加使用套件內的純髮型 `hair.png`，不會把第二張臉疊到角色上。可用以下工具從 `female-head-*.png` 重新產生裁切預覽：

```bash
python3 tools/build_hair_face_shop_previews.py
```

三套圖像方案的部位對應如下：

| 方案 | 上衣 | 下身 | 髮型 | 鞋子 |
| --- | --- | --- | --- | --- |
| Atelier | 黑色西裝外套 | 深藍九分褲 | 低髮髻長鬚 | 黑色樂福鞋 |
| Creative | 灰黑短版外套 | 黑色寬褲 | 自然中長髮 | 白色休閒鞋 |
| Performance | 黑色不對稱上衣 | 黑色直筒褲 | 低馬尾 | 黑色尖頭鞋 |
| Campus Sailor | 白色水手短上衣 | 深藍水手百褶裙 | — | 深藍水手帽、黑色瑪莉珍鞋 |
| Academy Noir | 黑色學院短西裝 | 炭灰百褶裙 | — | 黑色貝雷帽、黑色牛津鞋 |
| Modern Academy | 深藍現代學院西裝 | 霧藍百褶中長裙 | — | 深藍蝴蝶髮箍、深藍瑪莉珍鞋 |

最新完整套裝（`category: set`）：

| 套裝 | 內容 |
| --- | --- |
| Navy Pleated | 海軍藍背心洋裝、百褶裙、淺口鞋與配套髮型 |
| Ivory Academy | 象牙針織外套、藍色蝴蝶結襯衫、炭灰百褶裙、樂福鞋與配套髮型 |
| Denim Pinafore | 乳白 T 恤、丹寧吊帶裙、白色休閒鞋與配套髮型 |

每個 `sheet-*` 目錄都提供 top／bot 與對應的 hair 或 hat 1000×1900 畫布圖、`set.png`（整套驗證圖）與 `shop-*.png`（去除人物／綠幕後的商店預覽）；只有 shoe 仍從 `shop-shoe.png` 走 CSS 錨點。鞋履商店圖由已驗證的 `shoe.png` alpha 邊界重新裁切並保留透明留白，避免商品卡裁到鞋尖。原始綠幕圖可分別用 `python3 tools/import_female_sheet_sets.py <來源圖> rewards/wardrobe/female-layered-v1` 或 `python3 tools/import_female_school_sheet.py <來源圖> rewards/wardrobe/female-layered-v1` 重新匯入；匯入後用 `python3 tools/rebuild_shoe_shop_previews.py` 與 `python3 tools/validate_female_layered_outfit.py` 檢查尺寸、透明背景與綠幕邊緣。

完整套裝綠幕圖可用：

```bash
python3 tools/import_female_outfit_set_sheet.py <來源圖> rewards/wardrobe/female-layered-v1
```

它會建立 `set-navy-pleated/`、`set-ivory-academy/`、`set-denim-pinafore/`，每個目錄包含 `base.png`、`set.png`、`shop-set.png` 與 `manifest.json`。

男性仍走獨立的男性骨架與既有換裝路徑，不共用女性底圖。

## 2026-08-09 新增女性可拆分服裝

`generated-*` 目錄新增 10 組同系列、可自由混搭的上衣與下身，共 20 件商品：

| 代碼 | 系列 | 上衣 | 下身 |
| --- | --- | --- | --- |
| g21 | IVORY NAVY | 象牙藍滾邊襯衫 | 深藍百褶中長裙 |
| g22 | ROSE CHARCOAL | 煙粉蝴蝶結真絲上衣 | 炭灰高腰寬褲 |
| g23 | SKY CAMEL | 霧藍珍珠釦針織上衣 | 駝色高腰九分褲 |
| g24 | BURGUNDY NOIR | 酒紅短版西裝上衣 | 黑色箱褶及膝裙 |
| g25 | NAVY IVORY | 深藍現代水手針織上衣 | 象牙百褶中長裙 |
| g26 | LAVENDER CHECK | 薰衣草羅紋高領上衣 | 炭灰薰衣草格紋中長裙 |
| g27 | DENIM RUST | 靛藍短版丹寧外套 | 赤陶工裝及膝裙 |
| g28 | BLACK STAGE | 黑色不對稱緞面上衣 | 炭黑高腰寬褲 |
| g29 | CHAMPAGNE PLUM | 香檳蝴蝶結緞面上衣 | 深梅紫褶襉中長裙 |
| g30 | SKY SPORT | 白藍機能拉鍊外套 | 深藍直筒運動長褲 |

每個目錄含 `shop-top.png`、`shop-bottom.png`（800×800、無人物）以及 `top.png`、`bot.png`、`set.png`（1000×1900）。商店圖與穿戴圖由同一張去背來源生成，因此款式與細節一致；`set.png` 只供整套對位 QA，商品仍以獨立上衣／下身登錄。

可用以下工具重建這批素材：

```bash
python3 tools/import_generated_female_separates.py
```
