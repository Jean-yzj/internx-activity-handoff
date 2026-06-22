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

## ★ 先對齊：正式站已有 vs 這次要新增（給工程師）

> 參考站：**https://staging.internx.me**（論壇 / 人脈 / 活動 / 心得）。
> 這份 mockup 只示意「**這次才要新增、串接的部分**」。下表左欄是正式站**已經有**的（沿用），右欄是**目前沒有、要新做**的。對照真實資料模型 `data/activity.ts`、`data/needs-wall-live.js`、`data/chat.ts`、`data/verified-role-application.ts`。

| 範圍 | 正式站現況（已有，沿用）| 這次新增 / 要串（正式站還沒有）|
|---|---|---|
| 活動本體 | `data/activity.ts`：`activityType`/`organizerType`/`feeType`(free\|paid)/`registrationType`(含 `internx_form`)/`approvalStatus`/`createdBy`/`companyId`/`registrationDeadline`/`viewCount` | 票券**販售時間＋數量＋售完**狀態引擎（§3）；報名表單可**拖曳排序**（§4.3、§13）|
| 票券 / 收費 | `feeType` 二元（免費/付費）、`feeItems {name,price}`（`activity-form-schema.ts:328`）| `Ticket` 模型：`saleStart/saleEnd/quantity/sold` + `ticketStatus()`（§3）|
| 報名方式 | `registrationType: 'internx_form'`（站內表單已存在）| 可拖曳、可設定的 `FormField` schema + 欄位設定（§13）|
| **審核** | **活動發布審核**：`approvalStatus` pending/approved/rejected（平台審「活動能否上架」，`professional/home.jsx`）| **報名者審核**：`Registration.status`（主辦方審「個別報名者」，§12）——**與發布審核是兩回事** |
| 金流 | （目前活動多走外部連結 / 線下）| **平台代收代付**：通過→通知→線上繳費→自動標記 paid（§6、§14）|
| 通知 | 站內通知基礎建設 | 報名/審核/繳費**事件通知**（§15）|
| 創作者身分 | `verified-creator` 標章已存在，Post / ChatMessage **已顯示** `senderBadges`；`verifiedRoleApplications` 申請＋審核；`data/blog.ts` | 創作者主頁分頁（主辦活動/部落格/活動紀錄）、blog 發佈權**放寬**給帶標章者、創作者專區 landing/directory（§10）|
| **話題牆** | **NeedsWall** `data/needs-wall-live.js`（話題含 `forumId`/`branches`/`poll`）＋論壇 `ChatRoom` `data/chat.ts` | 與**活動／創作者**的串接：活動上架自動建話題、活動討論區、話題牆顯示行業認證專家（§17）|

一句話：**活動、報名表單(internx_form)、發布審核、verified-creator 標章、話題牆(NeedsWall) 都已存在**；要新做的是「**票券時間/數量、報名者審核、平台金流、表單拖曳、創作者主頁、以及把話題牆接上活動/創作者**」。

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

## 6. 金流：平台代收代付（主辦方不對帳）

金流由實習通統一處理，主辦方端只審核、不碰錢。完整流程：

1. 報名者送出 → `registration` 建為 `pending`（待審核）。
2. 主辦方在後臺按「通過」→ 後端 status 轉 `approved`，並**自動寄信**通知報名者可繳費。
3. 報名者在實習通**線上繳費**（沿用 `components/Payments/Payments.tsx`：點數折抵 / 轉帳，金額 = 所選票券 × 數量）。
4. 繳費完成 → 付款 webhook 將 status 轉 `paid`，主辦方後臺**自動**顯示「已付款」（無人工標記、無末五碼對帳）。
5. 退款同樣由平台處理。

`data/registration.ts` 需存 `ticketId`、`qty`、`status`、`paidAt`；主辦方端對付款狀態**唯讀**。

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

## 10. 創作者整合（主辦 ＝ 創作，同一認證帳號）

主辦單位與創作者是同一種認證帳號，不是兩套系統。判斷依據是 `profiles.badges` 是否含 `verified-creator`（不是獨立的 userRole）。同一帳號能辦活動（`Activity.createdBy`）也能發內容（`data/blog.ts`）。

