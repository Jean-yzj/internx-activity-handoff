# 創作者專區｜工程交接文件（詳細版）

> InternX 實習通 — 創作者專區（Creator Zone）前端 Demo 與後端串接規格
> 對象：接手實作的前端 / 後端工程師
> 版本：v3（2026-06）｜新增 §3.0 註冊兩案、§10 個人頁編輯、§11 檢舉機制、§12 追蹤/通知、整體架構圖
> 本文既有程式碼片段均**逐字摘自** `internx-me/frontend` 並標註 `檔案:行號`；標「待補」者為建議新增（彙整於 §19）
> 配套 Demo：本 repo `site/`（純前端、假資料、無後端）｜線上：https://internx-creator-zone.zeabur.app

---

## 0. TL;DR（先看這段）

創作者專區**幾乎不需要新發明任何系統**。平台 `internx-me/frontend` 已具備下列全部基礎，工作集中在「把既有系統接起來」：

| 創作者需求 | 既有可重用的系統 | 主要檔案 |
|---|---|---|
| 創作者專屬標籤 | `verified-creator` 標章（金色膠囊、quill-pen 圖示、`認證創作者`）+ `VerifiedRolePitchModal` | `components/Badge/ProfileBadge.tsx`、`lib/config.js` |
| 註冊選身分 + 送審 | `verifiedRoleApplications` 申請集合 + 管理員審核函式 | `data/verified-role-application.ts` |
| 撰寫部落格 | `BlogPost` 模型 + `BlockEditor` 編輯器 | `data/blog.ts`、`components/Blog/*` |
| 顯示專長 | `RealProfile.currentSkills`（分類）+ `SkillGroup` | `components/Profile/Profile.tsx` |
| LinkedIn / IG | `socialLinks` + `SocialLinkChip` + `SOCIAL_PLATFORMS` | `components/Chip/SocialLinkChip.tsx`、`lib/config.js`、`lib/util.js` |
| 主辦活動 / 活動紀錄 | `Activity`（`createdBy`）+ `Registration`（`userUid`）| `data/activity.ts`、`data/registration.ts` |
| 論壇 / 心得 / 人脈 顯示標籤 | `MergedSenderBadges` / `MergedSenderAvatar` / `PostBottom` | `components/Badge/*`、`components/Post/*` |
| 個人頁編輯（§10）| `ProfileEditPopup` / `SkillsEditPopup` / `LinksEditPopup` + `RealProfile.save()` | `components/Profile/*` |
| 檢舉創作者 / 文章（§11）| 沿用 admin 審核佇列模式；`reports` 集合與 `/admin/reports` **待補** | `data/report.ts`（待補） |
| 追蹤 / 通知（§12）| `Connection`（雙向）+ `addSideNotification`；單向 follow 與發文扇出 **待補** | `data/connection.ts` |

**三件主要工作：**
1. **註冊**：創作者**不是獨立註冊線**。建議「一般註冊 → 事後於 `/dashboard/verified-role-apply` 申請」（方案 A，現況）；或在 `onboarding.jsx` 的 `steps` 插入「身分選擇」步驟（方案 B，Demo 示範）。兩者都接到既有 `submitVerifiedRoleApplication()`（§3）。
2. **創作者主頁**：在 `Profile.tsx` 用既有的 `activeSectionTab` 機制新增 3 個分頁（部落格 / 主辦活動 / 活動紀錄），資料分別以 `userId` / `createdBy` / `userUid` 撈取。
3. **發佈權**：把目前 admin-only 的部落格發佈權，放寬給帶有 `verified-creator` 標章的使用者（一行條件即可）。

其餘（專長、社群連結、論壇/心得/人脈 標章、**個人頁編輯**）都是「把既有元件接上資料」；**檢舉、單向追蹤、發文通知扇出**為少數需新增的後端（§11／§12／§19）。

> 標示「**待補**」的項目代表現有程式碼尚無對應方法或欄位，需要新增；本文第 19 節彙整所有缺口。

---

## 1. 名詞與架構總覽

### 1.1 角色與身分
- **使用者身分（`users.userRole`，待補欄位）**：`student | professional | creator`，在 onboarding 選擇。僅用於分析與功能 gating。
- **標章（`profiles.badges`）**：真正決定「是否為認證創作者」的，是 `badges` 陣列是否含 `verified-creator`。由後端在審核通過時寫入。

### 1.2 資料流（申請 → 審核 → 標章 → 呈現）

> **整體架構圖**：見 [`site/img/architecture.svg`](img/architecture.svg)（線上 handoff 頁頂部亦內嵌）。圖中以**金色虛線框**標示「待補」節點，實線為既有系統。

```
使用者填認證表單
   │  submitVerifiedRoleApplication(db, uid, input)
   ▼
verifiedRoleApplications/{id}  (status: "pending")
verifiedRoleApplicationPrivate/{id}  (evidenceLink / evidenceFiles，僅管理員可讀)
   │  管理員於 /admin/verified-role-applications 審核
   ▼  approveVerifiedRoleApplication(db, adminUid, id)
grantVerifiedBadgeToUser(db, uid, "verified-creator", { verifiedRolePitch })
   ├─ profiles/{uid}.badges += "verified-creator"
   ├─ profiles/{uid}.verifiedRolePitch = { applicationType, organizationText, experienceText }
   └─ profiles/{uid}/subprofiles/realProfile.badges += "verified-creator"
   ▼
全站呈現：
   ProfileBadge（個人頁側欄）→ 點擊 → VerifiedRolePitchModal
   MergedSenderBadges（論壇訊息 / 心得貼文作者列）
   部落格 byline（待補：補上 MergedSenderBadges）
```

### 1.3 設計系統
Demo 直接沿用 `page-styles/globals.css` 的設計 token，無新色票。實作時請**直接用現有 CSS module**，不要照抄 Demo 攤平後的 class 名稱。

