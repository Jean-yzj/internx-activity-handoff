# 工程時程規劃：新功能整併主平台

> 給 PM 與接手工程師的排程文件。範圍依據：`INTEGRATION.md`（活動票券／審核／金流／話題牆）、`spec.html` §14–§17（撥款結算＋社團／帳號選單／活動個人化／Academy 速查）、`CREATOR-HANDOFF.md`（創作者專區）、`ACADEMY-PRD.md`（職涯學院）。
> 版本：v1（2026-07-02）

---

## ★ 2026-07-25 優先序調整（以此為準）

本文以下的 Phase 0–6 與週次估工**內容仍然有效**（估工依據、驗收條件、風險都沒變），但**執行順序改了**。決策：活動相關的東西（含社團等組織型主辦）＋創作者主頁＋部落格全部拉到短期，目標是**這個暑假讓社團把招募資料放上來**；收費活動用的金流移到暑假後。免費招募活動先跑起來，金流不擋上架。

| 分期 | 內容 | 對應本文 Phase | 項數 |
|---|---|---|---|
| **短期（暑假衝刺）** | 開工前置（備份演練、feature flag）、票券模型與防超賣、活動編輯器與報名頁、報名審核與後台名單、**社團／組織型主辦**、**創作者主頁與部落格** | Phase 0（去掉金流前置）＋ 1＋2（去掉金流）＋ 3 的社團部分 ＋ 4 的創作者部分 | 37 |
| **中期（暑假後）** | 代收代付、撥款結算、發票與特店申請、活動個人化、話題牆與討論區、整合回歸＋資安＋上線 | Phase 2 的金流部分 ＋ 3 的撥款部分 ＋ 4 的個人化部分 ＋ 5 | 19 |
| **長期（另案）** | Academy 職涯課程平台 | Phase 6 | 8 |

搬動的三件事，理由記在這裡免得之後有人搬回去：

1. **社團（Club／ClubMember、多管理員、換屆）從 Phase 3 提到短期** —— 社團是暑假的主要用戶，不做完他們沒辦法以組織身分開活動。
2. **創作者主頁＋部落格（含檢舉、追蹤、通知扇出）從 Phase 4 提到短期** —— 社團與講者要有能對外展示的頁面，招募才有說服力。
3. **代收代付、撥款結算、發票、特店申請從 Phase 0／2／3 降到中期** —— 暑假先做免費活動。注意：**金流特店申請有 2–4 週外部審核**，之後決定要開放收費活動時，要在那一週就送件，不要等功能做完才送。

短期 37 項是原文 Phase 0–4 裡約 7 週（2 人）的量，暑假只剩約 5 週 —— 這是刻意壓縮的目標，不是重新估工。真的做不完時，優先保「建活動 → 收報名 → 審核」這條主動線，創作者／部落格的檢舉與追蹤可以最後補。

即時進度看 `/checklist`（同一份項目清單，分期由 `assets/checklist-items.json` 每組的 `stage` 決定）。

---

## 0. 結論：要預留多久

| 人力配置 | 核心整合（不含 Academy） | 含 Academy 課程平台 |
|---|---|---|
| 1 名全端 | 26–36 週（約 6–8 個月） | 39–52 週（約 9–12 個月） |
| **2 名（建議）** | **14–18 週（基準 16 週，約 4 個月）** | **24–26 週（約 6–7 個月）** |
| 3 名 | 10–13 週（約 3 個月） | 約 4.5–5 個月（Academy 可提前並行） |

**建議方案：2 名工程師 × 16 週完成核心整合，Academy 依 INTEGRATION §20.3 的建議「等活動金流穩定後」另案 8–10 週。**

理由：
- 金流、撥款、權限這類程式碼**必須有第二個人 code review**，1 人配置在代收代付上風險過高。
- 3 人在金流關鍵路徑（Phase 2–3）會互相等待，邊際效益有限；除非 Academy 要提前並行才值得加人。
- 估算已含測試、code review、staging 驗證、資料遷移演練、資安檢查與約 15–20% 緩衝。

---