| 創作者需求 | 既有可重用 | 檔案 |
|---|---|---|
| 認證標章 | `verified-creator`（金色膠囊 + quill-pen）+ VerifiedRolePitchModal | `components/Badge/ProfileBadge.tsx`、`lib/config.js` |
| 身分送審 | `verifiedRoleApplications` 申請集合 + 管理員審核 | `data/verified-role-application.ts` |
| 撰寫部落格 | `BlogPost` + `BlockEditor`；發佈權放寬給帶標章者 | `data/blog.ts`、`components/Blog/*` |
| 主辦活動（在創作者主頁） | `Activity.createdBy` + `Registration.userUid` | `data/activity.ts`、`data/registration.ts` |
| 追蹤 / 通知 | `Connection`（雙向）；單向 follow 與發文扇出待補 | `data/connection.ts` |

**三件主要工作（摘自創作者專區交接）：**
1. 註冊：不另開創作者註冊線；一般註冊後於 `/dashboard/verified-role-apply` 申請，接 `submitVerifiedRoleApplication()`。
2. 創作者主頁：在 `Profile.tsx` 用既有 `activeSectionTab` 加 3 分頁（部落格 / 主辦活動 / 活動紀錄），分別以 `userId` / `createdBy` / `userUid` 撈取。
3. 發佈權：把目前 admin-only 的部落格發佈權，放寬給帶 `verified-creator` 標章者（一行條件）。

**整合到本交接的呈現（站內頁面）：**
- 後臺 `/backstage`：官方帳號分頁同時有「活動管理 / 報名名單 / 創作內容」；創作內容＝部落格管理，連到 `/blog-editor`。
- 公開端 `/creator`：創作者主頁的「主辦活動」分頁連到報名頁 `/attendee`；`/blog` 為部落格列表。
- 待補（彙整）：verifiedRoleApplications 審核佇列、blog 發佈 gating、單向 follow、發文通知扇出、檢舉（`reports` 集合）。

## 11. 對應原平台後台（`professional` / 官方帳號）

這個 mockup 的「認證帳號後臺」不是新框架 —— 它直接對應 internx.me 既有的官方帳號後台。

**原平台現況（已存在）：**
- 框架 `components/PlatformFrame/ProfessionalPlatformFrame.jsx`：左側欄由 `PROFESSIONAL_SERVICES`（`lib/config.js`）產生，項目為 **官方帳號儀表板 `home` / 新增活動 `new-activity` / 活動成果展示 `activity-showcase` / 成員 `members` / 申請成為官方帳號 `join`**。
- 儀表板 `pages/[lang]/professional/home.jsx`：`Activity.loadAllForAdmin(db)` → 以 `companyId === userData.admining` 過濾「我的活動」→ `TabsViewer` 分 **待審核 / 已批准 / 已拒絕**（`activity.approvalStatus`）→ `ActivityGrid editable`，點擊進 `/activity/{id}`。
- 權限：需 `userData.admining`（官方帳號）或 `userData.admin`（平台管理員），否則導去 `professional/join`。

> 重要：home.jsx 的「待審核/已批准/已拒絕」是**活動發布審核**（平台 admin 審活動能否上架），<b>不是</b>報名者審核。報名者審核是這次新增的概念，別混在一起。

**mockup → 原平台位置 → 改動：**

| 這份 mockup | 原平台位置 | 改動 |
|---|---|---|
| 認證帳號後臺（整個殼） | `ProfessionalPlatformFrame` | 沿用框架，側邊欄 `PROFESSIONAL_SERVICES` 新增「報名名單」「創作內容」兩個 key |
| 活動管理 / 我的活動 | `professional/home.jsx`（已存在） | 沿用；票券改用新模型（§3），卡片顯示報名數/待審核數 |
| 報名名單（報名者通過/拒絕） | **新增** `professional/registrations`（或活動詳情子頁） | 新增 `Registration.status`（§4.3、§5）+ 平台代收代付（§6） |
| 建立活動 | `professional/new-activity.jsx` | 換成新編輯器：票券時間/數量、表單拖曳、進階設定 |
| 活動成果展示 | `professional/activity-showcase.jsx` | 沿用 |
| 成員權限 | `professional/members.jsx` | 沿用（決定誰能管理此官方帳號） |
| 創作內容（部落格） | **新增** `professional/blog`（或重用 `BlockEditor`） | 發佈權 gated by `verified-creator` 標章（§10） |
| 報名者公開頁 | `activity/[activityId]`（已存在） | 對齊版型；報名表單依 `formSchema` 渲染 |