| Token | 值 | 用途 |
|---|---|---|
| `--theme-color` | `#0182fd` | 主色 |
| `--theme-color-dark` | `#1861a8` | hover |
| `--theme-color-black` | `#004aad` | 標題深色 |
| `--theme-white` | `#deefff` | 標籤淺底 |
| `--complementary-color` | `#e2a200` | 金色強調 |
| `--border-radius` | `10px` | 全站圓角 |
| `--top-bar-height` | `64px` | 導覽列高度 |
| 字體 | `Poppins` + `Noto Sans TC` | — |
| 圖示 | Remix Icon（`ri-*`） | — |

> **設計小註**：真實 `SkillGroup` 用的是 `<Chip type="default">`（偏靛藍）。本 Demo 把專長／社群標籤改成較淺的品牌天藍色填色膠囊，純為視覺一致；正式實作可沿用既有 `Chip`，或採用 Demo 的淺藍版本，由設計決定。

---

## 2. 資料模型完整定義（逐字）

### 2.1 認證申請（`data/verified-role-application.ts`）
```typescript
// 25-37
export type VerifiedRoleApplication = {
  id: string;
  userId: string;
  applicationType: VerifiedRoleApplicationType;   // 22-23
  organizationText: string;   // max 300
  experienceText: string;     // max 4000
  status: VerifiedRoleApplicationStatus;
  createdAt: { seconds: number; nanoseconds: number } | null;
  reviewedAt?: { seconds: number; nanoseconds: number } | null;
  reviewedBy?: string;        // admin uid
  reviewNote?: string;        // 駁回理由，max 500
  expertiseForumIds?: string[];
};
export type VerifiedRoleApplicationType = "verified-creator" | "industry-expert" | "collaboration-partner";
export type VerifiedRoleApplicationStatus = "pending" | "approved" | "rejected";

// 39-46  —— 證明（管理員限定，公開申請文件不含此資料）
export type VerifiedRoleApplicationPrivate = {
  applicationId: string;
  userId: string;
  evidenceLink?: string;      // max 1000
  evidenceFiles?: string[];   // max 5
  createdAt?: ...; updatedAt?: ...;
};
```

### 2.2 個人檔案標章（`data/profile.ts`）
```typescript
// 6-14
export type BadgeType =
  | "admin" | "kol" | "early-access" | "business" | "school-org"
  | "verified-creator" | "industry-expert" | "collaboration-partner";

// 17-21  —— 審核通過後寫入 profiles.verifiedRolePitch
export type VerifiedRolePitch = {
  applicationType: "verified-creator" | "industry-expert" | "collaboration-partner";
  organizationText: string;
  experienceText: string;
};
// profiles 文件含：badges: BadgeType[]、verifiedRolePitch?: VerifiedRolePitch
// 「專長」「社群連結」存在 subprofiles/realProfile：currentSkills[]、socialLinks[]
```

### 2.3 部落格（`data/blog.ts:8-42`）
```typescript
export interface BlogPostData {
  id: string; title: string; content: string;  // content 為 Markdown
  excerpt: string; category: BlogPostCategory; slug: string;
  status: BlogPostStatus; publishedAt?: Date;
  authorId: string; authorName: string; authorAvatar?: string;   // ← 連回創作者
  viewCount: number; likeCount: number; commentCount: number;
  userLikes?: Set<string>; attachments: AttachmentDataForModels[];
  createdAt: Date; updatedAt: Date;
}
// 5-6
type BlogPostStatus = 'draft' | 'published' | 'archived';
type BlogPostCategory = '實習心得' | '職涯規劃' | '面試技巧' | '職場文化' | '技能提升' | '其他';
```

### 2.4 活動（`data/activity.ts:174-261`，節錄關鍵欄位）
```typescript
export interface ActivityData {
  id: string; title: string; description: string;
  activityType: ActivityType; startDateTime: Date; endDateTime: Date;
  venueType: VenueType; venueRegion?: '北部'|'中部'|'南部'|'東部';
  feeType: FeeType; feeAmount?: number; registrationType: RegistrationType;
  approvalStatus: ActivityApprovalStatus;     // pending → approved/rejected
  createdBy: string;   // ← 主辦者 userId（活動紀錄／主辦活動的查詢鍵）
  companyId: string;
  viewCount: number; buttonClickCount: number;
  // 活動後回顧（活動結束才填）
  showcaseImageUrl?: string; showcaseHeadline?: string;
  showcaseFeedbackSummary?: string; showcaseAverageRating?: number; showcaseFeedbackCount?: number;
  pendingChanges?: Partial<ActivityData> | null;   // 已核准活動的待審修改
}
```

### 2.5 報名（`data/registration.ts:6-40`，節錄）
```typescript
export interface RegistrationData {
  id: string; createdAt: Date; updatedAt: Date;
  legalName: string; email: string; phone: string;
  activityId: string;   // ← 參加的活動
  userUid: string;      // ← 參加者（活動紀錄的查詢鍵）
  // 其餘為各類活動報名表單欄位（諮詢服務、創業小聚專用欄位等）
}
```

---

## 3. 功能一：註冊與身份識別

### 3.0 先回答：「創作者是走另一條註冊流程嗎？」
**不是。** 創作者沒有獨立的註冊入口——所有人都用同一個註冊／onboarding，差別只在「**何時**」取得 `verified-creator` 標章。有兩種接法，兩者**共用同一張認證表單與審核機制**（§3.4／§3.5）：

| | 方案 A — 事後申請（**平台現況・建議**）| 方案 B — 註冊時選身分（**Demo 示範**）|
|---|---|---|
| 流程 | 一般註冊 → 完成 onboarding → 正常使用 → 想當創作者時再申請 | onboarding 中插入「選擇身分」一步，選創作者即送審 |
| 申請入口 | 既有路由 `/[lang]/dashboard/verified-role-apply` | onboarding step 內嵌認證表單 |
| 優點 | 註冊零阻力、不擋一般使用者；改動最小 | 創作者意圖明確、引導完整 |
| 代價 | 創作者需多一次主動申請 | 拉長註冊漏斗；需改 onboarding step 索引（§3.2）|