## 1. 估算前提

1. 工程師**熟悉 `internx-me/frontend` 與 Firebase**（交接文件已標到檔案：行號，無摸索期）。若為新進或外包人員，**另加 2–3 週**熟悉期。
2. 交接文件即規格，不再有大幅 UI 需求變更；變更需求走變更管理、重估時程。
3. 不含**外部等待期**（金流特店申請 2–4 週、發票方案 1–3 週）——見 §6，第 0 週就要啟動。
4. 平台既有系統（活動本體、internx_form、發布審核、professional 後台、部落格 BlockEditor、話題牆、標章顯示）**沿用不重寫**（INTEGRATION §19 的原則）。

---

## 2. 範圍盤點與估工

| # | 範圍 | 內容摘要 | 依據 | 估工（人週） |
|---|---|---|---|---|
| A | 票券引擎＋表單＋報名頁 | Ticket 模型／ticketStatus／編輯器票券卡／@dnd-kit 拖曳／FormField 設定／attendee 三段式／防超賣 transaction／feeItems 遷移 | INTEGRATION §3–§5、§13 | 4–5.5 |
| B | 報名審核＋代收代付＋通知＋規則 | Registration 狀態機／approve、reject、pay webhook、refund 等 Cloud Functions／6 種通知事件／Firestore 規則 | INTEGRATION §6、§12、§14–§16 | 4.5–7 |
| C | 撥款結算＋社團 | Payout 模型／settleAndPayout（T+N）／撥款後台頁／銀行帳戶欄位／Club、ClubMember／多管理員角色權限／換屆移轉 | spec §14 | 5–6.5 |
| D | 創作者專區 | 主頁 3 分頁／blog 發佈權放寬／onboarding 入口 B／reports 檢舉／follow 追蹤＋發文扇出／creators 目錄 | CREATOR-HANDOFF | 4–6 |
| E | 話題牆串接 | 上架自動建話題（needsWallTopicId）／活動專屬討論區（chatRoomId）／行業認證專家卡 | INTEGRATION §17 | 1–1.5 |
| F | 活動個人化 | industryTags／preferredIndustries（onboarding）／領域篩選 chips／「綜合」排序＝推薦分數（標示原因）／追蹤主辦 | spec §16 | 1–1.5 |
| G | 帳號選單／導覽依角色 | 共用選單＋依旗標（badges／admining／adminingIsOwner／admin）條件展開；不得移除既有個人功能 | spec §15 | 0.5–1 |
| H | 整合回歸＋資安＋上線 | 三視角回歸／RWD／資安檢查／灰度上線／正式遷移 | — | 3–4 |
| | **核心小計** | | | **23–33 人週** |
| I | Academy 職涯學院 V1 | 15 頁／13+ collections／29 API／Mock 金流（Provider 抽象）／分潤撥款／Admin 後台 | ACADEMY-PRD、INTEGRATION §20 | 13–16（另案） |

---

## 3. 兩人分工建議

| | 工程師 A（偏後端） | 工程師 B（偏前端） |
|---|---|---|
| 主責 | 資料模型、Cloud Functions、金流串接、Firestore 規則、遷移腳本、結算撥款 | 編輯器、報名頁、後台 UI、創作者主頁、選單、個人化探索 |
| 互審 | 金流／權限／規則相關 PR **一律雙人 review** | 同左 |

---

## 4. 時程表（基準：2 人 × 16 週）

### Phase 0｜前置（開工前 1–2 週，可與 Phase 1 並行）

| 事項 | 說明 | 對應 |
|---|---|---|
| 金流商選型＋申請 | 綠界／藍新／TapPay 的「代收代付／平台拆帳」產品；**外部審核 2–4 週，最早啟動** | INTEGRATION §6 |
| 發票方案 | 代收代付下發票由誰開（平台？金流商加值中心？）——諮詢會計／法務 | §6 |
| 銀行帳戶資料保存 | 加密儲存、前端遮罩、僅後端讀取 | spec §14.1 |
| Staging＋備份演練 | Firestore 匯出／還原流程跑通，遷移前提 | — |
| Feature flag 機制 | 各 Phase 分批灰度上線的開關 | — |
| （若排 Academy）影片方案 | Cloud Storage＋CDN／Mux／Cloudflare Stream 選型 | ACADEMY-PRD |

