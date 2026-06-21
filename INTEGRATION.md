# 實習通 · 活動報名改版 — 工程交接文件

> 這份文件說明 **mockup 的每個前端頁面**，以及 **如何把它串接進現有的 `internx-me/frontend`（internx.me）**。
> Mockup 本身是純靜態示意檔，不引用也不修改任何現有程式碼。
>
> 線上 mockup：https://jean-yzj.github.io/internx-activity-handoff/

---

## 0. 怎麼用這份文件

1. 先開線上 mockup 操作一遍（票券四種狀態、報名表單拖曳排序）。
2. 對照本文件的「檔案改動」逐項套用到 `frontend`。
3. 視覺照第 7 節 token，行為照第 9 節驗收標準。

改動分三塊，互相獨立、可分批上：**(A) 票券模型**、**(B) 表單拖曳**、**(C) 報名者頁面排版**。

---

## 1. 前端頁面總覽

| Mockup 頁面 | 真實對應畫面 | 對應現有檔案（frontend） |
|---|---|---|
| `index.html` | 交接說明（非產品頁） | — |
| `editor.html` → 活動內容 | 建立 / 編輯活動表單 | `components/Activities/AddActivity.tsx`、`ActivityFormStep.tsx` |
| `editor.html` → 票券設定 | 票價設定區（**核心改動**） | `lib/form-schema/activity-form-schema.ts`（feeItems） |
| `editor.html` → 報名表單 | 自訂報名欄位 | `components/Activities/FormBuilder/*` |
| `attendee.html` | 活動詳情 + 報名頁 | `components/Activities/ActivityContent.jsx`、`components/Registration/Registration.tsx`、`components/Payments/Payments.tsx` |
| `spec.html` | 工程規格速查 | — |

mockup 的設計 token 直接抄自 `frontend/page-styles/globals.css`，所以套進去不會有違和感（見第 7 節）。

---

## 2. 串接總覽（資料流）

```
主辦方 (editor)                報名者 (attendee)              後端 / Firestore
─────────────                 ──────────────                ─────────────────
活動內容  ─┐                    活動介紹  ◀── activity 文件
票券設定  ─┼─▶ activity.tickets ─▶ 選擇票券 ◀── ticketStatus() 即時算狀態
報名表單  ─┘   activity.formSchema ─▶ 報名表單 ──▶ registration + payment 文件
                                                  └─▶ 後端再驗 status==='live' 且未超賣
```

重點：**狀態不存欄位**，由 `ticketStatus()` 用「現在時間 + 已售」即時計算，主辦方與報名者兩端共用同一個函式。

---

## 3. 資料模型改動（A：票券）

### 3.1 新增 `data/ticket.ts`

現況票券只有 `{ name, price }`（`activity-form-schema.ts:328`），缺販售時間與數量，所以早鳥過期還能選、也無法限量。改成：

```ts
export interface Ticket {
  id: string;
  name: string;            // 票種名稱
  price: number;           // 0 = 免費
  quantity: number | null; // 數量上限，null = 不限
  sold: number;            // 已售（後端維護，前端唯讀）
  saleStart: Timestamp;    // 販售開始
  saleEnd: Timestamp;      // 販售結束
  description?: string;
  order: number;           // 排序
}

export type TicketStatusKey = 'soon' | 'live' | 'ended' | 'soldout';

export function ticketStatus(t: Ticket, now = new Date()): TicketStatusKey {
  if (t.quantity != null && t.sold >= t.quantity) return 'soldout'; // 已售完
  if (now < t.saleStart.toDate()) return 'soon';                    // 尚未開賣
  if (now > t.saleEnd.toDate())   return 'ended';                   // 販售已截止
  return 'live';                                                    // 販售中（唯一可購買）
}
```

> mockup 的 `assets/app.js` 有同邏輯的純 JS 版本，可直接對照。

### 3.2 與現有 `feeItems` 的相容 / 遷移

- 在 `data/activity.ts` 新增 `tickets: Ticket[]`。
- 舊資料遷移：把每筆 `feeItems[i] = {name, price}` 轉成 `Ticket`，`quantity=null`、`saleStart=活動建立時間`、`saleEnd=活動開始時間`、`sold=0`。寫一支一次性 migration script 即可。
- 舊的 `feeAmount`（單一費用，`:344`）與 `參加名額上限`（`:371`）可由票券模型取代；過渡期可保留讀取、新建一律走 `tickets`。