**權限整合（主辦 ＝ 創作 的關鍵）：** 目前 `professional/*` 只認 `admining`（官方帳號）。整合後，把進入條件放寬為 **`admining`（可辦活動）OR `verified-creator` 標章（可發內容）**：兩者都進同一個 `ProfessionalPlatformFrame` 後台，依擁有的能力顯示對應側邊欄項目。`PROFESSIONAL_SERVICES_REQUIRE_ADMINING`（目前 `["home","new-activity","activity-showcase"]`）據此調整。

## 12. 報名資料模型與狀態機（完整）

### 12.1 `data/registration.ts`

```ts
export type RegistrationStatus =
  | 'pending'    // 已送出，待主辦方審核
  | 'approved'   // 已通過，待報名者繳費（系統已寄繳費通知）
  | 'paid'       // 已繳費完成（由付款 webhook 回寫）
  | 'rejected'   // 主辦方拒絕
  | 'cancelled'  // 報名者自行取消 / 逾期未繳
  | 'refunded';  // 已退款

export interface Registration {
  id: string;
  activityId: string;
  userUid: string;                   // 報名者
  ticketId: string;                  // 對應 Ticket.id
  qty: number;                       // 張數
  amount: number;                    // 應繳金額 = ticket.price × qty（送出當下快照，之後票價變動不影響）
  answers: Record<string, unknown>;  // 依 formSchema 的作答，key = FormField.id
  status: RegistrationStatus;
  createdAt: Timestamp;              // 送出時間
  approvedAt?: Timestamp;            // 主辦方通過
  paidAt?: Timestamp;               // 繳費完成（webhook 寫入）
  rejectedAt?: Timestamp;
  rejectReason?: string;             // 主辦方拒絕原因（選填）
  paymentId?: string;                // 對應 payment 文件
  reviewerUid?: string;              // 哪位主辦方成員審的（稽核用）
}
```

免費 / 自動通過活動：送出即 `status='paid'`（或 `'approved'`，視是否仍需報名者確認），跳過審核與金流。

### 12.2 狀態機

```
           送出報名               主辦方通過            報名者線上繳費
 (報名者) ──────────▶ pending ──────────────▶ approved ──────────────▶ paid
                       │ (主辦方)                  │ (逾期/取消)            │
                       │ 拒絕                       ▼                  (平台退款)
                       ▼                        cancelled                 ▼
                    rejected                                          refunded
```

| 轉換 | 觸發者 | 後端動作 | 副作用 |
|---|---|---|---|
| → `pending` | 報名者送出 | 建 registration；`ticket.sold += qty`（佔位）| 通知主辦方有新報名 |
| `pending` → `approved` | 主辦方按「通過」| 寫 `approvedAt` / `reviewerUid` | **寄信＋站內通知**報名者繳費連結 |
| `pending` → `rejected` | 主辦方按「拒絕」| 寫 `rejectedAt`；`ticket.sold -= qty`（釋放佔位）| 通知報名者結果（含 reason）|
| `approved` → `paid` | 付款 webhook | 寫 `paidAt` / `paymentId` | 後臺自動顯示「已付款」；寄收據 |
| `approved` → `cancelled` | 逾期未繳 / 報名者取消 | `ticket.sold -= qty` | 通知 |
| `paid` → `refunded` | 平台退款 | `ticket.sold -= qty`；建退款記錄 | 通知 |

> **佔位策略**：上表採「`pending` 即扣 `sold`」，避免審核期間名額被別人搶光。若不希望待審就佔名額，可改成 `approved` 才扣 —— 但要在 `approved` 當下重驗 `ticketStatus==='live'` 且未超賣，否則可能審核通過卻已售完。

---

## 13. 報名表單欄位型別（`FormField` 完整）

對應 `components/Activities/FormBuilder/types.ts`。報名者端依此 schema 渲染與驗證（mockup `attendee.html` 的 `renderForm()` 即照此分型別渲染）。