> **建議採方案 A**（現況已支援，幾乎免改 onboarding）。下面 §3.2 仍提供方案 B 的精確插入做法，因為 Demo `register.html` 示範的是方案 B 的選擇介面；兩案後端完全相同。

### 3.1 現有 onboarding 結構（`pages/[lang]/account/onboarding.jsx`）
```javascript
// 526
const [currentStep, setCurrentTab] = useState(0);
// 527-961  steps 陣列（index 0-5）
//   Step 0 介紹 / Step 1 社群守則 / Step 2 基本資料
//   Step 3 學生信箱（選填）/ Step 4 驗證碼 / Step 5 完成
// 步驟前進：setCurrentTab(currentStep + 1)（相對遞增）
// 跳過 email 驗證（125）：setCurrentTab(5)
```

### 3.2 插入「身分選擇」步驟（精確做法）
在 `steps` 陣列的 **Step 2（基本資料，~808 行）之後、Step 3 之前**插入一個新 step 物件：
```jsx
{
  name: "選擇您的身分",
  content: (
    <div>
      {/* 三選一：學生 / 專業人士 / 認證創作者（對應 Demo register.html 的 roleCard）*/}
      {/* 選「認證創作者」→ 展開認證表單 → submitVerifiedRoleApplication() → 設 users.userRole */}
    </div>
  ),
},
```
- 因為前進都用相對的 `setCurrentTab(currentStep + 1)`，**插入後所有現有步驟索引自動後移**，不需改其他前進邏輯。
- **唯一要改**：跳過按鈕（125 行）原本 `setCurrentTab(5)`（直接到完成），新增一步後完成頁變 index 6，請改成 `setCurrentTab(6)`。
- 新增 `users.userRole` 欄位（**待補**，§19）。

### 3.3 既有身分驗證可直接沿用（「填寫讓我們可以驗證的東西」）
學生信箱驗證流程已存在：
```javascript
// onboarding.jsx 128-139  寫入 users 文件
await updateDoc(userDoc, { studentEmail: email, studentEmailVerified: false });
// 141-179  寄驗證碼
fetch('/api/student-verification/send-email', {
  method: 'POST',
  headers: { Authorization: `Bearer ${idToken}` },
  body: JSON.stringify({ userUid: appStates.user.uid }),
});
// API：pages/api/student-verification/send-email.js
//   withApiSecurity(handler, { requireAuthentication: true, userLimitPerDay: 20, ipLimitPerDay: 80 })
//   代理到 Cloud Function（env STUDENT_VERIFICATION_CLOUD_FUNCTION_URL）
```
> 創作者認證與學生信箱驗證**互相獨立**，不互相阻擋。創作者額外填的是「認證表單」。

### 3.4 送出認證申請（逐字 API）
```typescript
// verified-role-application.ts:142
submitVerifiedRoleApplication(db, userId, {
  applicationType: "verified-creator",
  organizationText,           // 0-300，自動 sanitize
  experienceText,             // 0-4000
  evidenceLink?,              // 0-1000 → 寫入 private 集合
  evidenceFiles?,             // 最多 5 → 寫入 private 集合
  expertiseForumIds?,
}): Promise<void>
```
重點行為：
- **一人一筆 pending**（172-179）：已有 pending 申請會丟錯 `您已有一筆審核中的申請，請待審核完成後再送新申請。`
- 公開文件寫入 `verifiedRoleApplications`（不含 evidence）；evidence 另寫 `verifiedRoleApplicationPrivate`（僅管理員可讀）。

### 3.5 管理員審核（逐字 API，已存在）
```typescript
// 339  通過 → 授標章 + 寫 pitch + 更新狀態
approveVerifiedRoleApplication(db, adminUid, applicationId)
//   內部呼叫 grantVerifiedBadgeToUser(db, userId, "verified-creator", { verifiedRolePitch })
//   並更新 application：status="approved", reviewedAt, reviewedBy

// 103  授標章（寫三處）
grantVerifiedBadgeToUser(db, userId, badgeType, { verifiedRolePitch })
//   profiles/{uid}.badges += badgeType
//   profiles/{uid}.verifiedRolePitch = {...}
//   profiles/{uid}/subprofiles/realProfile.badges += badgeType

// 369  駁回
rejectVerifiedRoleApplication(db, adminUid, applicationId, note)  // status="rejected", reviewNote(0-500)
```
> 管理頁 `/[lang]/admin/verified-role-applications` 已存在，**不需改動**，連上即可。

### 3.6 前端待辦清單
- [ ] onboarding 新增身分選擇 step（重用 `Card`、`Input`、`TextArea`、`FileUpload`、`Chip`）。
- [ ] 選「創作者」時呼叫 `submitVerifiedRoleApplication()`，並寫 `users.userRole = "creator"`。
- [ ] 顯示「待審核中」：`<Chip type="pending">待審核中</Chip>`（Demo `register.html` Step 3）。
- [ ] （建議）通過/駁回各發一封 Email + 站內通知（`appStates.addSideNotification()`）。

> Demo 對應：`register.html`（3 步驟 stepper + 角色卡 + 認證表單 + 待審/通過狀態）。

---

## 4. 功能二：創作者專屬標籤

### 4.1 標章設定（`lib/config.js:1252-1258`）
```javascript
"verified-creator": {
  label: "認證創作者",
  description: "經平臺驗證的職涯內容創作者，分享內容品質高、有大量追蹤者。",
  icon: "quill-pen-line",
  color: "#7c3aed",
  pill: { emoji: "✍️", label: "認證創作者", border: "rgba(124, 58, 237, 0.35)" },
},
```
> **注意**：config 的 `color` 是紫色 `#7c3aed`，但 `verified-creator`/`industry-expert`/`collaboration-partner` 這三種「驗證角色」在 `ProfileBadge` 會套用 `profileBadgePillGold` 樣式（`ProfileBadge.module.css`），**實際渲染為金色膠囊**（border `#ffd700`、底 `#fffdf5`、字 `#1f2937`）。Demo 即用金色，與正式站一致。