### 3.3 Firestore 結構

兩種做法擇一：
- **內嵌**（票種少，建議）：`activities/{id}.tickets`（陣列）。`sold` 用 `FieldValue.increment()` 更新。
- **子集合**（票種多 / 高併發）：`activities/{id}/tickets/{ticketId}`，`sold` 放各自文件，搭配 transaction 防超賣。

---

## 4. 元件改動

### 4.1 活動內容步驟（沿用）
`AddActivity.tsx` 的步驟式結構不動，維持「左步驟 + 右表單」。把欄位寬度固定（避免輸入跑版）即可。

### 4.2 票券設定步驟（取代現有票價 UI）
把 `feeItems` 的輸入換成票券卡片清單（對照 mockup `editor.html` → 票券設定）。每張卡片欄位：名稱、售價、數量上限、販售開始、販售結束、說明。卡片標題即時顯示 `ticketStatus()` 算出的狀態徽章。

驗證（加到 `activity-form-schema.ts` 的 `feeItems.validation`）：

| 規則 | 訊息 |
|---|---|
| `saleStart < saleEnd` | 販售開始需早於結束時間 |
| `quantity == null \|\| quantity >= 1` | 數量上限需 ≥ 1，或留空表示不限 |
| `price >= 0` | 價格不可為負（現有） |
| 付費活動至少 1 張票 | 請至少新增一個票種 |

### 4.3 報名表單拖曳（B：@dnd-kit）

現況 `FormBuilder.tsx:88` 已有 `handleReorderFields(from, to)`，但拖曳是自製的、不穩、手機難用。**保留這個函式**，改用成熟套件驅動，工程端不必自己處理拖曳事件：

```bash
npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

`components/Activities/FormBuilder/FormPreview.tsx`：

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableFieldRow({ field, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id, disabled: field.locked });
  return (
    <div ref={setNodeRef}
         style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
         {...attributes}>
      {/* 把手只套在 grip 圖示上，其餘區域照常點選編輯 */}
      {!field.locked && <span className="grip" {...listeners}><Icon iconName="draggable" /></span>}
      {children}
    </div>
  );
}

export function FormPreview({ fields, onReorderFields, ... }) {
  return (
    <DndContext collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          const from = fields.findIndex(f => f.id === active.id);
          const to   = fields.findIndex(f => f.id === over.id);
          onReorderFields(from, to);     // ← 既有函式，邏輯不變
        }
      }}>
      <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        {fields.map(f => <SortableFieldRow key={f.id} field={f}>{/* 既有列內容 */}</SortableFieldRow>)}
      </SortableContext>
    </DndContext>
  );
}
```

- 系統必填欄位（姓名 / Email）標 `locked`：`useSortable({ disabled: true })`、不給把手、固定最上方。要再保險可用 `@dnd-kit/modifiers` 限制拖曳範圍。
- dnd-kit 內建 `KeyboardSensor`，鍵盤也能排序（無障礙），這是自製拖曳沒有的。
- mockup（`editor.html`）為了零依賴用 HTML5 drag 示意，正式版請用 dnd-kit。

**欄位設定抽屜（點欄位即可編輯）** — 對應現有 `FormBuilder/FieldSettingsDrawer.tsx`，模型欄位已存在於 `FormBuilder/types.ts`：

| 欄位型別 | 可設定 | 對應 FormField 欄位 |
|---|---|---|
| 共用 | 名稱、佔位提示、說明、必填 | `label` / `placeholder` / `helperText` / `required` |
| 檔案上傳 | **允許格式、檔案大小上限、數量上限** | `accept` / `maxFileSize`(bytes) / `maxFiles` |
| 下拉 / 單選 / 複選 | 選項、允許「其他」 | `options` / `allowOther` |
| Email | 限定網域 | `allowedDomains` |
| 數字 | 最小 / 最大 | `min` / `max` |