```ts
export type FieldType =
  | 'text' | 'textarea' | 'email' | 'phone' | 'number'
  | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'agreement';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  locked?: boolean;       // 系統必填（姓名/Email）：不可刪、不可拖、固定最上方
  order: number;
  placeholder?: string;
  helperText?: string;
  // 選項型（select / radio / checkbox）
  options?: string[];
  allowOther?: boolean;
  // 檔案型（file）
  accept?: string;        // 例 ".pdf, image/*"
  maxFileSize?: number;   // bytes
  maxFiles?: number;
  // Email
  allowedDomains?: string[]; // 例 [".edu.tw"]；空陣列 = 不限
  // 數字（number）
  min?: number; max?: number;
  // 同意條款（agreement）
  agreementText?: string;
}
```

| 型別 | 前端驗證 | 後端必驗（前端可被繞過）|
|---|---|---|
| `file` | 副檔名 ∈ `accept`、大小 ≤ `maxFileSize`、數量 ≤ `maxFiles` | 同左 + 病毒/類型掃描 |
| `email` | 格式 + 網域 ∈ `allowedDomains` | 同左 |
| `number` | `min ≤ v ≤ max` | 同左 |
| `select`/`radio`/`checkbox` | 值 ∈ `options`（或 `allowOther`）| 同左 |
| 任意 `required` | 非空 | 非空 |

---

## 14. API / Cloud Functions 介面（建議）

審核與金流一律走後端（Cloud Functions 或 API route），前端**只呼叫、不直接改 `status`**，避免被繞過。

```ts
// 主辦方審核（後端需驗 caller 是該 activity 的 admining 成員）
approveRegistration(input: { registrationId: string }): Promise<{ ok: true }>
//   pending → approved；寄繳費通知。非 pending 時回 409 NOT_PENDING
rejectRegistration(input: { registrationId: string; reason?: string }): Promise<{ ok: true }>
//   pending → rejected；釋放 sold；通知報名者

// 報名者繳費（沿用既有 components/Payments/Payments.tsx）
createPaymentSession(input: { registrationId: string }): Promise<{ paymentUrl: string }>
//   金額取自 registration.amount；僅允許 status==='approved'

// 付款回調（平台金流 → 後端；前端不可呼叫）
onPaymentSucceeded(webhook): // approved → paid；寫 paidAt / paymentId；寄收據

refundRegistration(input: { registrationId: string }): Promise<{ ok: true }>
//   依退款政策；paid → refunded；釋放 sold

// 報名送出（見 §5，務必用 transaction）
submitRegistration(input: { activityId; ticketId; qty; answers }): Promise<{ registrationId }>
```

**錯誤碼**：`TICKET_NOT_ON_SALE`、`SOLD_OUT`（送出時）、`NOT_PENDING`（重複審核）、`NOT_APPROVED`（未通過就想繳費）、`FORBIDDEN`（非該活動主辦方）、`VALIDATION_FAILED`（答案不符 formSchema）。

---

## 15. 通知事件（Email + 站內）

| 事件 | 對象 | 管道 | 內容重點 |
|---|---|---|---|
| 新報名待審 | 主辦方 | 站內（可選 Email）| 「X 報名了〈活動〉」+ 前往審核連結 |
| 審核通過・待繳費 | 報名者 | **Email + 站內** | 你已通過，點此於實習通繳費（金額 / 期限）|
| 審核未通過 | 報名者 | Email + 站內 | 結果說明（含 `rejectReason`）|
| 繳費完成 | 報名者 | Email | 收據 / 報名確認 |
| 繳費完成 | 主辦方 | 站內 | 「X 已完成繳費」（後臺自動轉「已付款」）|
| 退款完成 | 報名者 | Email | 退款明細 |

實作建議集中在 §14 各狀態轉換的後端動作裡發送，避免散落多處。

---

## 16. Firestore 安全規則（草稿）

關鍵原則：**`sold` / `status` / `paidAt` 全部只由後端寫，前端唯讀**；報名者只能建立自己的 `pending` 報名。