### 4.2 各情境的標章元件
| 情境 | 元件 / 用法 |
|---|---|
| 個人頁側欄 | `<ProfileBadge badgeType="verified-creator" size="small" verifiedRolePitch={profileInstance?.verifiedRolePitch ?? null} resolvePitchUserId={targetUserId} />`（`Profile.tsx:828-841`） |
| 論壇訊息 / 貼文作者列 | `<MergedSenderBadges senderId={post.senderId} senderBadges={post.badges} show />` |
| 部落格作者署名 | 同上（**待補**，見 §5.3） |

`ProfileBadge` 內：`getVerifiedRolePillIconName("verified-creator") === "quill-pen-line"`；點膠囊開 `VerifiedRolePitchModal` 顯示 `organizationText` + `experienceText`。側欄標章來源：
```javascript
// Profile.tsx 514-522
const displayBadges = collectPublicBadgeTypes(profileInstance ?? null);
const sidebarBadges = displayBadges.filter(b => b !== "verified");  // 濾掉舊版字串
```

> Demo 對應：`CZ.badgePill()`（`render.js`）模擬 `ProfileBadge`；`CZ.showPitch()`（`app.js`）模擬 `VerifiedRolePitchModal`。

---

## 5. 功能三：部落格串接

### 5.1 開放發佈權給創作者（精確改法）
目前 `pages/[lang]/blog/create.tsx` 用 `appStates.userData?.admin` 擋三處（useEffect 23-29、handleSubmit 32、render 80）。改成：
```typescript
// BEFORE
if (!appStates.userData?.admin) { /* deny */ }
// AFTER
const canCreate = appStates.userData?.admin
  || (appStates.userData?.badges?.includes('verified-creator') ?? false);
if (!canCreate) { /* deny */ }
```
三處都改成 `canCreate`。Firestore 規則同步放寬（§15）。

### 5.2 撰寫與儲存（逐字 API）
```typescript
// blog.ts:230
BlogPost.create(db, blogData, authorId, authorName): Promise<string>
//   authorId = appStates.user.uid
//   authorName = appStates.userProfile?.nickname || "管理員"   // create.tsx 52-57
//   ⚠ authorAvatar 不會自動帶入，需自行放進 blogData（待補，§19）
// slug 由標題前端產生（BlogCreate.tsx 158-162，只保留 a-z0-9 與中日韓字）
// 標題唯一（blog.ts 196-216）；slug 不檢查唯一
```
編輯器直接用既有 `components/Blog/BlockEditor.tsx`（標題/粗體/清單/連結/引用/圖片，Markdown↔HTML）。

### 5.3 作者署名顯示標章（**待補**）
`BlogView.tsx:141-156` 目前只渲染頭像 + 名字 + 日期，**沒有標章**。建議補上：
```jsx
<Link href={`/${lang}/user/${post.authorId}`}>
  <MergedSenderAvatar senderId={post.authorId} embeddedAvatar={post.authorAvatar} show size={46} linkable />
  <span className={styles.authorName}>{post.authorName}</span>
  <MergedSenderBadges senderId={post.authorId} show />   {/* ← 新增 */}
</Link>
```

### 5.4 創作者主頁「部落格」分頁
```typescript
const posts = await BlogPost.fetchUserPosts(db, creatorId);   // blog.ts:473
const published = posts.filter(p => p.isPublished());
// 用 <BlogPostsGrid posts={published} /> 渲染
```

> Demo 對應：`blog.html`（列表+分類）、`blog-article.html`（文章+作者署名帶金標+按讚）、`blog-editor.html`（工具列+編輯/預覽+字數）。

---

## 6. 功能四：活動串接（主辦活動 + 活動紀錄）

| 分頁 | 資料來源（逐字） | 元件 |
|---|---|---|
| 主辦活動（過往辦過的活動）| `Activity.fetchUserActivities(db, creatorId)`（`activity.ts:676`，where `createdBy == creatorId`，依 `timestamp` desc）| `ActivityCard`，過去活動帶 `showcase*` 回顧 |
| 活動紀錄（參與）| 查 `registrations` where `userUid == creatorId` → 取 `activityId` 再 `Activity.load()`（**待補**：目前只有 `loadByUserAndActivity` 與 `getRegistrationsByActivityId`，缺 `getRegistrationsByUserUid`，需新增）| `ActivityCard` 唯讀 / 時間軸 |

既有相關頁：活動詳情 `/[lang]/activity/[activityId]`、主辦者後台 `/[lang]/professional/home`、成果展示 `/professional/activity-showcase`。

> Demo 對應：creator.html「主辦活動」（`CZ.activityCard`，含 showcase 回顧）、「活動紀錄」（時間軸，host/join 標記）。

---

## 7. 功能五：專長 + 社群整合（LinkedIn / IG）

### 7.1 專長（已原生支援）
```jsx
// Profile.tsx 1059-1111：依 currentSkills 的 category 分組
// 每組用 <SkillGroup title={category} skills={values} />（221-254）
// SkillGroup 內每個技能用 <Chip type="default">{extractSkillDisplayValue(skill)}</Chip>
```

### 7.2 LinkedIn / Instagram（已原生支援）
```jsx
// Profile.tsx 990-1000
{realProfile.socialLinks.map((link, i) => (
  <SocialLinkChip key={i} platform={link.platform} username={link.username} />
))}
```
`SocialLinkChip`（`components/Chip/SocialLinkChip.tsx`）只吃 `{ platform, username }`，網址由 util 產生：
```javascript
// lib/config.js 908-957  SOCIAL_PLATFORMS
linkedin:  { name: "LinkedIn",  iconName: "linkedin-line"  },
instagram: { name: "Instagram", iconName: "instagram-line" },
// lib/util.js 338-371  getSocialLinkUrl(platform, username)
//   linkedin  → https://linkedin.com/in/{username}
//   instagram → https://instagram.com/{username}
//   會自動去掉開頭的 @、可從完整網址抽出帳號
```