報名者端要依這些設定驗證：檔案型別檢查 `accept` 副檔名與 `maxFileSize`、Email 檢查 `allowedDomains`、數字檢查 `min/max`。mockup 的報名頁（`attendee.html`）已照 `accept` / `maxFileSize` / `maxFiles` 顯示「接受 .pdf, image/* · 單檔 ≤ 5MB · 最多 1 個」。

### 4.4 報名者頁面（C：活動介紹 + 表單 + 票券）

對照 mockup `attendee.html`，報名者由上到下看到三段（順序很重要）：

1. **活動介紹** — cover、標題、日期/地點/主辦、富文本介紹、流程時間軸、常見問題。對應 `ActivityContent.jsx`。
2. **報名表單** — 依 `activity.formSchema` 算出的欄位、依拖曳後的順序渲染。對應 `Registration.tsx`。
3. **選擇票券** — 票券卡片，狀態用 `ticketStatus()` 判斷：`live` 才可選並出現數量 stepper；`soon/ended/soldout` 反灰不可選。底部固定送出列。

---

## 5. 後端 / Firestore：防超賣與送出再驗證

前端的 `ticketStatus()` 只是 UX，**最終一定要在後端再驗一次**：

```ts
// 報名送出（建議用 Firestore transaction）
await runTransaction(db, async (tx) => {
  const snap = await tx.get(ticketRef);
  const t = snap.data() as Ticket;
  if (ticketStatus(t) !== 'live') throw new Error('TICKET_NOT_ON_SALE'); // 防過期/未開賣
  if (t.quantity != null && t.sold + qty > t.quantity) throw new Error('SOLD_OUT'); // 防超賣
  tx.update(ticketRef, { sold: increment(qty) });
  tx.set(registrationRef, { ...form, ticketId: t.id, qty });
});
```

「審核制」活動（如創業者小聚）：送出後先建立 `registration` 為 `pending`，主辦方審核通過再進金流（見第 6 節）。

---

## 6. 金流串接（沿用現有 Payments）

`components/Payments/Payments.tsx` 的點數折抵 + 銀行轉帳邏輯**不用改**，只把「應付金額」的來源從 `feeAmount` 換成「所選票券 × 數量的加總」。`data/registration.ts` 增加 `ticketId`、`qty` 欄位即可對帳。

---

## 7. 視覺規範（直接用既有 token）

取自 `frontend/page-styles/globals.css`，**送出 / 主要按鈕一律用主色藍**：

```css
--theme-color: #0182fd;       /* 主色：主要按鈕、選取狀態、送出鍵 */
--theme-color-dark: #1861a8;  /* hover */
--complementary-color: #e2a200; /* 輔色：少量點綴，如「尚未開賣」徽章 */
--background-color-theme: #fff6ef; /* 頁面底色 */
--border-radius: 10px;
/* 字體 Poppins + Noto Sans TC，圖示 Remix Icons */
```

> 註：globals.css 另有 `--link-color: #c35500`（橘）。它是連結色，不是主要按鈕色 ——「送出」這類主動作請用 `--theme-color` 藍。

---

## 8. 分階段實作建議

- **Phase 1（最有感）**：票券模型 + `ticketStatus()` + 票券設定卡片 UI + 後端防超賣。直接解掉「早鳥過期還能選」「不能限量」。
- **Phase 2**：報名表單改 @dnd-kit 拖曳排序。
- **Phase 3**：報名者頁面排版（活動介紹 / 表單 / 票券三段）與視覺收斂。

---

## 9. 驗收標準

- [ ] 早鳥票販售結束時間過後，報名端自動鎖定、不可選。
- [ ] 每種票可獨立設數量，售完自動標記，後端 transaction 防超賣。
- [ ] 報名表單可用拖曳排序（含觸控與鍵盤），系統必填欄位固定最上方。
- [ ] 編輯器分步驟、欄位固定寬度，輸入時版面不跳動。
- [ ] 報名者頁面依序呈現：活動介紹 → 報名表單 → 票券狀態。
- [ ] 送出 / 主要按鈕為主色藍 `#0182fd`。

---

## 10. 本機預覽 / 部署

```bash
# mockup 本機預覽（零依賴）
node server.js   # http://localhost:4178
```

mockup 以 GitHub Pages 部署（main 分支 / 根目錄）。這份 repo 與 internx.me 完全分離，可當作 PR 描述與設計依據附在工程任務上。
