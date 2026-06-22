# 實習通 · 認證帳號交接（活動報名 ＋ 創作者）

A static, self-contained **mockup / handoff site** for one **認證帳號** that both
**hosts activities** (event registration editor + backstage) and **creates content**
(creator profile + blog). Merges the activity-registration handoff and the creator-zone
demo into one site, one nav, one model. Visual system mirrors the real InternX app; it
**does not import or modify** any existing `internx.me` code.

> 介面示意檔。純 HTML/CSS/JS，無建置流程。`node server.js` 後開 http://localhost:4178 （支援 /editor 這類無副檔名網址）。

## 為什麼做這個

現有編輯器的四個痛點 → 這份交接示範如何解：

| 問題 | 現況（frontend 程式碼） | 改法 |
|---|---|---|
| 早鳥票過期還能選 | `feeItems: {name, price}` 無時間欄位 (`activity-form-schema.ts:328`) | 每票加 `saleStart/saleEnd`，狀態自動計算 |
| 不能限制每種票張數 | 只有全活動名額上限 (`:371`) | 每票各設 `quantity` + 已售/剩餘 |
| 欄位排序不順手 | 自製拖曳不穩、手機難用 (`FormBuilder.tsx:88`) | 改用 `@dnd-kit`，抓把手就能順暢拖曳 |
| 編輯跑版、不精緻 | 單一長表單 `AddActivity.tsx` | 四步驟、固定寬度版面 + 即時預覽 |

## 內容

統一導覽（8 頁）：總覽 / 認證帳號後臺 / 建立活動 / 報名頁 / 創作者主頁 / 部落格 / 整合動線 / 工程規格

| 頁面 | 說明 |
|---|---|
| `index.html` `/` | 總覽：痛點對照、改版重點、一個帳號兩種能力 |
| `backstage.html` `/backstage` | 認證帳號後臺：活動管理 / 報名名單（審核）/ 創作內容（部落格）|
| `editor.html` `/editor` | 建立活動（票券時間/數量、表單就地編輯與拖曳、進階設定）|
| `attendee.html` `/attendee` | 報名頁：活動介紹 + 報名表單 + 票券狀態（帶入編輯器內容）|
| `creator.html` `/creator` | 創作者主頁（關於我 / 專長 / 部落格 / 主辦活動 / 活動紀錄）|
| `blog.html` `/blog` | 部落格列表（`/blog-editor` 撰寫、`/blog-article` 內文）|
| `integration.html` `/integration` | 整合動線：接進實習通的位置與點擊路徑 |
| `spec.html` `/spec` | 工程規格：資料模型、驗證、改動清單、驗收 |
| `INTEGRATION.md` | 工程交接文件：活動票券＋審核＋金流＋部落格＋verified-role |

活動頁用 `assets/style.css`；創作者頁用 `assets/cz/`（兩套 CSS 並存，token 相同），共用同一條導覽。

## 本機預覽

雙擊 `index.html` 即可，或啟動零依賴伺服器：

```bash
node server.js        # http://localhost:4178
```

## 設計 token（取自實習通 globals.css）

- 主色 `#0182fd`／深 `#1861a8`　·　輔色 `#e2a200`　·　CTA 橘 `#c35500`
- 背景 `#fff6ef`　·　圓角 `10px`
- 字體 Poppins + Noto Sans TC　·　圖示 Remix Icons