> Demo 對應：creator.html「關於我」（`CZ.socialChip`）、「專長」（`CZ.skillGroups`）。

---

## 8. 功能六：論壇 / 心得 / 人脈 串接

| 系統 | 創作者如何被串連 | 元件 / 路由 |
|---|---|---|
| 論壇 | 訊息作者列以 `senderId` 撈標章 | `ChatMessageItem` → `MergedSenderBadges` / `MergedSenderAvatar`；`/[lang]/dashboard/forum/[chatRoomId]` |
| 心得（featured）| `post.senderId === creatorUid` 的貼文集結到主頁；卡片署名 `由 {senderName} 發表於 {timestamp}`（`PostCard.tsx:219`）| `PostCard` / `PostBottom`；`/[lang]/dashboard/featured` |
| 人脈 | 創作者出現在推薦卡，帶標章 | `ConnectionCard` / `NetworkRecommendation`；`/[lang]/dashboard/connection` |

元件签名：
```typescript
// MergedSenderBadges.tsx 12-17
type Props = { senderId?: string; senderBadges?: BadgeType[]; show: boolean };
// MergedSenderAvatar.tsx 12-23
type Props = { senderId?; embeddedAvatar?: AvatarData|null; show: boolean;
               size?: number; style?; linkable?: boolean; className? };
// profile.ts 773-777：senderId 可能是 "{uid}" 或 "{uid}--{suffix}"
profileUserIdFromSenderId(senderId)  // 取 "--" 前的 uid
```
**統一導向規則**：所有作者名/頭像點擊一律導向 `/[lang]/user/[uid]`。

---

## 9. 創作者主頁改造（`Profile.tsx`）

主頁 = 既有兩欄式版面（側欄 300px + 主內容分頁）。新增分頁沿用既有 `activeSectionTab` 機制：

```jsx
// 281  狀態（更新註解即可）
const [activeSectionTab, setActiveSectionTab] = useState(0);
// 0=關於我 1=技能專長 2=個人評價 3=部落格 4=主辦活動 5=活動紀錄

// 分頁按鈕（944-966 之後，複製同樣 pattern）
<button type="button"
  className={`${styles.sectionTab} ${activeSectionTab === 3 ? styles.sectionTabActive : ''}`}
  onClick={() => setActiveSectionTab(3)}>部落格</button>

// 分頁內容（967-1294 的 tabPanel 內，複製同樣 pattern）
{activeSectionTab === 3 && (
  <div className={styles.mainCard} data-section="blog">
    {/* BlogPost.fetchUserPosts → BlogPostsGrid */}
  </div>
)}
```
依此再加「主辦活動（4）」「活動紀錄（5）」。所有切換沿用 `setActiveSectionTab`，CSS 沿用 `styles.sectionTab / mainCard`。

> Demo 對應：`creator.html`（完整 6 分頁，含 RWD：手機版分頁列水平捲動）。

---

## 10. 功能七：個人頁面編輯（創作者如何編輯自己的主頁）

### 10.1 編輯入口與權限（forSelf）
創作者主頁以「**是否為本人**」決定 UI：當 `appStates.user?.uid === profileId`（既有 `Profile.tsx` 的 `isOwnProfile` 判斷）時，側欄顯示「**編輯主頁**」+「預覽訪客視角」；否則顯示訪客操作（追蹤／私訊／更多）。**不需新做權限系統**，沿用既有判斷即可。

### 10.2 直接重用既有編輯彈窗（不必重寫）
平台個人頁編輯元件已存在，創作者主頁的編輯沿用同一批彈窗：

| 編輯區塊 | 既有元件 | 寫入位置 |
|---|---|---|
| 基本資料（顯示名稱／headline／學校／自介） | `ProfileEditPopup`（`components/Profile/*`） | `profiles.{nickname,...}` + `subprofiles/realProfile` |
| 專長（分類 + 技能） | `SkillsEditPopup` | `subprofiles/realProfile.currentSkills[]` |
| 社群連結（LinkedIn／IG／個人網站） | `LinksEditPopup` | `subprofiles/realProfile.socialLinks[]` |

儲存統一走既有 `RealProfile.save()`／`profile.save()`：**同時寫 `profiles` 與 `subprofiles/realProfile` 兩份文件**（與標章授予寫入的是同一份 realProfile，資料一致）。技能值用 `extractSkillDisplayValue()` 解析顯示；社群只存 `{platform, username}`，網址由 `getSocialLinkUrl()` 即時產生（§7.2）。

### 10.3 認證資訊為唯讀（重要安全點）
「所在產業／經歷」(`verifiedRolePitch`) 由審核流程寫入，**創作者不可自行編輯**——否則認證內容會被竄改，金標就失去意義。編輯彈窗中此區顯示為鎖定唯讀，並提示「要更新請重新送認證申請」。後端由 §15 的 Firestore 規則擋住使用者改 `badges` / `verifiedRolePitch`（雙保險：UI 唯讀 + 規則禁寫）。

> Demo 對應：creator.html「編輯我的頁面」彈窗（4 分頁：基本資料／專長／社群連結／認證資訊）。前三頁可即時編輯（新增/刪除技能、增刪社群連結），第 4 頁「認證資訊」為金色鎖定卡，明示 `profiles.verifiedRolePitch` 僅後端可寫。側欄另有「預覽訪客視角」(`?as=visitor`) 切換，方便創作者確認對外呈現。

---

## 11. 功能八：檢舉機制（檢舉創作者 / 檢舉文章）

> **誠實標註**：平台貼文（論壇／心得）已有檢舉入口與管理員審核佇列（如 `/admin/verified-role-applications` 即同款 admin queue 模式）。但針對「**創作者個人頁**」與「**部落格文章**」的檢舉**目前為待補**（§19），以下為建議實作；資料模型與 admin 頁需新增。

