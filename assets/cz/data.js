/* =====================================================================
   創作者專區 Demo — 假資料（前端展示用，無後端）
   欄位命名刻意對齊 internx-me/frontend 既有資料模型：
   Profile / VerifiedRolePitch / BlogPost / ActivityData / RegistrationData
   每位創作者都備齊各分頁資料，避免任何分頁出現空白。
   ===================================================================== */
window.CZ_DATA = {
  featured: "lin-yuzhen",

  creators: {
    /* ---------- 1. 林宥蓁（外商求職） ---------- */
    "lin-yuzhen": {
      id: "lin-yuzhen", name: "林宥蓁", initials: "宥", color: "#0182fd",
      role: "verified-creator", roleLabel: "認證創作者",
      headline: "外商求職教練｜前 McKinsey 商業分析師",
      school: "國立政治大學 企業管理學系", location: "台北市", followers: 1284,
      bio: "專注幫助大學生與新鮮人準備外商與顧問業求職。3 年帶過 200+ 場履歷健診與模擬面試，相信「把實習經驗講成戰功」是拿到 offer 的關鍵。",
      pitch: {
        organizationText: "前 McKinsey & Company 商業分析師；現為自由職涯教練與 InternX 合作講師。",
        experienceText: "畢業於政大企管，曾於 McKinsey 擔任商業分析師 3 年，主導多個策略顧問專案。離職後投入職涯教育，於 InternX、各大學職涯中心開設「外商求職」「Case Interview」工作坊，累積超過 200 場一對一履歷健診，學員 offer 涵蓋四大會計師事務所、外商顧問與快消品牌。",
      },
      socialLinks: [
        { platform: "linkedin", icon: "linkedin-fill", label: "LinkedIn", username: "yuzhen-lin", url: "https://linkedin.com/in/yuzhen-lin" },
        { platform: "instagram", icon: "instagram-line", label: "Instagram", username: "@yuzhen.career", url: "https://instagram.com/yuzhen.career" },
        { platform: "website", icon: "global-line", label: "個人網站", username: "yuzhen.cc", url: "#" },
      ],
      specialties: [
        { category: "求職輔導", skills: ["履歷健診", "Cover Letter", "面試準備", "薪資談判"] },
        { category: "顧問求職", skills: ["Case Interview", "Market Sizing", "邏輯框架", "簡報表達"] },
        { category: "個人品牌", skills: ["LinkedIn 經營", "內容創作", "公開演講"] },
      ],
      blogs: ["b1", "b2", "b3"], hostedEvents: ["e1", "e2", "e3"],
      drafts: [
        { title: "外商面試的 5 個地雷問題（草稿）", category: "面試技巧", date: "2026/06/15" },
        { title: "給大三生的暑期實習時間軸（草稿）", category: "職涯規劃", date: "2026/06/10" },
      ],
      activityLog: [
        { date: "2026/05/18", role: "host", title: "外商求職實戰工作坊（第 6 屆）", desc: "主辦・42 人報名・滿意度 4.8" },
        { date: "2026/04/27", role: "host", title: "履歷健診 Open Office Hour", desc: "主辦・每月固定場・18 人參與" },
        { date: "2026/04/10", role: "join", title: "2026 春季校園職涯博覽會", desc: "受邀講者・主題分享" },
        { date: "2026/03/22", role: "host", title: "Coffee Chat：顧問業學長姐經驗談", desc: "主辦・線上・60 人參與" },
        { date: "2026/02/15", role: "join", title: "LinkedIn 個人品牌講座", desc: "報名參加" },
      ],
      featuredPosts: [
        { company: "麥肯錫顧問公司", rating: 4.9, summary: "面試流程很扎實，Case 題目貼近實務。建議事先練習 market sizing 與獲利樹框架，現場會要求邊講邊算。", time: "2026/05/02" },
        { company: "聯合利華 Unilever", rating: 4.5, summary: "MT 計畫關卡多，從線上測驗、AC 到終面。重點在團隊合作展現與商業敏感度。", time: "2026/03/14" },
      ],
      forumPosts: [
        { room: "顧問業求職", content: "整理了一份『Case Interview 常見 8 大框架』的速查表，需要的同學可以留言，我私訊給你～", time: "2026/05/20", reactions: 36 },
        { room: "履歷健診", content: "履歷的每一條 bullet 都用 STAR 寫：情境 → 任務 → 行動 → 量化結果。能量化就量化。", time: "2026/05/06", reactions: 51 },
      ],
    },

    /* ---------- 2. 陳柏宇（軟體工程） ---------- */
    "chen-boyu": {
      id: "chen-boyu", name: "陳柏宇", initials: "柏", color: "#7c3aed",
      role: "verified-creator", roleLabel: "認證創作者",
      headline: "資深前端工程師｜帶你準備技術面試",
      school: "國立台灣大學 資訊工程學系", location: "新竹市", followers: 980,
      bio: "在新創與外商都待過的前端工程師，專長把抽象的演算法講成人話。每週分享一題 LeetCode 解析與系統設計觀念。",
      pitch: {
        organizationText: "現任外商軟體公司資深前端工程師，曾任職於兩間早期新創。",
        experienceText: "台大資工畢業，6 年前端與全端開發經驗，主導過數個百萬級用戶產品的前端架構。業餘經營技術部落格與 YouTube，專注幫助非本科與轉職者準備技術面試，學員錄取多家台灣與外商科技公司。",
      },
      socialLinks: [
        { platform: "linkedin", icon: "linkedin-fill", label: "LinkedIn", username: "boyu-chen", url: "#" },
        { platform: "instagram", icon: "instagram-line", label: "Instagram", username: "@boyu.codes", url: "#" },
      ],
      specialties: [
        { category: "技術面試", skills: ["演算法", "系統設計", "白板題", "履歷投遞"] },
        { category: "前端開發", skills: ["React", "TypeScript", "效能優化", "前端架構"] },
      ],
      blogs: ["b4", "b5"], hostedEvents: ["e4"],
      activityLog: [
        { date: "2026/05/10", role: "host", title: "新手工程師技術面試衝刺營", desc: "主辦・線上・35 人參與" },
        { date: "2026/04/02", role: "join", title: "F2E 前端開發者年會", desc: "報名參加" },
        { date: "2026/03/08", role: "host", title: "LeetCode 共學讀書會", desc: "主辦・每週一次" },
      ],
      featuredPosts: [
        { company: "某外商軟體公司", rating: 4.7, summary: "技術面試共 4 關：線上測驗、兩輪白板題、系統設計。系統設計建議先確認需求與規模，再畫架構。", time: "2026/04/18" },
      ],
      forumPosts: [
        { room: "軟體工程求職", content: "白板題卡住時，先講你的思路再寫 code。面試官在乎的是溝通與拆解，不是你一次寫對。", time: "2026/05/12", reactions: 44 },
      ],
    },

    /* ---------- 3. 黃詩涵（行銷） ---------- */
    "huang-shihan": {
      id: "huang-shihan", name: "黃詩涵", initials: "詩", color: "#e2a200",
      role: "verified-creator", roleLabel: "認證創作者",
      headline: "品牌行銷顧問｜社群經營實戰派",
      school: "國立政治大學 廣告學系", location: "台北市", followers: 2150,
      bio: "操盤過多個百萬粉專與電商品牌，專注教學生如何把興趣變成個人品牌、把作品變成履歷亮點。",
      pitch: {
        organizationText: "獨立品牌行銷顧問；曾任電商品牌行銷總監，現經營行銷教學社群。",
        experienceText: "政大廣告畢業，10 年數位行銷經驗，操盤過服飾、美妝與餐飲品牌的社群與廣告投放，多個專案 ROAS 超過 5。近年投入行銷教育，於 InternX 與多所大學開設社群經營與個人品牌課程。",
      },
      socialLinks: [
        { platform: "instagram", icon: "instagram-line", label: "Instagram", username: "@sophie.brand", url: "#" },
        { platform: "linkedin", icon: "linkedin-fill", label: "LinkedIn", username: "shihan-huang", url: "#" },
      ],
      specialties: [
        { category: "數位行銷", skills: ["社群經營", "內容策略", "廣告投放", "數據分析"] },
        { category: "個人品牌", skills: ["IG 經營", "短影音", "文案", "品牌定位"] },
      ],
      blogs: ["b6", "b7"], hostedEvents: ["e5", "e6"],
      activityLog: [
        { date: "2026/05/24", role: "host", title: "個人品牌實戰工作坊", desc: "主辦・台北・滿座 50 人" },
        { date: "2026/05/01", role: "host", title: "短影音腳本企劃講座", desc: "主辦・線上・120 人" },
        { date: "2026/04/12", role: "join", title: "數位行銷高峰會", desc: "受邀講者" },
        { date: "2026/03/03", role: "join", title: "電商品牌交流之夜", desc: "報名參加" },
      ],
      featuredPosts: [
        { company: "某新創電商", rating: 4.3, summary: "行銷實習主要做社群與素材，學到完整投放流程。建議主動爭取看數據，不要只做美編。", time: "2026/04/06" },
      ],
      forumPosts: [
        { room: "行銷求職", content: "作品集比履歷重要。把你經營過的帳號、做過的活動數據整理成案例，面試直接拿出來講。", time: "2026/05/15", reactions: 62 },
      ],
    },

    /* ---------- 4. 王凱程（創業） ---------- */
    "wang-kaicheng": {
      id: "wang-kaicheng", name: "王凱程", initials: "凱", color: "#0f766e",
      role: "collaboration-partner", roleLabel: "合作夥伴",
      headline: "新創共同創辦人｜聊商業開發與募資",
      school: "國立清華大學 經濟學系", location: "台北市", followers: 640,
      bio: "連續創業者，分享從 0 到 1 的真實經驗：找題目、做 MVP、跟投資人聊天。歡迎想創業的同學來交流。",
      pitch: {
        organizationText: "教育科技新創共同創辦人暨營運長；InternX 創業社群合作夥伴。",
        experienceText: "清大經濟畢業，連續創業者，現為一間教育科技新創的共同創辦人，曾完成兩輪募資。長期在校園分享創業與商業開發實務，協助學生團隊驗證題目與準備提案。",
      },
      socialLinks: [{ platform: "linkedin", icon: "linkedin-fill", label: "LinkedIn", username: "kevin-wang", url: "#" }],
      specialties: [
        { category: "創業", skills: ["商業模式", "募資簡報", "商業開發", "產品驗證"] },
        { category: "營運", skills: ["團隊管理", "成長策略"] },
      ],
      blogs: ["b8"], hostedEvents: ["e7"],
      activityLog: [
        { date: "2026/05/05", role: "host", title: "學生創業者小聚", desc: "主辦・台北・30 人" },
        { date: "2026/04/20", role: "join", title: "U-Start 創新創業計畫說明會", desc: "受邀分享" },
        { date: "2026/03/15", role: "join", title: "新創 Demo Day", desc: "評審" },
      ],
      featuredPosts: [
        { company: "某早期新創", rating: 4.6, summary: "新創實習什麼都要碰，成長最快。心態要從『被分派任務』轉成『主動找問題解決』。", time: "2026/03/28" },
      ],
      forumPosts: [
        { room: "創業交流", content: "別急著寫商業計畫書，先去找 10 個真實用戶聊天。題目是問出來的，不是想出來的。", time: "2026/05/08", reactions: 29 },
      ],
    },

    /* ---------- 5. 李思妤（設計） ---------- */
    "li-siyu": {
      id: "li-siyu", name: "李思妤", initials: "思", color: "#db2777",
      role: "verified-creator", roleLabel: "認證創作者",
      headline: "資深產品設計師｜作品集健診",
      school: "實踐大學 媒體傳達設計學系", location: "台北市", followers: 1530,
      bio: "在 B2B SaaS 團隊做產品設計，最愛幫設計系學生看作品集。相信好的作品集是『會說故事的設計決策』。",
      pitch: {
        organizationText: "B2B SaaS 公司資深產品設計師；設計社群講師。",
        experienceText: "實踐媒傳畢業，7 年產品設計經驗，現任職於 B2B SaaS 團隊，負責核心產品的使用者體驗。長期在設計社群分享作品集與面試準備，幫助上百位設計系學生與轉職者拿到設計職位。",
      },
      socialLinks: [
        { platform: "instagram", icon: "instagram-line", label: "Instagram", username: "@tina.designs", url: "#" },
        { platform: "website", icon: "global-line", label: "Portfolio", username: "tina.design", url: "#" },
      ],
      specialties: [
        { category: "產品設計", skills: ["UI/UX", "作品集", "設計思考", "使用者研究", "Figma"] },
      ],
      blogs: ["b9", "b10"], hostedEvents: ["e8"],
      activityLog: [
        { date: "2026/05/16", role: "host", title: "作品集健診 Office Hour", desc: "主辦・線上・25 人" },
        { date: "2026/04/22", role: "host", title: "UI/UX 設計入門工作坊", desc: "主辦・台北・40 人" },
        { date: "2026/03/30", role: "join", title: "設計師作品集交流展", desc: "參展" },
      ],
      featuredPosts: [
        { company: "某 SaaS 公司", rating: 4.8, summary: "設計實習能參與真實產品決策。面試最看作品集的『過程』，記得放上你怎麼思考、怎麼取捨。", time: "2026/04/02" },
      ],
      forumPosts: [
        { room: "設計求職", content: "作品集不要只放漂亮的最終畫面，放上你的研究、草稿與設計決策，面試官想看的是思考過程。", time: "2026/05/18", reactions: 48 },
      ],
    },

    /* ---------- 6. 張哲瑋（金融） ---------- */
    "chang-jhewei": {
      id: "chang-jhewei", name: "張哲瑋", initials: "哲", color: "#1861a8",
      role: "industry-expert", roleLabel: "產業專家",
      headline: "投資銀行分析師｜金融業實習申請",
      school: "國立台灣大學 財務金融學系", location: "台北市", followers: 870,
      bio: "在外商投行做 M&A，分享金融業實習怎麼申請、面試考什麼、第一份 PA/IBD 工作的真實樣貌。",
      pitch: {
        organizationText: "外商投資銀行分析師（IBD / M&A）。",
        experienceText: "台大財金畢業，現任外商投資銀行分析師，專注併購與股權承銷。曾在多所大學金融社團分享投行求職，協助學生準備履歷、Networking 與技術面試。",
      },
      socialLinks: [{ platform: "linkedin", icon: "linkedin-fill", label: "LinkedIn", username: "jhewei-chang", url: "#" }],
      specialties: [
        { category: "金融求職", skills: ["財務分析", "估值建模", "實習申請", "Networking"] },
      ],
      blogs: ["b11"], hostedEvents: ["e9"],
      activityLog: [
        { date: "2026/05/12", role: "host", title: "投行求職 Networking 工作坊", desc: "主辦・台北・28 人" },
        { date: "2026/04/08", role: "join", title: "金融業實習博覽會", desc: "受邀講者" },
        { date: "2026/03/18", role: "join", title: "財金系系友講座", desc: "分享嘉賓" },
      ],
      featuredPosts: [
        { company: "某外商投行", rating: 4.4, summary: "投行實習工時長但學很快。申請重點是 Networking 與技術面試，估值建模要練熟。", time: "2026/03/20" },
      ],
      forumPosts: [
        { room: "金融業求職", content: "投行申請季很短，提早一年開始 Networking。冷信要客製化，問具體問題，不要只問『可以給我建議嗎』。", time: "2026/05/02", reactions: 33 },
      ],
    },
  },

  /* =================== BlogPost =================== */
  blogs: {
    b1: {
      id: "b1", slug: "4-offers-in-3-weeks", category: "職涯規劃",
      title: "我如何在 3 週內拿到 4 個外商 Offer",
      excerpt: "從投履歷到拿到 offer，其實是一套可以複製的系統。這篇拆解我當年的時間表、信件模板，以及面試前一晚我都在做什麼。",
      author: "lin-yuzhen", date: "2026/05/12", readTime: 7, views: 3240, likes: 286,
      content: [
        { t: "h2", v: "求職是一場專案管理" },
        { t: "p", v: "很多人把求職當成「碰運氣」，但其實它更像一個有期限、有里程碑的專案。當我決定要在一個月內拿到 offer 時，第一件事不是投履歷，而是打開試算表，把每一家公司的截止日、關卡、聯絡人都列出來。" },
        { t: "p", v: "把求職視覺化之後，你會發現自己真正能掌控的變數只有三個：履歷品質、面試表現、申請數量。我們一個一個拆。" },
        { t: "h3", v: "1. 履歷：用 STAR 把實習寫成戰功" },
        { t: "p", v: "招募者看一份履歷平均只有 7 秒。所以每一條 bullet 都要能在一行內講完「你做了什麼、帶來什麼結果」。我習慣用 STAR 原則：" },
        { t: "ul", v: ["情境 Situation：當時面對什麼問題", "任務 Task：你被賦予什麼目標", "行動 Action：你具體做了什麼", "結果 Result：盡量量化（成長 %、省下多少時間）"] },
        { t: "quote", v: "如果一條經歷無法量化，那它通常不值得放進履歷的前三條。" },
        { t: "h3", v: "2. 面試：把緊張變成準備" },
        { t: "p", v: "面試前一晚我不會臨時抱佛腳，而是做三件事：重看公司近期新聞、把自己的故事練到能在 90 秒內講完、預想三個最可能被問的刁鑽問題。準備過的緊張，會變成自信。" },
        { t: "h2", v: "結語" },
        { t: "p", v: "Offer 不是運氣，是準備乘以數量。希望這套方法能幫到正在求職路上的你。有問題歡迎在 InternX 論壇標記我，或來我的 Office Hour 聊聊。" },
      ],
    },
    b2: {
      id: "b2", slug: "star-resume", category: "面試技巧",
      title: "履歷的 STAR 原則：把實習經驗寫成戰功",
      excerpt: "「在 OO 公司實習」不是經歷，「讓客訴回覆時間縮短 40%」才是。手把手帶你改寫三條最常見的履歷句子。",
      author: "lin-yuzhen", date: "2026/04/20", readTime: 5, views: 2110, likes: 173,
      content: [
        { t: "h2", v: "為什麼你的履歷沒有記憶點" },
        { t: "p", v: "大部分學生的履歷都長一樣：列出公司、職稱、然後寫「協助主管處理日常事務」。問題是，這句話換成任何人、任何公司都成立——它沒有「你」。" },
        { t: "h3", v: "改寫範例" },
        { t: "p", v: "原句：協助行銷團隊經營社群。改寫：獨立經營品牌 IG，3 個月內將互動率從 1.2% 提升至 4.5%，並企劃 2 檔帶來 300+ 名單的活動。" },
        { t: "quote", v: "好的履歷句子，讀完會讓人想多問一句。" },
        { t: "p", v: "把每一條都套進 STAR，你的履歷就會從「做過什麼」升級成「帶來什麼價值」。" },
      ],
    },
    b3: {
      id: "b3", slug: "case-interview-guide", category: "面試技巧",
      title: "Case Interview 完全攻略：從框架到實戰",
      excerpt: "顧問業面試最讓人害怕的 Case，其實有跡可循。整理我最常用的 4 大框架與一個真實考題的完整拆解。",
      author: "lin-yuzhen", date: "2026/03/30", readTime: 9, views: 1890, likes: 142,
      content: [
        { t: "h2", v: "Case 考的不是答案，是思路" },
        { t: "p", v: "顧問面試官想看的，是你面對一個沒有標準答案的商業問題時，能不能結構化地拆解、有邏輯地推進。" },
        { t: "h3", v: "四大常用框架" },
        { t: "ul", v: ["獲利樹：營收 − 成本，往下拆", "市場進入：市場、競爭、能力、財務", "Market Sizing：由上而下 vs 由下而上", "3C / 4P：情境分析的起手式"] },
        { t: "p", v: "但切記：框架是地圖，不是答案。面試官最怕你硬套框架卻不思考。" },
      ],
    },
    b4: {
      id: "b4", slug: "tech-interview-mindset", category: "面試技巧",
      title: "技術面試不是考你會不會，而是看你怎麼想",
      excerpt: "白板題卡住不是世界末日。分享我面試官視角最在意的三件事，以及怎麼把「不會」講成加分。",
      author: "chen-boyu", date: "2026/05/08", readTime: 6, views: 1620, likes: 121,
      content: [
        { t: "h2", v: "面試官在看什麼" },
        { t: "p", v: "當過幾次面試官後我發現：能不能寫出最佳解其實沒那麼重要，重要的是你的溝通、拆解問題的方式，以及卡住時的反應。" },
        { t: "h3", v: "卡住時這樣做" },
        { t: "ul", v: ["先複述題目，確認需求與邊界條件", "講出你的暴力解，再討論怎麼優化", "邊寫邊講，讓面試官跟得上你的思路"] },
        { t: "quote", v: "沉默是技術面試最大的扣分，思考要說出來。" },
        { t: "p", v: "把面試當成一場 pair programming，而不是考試，你會放鬆很多。" },
      ],
    },
    b5: {
      id: "b5", slug: "system-design-101", category: "技能提升",
      title: "新手也能懂的系統設計入門",
      excerpt: "系統設計題不是要你當架構師，而是看你會不會釐清需求、估算規模、做取捨。三步驟帶你建立框架。",
      author: "chen-boyu", date: "2026/04/15", readTime: 8, views: 1340, likes: 98,
      content: [
        { t: "h2", v: "別急著畫架構圖" },
        { t: "p", v: "最常見的錯誤是一聽到題目就開始畫 box。先停下來，把需求與規模問清楚，後面的設計才有依據。" },
        { t: "h3", v: "三步驟" },
        { t: "ul", v: ["釐清需求：功能、規模、讀寫比例", "估算數字：QPS、儲存量、頻寬", "畫架構並說明每個取捨的理由"] },
        { t: "p", v: "記得：系統設計沒有標準答案，講清楚你為什麼這樣選，比選什麼更重要。" },
      ],
    },
    b6: {
      id: "b6", slug: "personal-brand-from-zero", category: "技能提升",
      title: "從 0 開始經營個人品牌，第一個月該做什麼",
      excerpt: "不用等到很厲害才開始。分享我帶學生啟動個人品牌的第一個月行動清單，與三個最常見的卡關。",
      author: "huang-shihan", date: "2026/05/20", readTime: 6, views: 2480, likes: 215,
      content: [
        { t: "h2", v: "個人品牌不是炫耀，是累積" },
        { t: "p", v: "很多人覺得要等到「夠厲害」才能開始經營。其實剛好相反——把你正在學的東西記錄下來，本身就是最好的內容。" },
        { t: "h3", v: "第一個月行動清單" },
        { t: "ul", v: ["決定一個主題與目標受眾", "每週固定產出 2 則貼文", "觀察數據，找出哪種內容互動最高"] },
        { t: "quote", v: "穩定產出 30 天，比偶爾爆紅一次更有價值。" },
        { t: "p", v: "別怕沒人看，前期就是練手感、建立節奏。" },
      ],
    },
    b7: {
      id: "b7", slug: "social-media-portfolio", category: "職涯規劃",
      title: "把你經營的帳號，變成行銷履歷的亮點",
      excerpt: "做過的社群、辦過的活動，都是面試的籌碼。教你怎麼把日常成果整理成讓面試官眼睛一亮的案例。",
      author: "huang-shihan", date: "2026/04/28", readTime: 5, views: 1760, likes: 134,
      content: [
        { t: "h2", v: "面試官想看數據，不是感覺" },
        { t: "p", v: "「我經營過社群」太模糊。把它變成：經營 X 帳號 N 個月，粉絲從 A 成長到 B，互動率提升 C%。" },
        { t: "h3", v: "整理成案例的格式" },
        { t: "ul", v: ["背景與目標", "你做了什麼", "可量化的成果"] },
        { t: "p", v: "一份有三個案例的作品集，勝過十行空泛的自我介紹。" },
      ],
    },
    b8: {
      id: "b8", slug: "validate-before-build", category: "其他",
      title: "創業別急著做產品，先去找 10 個用戶聊天",
      excerpt: "好題目是問出來的。分享我驗證創業題目的方法，以及怎麼問問題才不會得到客套的假答案。",
      author: "wang-kaicheng", date: "2026/05/06", readTime: 7, views: 1180, likes: 89,
      content: [
        { t: "h2", v: "最貴的錯誤是做出沒人要的東西" },
        { t: "p", v: "我第一次創業花了半年做產品，上線後才發現沒人需要。第二次，我先花兩週跟 20 個潛在用戶聊天。" },
        { t: "h3", v: "怎麼問才有用" },
        { t: "ul", v: ["問過去的行為，不要問未來的意願", "問他現在怎麼解決這個問題、花多少時間", "別介紹你的產品，先聽他的痛點"] },
        { t: "quote", v: "「你會用嗎」得到的都是客套，「你上次怎麼解決的」才是真相。" },
        { t: "p", v: "驗證過再動手，你會省下大把時間與金錢。" },
      ],
    },
    b9: {
      id: "b9", slug: "portfolio-tells-story", category: "技能提升",
      title: "好的作品集，是會說故事的設計決策",
      excerpt: "別只放漂亮的最終畫面。帶你用『問題 → 思考 → 取捨 → 成果』的結構，讓作品集替你說話。",
      author: "li-siyu", date: "2026/05/16", readTime: 6, views: 1990, likes: 168,
      content: [
        { t: "h2", v: "面試官看的是過程，不是結果" },
        { t: "p", v: "兩份作品集最終畫面一樣漂亮，但能拿到 offer 的那份，通常把『為什麼這樣設計』講得很清楚。" },
        { t: "h3", v: "每個案例的骨架" },
        { t: "ul", v: ["問題：你要解決什麼", "研究：你怎麼理解使用者", "取捨：你考慮過哪些方案、為什麼選這個", "成果：上線後的數據或回饋"] },
        { t: "quote", v: "設計的價值在決策，不在像素。" },
        { t: "p", v: "把草稿、被否決的版本也放上來，那才是你思考的證據。" },
      ],
    },
    b10: {
      id: "b10", slug: "ux-first-job", category: "職涯規劃",
      title: "設計系新鮮人的第一份工作怎麼選",
      excerpt: "大公司還是新創？接案還是內部團隊？分享我的判斷標準，以及第一份工作最該累積的東西。",
      author: "li-siyu", date: "2026/04/24", readTime: 5, views: 1280, likes: 96,
      content: [
        { t: "h2", v: "第一份工作要累積的是判斷力" },
        { t: "p", v: "薪水重要，但第一份工作真正值錢的是：有沒有人帶你、能不能參與完整的產品流程。" },
        { t: "h3", v: "我的判斷標準" },
        { t: "ul", v: ["團隊有沒有資深設計師可以學", "能不能碰到完整的設計流程", "產品有沒有真實用戶"] },
        { t: "p", v: "別只看公司名氣，看你三年後會變成什麼樣的設計師。" },
      ],
    },
    b11: {
      id: "b11", slug: "ib-internship-apply", category: "職涯規劃",
      title: "金融業實習申請：時程、Networking 與技術面試",
      excerpt: "投行申請季很短，準備卻要很早。整理金融業實習的完整時間軸，與冷信、技術面試的實戰建議。",
      author: "chang-jhewei", date: "2026/05/02", readTime: 8, views: 1420, likes: 110,
      content: [
        { t: "h2", v: "投行求職贏在準備得早" },
        { t: "p", v: "很多人以為大三才開始準備就好，但頂尖投行的暑期實習，往往大二下就要開始 Networking。" },
        { t: "h3", v: "三個重點" },
        { t: "ul", v: ["時程：提早一年開始，別等職缺開放", "Networking：客製化冷信，問具體問題", "技術面試：估值三法與財報要練熟"] },
        { t: "quote", v: "冷信不要問『可以給我建議嗎』，要問『關於 X，您當時怎麼判斷』。" },
        { t: "p", v: "金融業很吃資訊與人脈，越早開始累積越有優勢。" },
      ],
    },
  },

  /* =================== ActivityData（主辦活動） =================== */
  events: {
    e1: { id: "e1", type: "工作坊", typeIcon: "presentation-line", title: "外商求職實戰工作坊（第 6 屆）", date: "2026/05/18", venue: "台北・線下", fee: "NT$ 600", past: true, showcase: { headline: "42 人完訓，滿意度 4.8 / 5", rating: 4.8, count: 38 } },
    e2: { id: "e2", type: "講座", typeIcon: "mic-line", title: "履歷健診 Open Office Hour", date: "2026/04/27", venue: "線上 Google Meet", fee: "免費", past: true, showcase: { headline: "每月固定場・累積 200+ 份履歷", rating: 4.9, count: 64 } },
    e3: { id: "e3", type: "交流活動", typeIcon: "cup-line", title: "Coffee Chat：顧問業學長姐經驗談", date: "2026/06/28", venue: "線上", fee: "NT$ 200", past: false },
    e4: { id: "e4", type: "工作坊", typeIcon: "code-s-slash-line", title: "新手工程師技術面試衝刺營", date: "2026/05/10", venue: "線上", fee: "NT$ 800", past: true, showcase: { headline: "35 人參與，模擬面試演練", rating: 4.7, count: 31 } },
    e5: { id: "e5", type: "工作坊", typeIcon: "palette-line", title: "個人品牌實戰工作坊", date: "2026/05/24", venue: "台北・線下", fee: "NT$ 500", past: true, showcase: { headline: "滿座 50 人，現場帳號健診", rating: 4.8, count: 47 } },
    e6: { id: "e6", type: "講座", typeIcon: "video-line", title: "短影音腳本企劃講座", date: "2026/07/05", venue: "線上", fee: "免費", past: false },
    e7: { id: "e7", type: "交流活動", typeIcon: "rocket-line", title: "學生創業者小聚", date: "2026/05/05", venue: "台北・線下", fee: "免費", past: true, showcase: { headline: "30 位學生創業者交流", rating: 4.6, count: 26 } },
    e8: { id: "e8", type: "工作坊", typeIcon: "pencil-ruler-2-line", title: "UI/UX 設計入門工作坊", date: "2026/04/22", venue: "台北・線下", fee: "NT$ 700", past: true, showcase: { headline: "40 人完訓，Figma 實作", rating: 4.9, count: 36 } },
    e9: { id: "e9", type: "工作坊", typeIcon: "line-chart-line", title: "投行求職 Networking 工作坊", date: "2026/06/12", venue: "台北・線下", fee: "NT$ 900", past: false },
  },

  navTabs: [
    { text: "論壇", icon: "chat-1-line", href: "https://internx.me/zh-tw/dashboard/forum", external: true },
    { text: "話題牆", icon: "discuss-line", href: "https://staging.internx.me/zh-tw/dashboard/needs-wall", external: true },
    { text: "人脈", icon: "group-2-line", href: "https://internx.me/zh-tw/dashboard/connection", external: true },
    { text: "活動", icon: "suitcase-line", href: "/activities", key: "activities" },
    { text: "心得", icon: "sparkling-line", href: "https://internx.me/zh-tw/dashboard/featured", external: true },
    { text: "創作者", icon: "quill-pen-line", href: "/creators", key: "creator" },
  ],
};