```
match /activities/{aid} {
  allow read: if true;                                   // 公開活動頁
  allow write: if isActivityAdmin(aid);                  // 僅該官方帳號成員
  match /tickets/{tid} {
    allow read: if true;
    allow write: if false;                               // sold 只由後端 transaction 改
  }
}
match /registrations/{rid} {
  allow create: if request.auth.uid == request.resource.data.userUid
                && request.resource.data.status == 'pending';  // 報名者只能建 pending
  allow read:   if isOwner(rid) || isActivityAdmin(resource.data.activityId);
  allow update, delete: if false;   // status 轉換一律走 Cloud Functions
}

function isActivityAdmin(aid) {
  return get(/databases/$(db)/documents/activities/$(aid)).data.companyId
         == get(/databases/$(db)/documents/users/$(request.auth.uid)).data.admining;
}
```

---

## 17. 話題牆（NeedsWall）整合

話題牆＝正式站既有的 **NeedsWall**（`data/needs-wall-live.js`、`pages/[lang]/dashboard/needs-wall`），不是新做的。這次要做的是**把活動與創作者接上去**。

**現況（已有，沿用）：**

```ts
// NeedsWall 話題（data/needs-wall-live.js）
interface NeedsWallTopic {
  id: string; title: string; summary: string;
  forumId: string;        // 行業（24 種，見 lib/needs-wall-forum-ids.ts：finance/tech/...）
  category: string; tags: string[];
  poll?: { question: string; options: {id;label;votes}[] };
  branches: { id; label; comments: {...}[] }[];  // 討論支線
  createdBy: string; replies: number; views: number;
}
// 既有函式：createNeedsWallTopic() / subscribeNeedsWallTopics({forumId}) / voteNeedsWallTopicPoll()
// 論壇 ChatRoom（data/chat.ts）：tags[{targetType:'company'|'topic'|'user', targetId}], parentId/depth
// Post / ChatMessage 已會顯示 senderBadges（verified-creator 標章已串好）
```

**這次要串的（正式站還沒有）：**

| # | 串接 | 機制 | 欄位 / 檔案 |
|---|---|---|---|
| 1 | **活動 → 話題牆** | 活動 `approvalStatus==='approved'` 上架時，依活動行業在對應 `forumId` 的話題牆**自動建立 / 連結一條討論支線**；活動詳情頁顯示「社群討論」連到該話題 | 新增 `activity.needsWallTopicId?`；呼叫既有 `createNeedsWallTopic()` |
| 2 | **活動 → 論壇討論區** | 付費 / `internx_form` 活動可開**專屬討論區**，活動頁「加入活動討論」 | 新增 `activity.chatRoomId?`；`ChatRoom.create({tags:[{targetType:'topic',targetId:activityId}]})` |
| 3 | **創作者 → 話題牆** | 認證創作者（`badges ⊇ verified-creator` 且 `verifiedRolePitch.expertiseForumIds` 含該話題 `forumId`）→ 話題頁顯示「行業認證專家」卡，連到創作者主頁 | **沿用**既有 badge + `expertiseForumIds`，**無新欄位** |
| 4 | **話題牆 → 活動建議**（選配）| 高票 `poll` / 高熱度話題 → 建議主辦方開相關講座 | 讀 `voteNeedsWallTopicPoll` 結果，產生建議 |

**資料流（活動 ↔ 話題牆）：**

```
主辦方上架活動 (approved)
   └─▶ 後端 hook：依 activity.activityType + 行業 → forumId
        └─▶ createNeedsWallTopic({ forumId, title:活動名, tags, createdBy })
             └─▶ 回寫 activity.needsWallTopicId
報名者看活動頁 ──▶「社群討論」區塊 ──▶ /dashboard/needs-wall/{needsWallTopicId}
                                          └─▶ 話題頁底部：行業認證專家（expertiseForumIds 命中）
```

> 重點：話題牆、論壇、verified-creator 標章顯示**都已存在**；新增的只有「活動 ↔ 話題」的關聯欄位（`needsWallTopicId` / `chatRoomId`）與上架時的建立 hook。創作者在話題牆的曝光是純查詢（badge + expertiseForumIds），不需新資料。

---

## 18. 本機預覽 / 部署

```bash
# mockup 本機預覽（零依賴）
node server.js   # http://localhost:4178
```

mockup 以 GitHub Pages 部署（main 分支 / 根目錄）。這份 repo 與 internx.me 完全分離，可當作 PR 描述與設計依據附在工程任務上。