### 11.1 建議資料模型（新增 `reports` 集合）
```typescript
export type ReportTargetType = "profile" | "blog" | "post" | "activity";
export type ReportReason =
  | "impersonation"      // 冒用身分／假冒他人（profile）
  | "misinformation"     // 不實資訊
  | "harassment"         // 騷擾或不當內容
  | "spam"               // 廣告／垃圾訊息
  | "copyright"          // 侵犯著作權（blog）
  | "inappropriate"      // 不當或冒犯內容（blog）
  | "other";
export interface ReportData {
  id: string;
  targetType: ReportTargetType;
  targetId: string;            // 被檢舉的 profileId / blogId
  reporterUid?: string;        // 檢舉人（允許匿名）
  reporterRole?: "general" | "acquaintance" | "influenced";  // 您的身分
  reason: ReportReason;
  description?: string;        // 補充說明，max 1000
  contactEmail?: string;       // 選填，回覆審核結果用
  processed: boolean;          // 預設 false → 管理員處理後設 true
  createdAt: Date; reviewedAt?: Date; reviewedBy?: string;
  action?: "none" | "warned" | "content-removed" | "badge-revoked" | "banned";
}
```

### 11.2 檢舉流程（前端 → 後端 → 管理 → 處置）
```
訪客點「檢舉這位創作者 / 檢舉文章」
  → 彈窗：選原因（依 profile/blog 切換選項）+ 您的身分 + 補充說明 +（選填）聯絡 Email
  → createReport({ targetType, targetId, reason, reporterRole, description })   // 待補
  → 寫入 reports/{id}（processed:false）
  → 前端提示「檢舉已送出，我們會盡快審核」
  → 管理員於 /admin/reports（待補頁）逐筆處理 → 設 processed:true + action
  → 嚴重者處置：
       下架文章 → BlogPost.updateStatus(db, id, 'archived')        // blog.ts:954（已存在）
       撤銷標章 → revokeVerifiedBadgeFromUser(...)                  // 待補（§19）
```

### 11.3 原因選項（前端依被檢舉對象切換）
| 對象 | 提供的原因 |
|---|---|
| 創作者個人頁 (`profile`) | 冒用身分／假冒他人、個人資料含不實資訊、騷擾或不當內容、廣告或垃圾訊息、其他 |
| 部落格文章 (`blog`) | 文章含不實資訊、不當或冒犯內容、廣告或垃圾訊息、侵犯著作權、其他 |

### 11.4 與既有審核機制對稱
「撤標章」建議新增 `revokeVerifiedBadgeFromUser`，與既有 `grantVerifiedBadgeToUser`（§3.5）對稱（移除 `profiles.badges` 的 `verified-creator` + 清 `verifiedRolePitch`）。「下架文章」直接用既有 `BlogPost.updateStatus(... 'archived')`，**不需新做**。

> Demo 對應：creator.html 訪客側欄「更多 → 檢舉這位創作者 / 封鎖」、blog-article.html「檢舉文章」。兩者共用 `CZ.reportModal(kind, name)`，`kind` 為 `profile`/`blog` 時切換原因清單；送出後 toast 提示對應 `reports` 集合 `processed:false`。

---

## 12. 功能九：追蹤與通知

### 12.1 追蹤（單向 Follow）≠ 人脈（雙向 Connection）
平台既有 `Connection`（人脈，`data/connection.ts`）是**雙向**關係（需互相同意）。創作者「追蹤」語意是**單向**關注（不需對方同意），兩者不同：
- 直接沿用 `Connection` 不完全符合（它是雙向）。建議**新增單向 follow 邊**（`follows/{followerUid}_{creatorUid}` 或在 realProfile 存 `followerUids[]`/`followingUids[]`），§19 待補。
- 追蹤數（Demo 顯示 `1,284`）對應 `followerCount`（待補欄位，或即時 aggregate count）。

### 12.2 通知（Notification）
平台已有站內通知能力：`appStates.addSideNotification(...)`（即時側邊提示，已存在）。持久化的 `Notification` 文件模型待確認/補齊。創作者相關通知建議：

| 觸發 | 收件人 | 文案 |
|---|---|---|
| 認證通過／駁回 | 申請者 | 見 §16 通知文案 |
| 創作者發新文章 | 全部追蹤者 | `{creator} 發佈了新文章：{title}` |
| 被追蹤 | 創作者 | `{user} 開始追蹤你` |
| 檢舉處理完成 | 檢舉人（若留 uid/email） | `您檢舉的內容已處理` |

### 12.3 發文 → 通知扇出
創作者發佈文章（`BlogPost.create` + `status:published`）後，需對所有追蹤者扇出通知。**建議用 server-side hook**（Cloud Function `onBlogPublished`，待補）批次寫 `Notification`，避免前端逐筆寫造成大量 client 寫入。

> Demo 對應：creator.html 訪客「追蹤」按鈕（toggle「追蹤中 ↔ 已追蹤」+ 追蹤數即時 ±1）；blog-editor.html 發佈成功彈窗第 3 點「追蹤者的通知與動態」即示意此扇出。

---

## 13. 路由表

### 既有（直接重用）
```
/[lang]/user/[profileId]                 創作者主頁（擴充分頁）
/[lang]/blog                             部落格列表
/[lang]/blog/[slug]                      文章頁（byline 補標章）
/[lang]/blog/create                      撰寫（放寬給 verified-creator）
/[lang]/blog/manage                      管理
/[lang]/activity/[activityId]            活動詳情
/[lang]/professional/home                主辦者後台
/[lang]/professional/activity-showcase   活動成果展示
/[lang]/dashboard/forum/[chatRoomId]     論壇
/[lang]/dashboard/featured               心得
/[lang]/dashboard/connection             人脈
/[lang]/admin/verified-role-applications 審核後台
/[lang]/account/onboarding               註冊引導（加身分選擇 step）
/api/student-verification/send-email     寄學生信箱驗證碼
```
### 建議新增
```
/[lang]/creators            創作者專區首頁 + 探索   ← Demo index.html / directory.html
```
並在 `lib/config.js` 的 `TOP_BAR_TABS` / `BOTTOM_BAR_TABS` 視需要加入「創作者」入口（icon `quill-pen-line`）。

---

