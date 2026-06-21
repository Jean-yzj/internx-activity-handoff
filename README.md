# 實習通 · 活動報名編輯器改版交接

A static, self-contained **mockup / handoff site** that shows engineering what the
redesigned "活動報名專區" (event registration editor) should look like and how it
should behave. Visual system mirrors the real InternX app; it **does not import or
modify** any existing `internx.me` code.

> 介面示意檔。純 HTML/CSS/JS，無建置流程，雙擊即可開啟。

## 為什麼做這個

現有編輯器的四個痛點 → 這份交接示範如何解：

| 問題 | 現況（frontend 程式碼） | 改法 |
|---|---|---|
| 早鳥票過期還能選 | `feeItems: {name, price}` 無時間欄位 (`activity-form-schema.ts:328`) | 每票加 `saleStart/saleEnd`，狀態自動計算 |
| 不能限制每種票張數 | 只有全活動名額上限 (`:371`) | 每票各設 `quantity` + 已售/剩餘 |
| 欄位排序不順手 | 自製拖曳不穩、手機難用 (`FormBuilder.tsx:88`) | 改用 `@dnd-kit`，抓把手就能順暢拖曳 |
| 編輯跑版、不精緻 | 單一長表單 `AddActivity.tsx` | 四步驟、固定寬度版面 + 即時預覽 |

## 內容

| 頁面 | 說明 |
|---|---|
| `index.html` | 總覽：痛點對照與改版重點 |
| `editor.html` | 主辦方編輯器（票券與表單可實際操作） |
| `attendee.html` | 報名者完整頁面：活動介紹 + 報名表單 + 票券狀態（範例：學生創業者小聚） |
| `integration.html` | 整合動線：它接進實習通的哪個位置（路由 + 點擊路徑） |
| `spec.html` | 工程規格：資料模型、驗證、改動檔案清單、驗收標準 |
| `INTEGRATION.md` | **工程交接文件**：前端頁面對應 + 如何串接進 internx.me |

## 本機預覽

雙擊 `index.html` 即可，或啟動零依賴伺服器：

```bash
node server.js        # http://localhost:4178
```

## 設計 token（取自實習通 globals.css）

- 主色 `#0182fd`／深 `#1861a8`　·　輔色 `#e2a200`　·　CTA 橘 `#c35500`
- 背景 `#fff6ef`　·　圓角 `10px`
- 字體 Poppins + Noto Sans TC　·　圖示 Remix Icons