### Phase 1｜票券引擎＋表單＋報名頁（週 1–3）——不碰錢

| 任務 | 負責 | 對應 |
|---|---|---|
| `data/ticket.ts`＋`ticketStatus()`＋`activity.tickets[]` | A | INTEGRATION §3 |
| 防超賣 transaction＋`submitRegistration`（錯誤碼 TICKET_NOT_ON_SALE／SOLD_OUT） | A | §5、§14 |
| feeItems→tickets **一次性遷移腳本＋staging 演練＋回滾方案** | A | §3.2 |
| 編輯器票券卡 UI＋驗證（起迄／數量）＋`agenda[]` 時段 | B | §4.2、§19#16 |
| FormBuilder 改 @dnd-kit＋欄位設定抽屜（檔案／選項／網域／數值） | B | §4.3、§13 |
| attendee 頁三段式＋依 formSchema 渲染＋票券狀態鎖定 | B | §4.4 |
| Firestore 規則：tickets 前端唯讀 | A | §16 |

**出場 Gate**：併發報名壓測不超賣；遷移演練成功且可回滾；INTEGRATION §9 驗收清單全過。
**可獨立上線**：是（免費／外部收款活動立即受益，先解「早鳥過期還能選、不能限量」）。

### Phase 2｜報名審核＋平台代收代付（週 4–7）

| 任務 | 負責 | 對應 |
|---|---|---|
| `Registration.status` 狀態機＋sold 佔位／釋放對稱（approve／reject／cancel／refund） | A | §12 |
| Cloud Functions：approve／reject／createPaymentSession／付款 webhook／refund（**冪等＋驗簽**） | A | §14 |
| 通知 6 事件（Email＋站內），集中在狀態轉換處發送 | A | §15 |
| 後台「報名名單」頁＋側欄新增項（PROFESSIONAL_SERVICES） | B | §11 |
| 繳費動線（沿用 `Payments.tsx`）＋各狀態畫面 | B | §6 |
| Firestore 規則：registrations 只能建自己的 pending；status／paidAt 僅後端寫 | A | §16 |

**出場 Gate**：沙盒金流 E2E（送出→通過→繳費→自動 paid→退款）；webhook 重放／亂序／偽造測試；規則模擬器全過；金額＝送出當下快照（票價後改不影響）。
**備註**：特店申請若未核下，全流程先在 staging 完成，正式環境以 flag 關閉等待。

### Phase 3｜撥款結算＋社團（週 8–10）

| 任務 | 負責 | 對應 |
|---|---|---|
| `data/payout.ts`＋`settleAndPayout()`（活動結束 T+N）＋每筆 payout 可回溯 orderIds | A | spec §14.1 |
| Club／ClubMember 模型＋`activity.ownerType/ownerId`＋五種角色權限 | A | spec §14.2 |
| 換屆移轉（只換 isOwner／term，歷史資料掛 clubId 不動；舊成員轉 alumni）＋審計 log | A | spec §14.2 |
| 後台「撥款結算」頁（總收款／手續費／待撥款／已撥款／已退款）＋銀行帳戶設定 | B | spec §14.1 |
| club 主頁＋club-register 四步＋成員管理（邀請／移轉） | B | spec §14.2 |
| 選單：adminingIsOwner 條件區塊（共同管理員／移轉擁有權） | B | spec §15 |

**出場 Gate**：結算對帳測試（gross − 平台抽成 − 金流手續費 = net，含退款情境）；權限矩陣測試（5 角色 × 各動作）；換屆後歷史活動／結算／追蹤者歸屬不變。

### Phase 4｜創作者＋個人化＋話題牆＋選單（週 11–14）