## 14. Demo 頁面 ↔ 真實實作 對照

| Demo 頁面 | 對應真實元件 / 路由 |
|---|---|
| `index.html` / `directory.html` | 新增 `/[lang]/creators` |
| `creator.html` | `/[lang]/user/[id]` + `Profile.tsx`（新增分頁） |
| `blog.html` / `blog-article.html` / `blog-editor.html` | `/[lang]/blog`、`/blog/[slug]`、`/blog/create` + `BlogPostsGrid` / `BlogView` / `BlockEditor` |
| `register.html`（方案 A/B 流程說明 + stepper）| `/[lang]/account/onboarding`（方案 B）或 `/dashboard/verified-role-apply`（方案 A）+ `submitVerifiedRoleApplication` |
| creator.html「編輯我的頁面」彈窗 | `ProfileEditPopup` / `SkillsEditPopup` / `LinksEditPopup` + `RealProfile.save()` |
| creator.html「檢舉創作者」、blog-article.html「檢舉文章」 | `createReport()` + `reports` 集合（待補，§11）|
| creator.html「追蹤」按鈕、blog-editor 發佈成功彈窗 | 單向 follow + 發文通知扇出（待補，§12）|
| blog-editor 發佈成功「三個出現位置」 | `authorId` 連動：`fetchUserPosts` / `/blog` 列表 / 追蹤者通知 |
| 金色標籤 | `ProfileBadge` + `VerifiedRolePitchModal` |

---

## 15. Firestore 安全規則

> **重要**：`internx-me/frontend` repo **沒有** `firestore.rules`，規則放在另一個 repo `internx-me/firebase-contents`。以下為**建議要加/確認**的規則（請在該 repo 設定）。

```
// verifiedRoleApplications：本人可建立 pending，狀態只能由 admin 改
match /verifiedRoleApplications/{id} {
  allow create: if request.auth.uid == request.resource.data.userId
                && request.resource.data.status == 'pending';
  allow read:   if request.auth.uid == resource.data.userId || isAdmin();
  allow update: if isAdmin();   // status / reviewNote
}
// 證明僅 admin 可讀
match /verifiedRoleApplicationPrivate/{id} {
  allow read: if isAdmin();
  allow create: if request.auth.uid == request.resource.data.userId;
}
// 標章與 pitch 只能後端（admin / Cloud Function）寫
match /profiles/{uid} {
  allow update: if request.auth.uid == uid
                && !request.resource.data.diff(resource.data).affectedKeys()
                       .hasAny(['badges','verifiedRolePitch']);   // 使用者不可自改
}
// 部落格：admin 或 verified-creator 可建立／改自己的
match /blogPosts/{id} {
  allow create: if (isAdmin() || hasBadge('verified-creator'))
                && request.resource.data.authorId == request.auth.uid;
  allow update: if isAdmin() || resource.data.authorId == request.auth.uid;
}
```

---

## 16. 通知文案（建議）
- 送出申請：`認證創作者申請已送出 — 我們將於 3–5 個工作天內審核。`
- 核准：`恭喜！您已成為認證創作者 — 已解鎖創作者主頁與部落格發佈。` → CTA `/[lang]/user/[uid]`
- 駁回：`認證創作者申請結果 — {reviewNote}。可於 30 天後重新申請。`

---

## 17. 實作順序與檢查清單

**Phase 1 — 身分與標章（後端大多已就緒）**
- [ ] `users` 加 `userRole` 欄位（§19）
- [ ] onboarding 插入身分選擇 step；跳過按鈕 `setCurrentTab(5)` → `setCurrentTab(6)`
- [ ] 串 `submitVerifiedRoleApplication()`；顯示「待審核中」
- [ ] 驗證審核 → `approveVerifiedRoleApplication` → 個人頁金標顯示

**Phase 2 — 創作者主頁**
- [ ] `Profile.tsx` 新增 部落格 / 主辦活動 / 活動紀錄 三分頁（§9）
- [ ] 部落格串 `BlogPost.fetchUserPosts`
- [ ] 主辦活動串 `Activity.fetchUserActivities`
- [ ] 活動紀錄：新增 `getRegistrationsByUserUid`（§19）後串接

**Phase 3 — 內容發佈與串接**
- [ ] `blog/create.tsx` 三處 admin 檢查改為 `canCreate`（§5.1）
- [ ] `BlogView.tsx` byline 補 `MergedSenderBadges`（§5.3）
- [ ] 確認論壇/心得/人脈 作者列標章（多為既有，驗證即可）

**Phase 4 — 個人頁編輯（多為既有元件）**
- [ ] 創作者主頁接 `ProfileEditPopup` / `SkillsEditPopup` / `LinksEditPopup`（§10）
- [ ] 確認認證資訊區唯讀（`verifiedRolePitch` 不可前端寫）

**Phase 5 — 檢舉與追蹤（需新增後端）**
- [ ] 新增 `reports` 集合 + `createReport()` + `/admin/reports` 處理頁（§11）
- [ ] 新增 `revokeVerifiedBadgeFromUser()`（檢舉處置／違規撤標章，§11）
- [ ] 單向 follow（`follows` 邊或 `followerUids[]`）+ `followerCount`（§12）
- [ ] 發文通知扇出 Cloud Function `onBlogPublished`（§12）

**Phase 6 — 專區入口**
- [ ] 新增 `/[lang]/creators` 首頁 + 探索頁
- [ ] `TOP_BAR_TABS` 加入創作者入口

**Phase 7 — 通知 / 分析 / 規則**
- [ ] 核准/駁回 Email + 站內通知
- [ ] `firebase-contents` 補/確認安全規則（§15）
- [ ] 埋分析事件（§20）

---

## 18. 元件 / 函式速查

