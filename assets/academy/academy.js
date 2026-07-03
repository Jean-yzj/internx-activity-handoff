/* =====================================================================
   InternX Academy 職涯學院 — 資料層（6 頁共用）
   - localStorage 持久化：課程 / 訂單 / 付款 / Enrollment / 進度 / 留言 /
     公告 / 分潤 / 撥款 / 收藏 / 下載紀錄 / 平台設定
   - PaymentProvider 抽象層（PRD §8.2）：V1 = FakePaymentProvider，
     未來換 ECPay / NewebPay / Stripe / TapPay 只換 provider、流程不動
   - 對應 spec §17 / ACADEMY-PRD.md；欄位命名對齊 PRD §9 / §11
   ===================================================================== */
(function () {
  "use strict";
  const KEY = "ixa_db_v1";
  const SEED_V = 7; // 改 seed 結構時 +1，舊資料自動重建
  const now = () => Date.now();
  const DAY = 86400000;
  const ago = d => now() - d * DAY;
  const ahead = d => now() + d * DAY;

  /* ================= 標籤字典（PRD §3.3 五類標籤） ================= */
  const CAREERS = [
    { key: "pm",         label: "產品 PM",     icon: "ri-lightbulb-flash-line" },
    { key: "ba",         label: "商業分析",    icon: "ri-bar-chart-box-line" },
    { key: "marketing",  label: "行銷／企劃",  icon: "ri-megaphone-line" },
    { key: "finance",    label: "金融",        icon: "ri-bank-line" },
    { key: "consulting", label: "顧問",        icon: "ri-briefcase-4-line" },
    { key: "engineering",label: "軟體工程",    icon: "ri-code-s-slash-line" },
    { key: "uiux",       label: "UI/UX 設計",  icon: "ri-palette-line" },
    { key: "hr",         label: "人資 HR",     icon: "ri-team-line" },
    { key: "startup",    label: "創業",        icon: "ri-rocket-2-line" },
  ];
  const STAGES = [
    { key: "explore",      label: "還不知道方向" },
    { key: "first-resume", label: "準備第一份履歷" },
    { key: "applying",     label: "正在投實習" },
    { key: "interviewing", label: "準備面試" },
    { key: "offer",        label: "收到 Offer 後" },
  ];
  const GRADES = ["大一", "大二", "大三", "大四", "研究生", "轉職"];
  const OUTCOMES = [
    { key: "resume",    label: "可產出履歷",     icon: "ri-file-user-line" },
    { key: "portfolio", label: "可產出作品集",   icon: "ri-folder-chart-line" },
    { key: "interview", label: "可完成面試準備", icon: "ri-question-answer-line" },
    { key: "direction", label: "可建立職涯方向", icon: "ri-compass-3-line" },
  ];
  const careerOf  = k => CAREERS.find(c => c.key === k) || { key: k, label: k, icon: "ri-focus-line" };
  const stageOf   = k => STAGES.find(s => s.key === k) || { key: k, label: k };
  const outcomeOf = k => OUTCOMES.find(o => o.key === k) || { key: k, label: k, icon: "ri-check-line" };

  /* ================= 使用者（共用主平台帳號；PRD 整合 §5） ================= */
  const ME = "u-yz"; // demo 登入者：同一帳號 = student + creator + admin
  const USERS = {
    "u-yz":  { name: "林宥蓁", initial: "宥", color: "#0182fd" },
    "u-zw":  { name: "張哲瑋", initial: "哲", color: "#1861a8" },
    "u-sh":  { name: "黃詩涵", initial: "詩", color: "#e2a200" },
    "u-sy":  { name: "李思妤", initial: "思", color: "#db2777" },
    "u-by":  { name: "陳柏宇", initial: "柏", color: "#0f766e" },
    "u-kx":  { name: "許凱翔", initial: "凱", color: "#7a4ddb" },
  };

  /* ================= Seed 建構小工具 ================= */
  let _lid = 0;
  const L = (title, mins, opt) => Object.assign({ id: "l" + (++_lid), title, mins, preview: false, materials: [] }, opt || {});
  const S = (title, lessons) => ({ id: "s" + (++_lid), title, lessons });
  const M = (n, t) => ({ n, t });

  /* ================= 課程 seed（PRD §3.1 / §3.2 / §5.3 全欄位） ================= */
  function seedCourses() {
    _lid = 0;
    return [
      {
        id: "c-ba", status: "published", featured: true,
        title: "零基礎商業分析實習準備課",
        subtitle: "帶你完成一份可以放進履歷的分析專案，從 Excel、SQL 到把成果講成故事。",
        icon: "ri-bar-chart-box-line", color: "#0182fd",
        creatorId: "u-zw", creatorTitle: "前 Shopee 商業分析實習生",
        price: 1200, salePrice: 0, saleEnd: 0, free: false,
        careers: ["ba", "pm", "marketing"], skills: ["Excel", "SQL", "商業分析", "履歷作品集"],
        grades: ["大二", "大三", "大四"], stages: ["first-resume", "applying"], outcomes: ["portfolio", "resume"],
        level: "入門", hours: 8.5,
        hasMaterials: true, hasHomework: true, resumeArtifact: true, hasQA: true,
        intro: "很多同學想投 BA／PM／行銷分析實習，但履歷上只有課堂報告，說不出「我用資料做過什麼決定」。這堂課用一個完整的電商案例，帶你從拿到原始資料開始：清理、分析、視覺化、寫結論，最後產出一份可以直接放進履歷與面試作品集的分析專案。",
        fitFor: ["想申請 BA／PM／行銷分析實習的大二～大四學生", "履歷缺一個「有數據」的專案", "會基本 Excel，但沒用資料回答過商業問題"],
        notFitFor: ["已有 1 年以上數據分析實務經驗", "想深入學統計模型或機器學習（本課聚焦求職應用）"],
        gains: ["完成一份可放進履歷的完整分析專案", "看懂企業出的 Excel／SQL 筆試在考什麼", "能用 STAR 結構把分析成果講成面試故事", "拿到分析報告與履歷專案描述的可改寫範本"],
        jobTypes: ["商業分析實習生", "產品企劃實習生", "行銷數據實習生", "電商營運實習生"],
        artifacts: [
          { t: "電商銷售分析專案報告", d: "10 頁分析報告＋圖表，可直接放作品集" },
          { t: "履歷專案描述範本", d: "把這份專案寫進履歷的 3 種寫法（BA／PM／行銷版）" },
        ],
        pairWith: [
          { type: "consult", title: "張哲瑋的 1:1 履歷健檢（分析職缺版）", href: "/creator" },
          { type: "event", title: "活動：BA 學長姐線上分享會", href: "/activities" },
          { type: "job", title: "實習職缺：商業分析實習生（電商）", href: "https://internx.me/zh-tw/dashboard/forum", ext: true },
        ],
        faq: [
          { q: "完全沒碰過 SQL 可以上嗎？", a: "可以。SQL 章節從 SELECT 開始教，作業附逐步解答；課程重點是「用資料回答商業問題」，不是語法背誦。" },
          { q: "作業會有人改嗎？", a: "每個單元的作業附詳解與自評清單；你也可以把成果貼在留言區，講師每週固定回覆一次。" },
          { q: "買了可以看多久？", a: "購買後永久觀看，教材可重複下載，之後課程更新也免費。" },
        ],
        sections: [
          S("先搞懂：企業為什麼要商業分析", [
            L("課程導覽＆怎麼拿到最好效果", 6, { preview: true, subtitles: [
              { t: 0,   text: "嗨，我是哲瑋。歡迎加入商業分析實習準備課。" },
              { t: 16,  text: "這堂課的目標只有一個：讓你帶著一份能放進履歷的分析專案離開。" },
              { t: 40,  text: "我們會從 Excel 資料清理開始，一路做到 SQL 筆試與完整案例。" },
              { t: 70,  text: "每一章都有作業與詳解 —— 動手做，比看十遍影片有用。" },
              { t: 110, text: "建議先到教材區下載練習檔，跟著影片一起操作。" },
              { t: 160, text: "遇到卡關就在單元下面留言，我每週固定回覆一次。" },
              { t: 230, text: "準備好了嗎？我們從企業為什麼需要商業分析開始。" },
              { t: 320, text: "下一個單元，會用三個真實案例看 BA 實習每天在做什麼。" },
            ] }),
            L("BA 實習在做什麼：三個真實案例", 14, { preview: true }),
            L("拆解 JD：企業要的其實是這三件事", 11),
          ]),
          S("Excel：從表格到商業洞察", [
            L("資料清理的固定套路", 16, { materials: [M("練習用原始資料.xlsx", "xlsx")] }),
            L("樞紐分析：三步驟回答商業問題", 18, { materials: [M("樞紐分析練習檔.xlsx", "xlsx")] }),
            L("圖表怎麼選：讓人一眼看懂", 12),
          ]),
          S("SQL：筆試最常考的那些", [
            L("SELECT／WHERE／GROUP BY 一次上手", 20, { materials: [M("SQL 練習題與解答.pdf", "pdf")] }),
            L("JOIN 觀念與常見陷阱", 17),
            L("實習筆試模擬題實作", 15, { materials: [M("筆試模擬題.pdf", "pdf")] }),
          ]),
          S("做出你的履歷專案", [
            L("案例：電商營收下滑，怎麼分析", 22),
            L("把分析寫成 10 頁報告", 16, { materials: [M("分析報告範本.pptx", "pptx")] }),
            L("寫進履歷＋面試怎麼講", 13, { materials: [M("履歷專案描述範本.docx", "docx")] }),
          ]),
        ],
        seed: { students: 214, completion: 0.63, gross: 214 * 1200, feeRate: 0.15 },
        createdAt: ago(120), publishedAt: ago(96), updatedAt: ago(9),
      },
      {
        id: "c-resume", status: "published", featured: false,
        title: "實習履歷從 0 到 1：寫出會被約面試的履歷",
        subtitle: "不套模板硬填，帶你把經歷翻成企業看得懂的語言，完成一版可投遞的履歷。",
        icon: "ri-file-user-line", color: "#1d9e75",
        creatorId: "u-yz", creatorTitle: "職涯教練／前獵才顧問",
        price: 990, salePrice: 790, saleEnd: ahead(18), free: false,
        careers: [], skills: ["履歷", "自我盤點", "量化成果"],
        grades: ["大一", "大二", "大三", "大四", "研究生"], stages: ["first-resume", "applying"], outcomes: ["resume"],
        level: "入門", hours: 6,
        hasMaterials: true, hasHomework: true, resumeArtifact: true, hasQA: true,
        intro: "第一份履歷最難的不是排版，而是「我好像沒什麼可寫」。這堂課帶你做完整的自我盤點，把社團、專題、打工翻成企業在乎的能力證據，用量化寫法完成一版真的可以投遞的履歷初稿，並教你針對不同職缺快速改版。",
        fitFor: ["還沒有履歷、不知道從哪開始的同學", "投了很多間都沒有面試邀約", "覺得自己「沒經歷可寫」的人"],
        notFitFor: ["已有多次面試邀約、想優化外商英文履歷（可直接預約 1:1 諮詢）"],
        gains: ["完成一版可直接投遞的履歷初稿", "理解企業 6 秒篩選履歷時在看什麼", "學會把平凡經歷寫出量化成果", "知道怎麼針對不同職缺改履歷", "搭配平台履歷健檢做下一步優化"],
        jobTypes: ["各領域實習職缺（不限產業）"],
        artifacts: [
          { t: "可投遞的履歷初稿", d: "跟著每章作業做完，課程結束就有一版履歷" },
          { t: "經歷量化字庫", d: "300+ 動詞與量化句型，改寫時直接查" },
        ],
        pairWith: [
          { type: "consult", title: "林宥蓁的 1:1 履歷健檢", href: "/creator" },
          { type: "event", title: "活動：履歷健診 Open Office Hour", href: "/activities" },
          { type: "course", title: "課程：面試準備完全攻略", href: "/course?id=c-interview" },
        ],
        faq: [
          { q: "跟免費的履歷講座差在哪？", a: "講座給觀念，這堂課給流程與範本：每章有作業，做完就累積出一版履歷，而不是聽完還是不知道怎麼下筆。" },
          { q: "有中英文履歷嗎？", a: "本課聚焦中文履歷；英文履歷的差異在最後一章補充，並附英文動詞字庫。" },
        ],
        sections: [
          S("企業怎麼看履歷", [
            L("6 秒篩選：人資與用人主管在看什麼", 9, { preview: true }),
            L("最常見的 7 個扣分點", 12),
          ]),
          S("自我盤點：把經歷挖出來", [
            L("盤點表實作：社團／專題／打工都能寫", 15, { materials: [M("自我盤點表.xlsx", "xlsx")] }),
            L("挑重點：跟職缺對齊", 11),
          ]),
          S("寫出量化成果", [
            L("STAR 改寫法＋動詞字庫", 16, { materials: [M("經歷量化字庫.pdf", "pdf")] }),
            L("沒有數字怎麼量化", 10),
          ]),
          S("完成你的履歷", [
            L("版面與排序：一頁的藝術", 12, { materials: [M("履歷範本（3 款）.zip", "zip")] }),
            L("針對職缺改版＋投遞前檢查清單", 13, { materials: [M("投遞前檢查清單.pdf", "pdf")] }),
          ]),
        ],
        seed: { students: 386, completion: 0.71, gross: 386 * 890, feeRate: 0.15 },
        createdAt: ago(150), publishedAt: ago(130), updatedAt: ago(4),
      },
      {
        id: "c-interview", status: "published", featured: false,
        title: "面試準備完全攻略：從自我介紹到 STAR",
        subtitle: "一套可以重複用的面試準備系統：題庫、故事庫、模擬與復盤。",
        icon: "ri-question-answer-line", color: "#c35500",
        creatorId: "u-yz", creatorTitle: "職涯教練／前獵才顧問",
        price: 1490, salePrice: 0, saleEnd: 0, free: false,
        careers: [], skills: ["面試", "自我介紹", "STAR 法則"],
        grades: ["大二", "大三", "大四", "研究生"], stages: ["interviewing"], outcomes: ["interview"],
        level: "入門–進階", hours: 7,
        hasMaterials: true, hasHomework: true, resumeArtifact: false, hasQA: true,
        intro: "面試不是口才比賽，是準備方法的比賽。這堂課給你一套系統：把經歷整理成 6 個核心故事，對應 80% 的行為面試題，再用模擬與復盤把回答磨到穩定。",
        fitFor: ["拿到面試邀約但很緊張的同學", "回答問題常常越講越發散", "想建立一套之後每次面試都能用的準備法"],
        notFitFor: ["準備顧問 Case interview（請搭配 Case Interview 入門課）"],
        gains: ["寫出 60/90 秒兩版自我介紹", "建立 6 個 STAR 核心故事庫", "常見 30 題行為面試題都有答法", "學會面試後復盤，一次比一次穩"],
        jobTypes: ["各領域實習面試", "研替／新鮮人面試"],
        artifacts: [{ t: "個人面試題庫與故事庫", d: "Notion 範本，之後每場面試都能重複使用" }],
        pairWith: [
          { type: "consult", title: "1:1 模擬面試（40 分鐘）", href: "/creator" },
          { type: "course", title: "課程：實習履歷從 0 到 1", href: "/course?id=c-resume" },
        ],
        faq: [
          { q: "有英文面試嗎？", a: "第五章有英文自我介紹與常見題的準備法，附句型庫。" },
        ],
        sections: [
          S("面試官到底想聽什麼", [L("面試的本質：風險評估", 10, { preview: true }), L("三種面試官，三種對策", 12)]),
          S("自我介紹", [L("60 秒版：鉤子＋證據＋動機", 14, { materials: [M("自我介紹結構模板.pdf", "pdf")] }), L("90 秒版與常見追問", 11)]),
          S("STAR 故事庫", [L("把經歷拆成 6 個核心故事", 16, { materials: [M("故事庫 Notion 範本.notion", "notion")] }), L("30 題行為題對應表", 15, { materials: [M("行為面試題庫 30 題.pdf", "pdf")] })]),
          S("實戰與復盤", [L("線上面試的細節", 9), L("英文面試最低限度準備", 13), L("面試後復盤表", 8, { materials: [M("面試復盤表.xlsx", "xlsx")] })]),
        ],
        seed: { students: 158, completion: 0.58, gross: 158 * 1490, feeRate: 0.15 },
        createdAt: ago(100), publishedAt: ago(84), updatedAt: ago(15),
      },
      {
        id: "c-pm", status: "published", featured: false,
        title: "PM 實習入門：從 0 做出一份產品企劃書",
        subtitle: "用一個題目走完 PM 的完整思考：訪談、定義問題、寫 PRD、簡報提案。",
        icon: "ri-lightbulb-flash-line", color: "#7a4ddb",
        creatorId: "u-sh", creatorTitle: "外商電商 PM／前新創 PM",
        price: 1800, salePrice: 0, saleEnd: 0, free: false,
        careers: ["pm"], skills: ["產品企劃", "使用者訪談", "簡報", "Notion"],
        grades: ["大二", "大三", "大四", "研究生"], stages: ["explore", "applying"], outcomes: ["portfolio", "direction"],
        level: "入門", hours: 9,
        hasMaterials: true, hasHomework: true, resumeArtifact: true, hasQA: true,
        intro: "PM 實習的門檻不是證照，是「你能不能展示產品思考」。這堂課帶你從一個真實題目出發：做 5 場使用者訪談、定義問題、寫出一份 PRD 與提案簡報 —— 這就是你面試時最有力的作品。",
        fitFor: ["想申請 PM／產品企劃實習", "不確定自己適不適合 PM、想先體驗完整流程", "有想法但不知道怎麼寫成企劃"],
        notFitFor: ["已在做 PM 實習、想學進階數據驅動迭代"],
        gains: ["完成一份可放作品集的產品企劃書（PRD）", "做過真實的使用者訪談並整理洞察", "能在面試中展示完整產品思考", "確認自己是否真的想走 PM"],
        jobTypes: ["產品經理實習生", "產品企劃實習生", "專案管理實習生"],
        artifacts: [
          { t: "產品企劃書（PRD）", d: "含問題定義、用戶洞察、解法與指標" },
          { t: "提案簡報", d: "10 頁內講清楚一個產品提案" },
        ],
        pairWith: [
          { type: "consult", title: "黃詩涵的 PM 職涯 1:1 諮詢", href: "/creator" },
          { type: "event", title: "活動：產品經理實習分享會", href: "/activities" },
          { type: "course", title: "課程：零基礎商業分析實習準備課", href: "/course?id=c-ba" },
        ],
        faq: [
          { q: "沒有技術背景可以當 PM 嗎？", a: "可以。課程會教你跟工程師協作需要懂的最低限度概念，重點放在問題定義與溝通。" },
          { q: "訪談要自己找人嗎？", a: "會給你招募訪談對象的話術與同學互助管道，5 場訪談是課程作業的一部分。" },
        ],
        sections: [
          S("PM 在做什麼", [L("一天的 PM：三個場景", 12, { preview: true }), L("實習 JD 拆解與能力地圖", 13)]),
          S("使用者訪談", [L("訪談大綱設計", 15, { materials: [M("訪談大綱模板.docx", "docx")] }), L("5 場訪談實戰與紀錄法", 18), L("從逐字稿到洞察", 14)]),
          S("定義問題與解法", [L("問題陳述：HMW 寫法", 12), L("解法發想與取捨", 16), L("指標怎麼訂", 11)]),
          S("寫出 PRD 與提案", [L("PRD 逐段寫作", 20, { materials: [M("PRD 範本.notion", "notion")] }), L("提案簡報與 Demo Day", 15, { materials: [M("提案簡報範本.pptx", "pptx")] })]),
        ],
        seed: { students: 127, completion: 0.52, gross: 127 * 1800, feeRate: 0.15 },
        createdAt: ago(80), publishedAt: ago(60), updatedAt: ago(6),
      },
      {
        id: "c-case", status: "published", featured: false,
        title: "顧問 Case Interview 入門",
        subtitle: "MBB／四大顧問面試的 case 拆解框架、練習方法與 mock 對練指南。",
        icon: "ri-briefcase-4-line", color: "#11243f",
        creatorId: "u-zw", creatorTitle: "前 Shopee 商業分析實習生／顧問面試上岸",
        price: 2400, salePrice: 0, saleEnd: 0, free: false,
        careers: ["consulting", "ba"], skills: ["Case Interview", "結構化思考", "估算"],
        grades: ["大三", "大四", "研究生"], stages: ["interviewing"], outcomes: ["interview"],
        level: "進階", hours: 10,
        hasMaterials: true, hasHomework: true, resumeArtifact: false, hasQA: true,
        intro: "Case interview 不是聰明測驗，是可以練的技能。這堂課把 case 拆成固定動作：開場結構、估算、圖表解讀、收尾建議，每章配真題演練與 mock 對練指南。",
        fitFor: ["目標顧問業／管顧實習的同學", "面試有 case 環節的策略／商分職缺", "想練結構化思考"],
        notFitFor: ["還在探索方向、第一次接觸商業案例（建議先上商業分析課）"],
        gains: ["掌握 4 種常見 case 類型的拆解框架", "市場估算題有固定解法", "能主導 mock 對練並互相回饋", "拿到 20 題真題與解析"],
        jobTypes: ["管理顧問實習生", "策略分析實習生", "商業分析師"],
        artifacts: [{ t: "個人 case 筆記系統", d: "框架卡＋錯題本，面試前快速複習" }],
        pairWith: [
          { type: "consult", title: "顧問學長 1:1 mock case", href: "/creator" },
          { type: "course", title: "課程：零基礎商業分析實習準備課", href: "/course?id=c-ba" },
        ],
        faq: [
          { q: "需要先會什麼？", a: "基本商業常識與四則運算即可，但建議先具備商業分析基礎，吸收會快很多。" },
        ],
        sections: [
          S("Case 是什麼", [L("面試官視角：評分表長怎樣", 11, { preview: true }), L("四種 case 類型總覽", 13)]),
          S("核心動作", [L("開場：結構化提問", 17), L("市場估算固定解法", 19, { materials: [M("估算題練習 20 題.pdf", "pdf")] }), L("圖表快讀", 12)]),
          S("實戰演練", [L("獲利下滑 case 全程示範", 24), L("市場進入 case 全程示範", 22), L("mock 對練指南", 10, { materials: [M("Mock 對練評分表.pdf", "pdf")] })]),
        ],
        seed: { students: 73, completion: 0.49, gross: 73 * 2400, feeRate: 0.15 },
        createdAt: ago(70), publishedAt: ago(50), updatedAt: ago(20),
      },
      {
        id: "c-uiux", status: "published", featured: false,
        title: "UI/UX 求職作品集實戰",
        subtitle: "把課堂作業與 side project 重整成叫得出名字的作品集，含 Figma 交付細節。",
        icon: "ri-palette-line", color: "#db2777",
        creatorId: "u-sy", creatorTitle: "SaaS 產品設計師",
        price: 1600, salePrice: 1390, saleEnd: ahead(10), free: false,
        careers: ["uiux"], skills: ["Figma", "作品集", "UX 流程"],
        grades: ["大二", "大三", "大四", "轉職"], stages: ["first-resume", "applying"], outcomes: ["portfolio"],
        level: "入門–進階", hours: 8,
        hasMaterials: true, hasHomework: true, resumeArtifact: true, hasQA: true,
        intro: "設計實習看的不是你會多少工具，而是作品集能不能講出「為什麼這樣設計」。這堂課帶你把現有作業重整成 2 個完整案例：研究、流程、取捨、成果，並教你 Figma 檔案的專業整理法。",
        fitFor: ["想申請 UI/UX／產品設計實習", "有作業但不成作品集", "轉職探索設計領域"],
        notFitFor: ["找視覺／平面設計職缺（本課聚焦產品設計）"],
        gains: ["完成 2 個完整作品集案例", "作品集敘事：問題→過程→取捨→成果", "Figma 檔案交付規範", "知道台灣設計實習的審件標準"],
        jobTypes: ["UI/UX 設計實習生", "產品設計實習生"],
        artifacts: [{ t: "作品集網站（2 案例）", d: "含案例敘事結構與版型範本" }],
        pairWith: [
          { type: "consult", title: "李思妤的作品集健檢", href: "/creator" },
          { type: "event", title: "活動：產品設計作品集健診", href: "/activities" },
        ],
        faq: [
          { q: "要會寫程式嗎？", a: "不用。作品集用現成工具架站，課程附教學。" },
        ],
        sections: [
          S("審件者怎麼看作品集", [L("3 分鐘審件實錄", 10, { preview: true }), L("常見死因排行", 12)]),
          S("案例重整", [L("挑案例：兩個就夠", 11), L("敘事結構逐段寫", 18, { materials: [M("案例敘事模板.fig", "fig")] }), L("視覺呈現與排版", 15)]),
          S("Figma 專業度", [L("檔案結構與命名", 13, { materials: [M("Figma 整理檢查表.pdf", "pdf")] }), L("元件與 Auto Layout 基本功", 17)]),
          S("上線與投遞", [L("作品集架站", 12), L("投遞與跟進", 9)]),
        ],
        seed: { students: 96, completion: 0.6, gross: 96 * 1500, feeRate: 0.15 },
        createdAt: ago(65), publishedAt: ago(48), updatedAt: ago(3),
      },
      {
        id: "c-fin", status: "published", featured: false,
        title: "金融實習全準備：產業地圖到 MA 面試",
        subtitle: "銀行／證券／投信投顧在幹嘛、實習缺怎麼挑、筆試面試怎麼準備，一次講完。",
        icon: "ri-bank-line", color: "#1861a8",
        creatorId: "u-kx", creatorTitle: "前外資投行分析師",
        price: 2000, salePrice: 0, saleEnd: 0, free: false,
        careers: ["finance"], skills: ["產業研究", "Excel", "英文面試", "估值入門"],
        grades: ["大二", "大三", "大四", "研究生"], stages: ["explore", "applying", "interviewing"], outcomes: ["direction", "interview"],
        level: "入門", hours: 9.5,
        hasMaterials: true, hasHomework: false, resumeArtifact: true, hasQA: true,
        intro: "金融的職涯路徑多到讓人迷路：前中後台、買方賣方、銀行證券投信。這堂課先給你完整產業地圖，再針對實習與 MA 的筆試、英文面試、群面逐一準備，並帶你完成一份個股研究報告當作品。",
        fitFor: ["對金融有興趣但分不清各職位差異", "目標銀行 MA／券商／投信實習", "非商科想跨進金融"],
        notFitFor: ["已確定走量化交易／金融工程（技術路線不在本課範圍）"],
        gains: ["畫出自己的金融職涯地圖", "完成一份個股研究報告（可放履歷）", "英文自介與群面有完整套路", "看懂金融筆試考什麼"],
        jobTypes: ["銀行 MA／實習生", "券商研究部實習生", "投信投顧實習生", "金融科技實習生"],
        artifacts: [{ t: "個股研究報告", d: "一頁 tear sheet＋完整報告範本" }],
        pairWith: [
          { type: "consult", title: "投行學長 1:1 職涯諮詢", href: "/creator" },
          { type: "event", title: "活動：金融業職涯講座", href: "/activities" },
          { type: "course", title: "課程：面試準備完全攻略", href: "/course?id=c-interview" },
        ],
        faq: [
          { q: "非商科聽得懂嗎？", a: "可以，第一章從零建立框架；財務名詞出現時都會即時解釋。" },
        ],
        sections: [
          S("金融產業地圖", [L("前中後台一張圖", 14, { preview: true }), L("買方 vs 賣方：職涯差在哪", 13), L("實習缺怎麼挑", 11)]),
          S("硬技能最低限度", [L("財報三表 60 分鐘", 22, { materials: [M("財報速讀講義.pdf", "pdf")] }), L("估值入門：倍數法", 16), L("Excel 金融應用", 14)]),
          S("做出研究報告", [L("個股研究框架", 18, { materials: [M("研究報告範本.docx", "docx")] }), L("一頁 tear sheet", 12)]),
          S("MA／實習面試", [L("英文自介與常見題", 15), L("群面與時事題", 14, { materials: [M("金融時事整理法.pdf", "pdf")] })]),
        ],
        seed: { students: 88, completion: 0.55, gross: 88 * 2000, feeRate: 0.15 },
        createdAt: ago(58), publishedAt: ago(40), updatedAt: ago(12),
      },
      {
        id: "c-linkedin", status: "published", featured: false,
        title: "LinkedIn 個人品牌與 Networking 實戰",
        subtitle: "免費公開課：把 LinkedIn 從「有帳號」變成「會帶來機會」。",
        icon: "ri-linkedin-box-line", color: "#0a66c2",
        creatorId: "u-sh", creatorTitle: "外商電商 PM／前新創 PM",
        price: 0, salePrice: 0, saleEnd: 0, free: true,
        careers: [], skills: ["LinkedIn", "Networking", "個人品牌"],
        grades: ["大一", "大二", "大三", "大四", "研究生"], stages: ["explore", "applying", "offer"], outcomes: ["direction"],
        level: "入門", hours: 2.5,
        hasMaterials: true, hasHomework: false, resumeArtifact: false, hasQA: true,
        intro: "台灣學生最容易忽略的求職管道就是 LinkedIn。這堂免費課用 2.5 小時帶你把個人檔案整理到專業水準，並學會不尷尬的 cold message 寫法，開始累積業界人脈。",
        fitFor: ["還沒有 LinkedIn 或檔案空白的同學", "想找外商／新創機會", "想跟學長姐建立聯繫但不知道怎麼開口"],
        notFitFor: ["已有活躍 LinkedIn 與穩定人脈經營習慣"],
        gains: ["完成專業的 LinkedIn 個人檔案", "寫出回覆率高的 cold message", "建立每週 30 分鐘的人脈經營節奏"],
        jobTypes: ["外商實習", "新創實習", "海外機會"],
        artifacts: [],
        pairWith: [
          { type: "course", title: "課程：實習履歷從 0 到 1", href: "/course?id=c-resume" },
          { type: "event", title: "活動：Networking 工作坊", href: "/activities" },
        ],
        faq: [
          { q: "真的免費？", a: "真的。這是講師的公開課，也是體驗平台課程系統的入口。" },
        ],
        sections: [
          S("檔案整理", [L("大頭貼／標題／About 的公式", 18, { preview: true }), L("經歷區：跟履歷不一樣", 14)]),
          S("開始 Networking", [L("Cold message 三段式", 16, { materials: [M("訊息模板 10 則.pdf", "pdf")] }), L("跟進與維繫：不只按讚", 12)]),
          S("長期經營", [L("每週 30 分鐘的節奏", 11), L("發文：從轉發到原創", 13)]),
        ],
        seed: { students: 642, completion: 0.77, gross: 0, feeRate: 0.15 },
        createdAt: ago(90), publishedAt: ago(75), updatedAt: ago(30),
      },
      {
        id: "c-swe", status: "pending", featured: false,
        title: "軟體工程實習準備：刷題之外的必修課",
        subtitle: "Git 協作、side project、技術面試溝通 —— 台灣新創與外商實習真正在看的事。",
        icon: "ri-code-s-slash-line", color: "#0f766e",
        creatorId: "u-by", creatorTitle: "新創前端工程師",
        price: 1700, salePrice: 0, saleEnd: 0, free: false,
        careers: ["engineering"], skills: ["Git", "Side Project", "技術面試"],
        grades: ["大二", "大三", "大四"], stages: ["applying", "interviewing"], outcomes: ["portfolio", "interview"],
        level: "入門–進階", hours: 8,
        hasMaterials: true, hasHomework: true, resumeArtifact: true, hasQA: true,
        intro: "大家都在刷題，但實習面試被刷掉常常不是因為演算法，而是看不出你能不能協作。這堂課補上刷題以外的部分：把 side project 做成有品質的作品、Git 協作習慣、以及技術面試怎麼溝通。",
        fitFor: ["想申請前後端／全端實習", "有寫過作業但沒有像樣的 side project", "面試時不知道怎麼講自己的專案"],
        notFitFor: ["純粹想練演算法題（請搭配刷題資源）"],
        gains: ["完成一個可展示的 side project", "建立專業的 GitHub 檔案", "技術面試的專案敘事", "code review 與協作禮儀"],
        jobTypes: ["前端實習生", "後端實習生", "全端實習生"],
        artifacts: [{ t: "Side project＋GitHub 檔案", d: "含 README 寫法與部署" }],
        pairWith: [{ type: "consult", title: "工程師學長 mock interview", href: "/creator" }],
        faq: [{ q: "要會哪個框架？", a: "不限框架，範例以 React 示範，觀念通用。" }],
        sections: [
          S("實習市場現況", [L("台灣 SWE 實習地圖", 12, { preview: true })]),
          S("Side project", [L("選題與範圍控制", 14), L("README 與部署", 16, { materials: [M("README 範本.docx", "docx")] })]),
          S("協作與面試", [L("Git 協作流程", 18), L("專案敘事與白板溝通", 15)]),
        ],
        seed: { students: 0, completion: 0, gross: 0, feeRate: 0.15 },
        createdAt: ago(6), publishedAt: 0, updatedAt: ago(1), submittedAt: ago(1),
      },
      {
        id: "c-excel", status: "draft", featured: false,
        title: "Excel 數據分析求職應用",
        subtitle: "（草稿）從函數到儀表板，補足履歷上的資料分析能力。",
        icon: "ri-table-line", color: "#1a8a35",
        creatorId: "u-yz", creatorTitle: "職涯教練／前獵才顧問",
        price: 890, salePrice: 0, saleEnd: 0, free: false,
        careers: ["ba", "finance", "marketing"], skills: ["Excel", "數據分析"],
        grades: ["大一", "大二", "大三", "大四"], stages: ["first-resume"], outcomes: ["resume"],
        level: "入門", hours: 5,
        hasMaterials: true, hasHomework: true, resumeArtifact: true, hasQA: true,
        intro: "適合想申請金融、顧問、商業分析實習的學生，補足履歷中的資料分析能力，學完可產出一份 Excel 分析作品。",
        fitFor: ["想補資料分析能力的商管學生"], notFitFor: [],
        gains: ["完成一份 Excel 分析作品"], jobTypes: ["商業分析實習生", "金融實習生"],
        artifacts: [{ t: "Excel 分析作品", d: "含互動式儀表板" }],
        pairWith: [], faq: [],
        sections: [S("函數基礎", [L("查找與統計函數", 15)]), S("儀表板", [L("樞紐＋圖表儀表板", 20)])],
        seed: { students: 0, completion: 0, gross: 0, feeRate: 0.15 },
        createdAt: ago(3), publishedAt: 0, updatedAt: ago(0.2),
      },
    ];
  }

  /* ================= 其餘 seed ================= */
  function seedDB() {
    const courses = seedCourses();
    const buyers = ["陳冠廷", "林孟潔", "張育晟", "許芸蓁", "蔡承翰", "楊子萱", "王品睿", "吳宇珊", "李承恩", "郭曉彤"];
    const orders = [], payments = [], enrollments = [], revenue = [];
    let oi = 0;
    // 近 30 天訂單明細（較早的歷史彙總在 course.seed.gross）
    const recent = [
      ["c-resume", 0, 0.3, 790], ["c-ba", 1, 0.8, 1200], ["c-pm", 2, 1.5, 1800],
      ["c-resume", 3, 2, 790], ["c-fin", 4, 4, 2000], ["c-case", 5, 6, 2400],
      ["c-uiux", 6, 8, 1390], ["c-ba", 7, 11, 1200], ["c-interview", 8, 14, 1490],
      ["c-resume", 9, 17, 790], ["c-ba", 0, 21, 1200], ["c-linkedin", 1, 24, 0],
      ["c-interview", 2, 26, 1490], ["c-pm", 3, 29, 1800],
    ];
    recent.forEach(([cid, bi, d, amt]) => {
      const c = courses.find(x => x.id === cid);
      const id = "O-2607" + String(10 + (++oi));
      const t = ago(d);
      orders.push({ id, userId: "u-b" + bi, userName: buyers[bi], courseId: cid, amount: amt, status: "paid", createdAt: t, paidAt: t + 360000 });
      payments.push({ id: "P-" + id, orderId: id, provider: "fake", amount: amt, status: "paid", createdAt: t, paidAt: t + 360000 });
      enrollments.push({ id: "E-" + id, orderId: id, userId: "u-b" + bi, courseId: cid, createdAt: t + 360000 });
      const rate = c.seed.feeRate;
      revenue.push({
        id: "R-" + id, orderId: id, courseId: cid, creatorId: c.creatorId,
        grossAmount: amt, platformFeeRate: rate, platformFeeAmount: Math.round(amt * rate),
        creatorIncomeAmount: amt - Math.round(amt * rate),
        paymentStatus: "paid", payoutStatus: "pending", paidAt: t + 360000, payoutAt: 0,
      });
    });
    // demo 使用者（宥蓁）已購：c-ba 進行中、c-linkedin 已完成
    const myOrders = [
      { cid: "c-ba", d: 12, amt: 1200 },
      { cid: "c-linkedin", d: 40, amt: 0 },
    ];
    myOrders.forEach(({ cid, d, amt }) => {
      const c = courses.find(x => x.id === cid);
      const id = "O-ME" + cid.slice(2);
      const t = ago(d);
      orders.push({ id, userId: ME, userName: USERS[ME].name, courseId: cid, amount: amt, status: "paid", createdAt: t, paidAt: t + 60000 });
      payments.push({ id: "P-" + id, orderId: id, provider: "fake", amount: amt, status: "paid", createdAt: t, paidAt: t + 60000 });
      enrollments.push({ id: "E-" + id, orderId: id, userId: ME, courseId: cid, createdAt: t + 60000 });
      const rate = c.seed.feeRate;
      revenue.push({
        id: "R-" + id, orderId: id, courseId: cid, creatorId: c.creatorId,
        grossAmount: amt, platformFeeRate: rate, platformFeeAmount: Math.round(amt * rate),
        creatorIncomeAmount: amt - Math.round(amt * rate),
        paymentStatus: "paid", payoutStatus: "pending", paidAt: t + 60000, payoutAt: 0,
      });
    });
    // 進度：c-ba 前 5 個單元完成；c-linkedin 全完成
    const ba = courses.find(c => c.id === "c-ba");
    const li = courses.find(c => c.id === "c-linkedin");
    const progBA = { lessons: {}, watched: {}, lastLesson: "", lastAt: ago(1), completedAt: 0, addedToProfile: false };
    ba.sections.flatMap(s => s.lessons).slice(0, 5).forEach(l => { progBA.lessons[l.id] = 100; progBA.watched[l.id] = true; progBA.lastLesson = l.id; });
    const progLI = { lessons: {}, watched: {}, lastLesson: "", lastAt: ago(20), completedAt: ago(20), addedToProfile: true };
    li.sections.flatMap(s => s.lessons).forEach(l => { progLI.lessons[l.id] = 100; progLI.watched[l.id] = true; progLI.lastLesson = l.id; });

    // 留言（含講師回覆 / 置頂 / 已解答）
    const baL = ba.sections.flatMap(s => s.lessons);
    const reL = courses.find(c => c.id === "c-resume").sections.flatMap(s => s.lessons);
    const comments = [
      {
        id: "cm1", courseId: "c-ba", lessonId: baL[3].id, userId: "u-b1", userName: "林孟潔",
        text: "請問樞紐分析那段，如果原始資料有合併儲存格要先怎麼處理？跑出來的結果會怪怪的。",
        likes: 12, likedByMe: false, pinned: true, solved: true, hidden: false, createdAt: ago(6),
        replies: [{ id: "cm1r1", userId: "u-zw", userName: "張哲瑋", isCreator: true, text: "好問題！先全選 → 取消合併 → Ctrl+G 定位空值 → 填上方值。我錄了一段 3 分鐘補充放在本單元教材區，也更新了練習檔。", createdAt: ago(5.5) }],
      },
      {
        id: "cm2", courseId: "c-ba", lessonId: baL[6].id, userId: "u-b4", userName: "蔡承翰",
        text: "SQL 練習題第 7 題用子查詢寫出來了，但答案是用 JOIN，兩種效能差很多嗎？",
        likes: 5, likedByMe: true, pinned: false, solved: true, hidden: false, createdAt: ago(3),
        replies: [{ id: "cm2r1", userId: "u-zw", userName: "張哲瑋", isCreator: true, text: "筆試階段兩種都拿分！實務上大表 JOIN 通常較好，面試被追問時講得出取捨就加分。", createdAt: ago(2.6) }],
      },
      {
        id: "cm3", courseId: "c-ba", lessonId: baL[0].id, userId: "u-b6", userName: "王品睿",
        text: "大二下才開始準備會太晚嗎？身邊同學好像大一就在實習了…",
        likes: 18, likedByMe: false, pinned: false, solved: false, hidden: false, createdAt: ago(1),
        replies: [],
      },
      {
        id: "cm4", courseId: "c-resume", lessonId: reL[2].id, userId: "u-b0", userName: "陳冠廷",
        text: "盤點表寫完發現我的經歷都是系上活動，沒有企業實習，這樣第一份履歷還有救嗎？",
        likes: 9, likedByMe: false, pinned: false, solved: false, hidden: false, createdAt: ago(0.5),
        replies: [],
      },
      {
        id: "cm5", courseId: "c-resume", lessonId: reL[4].id, userId: "u-b3", userName: "許芸蓁",
        text: "「沒有數字怎麼量化」這章太實用了，用規模＋頻率改寫後整份履歷立刻不一樣，謝謝老師！",
        likes: 21, likedByMe: false, pinned: false, solved: false, hidden: false, createdAt: ago(2),
        replies: [{ id: "cm5r1", userId: "u-yz", userName: "林宥蓁", isCreator: true, text: "太好了！記得投遞前跑一次檢查清單，有問題貼上來我看 😊", createdAt: ago(1.8) }],
      },
      {
        id: "cm6", courseId: "c-linkedin", lessonId: li.sections[1].lessons[0].id, userId: "u-b8", userName: "李承恩",
        text: "照模板寄了 5 封 cold message，兩位學長回我了！其中一位約了線上咖啡 ☕",
        likes: 33, likedByMe: true, pinned: true, solved: false, hidden: false, createdAt: ago(4),
        replies: [{ id: "cm6r1", userId: "u-sh", userName: "黃詩涵", isCreator: true, text: "恭喜！記得聊完 24 小時內寄 thank-you note，關係才會留下來。", createdAt: ago(3.7) }],
      },
    ];
    const announcements = [
      { id: "an1", courseId: "c-ba", type: "課程更新", title: "新增：合併儲存格處理補充影片", body: "很多同學問樞紐分析遇到合併儲存格的處理，我補錄了 3 分鐘示範並更新練習檔，在第二章教材區可以下載。", createdAt: ago(5) },
      { id: "an2", courseId: "c-ba", type: "直播通知", title: "7/15（三）20:00 期中 QA 直播", body: "會統一回覆留言區的高票問題，並示範一題完整的筆試模擬題。直播連結當天公告在此。", createdAt: ago(2) },
      { id: "an3", courseId: "c-resume", type: "新增教材", title: "英文動詞字庫上架", body: "應留言區許願，英文版動詞字庫已放到最後一章教材區，寫英文履歷時直接查。", createdAt: ago(7) },
      { id: "an4", courseId: "c-linkedin", type: "Q&A 整理", title: "Cold message 常見問題整理", body: "把留言區問最多的 5 個問題整理成一篇，包含「對方已讀不回要不要追」——答案是：一週後追一次，就好。", createdAt: ago(10) },
    ];
    // 創作者 registry ＋ 待審申請
    const creators = {
      "u-yz": { title: "職涯教練／前獵才顧問", verified: true, suspended: false, joinedAt: ago(150) },
      "u-zw": { title: "前 Shopee 商業分析實習生", verified: true, suspended: false, joinedAt: ago(130) },
      "u-sh": { title: "外商電商 PM／前新創 PM", verified: true, suspended: false, joinedAt: ago(100) },
      "u-sy": { title: "SaaS 產品設計師", verified: true, suspended: false, joinedAt: ago(70) },
      "u-by": { title: "新創前端工程師", verified: true, suspended: false, joinedAt: ago(10) },
      "u-kx": { title: "前外資投行分析師", verified: true, suspended: false, joinedAt: ago(60) },
    };
    const creatorApps = [
      { id: "app-1", name: "王采潔", school: "政治大學 企管系", title: "前四大審計實習生", intro: "想開一堂「四大實習申請與 Open Question 準備」課程，涵蓋審計／稅務組差異、履歷與面試準備。", appliedAt: ago(2), status: "pending" },
    ];
    // 歷史撥款（讓「已撥款」有數字）
    const payouts = [
      { id: "PO-1", creatorId: "u-zw", amount: 152000, at: ago(35), note: "5 月結算" },
      { id: "PO-2", creatorId: "u-yz", amount: 168000, at: ago(35), note: "5 月結算" },
      { id: "PO-3", creatorId: "u-sh", amount: 96000, at: ago(35), note: "5 月結算" },
      { id: "PO-4", creatorId: "u-sy", amount: 54000, at: ago(35), note: "5 月結算" },
      { id: "PO-5", creatorId: "u-kx", amount: 61000, at: ago(35), note: "5 月結算" },
    ];
    return {
      v: SEED_V,
      courses, orders, payments, enrollments, revenue, payouts,
      comments, announcements, creators, creatorApps,
      progress: { "c-ba": progBA, "c-linkedin": progLI },
      favorites: ["c-pm", "c-uiux"],
      downloads: [{ courseId: "c-ba", name: "練習用原始資料.xlsx", at: ago(10) }, { courseId: "c-ba", name: "樞紐分析練習檔.xlsx", at: ago(8) }],
      profileOutcomes: [{ courseId: "c-linkedin", at: ago(20), toCareerMap: true }],
      settings: { defaultFee: 0.15, creatorFee: {}, courseFee: {}, freeExempt: true },
      adminLogs: [{ at: ago(1), text: "課程「軟體工程實習準備」送審，等待審核" }],
      seq: 100,
    };
  }

  /* ================= 載入 / 儲存 ================= */
  let db;
  try {
    db = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!db || db.v !== SEED_V) db = seedDB();
  } catch (e) { db = seedDB(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* private mode */ } }
  save();

  /* ================= 共用 helpers ================= */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const money = n => n === 0 ? "免費" : "NT$" + Number(n).toLocaleString("zh-TW");
  const dstr = ts => { const d = new Date(ts); return (d.getMonth() + 1) + "/" + d.getDate(); };
  const dfull = ts => { const d = new Date(ts); return d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate(); };
  const timeAgo = ts => {
    const s = Math.max(1, Math.round((now() - ts) / 1000));
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + " 分鐘前";
    if (s < 86400) return Math.round(s / 3600) + " 小時前";
    if (s < 86400 * 30) return Math.round(s / 86400) + " 天前";
    return dstr(ts);
  };
  const qs = k => new URLSearchParams(location.search).get(k) || "";
  const uid = p => p + "-" + (++db.seq);
  const lessonsOf = c => (c.sections || []).flatMap(s => s.lessons || []);
  const materialsOf = c => {
    const out = [];
    (c.sections || []).forEach(s => (s.lessons || []).forEach(l => (l.materials || []).forEach(m => out.push(Object.assign({ lessonId: l.id, lessonTitle: l.title }, m)))));
    return out;
  };
  const gradeRange = c => {
    if (!c.grades || !c.grades.length) return "不限年級";
    const idx = c.grades.map(g => GRADES.indexOf(g)).filter(i => i >= 0).sort((a, b) => a - b);
    if (!idx.length) return c.grades.join("、");
    const a = GRADES[idx[0]], b = GRADES[idx[idx.length - 1]];
    return a === b ? a : a + "–" + b;
  };
  const currentPrice = c => {
    if (c.free || c.price === 0) return 0;
    if (c.salePrice && c.saleEnd && c.saleEnd > now()) return c.salePrice;
    return c.price;
  };
  const onSale = c => !c.free && c.salePrice > 0 && c.saleEnd > now();

  /* ================= 課程查詢 / 統計 ================= */
  const getCourse = id => db.courses.find(c => c.id === id);
  const published = () => db.courses.filter(c => c.status === "published");
  function courseStats(id) {
    // 口徑：seed.students / seed.gross = 30 天前的歷史彙總；db.orders / db.revenue = 近 30 天明細（含本瀏覽器新產生的訂單）
    const c = getCourse(id);
    const liveOrders = db.orders.filter(o => o.courseId === id && o.status === "paid");
    const students = (c.seed ? c.seed.students : 0) + liveOrders.length;
    const gross = (c.seed ? c.seed.gross : 0) + db.revenue.filter(r => r.courseId === id && r.paymentStatus === "paid").reduce((s, r) => s + r.grossAmount, 0);
    const completion = c.seed && c.seed.completion ? c.seed.completion : 0;
    return { students, gross, completion };
  }
  function feeRateFor(c) {
    if (c.free && db.settings.freeExempt) return 0;
    if (db.settings.courseFee[c.id] != null) return db.settings.courseFee[c.id];
    if (db.settings.creatorFee[c.creatorId] != null) return db.settings.creatorFee[c.creatorId];
    return db.settings.defaultFee;
  }

  /* ================= Enrollment / 進度 ================= */
  const isEnrolled = cid => db.enrollments.some(e => e.userId === ME && e.courseId === cid);
  const myEnrollments = () => db.enrollments.filter(e => e.userId === ME);
  function prog(cid) {
    if (!db.progress[cid]) db.progress[cid] = { lessons: {}, watched: {}, lastLesson: "", lastAt: 0, completedAt: 0, addedToProfile: false };
    return db.progress[cid];
  }
  function coursePct(cid) {
    const c = getCourse(cid); if (!c) return 0;
    const all = lessonsOf(c); if (!all.length) return 0;
    const p = prog(cid);
    return Math.round(all.filter(l => p.watched[l.id]).length / all.length * 100);
  }
  function setLessonPct(cid, lid, pct) {
    const p = prog(cid);
    p.lessons[lid] = Math.max(p.lessons[lid] || 0, Math.round(pct));
    p.lastLesson = lid; p.lastAt = now();
    let justCompleted = false;
    if (p.lessons[lid] >= 90 && !p.watched[lid]) {
      p.watched[lid] = true;
      const all = lessonsOf(getCourse(cid));
      if (all.every(l => p.watched[l.id]) && !p.completedAt) { p.completedAt = now(); justCompleted = true; }
    }
    save();
    return { justCompleted, watched: !!p.watched[lid] };
  }
  function markLessonDone(cid, lid) { return setLessonPct(cid, lid, 100); }
  function addToProfile(cid, toCareerMap) {
    const p = prog(cid);
    p.addedToProfile = true;
    if (!db.profileOutcomes.some(o => o.courseId === cid)) db.profileOutcomes.push({ courseId: cid, at: now(), toCareerMap: !!toCareerMap });
    save();
  }

  /* ================= 金流：Provider 抽象層（PRD §8.2） ================= */
  const FakePaymentProvider = {
    key: "fake", label: "FakePay 模擬金流",
    createPayment(order) {
      const p = { id: uid("P"), orderId: order.id, provider: "fake", amount: order.amount, status: "pending", createdAt: now(), paidAt: 0 };
      db.payments.push(p); save(); return p;
    },
    verifyPayment(payment) { return payment.status === "paid"; },
    refundPayment(payment) { payment.status = "refunded"; save(); return payment; },
    getPaymentStatus(payment) { return payment.status; },
  };
  const providers = { fake: FakePaymentProvider };
  const provider = () => providers.fake; // V1 固定 FakePay；未來依設定切換

  function createOrder(courseId) {
    const c = getCourse(courseId);
    if (!c) throw new Error("course not found");
    if (isEnrolled(courseId)) return null;
    const o = { id: uid("O"), userId: ME, userName: USERS[ME].name, courseId, amount: currentPrice(c), status: "pending", createdAt: now(), paidAt: 0 };
    db.orders.push(o);
    const p = provider().createPayment(o);
    save();
    return { order: o, payment: p };
  }
  function settlePaid(order, payment) {
    payment.status = "paid"; payment.paidAt = now();
    order.status = "paid"; order.paidAt = now();
    const e = { id: uid("E"), orderId: order.id, userId: order.userId, courseId: order.courseId, createdAt: now() };
    db.enrollments.push(e);
    const c = getCourse(order.courseId);
    const rate = feeRateFor(c);
    const fee = Math.round(order.amount * rate);
    const r = {
      id: uid("R"), orderId: order.id, courseId: order.courseId, creatorId: c.creatorId,
      grossAmount: order.amount, platformFeeRate: rate, platformFeeAmount: fee,
      creatorIncomeAmount: order.amount - fee,
      paymentStatus: "paid", payoutStatus: "pending", paidAt: now(), payoutAt: 0,
    };
    db.revenue.push(r);
    save();
    return { enrollment: e, record: r };
  }
  function mockPaySuccess(orderId) {
    const o = db.orders.find(x => x.id === orderId);
    const p = db.payments.filter(x => x.orderId === orderId).pop();
    if (!o || o.status === "paid") return null;
    if (p.status !== "pending") { p.status = "pending"; } // 失敗後重試
    const res = settlePaid(o, p);
    return Object.assign({ order: o, payment: p }, res);
  }
  function mockPayFail(orderId) {
    const p = db.payments.filter(x => x.orderId === orderId).pop();
    if (p && p.status === "pending") { p.status = "failed"; save(); }
    return p;
  }
  function refundOrder(orderId) {
    const o = db.orders.find(x => x.id === orderId); if (!o || o.status !== "paid") return null;
    const p = db.payments.filter(x => x.orderId === orderId).pop();
    provider().refundPayment(p);
    o.status = "refunded";
    db.enrollments = db.enrollments.filter(e => e.orderId !== orderId);
    const r = db.revenue.find(x => x.orderId === orderId);
    if (r) { r.paymentStatus = "refunded"; r.payoutStatus = "n/a"; }
    save(); return o;
  }

  /* ================= 收藏 / 下載 ================= */
  const isFav = cid => db.favorites.includes(cid);
  function toggleFav(cid) {
    const i = db.favorites.indexOf(cid);
    if (i >= 0) db.favorites.splice(i, 1); else db.favorites.push(cid);
    save(); return i < 0;
  }
  function downloadMaterial(cid, name) {
    db.downloads.unshift({ courseId: cid, name, at: now() });
    save();
    const c = getCourse(cid);
    const body = "InternX Academy 示範教材\n========================\n課程：" + c.title + "\n教材：" + name + "\n\n（此為 demo 平台產生的示範檔案，正式平台會提供講師上傳的實際教材。）\n";
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name.replace(/\.(xlsx|pptx|docx|pdf|zip|fig|notion)$/i, "") + ".txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ================= 留言 ================= */
  const commentsOf = (cid, lid) => db.comments.filter(m => m.courseId === cid && !m.hidden && (lid ? m.lessonId === lid : true));
  function addComment(cid, lid, text) {
    const m = { id: uid("cm"), courseId: cid, lessonId: lid || "", userId: ME, userName: USERS[ME].name, text, likes: 0, likedByMe: false, pinned: false, solved: false, hidden: false, createdAt: now(), replies: [] };
    db.comments.unshift(m); save(); return m;
  }
  function addReply(cmId, text, asCreator) {
    const m = db.comments.find(x => x.id === cmId); if (!m) return;
    m.replies.push({ id: uid("cr"), userId: ME, userName: USERS[ME].name, isCreator: !!asCreator, text, createdAt: now() });
    save(); return m;
  }
  function toggleCmtLike(cmId) {
    const m = db.comments.find(x => x.id === cmId); if (!m) return;
    m.likedByMe = !m.likedByMe; m.likes += m.likedByMe ? 1 : -1; save(); return m;
  }
  function setCmtFlag(cmId, key, val) { const m = db.comments.find(x => x.id === cmId); if (m) { m[key] = val; save(); } return m; }

  /* ================= 創作者後台 ================= */
  const myCourses = () => db.courses.filter(c => c.creatorId === ME);
  function saveCourse(data) {
    let c = data.id ? getCourse(data.id) : null;
    if (!c) {
      c = Object.assign({
        id: uid("c"), status: "draft", featured: false, creatorId: ME,
        creatorTitle: (db.creators[ME] || {}).title || "認證創作者",
        icon: "ri-book-open-line", color: "#0182fd", price: 0, salePrice: 0, saleEnd: 0, free: false,
        careers: [], skills: [], grades: [], stages: [], outcomes: [], level: "入門", hours: 0,
        hasMaterials: false, hasHomework: false, resumeArtifact: false, hasQA: true,
        intro: "", fitFor: [], notFitFor: [], gains: [], jobTypes: [], artifacts: [], pairWith: [], faq: [], sections: [],
        seed: { students: 0, completion: 0, gross: 0, feeRate: db.settings.defaultFee },
        createdAt: now(), publishedAt: 0,
      }, data);
      db.courses.unshift(c);
    } else {
      Object.assign(c, data);
    }
    c.updatedAt = now();
    save(); return c;
  }
  function submitReview(cid) {
    const c = getCourse(cid); if (!c) return;
    c.status = "pending"; c.submittedAt = now(); c.rejectReason = ""; c.updatedAt = now();
    db.adminLogs.unshift({ at: now(), text: "課程「" + c.title + "」送審，等待審核" });
    save(); return c;
  }
  function creatorRevenue(creatorId) {
    const records = db.revenue.filter(r => r.creatorId === creatorId && r.paymentStatus === "paid");
    const liveIncome = records.reduce((s, r) => s + r.creatorIncomeAmount, 0);
    const seedIncome = db.courses.filter(c => c.creatorId === creatorId).reduce((s, c) => s + Math.round((c.seed ? c.seed.gross : 0) * (1 - (c.seed ? c.seed.feeRate : 0.15))), 0);
    const paidOut = db.payouts.filter(p => p.creatorId === creatorId).reduce((s, p) => s + p.amount, 0);
    return { records, total: liveIncome + seedIncome, paidOut, pending: liveIncome + seedIncome - paidOut };
  }

  /* ================= Admin ================= */
  function approveCourse(cid) {
    const c = getCourse(cid); if (!c) return;
    c.status = "published"; c.publishedAt = now(); c.rejectReason = ""; c.updatedAt = now();
    db.adminLogs.unshift({ at: now(), text: "課程「" + c.title + "」審核通過，已上架" });
    save(); return c;
  }
  function rejectCourse(cid, reason) {
    const c = getCourse(cid); if (!c) return;
    c.status = "rejected"; c.rejectReason = reason || ""; c.updatedAt = now();
    db.adminLogs.unshift({ at: now(), text: "課程「" + c.title + "」退回修改：" + (reason || "未填原因") });
    save(); return c;
  }
  function takedownCourse(cid) {
    const c = getCourse(cid); if (!c) return;
    c.status = "off"; c.updatedAt = now();
    db.adminLogs.unshift({ at: now(), text: "課程「" + c.title + "」已下架" });
    save(); return c;
  }
  function setFeatured(cid, val) {
    const c = getCourse(cid); if (!c) return;
    c.featured = !!val;
    db.adminLogs.unshift({ at: now(), text: "課程「" + c.title + "」" + (val ? "標記精選" : "取消精選") });
    save(); return c;
  }
  function decideCreatorApp(appId, ok) {
    const a = db.creatorApps.find(x => x.id === appId); if (!a) return;
    a.status = ok ? "approved" : "rejected"; a.decidedAt = now();
    db.adminLogs.unshift({ at: now(), text: "創作者申請「" + a.name + "」" + (ok ? "審核通過" : "已拒絕") });
    save(); return a;
  }
  function setSuspended(creatorId, val) {
    if (db.creators[creatorId]) { db.creators[creatorId].suspended = !!val; save(); }
    db.adminLogs.unshift({ at: now(), text: "創作者「" + (USERS[creatorId] || {}).name + "」" + (val ? "已停權" : "已恢復") });
    save();
  }
  function platformSummary() {
    const liveGross = db.revenue.filter(r => r.paymentStatus === "paid").reduce((s, r) => s + r.grossAmount, 0);
    const liveFee = db.revenue.filter(r => r.paymentStatus === "paid").reduce((s, r) => s + r.platformFeeAmount, 0);
    const seedGross = db.courses.reduce((s, c) => s + (c.seed ? c.seed.gross : 0), 0);
    const seedFee = db.courses.reduce((s, c) => s + Math.round((c.seed ? c.seed.gross : 0) * (c.seed ? c.seed.feeRate : 0.15)), 0);
    const gross = liveGross + seedGross, fee = liveFee + seedFee;
    const creatorTotal = gross - fee;
    const paidOut = db.payouts.reduce((s, p) => s + p.amount, 0);
    return { gross, fee, creatorTotal, paidOut, pending: creatorTotal - paidOut };
  }
  function markPayout(creatorId) {
    const cr = creatorRevenue(creatorId);
    if (cr.pending <= 0) return null;
    const po = { id: uid("PO"), creatorId, amount: cr.pending, at: now(), note: "手動結算" };
    db.payouts.push(po);
    db.revenue.filter(r => r.creatorId === creatorId && r.payoutStatus === "pending").forEach(r => { r.payoutStatus = "paid"; r.payoutAt = now(); });
    db.adminLogs.unshift({ at: now(), text: "已撥款給「" + (USERS[creatorId] || {}).name + "」 " + money(po.amount) });
    save(); return po;
  }
  function exportCSV(rows, filename) {
    const csv = "\uFEFF" + rows.map(r => r.map(c => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function resetDemo() { localStorage.removeItem(KEY); location.reload(); }

  /* ================= 共用 render：課程卡 ================= */
  const covStyle = c => "background:linear-gradient(135deg," + c.color + "," + c.color + "cc)";
  function avatarHTML(userId, size) {
    const u = USERS[userId] || { initial: "?", color: "#8a94a3" };
    return '<div class="avatar" style="width:' + size + "px;height:" + size + "px;background:" + u.color + ";font-size:" + Math.round(size * 0.36) + 'px">' + u.initial + "</div>";
  }
  function priceHTML(c) {
    const p = currentPrice(c);
    if (p === 0) return '<span class="ax-price freeP">免費</span>';
    if (onSale(c)) return '<span class="ax-price">' + money(p) + '<span class="strike">' + money(c.price) + "</span></span>";
    return '<span class="ax-price">' + money(p) + "</span>";
  }
  function courseCardHTML(c) {
    const st = courseStats(c.id);
    const u = USERS[c.creatorId] || { name: "講師" };
    const feats = [
      c.hasMaterials && '<span title="提供教材下載"><i class="ri-folder-download-line"></i> 教材</span>',
      c.hasHomework && '<span title="含課後作業"><i class="ri-edit-box-line"></i> 作業</span>',
      c.resumeArtifact && '<span title="可產出履歷作品"><i class="ri-file-user-line"></i> 履歷作品</span>',
      c.hasQA && '<span title="講師 Q&A 留言區"><i class="ri-question-answer-line"></i> Q&amp;A</span>',
    ].filter(Boolean).join("");
    const careers = (c.careers && c.careers.length ? c.careers.map(k => careerOf(k).label) : ["全職涯方向"]).slice(0, 3);
    return '<a class="ax-card" href="/course?id=' + c.id + '">' +
      '<div class="ax-cover" style="' + covStyle(c) + '"><i class="' + c.icon + '"></i>' +
        '<div class="ax-covTags">' + (c.featured ? '<span class="atg featured"><i class="ri-star-fill"></i> 精選</span>' : "") + (c.free ? '<span class="atg free">免費</span>' : (onSale(c) ? '<span class="atg free">限時優惠</span>' : "")) + "</div>" +
        '<button type="button" class="ax-fav ' + (isFav(c.id) ? "on" : "") + '" data-fav="' + c.id + '" aria-pressed="' + (isFav(c.id) ? "true" : "false") + '" aria-label="收藏課程：' + esc(c.title) + '" title="收藏課程"><i class="' + (isFav(c.id) ? "ri-heart-fill" : "ri-heart-line") + '" aria-hidden="true"></i></button>' +
      "</div>" +
      '<div class="ax-cardBody">' +
        '<div class="ax-cardT">' + esc(c.title) + "</div>" +
        '<div class="ax-teacher"><b>' + esc(u.name) + "</b> · " + esc(c.creatorTitle) + "</div>" +
        '<div class="ax-cardMeta"><i class="ri-signal-tower-line"></i>' + c.level + ' <span>·</span> <i class="ri-time-line"></i>' + c.hours + " 小時 <span>·</span> <i class=\"ri-user-3-line\"></i>" + gradeRange(c) + "</div>" +
        '<div class="ax-miniTags">' + careers.map(l => '<span class="ax-miniTag">' + l + "</span>").join("") + (c.skills || []).slice(0, 3).map(s => '<span class="ax-miniTag skill">' + esc(s) + "</span>").join("") + "</div>" +
        '<div class="ax-featRow">' + feats + "</div>" +
        '<div class="ax-cardFoot">' + priceHTML(c) +
          '<span class="ax-soc">' + st.students.toLocaleString("zh-TW") + " 人已購" + (st.completion ? "<br>完成率 " + Math.round(st.completion * 100) + "%" : "") + "</span>" +
        "</div>" +
      "</div></a>";
  }
  function wireFavs(root) {
    (root || document).querySelectorAll("[data-fav]").forEach(b => b.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      const on = toggleFav(b.dataset.fav);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.innerHTML = '<i class="' + (on ? "ri-heart-fill" : "ri-heart-line") + '" aria-hidden="true"></i>';
      if (window.CZ) CZ.toast(on ? "已加入收藏，可在「我的課程」查看" : "已取消收藏");
    }));
  }
  const MAT_ICON = { xlsx: "ri-file-excel-2-line", pptx: "ri-slideshow-2-line", docx: "ri-file-word-2-line", pdf: "ri-file-pdf-2-line", zip: "ri-file-zip-line", fig: "ri-pen-nib-line", notion: "ri-booklet-line" };

  /* ================= 字幕（cue 模型；正式版＝講師上傳 SRT/VTT，見 spec §17） ================= */
  // lesson.subtitles = [{ t: 秒, text }]；沒有自訂字幕的單元回傳示範字幕（demo 佔位）
  function cuesFor(lesson) {
    if (lesson.subtitles && lesson.subtitles.length) return lesson.subtitles;
    const dur = lesson.mins * 60;
    const mk = (f, text) => ({ t: Math.round(dur * f), text });
    return [
      mk(0,    "（示範字幕）歡迎來到「" + lesson.title + "」。"),
      mk(0.12, "這個單元約 " + lesson.mins + " 分鐘，建議搭配教材一起看。"),
      mk(0.30, "正式平台的字幕由講師上傳 SRT／VTT，或平台自動轉錄後校對。"),
      mk(0.50, "右下角 CC 按鈕可以開關字幕，偏好會記住。"),
      mk(0.70, "「" + lesson.title + "」的重點就在這一段，記得做筆記。"),
      mk(0.88, "本單元接近尾聲，看完會自動標記完成並前往下一堂。"),
    ];
  }
  const cueAt = (lesson, sec) => {
    const cues = cuesFor(lesson);
    let cur = null;
    for (const c of cues) { if (c.t <= sec) cur = c; else break; }
    return cur ? cur.text : "";
  };
  const ccOn = () => db.ccOn !== false; // 預設開啟
  function setCC(v) { db.ccOn = !!v; save(); }
  // 解析「mm:ss 文字」多行輸入（Studio 字幕編輯用）
  function parseCueLines(str) {
    return String(str || "").split("\n").map(line => {
      const m = line.trim().match(/^(\d{1,3}):([0-5]\d)\s+(.+)$/);
      return m ? { t: (+m[1]) * 60 + (+m[2]), text: m[3].trim() } : null;
    }).filter(Boolean).sort((a, b) => a.t - b.t);
  }
  const cueLinesOf = lesson => (lesson.subtitles || []).map(c =>
    Math.floor(c.t / 60) + ":" + String(c.t % 60).padStart(2, "0") + " " + c.text).join("\n");

  /* ================= 對外 API ================= */
  window.IXA = {
    ME, USERS, CAREERS, STAGES, GRADES, OUTCOMES, careerOf, stageOf, outcomeOf,
    db: () => db, save, resetDemo,
    esc, money, dstr, dfull, timeAgo, qs, now,
    getCourse, published, courseStats, lessonsOf, materialsOf, gradeRange, currentPrice, onSale, feeRateFor,
    isEnrolled, myEnrollments, prog, coursePct, setLessonPct, markLessonDone, addToProfile,
    providers, provider, createOrder, mockPaySuccess, mockPayFail, refundOrder,
    isFav, toggleFav, downloadMaterial,
    commentsOf, addComment, addReply, toggleCmtLike, setCmtFlag,
    myCourses, saveCourse, submitReview, creatorRevenue,
    approveCourse, rejectCourse, takedownCourse, setFeatured, decideCreatorApp, setSuspended,
    platformSummary, markPayout, exportCSV,
    covStyle, avatarHTML, priceHTML, courseCardHTML, wireFavs, MAT_ICON,
    cuesFor, cueAt, ccOn, setCC, parseCueLines, cueLinesOf,
  };
})();