| 任務 | 負責 | 對應 |
|---|---|---|
| 創作者主頁 3 分頁（activeSectionTab）＋byline 標章＋`/creators` 目錄 | B | CREATOR-HANDOFF §9 |
| blog 發佈權放寬給 verified-creator（gating）＋BlockEditor 沿用 | B | INTEGRATION §10 |
| onboarding 入口 B（身分選擇，共用 `submitVerifiedRoleApplication()`） | A | §10.1 |
| reports 檢舉＋Admin 處置（警告／下架／撤章／停權）＋`revokeVerifiedBadgeFromUser` | A | CREATOR-HANDOFF §11 |
| follow 追蹤＋`onBlogPublished` 通知扇出（後端批次，不可前端逐筆寫） | A | CREATOR-HANDOFF §12 |
| 活動個人化：industryTags＋preferredIndustries＋領域篩選＋綜合排序（**標示推薦原因；只排序不隱藏**）＋追蹤主辦 | B | spec §16 |
| 話題牆：上架 hook 自動建話題＋活動討論區＋行業認證專家卡 | A | INTEGRATION §17 |
| 帳號選單全套條件展開（**不得移除里程碑／心得／收藏／小夥伴等既有項目**） | B | spec §15 |

**出場 Gate**：badges／verifiedRolePitch 僅後端可寫（規則＋UI 雙層）；一人一筆 pending 申請限制生效；檢舉→處置→通知全流程演練；推薦排序驗證「不隱藏任何活動」。

### Phase 5｜整合回歸＋資安＋上線（週 15–16）

| 任務 | 說明 |
|---|---|
| 全站回歸 | 三視角（學生／創作者／社團主辦）走完所有動線；RWD ≤390px 無溢出 |
| 資安檢查 | §8 清單逐項；規則 review；上傳檔案掃描；rate limit；PII 權限 |
| 灰度上線 | feature flags 逐批開；監控錯誤率／金流失敗率；回滾預案 |
| 正式遷移 | 維護窗口執行 feeItems→tickets；切換新編輯器 |

**出場 Gate**：上線後觀察 1 週無 P0／P1 事故。

---

## 5. Phase 6｜Academy 職涯學院（另案：2 人 × 8–10 週）

依 INTEGRATION §20.3：**等活動金流（§6＋spec §14.1）穩定後再排**，直接重用 Payment Provider 抽象、結算後台與 verified-creator 講師身分。

| 週次 | 內容 | 依據 |
|---|---|---|
| W1–2 | 資料層＋課程 CRUD＋五類標籤（Courses／Sections／Lessons／Tags 等 13+ collections） | PRD §11 |
| W3–4 | 課程探索／詳情／購買（Order→Payment→Enrollment→RevenueRecord；V1 Mock 金流） | PRD §8 |
| W5–6 | 教室播放器＋進度＋留言＋公告；我的課程 | PRD §5–§7 |
| W7–8 | 創作者後台（4 步開課精靈／收益）＋Admin（審核／退款／撥款／分潤三層設定） | PRD §9–§10 |
| W9–10 | 主平台入口（Navbar／職缺頁推薦課程／個人頁）＋回歸＋上線 | PRD §16–§17 |

**前置**：影片儲存／串流方案第 0 週選型；若 V1 直接收真錢（不用 Mock），需一併確認發票與退款政策。
**現在就要預留的**（做 Phase 2–3 時順手做，避免 Academy 重工）：Order／Payment／結算紀錄加 `itemType: 'activity' | 'course'`＋`itemId`；Payment Provider 先定 interface（INTEGRATION §20.1）。

---

## 6. 外部依賴與 Lead Time（第 0 週啟動）

| 依賴 | 等待期 | 卡誰 |
|---|---|---|
| 金流商特店／代收代付服務申請 | 2–4 週 | Phase 2 正式上線 |
| 發票開立方案（電子發票／加值中心） | 1–3 週 | Phase 2–3 |
| 代收代付法遵確認 | 1–2 週 | 建議直接採金流商的代收代付產品，法遵由金流商承擔 |
| 影片儲存／串流選型（Academy） | 1–2 週 | Phase 6 |

---

## 7. 資料完整性檢查清單（貫穿各 Phase）