| 用途 | 簽名 | 檔案:行 |
|---|---|---|
| 送認證申請 | `submitVerifiedRoleApplication(db, uid, input)` | verified-role-application.ts:142 |
| 核准 | `approveVerifiedRoleApplication(db, adminUid, id)` | :339 |
| 授標章 | `grantVerifiedBadgeToUser(db, uid, badge, {verifiedRolePitch})` | :103 |
| 駁回 | `rejectVerifiedRoleApplication(db, adminUid, id, note)` | :369 |
| 補抓 pitch | `loadApprovedVerifiedRolePitchForBadge(db, uid, badge)` | :58 |
| 建文章 | `BlogPost.create(db, blogData, authorId, authorName)` | blog.ts:230 |
| 抓某人文章 | `BlogPost.fetchUserPosts(db, userId)` | blog.ts:473 |
| 改狀態 | `BlogPost.updateStatus(db, id, status)` | blog.ts:954 |
| 抓主辦活動 | `Activity.fetchUserActivities(db, userId)` | activity.ts:676 |
| 抓某活動報名 | `Registration.getRegistrationsByActivityId(db, activityId)` | registration.ts:429 |
| 社群網址 | `getSocialLinkUrl(platform, username)` | util.js:338 |
| senderId→uid | `profileUserIdFromSenderId(senderId)` | profile.ts:773 |
| 存個人檔案 | `RealProfile.save()` / `profile.save()`（編輯主頁，§10）| `data/profile.ts` |

**待補函式（本文建議新增，無既有 file:line）：**

| 用途 | 建議簽名 | 對應節 |
|---|---|---|
| 以 userUid 撈報名 | `Registration.getRegistrationsByUserUid(db, userUid)` | §6 |
| 建立檢舉 | `createReport({ targetType, targetId, reason, ... })` | §11 |
| 撤銷標章 | `revokeVerifiedBadgeFromUser(db, adminUid, uid, badge)` | §11 |
| 追蹤 / 取消 | `followCreator(db, uid, creatorId)` / `unfollow(...)` | §12 |
| 發文通知扇出 | Cloud Function `onBlogPublished(blogPost)` | §12 |

---

## 19. 已知缺口 / 待補（重要）

1. **`users.userRole` 欄位**：目前 `users`（`data/user.ts`）沒有此欄位，需新增（`student | professional | creator`）。標章判定仍以 `profiles.badges` 為準，`userRole` 僅供分析/gating。
2. **`getRegistrationsByUserUid`**：`Registration` 目前只有 `loadByUserAndActivity` 與 `getRegistrationsByActivityId`，缺「以 userUid 撈某人所有報名」的方法，需新增才能做「活動紀錄」分頁。
3. **部落格 byline 標章**：`BlogView.tsx` 目前不顯示標章，需依 §5.3 補 `MergedSenderBadges`。
4. **`authorAvatar` 未自動帶入**：`BlogPost.create` 不會自動塞作者頭像，需在 `blogData` 顯式帶入，否則文章卡/署名無頭像。
5. **Firestore 規則不在本 repo**：在 `internx-me/firebase-contents`，依 §15 補/確認。
6. **slug 不檢查唯一**：只有標題唯一檢查；若擔心 slug 撞號，建立時可加後綴（如短 id）。
7. **檢舉（profile / blog）**：目前無對應集合。需新增 `reports` 集合、`createReport()`、`/admin/reports` 處理頁（§11）。貼文層級檢舉雖已有，但 profile/blog 為新建。
8. **撤標章 `revokeVerifiedBadgeFromUser`**：與 `grantVerifiedBadgeToUser` 對稱，供檢舉處置／違規時移除 `verified-creator` 標章 + 清 `verifiedRolePitch`，需新增（§11）。
9. **單向追蹤 Follow**：既有 `Connection` 為雙向人脈，單向「追蹤」需新增 follow 邊（`follows/{follower}_{creator}` 或 `followerUids[]`/`followingUids[]`）與 `followerCount`（§12）。
10. **發文通知扇出**：發佈文章後對追蹤者批次通知，建議用 Cloud Function `onBlogPublished` server-side 寫 `Notification`，避免前端逐筆寫（§12）。`Notification` 持久化模型亦需確認/補齊。

---

## 20. 測試清單（建議）

- [ ] 註冊選「創作者」→ 送出 → `verifiedRoleApplications` 出現 pending；重送被擋（一人一筆）。
- [ ] 管理員核准 → `profiles.badges` 含 `verified-creator`、`verifiedRolePitch` 寫入；個人頁金標出現、點開有 pitch。
- [ ] 駁回 → 顯示 `reviewNote`。
- [ ] verified-creator（非 admin）可進 `/blog/create` 發文；非創作者被導回。
- [ ] 文章 byline 顯示標章、點作者導向 `/[lang]/user/[uid]`。
- [ ] 創作者主頁：部落格/主辦活動/活動紀錄三分頁皆有資料且數字一致。
- [ ] 論壇/心得 的作者列出現金標。
- [ ] LinkedIn/IG chip 連到正確網址（`linkedin.com/in/...`、`instagram.com/...`）。
- [ ] 本人看自己主頁顯示「編輯主頁」；改基本資料/專長/社群後 `realProfile` 同步；認證資訊區唯讀無法改。
- [ ] 訪客檢舉創作者 / 文章 → `reports/{id}` 出現 `processed:false`；管理員處理後 `processed:true` + `action`。
- [ ] 追蹤創作者 → `followerCount` +1、出現在追蹤清單；取消追蹤 -1。
- [ ] 創作者發新文章 → 追蹤者收到通知（站內 + 可選 Email）。
- [ ] 手機版（≤390px）各頁無水平溢出，分頁列可水平捲動。

---

## 21. 分析事件（建議）
- `creator_role_selected`（onboarding 選身分）
- `creator_application_submitted` / `_approved` / `_rejected`（含 time-to-approval）
- `creator_blog_published`、`creator_profile_view`、`creator_followed`

---

_本文件描述「把既有系統接起來」的整合工程，而非從零開發。實作前請先讀 `frontend/data/README.md`（BaseModelController 架構）與 `frontend/CLAUDE.md`。所有 `檔案:行號` 以本文版本當下的 `internx-me/frontend` 為準，行號可能因後續改動而位移，請以符號名稱為準。_