- [ ] feeItems→tickets 遷移：staging 演練＋正式前備份＋回滾腳本
- [ ] 所有狀態轉換（registration.status／payout.status／sold）**只由 Cloud Functions 寫**，前端唯讀
- [ ] 報名送出走 Firestore transaction，後端重驗 `status==='live'` 且未超賣
- [ ] sold 佔位／釋放對稱：pending +qty；rejected／cancelled／refunded −qty（漏一邊就會鎖死名額）
- [ ] `registration.amount` 為送出當下快照，票價後改不影響已送出報名
- [ ] 付款 webhook 冪等（同 paymentId 重複回調只生效一次）
- [ ] badges／verifiedRolePitch 雙寫一致（profiles＋subprofiles/realProfile 同時寫）
- [ ] 每筆 payout 可回溯 orderIds，結算金額可對帳
- [ ] 換屆移轉：活動／追蹤者／結算永久掛 clubId，不因換人而轉移
- [ ] 金流資料模型預留 `itemType`／`itemId`（activity｜course），Academy 不重工

## 8. 資安檢查清單（貫穿各 Phase）

- [ ] Firestore 規則：`sold`／`status`／`paidAt`／`badges`／`verifiedRolePitch` 前端禁寫；registrations 只能建自己的 pending；規則模擬器測試納入 CI
- [ ] 後端重驗所有 formSchema 約束（檔案格式／大小／數量、Email 網域、數值範圍、options 白名單）——前端驗證可被繞過
- [ ] 上傳檔案：型別／大小後端再驗＋病毒掃描；認證證明檔（evidenceFiles）僅 Admin 可讀
- [ ] 金流 webhook：驗簽＋來源限制＋冪等；createPaymentSession 僅允許 `status==='approved'`
- [ ] 權限：`isActivityAdmin`／club 五角色矩陣／`admining OR verified-creator` 後台進入條件，每條後端都要驗（不能只靠 UI 隱藏）
- [ ] PII 最小化：報名 answers 含個資，主辦方僅能讀自己活動的報名；匯出功能留審計 log
- [ ] 銀行帳戶：加密儲存、前端遮罩、變更需重新驗證
- [ ] 報名／申請端點 rate limit，防灌單與垃圾申請（一人一筆 pending）
- [ ] 檢舉→處置（警告／下架／撤章／停權）流程可用，Admin 操作留 log

---

## 9. 主要風險與對策

| 風險 | 影響 | 對策 |
|---|---|---|
| 特店申請延遲 | Phase 2 正式上線延後 | 第 0 週啟動；開發照常在 staging 完成，flag 等待 |
| 代收代付法遵 | 金流上線受阻 | 用金流商代收代付產品；發票開立方先問清楚 |
| 併發超賣 | 資料錯亂、客訴 | transaction＋壓測列為 Phase 1 出場 Gate |
| webhook 重放／偽造 | 金流錯帳 | 驗簽＋冪等＋每日對帳 job |
| 換屆移轉 bug | 社團歷史資料歸屬錯亂 | 資料掛 clubId 不動；演練＋審計 log |
| 範圍蔓延（Academy 提前插隊） | 全部延期 | 依 §20.3 另案；核心期間只做 `itemType` 等預留 |
| 單人開發金流 | 無互審、出錯難察覺 | 至少 2 人；金流／權限 PR 雙人 review |

---

## 10. 日期對照（假設 2026-07-13 開工、2 人）

| 里程碑 | 日期 |
|---|---|
| Phase 0 前置＋特店申請送件 | 07-06 起 |
| Phase 1 票券引擎上線（staging） | ~07-31 |
| Phase 2 審核＋金流完成（沙盒全過） | ~08-28 |
| Phase 3 撥款＋社團完成 | ~09-18 |
| Phase 4 創作者＋個人化＋話題牆完成 | ~10-16 |
| **核心整合正式上線** | **~10-30** |
| Academy 另案開工（若排） | 11 月初 |
| Academy V1 完成 | 2026-12 底～2027-01 中（含年末假期緩衝） |
