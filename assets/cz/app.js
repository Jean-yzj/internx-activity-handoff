/* =====================================================================
   創作者專區 Demo — 共用外框與互動
   - 注入 TopBar / BottomBar / Footer / 手機選單（沿用 internx 結構）
   - 提供 modal / toast / 分頁 / 下拉選單 helper
   ===================================================================== */
(function () {
  const D = window.CZ_DATA;
  const page = document.body.dataset.page || "";

  /* ---------- 小工具 ---------- */
  function h(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function avatar(initials, color, size, cls) {
    return `<div class="avatar ${cls || ""}" style="width:${size}px;height:${size}px;background:${color};font-size:${Math.round(size*0.36)}px">${initials}</div>`;
  }
  window.CZ = window.CZ || {};
  window.CZ.avatar = avatar;

  /* ---------- TopBar ---------- */
  function buildTopBar() {
    const cur = location.pathname.replace(/\.html$/, "").replace(/\/+$/, "");
    const tabs = D.navTabs.map(t => {
      const a = t.href.split("?")[0].replace(/\/+$/, "");
      const sel = (a === cur || (a.length > 1 && cur.startsWith(a))) ? "selected" : "";
      const tgt = t.external ? `target="_blank" rel="noopener"` : "";
      return `<a class="topBarTab ${sel}" href="${t.href}" ${tgt}><i class="ri-${t.icon}"></i><span class="tabText">${t.text}</span></a>`;
    }).join("");

    return h(`
      <div class="topbarOuter">
        <div class="topbar">
          <div class="tb-left"><a class="tb-logo" href="/index" aria-label="InternX 首頁"></a></div>
          <div class="tb-middle"><div class="navIcons">${tabs}</div></div>
          <div class="tb-right">
            <button class="tb-iconbtn" title="搜尋" onclick="CZ.toast('搜尋為平台既有功能')"><i class="ri-search-line"></i></button>
            <div class="notificationButtonContainer">
              <button class="tb-iconbtn" title="通知" onclick="CZ.toast('您有 3 則新通知')"><i class="ri-notification-line"></i></button>
              <span class="notificationDot"></span>
            </div>
            <div class="userMenuButton" id="userMenuBtn">
              ${avatar("訪", "#0182fd", 30, "userMenuAvatar")}
              <i class="ri-arrow-down-s-line" style="font-size:14px;color:#666"></i>
            </div>
            <button class="tb-iconbtn tb-hamburger" id="hamburgerBtn" title="選單"><i class="ri-menu-line"></i></button>
          </div>
        </div>
      </div>`);
  }

  /* ---------- 使用者下拉 ---------- */
  function buildUserDropdown() {
    return h(`
      <div id="userDropdown" style="display:none">
        <div class="userDropdownOverlay" id="userDropdownOverlay"></div>
        <div class="userDropdownPanel">
          <a class="dd-profileCard" href="/creator?id=${D.featured}">
            ${avatar("宥", "#0182fd", 48)}
            <div><div class="dd-name">林宥蓁</div><div class="dd-sub">檢視我的創作者主頁</div></div>
            <i class="ri-arrow-right-s-line" style="color:#666;margin-left:auto"></i>
          </a>
          <div class="sectionLabel">創作者</div>
          <div class="dd-card">
            <a class="dd-button" href="/blog-editor"><i class="ri-quill-pen-line"></i> 撰寫新文章</a>
            <a class="dd-button" href="/creator?id=${D.featured}#events"><i class="ri-calendar-event-line"></i> 我的主辦活動</a>
            <a class="dd-button" href="/register"><i class="ri-verified-badge-line"></i> 創作者認證</a>
          </div>
          <div class="sectionLabel">平台</div>
          <div class="dd-card">
            <a class="dd-button" href="/directory"><i class="ri-compass-3-line"></i> 探索創作者</a>
            <a class="dd-button" href="/spec"><i class="ri-file-list-3-line"></i> 工程交接文件</a>
          </div>
          <a class="dd-logout" href="#" onclick="CZ.toast('Demo 不含登入功能');return false"><i class="ri-logout-box-line"></i> 登出</a>
        </div>
      </div>`);
  }

  /* ---------- 手機選單 ---------- */
  function buildMobileMenu() {
    const items = D.navTabs.map(t => {
      const sel = t.key === "creator" ? "selected" : "";
      const tgt = t.external ? `target="_blank" rel="noopener"` : "";
      return `<a class="${sel}" href="${t.href}" ${tgt}><i class="ri-${t.icon}"></i>${t.text}</a>`;
    }).join("");
    return h(`
      <div class="mobileMenu" id="mobileMenu">
        <div class="mobileMenuPanel">
          <div style="display:flex;justify-content:flex-end;margin-bottom:10px">
            <button class="tb-iconbtn" id="mobileMenuClose"><i class="ri-close-line"></i></button>
          </div>
          ${items}
          <div style="height:1px;background:#eee;margin:10px 0"></div>
          <a href="/directory"><i class="ri-compass-3-line"></i>探索創作者</a>
          <a href="/register"><i class="ri-verified-badge-line"></i>申請認證</a>
          <a href="/spec"><i class="ri-file-list-3-line"></i>工程交接文件</a>
        </div>
      </div>`);
  }

  /* ---------- BottomBar（行動版，創作者專區導覽）---------- */
  function buildBottomBar() {
    const tabs = [
      { text: "專區首頁", icon: "home-5-line", href: "/index", key: "home" },
      { text: "探索", icon: "compass-3-line", href: "/directory", key: "directory" },
      { text: "部落格", icon: "article-line", href: "/blog", key: "blog" },
      { text: "申請認證", icon: "verified-badge-line", href: "/register", key: "register" },
    ];
    return h(`
      <div class="bottomBar">
        <div class="bottomBarContent">
          ${tabs.map(t => `<a class="bottomTab ${page===t.key?"selected":""}" href="${t.href}"><i class="ri-${t.icon}"></i><span class="text">${t.text}</span></a>`).join("")}
        </div>
      </div>`);
  }

  /* ---------- Footer ---------- */
  function buildFooter() {
    return h(`
      <footer class="footer">
        <div class="footerCenter">
          <div class="footerLogoRegion">
            <div class="footerLogo"></div>
            從實習出發，<br>通往理想職涯。
            <div class="footerSocialLinks">
              <a href="https://instagram.com/internx.me" target="_blank" rel="noopener" title="Instagram"><i class="ri-instagram-line"></i></a>
              <a href="mailto:internx.me@gmail.com" title="Email"><i class="ri-mail-line"></i></a>
              <a href="#" title="LINE"><i class="ri-line-line"></i></a>
            </div>
          </div>
          <div class="footerColumn">
            <h3 class="footerColumnTitle">創作者專區</h3>
            <ul>
              <li><a href="/index">專區首頁</a></li>
              <li><a href="/directory">探索創作者</a></li>
              <li><a href="/blog">部落格文章</a></li>
              <li><a href="/register">申請成為創作者</a></li>
            </ul>
          </div>
          <div class="footerColumn">
            <h3 class="footerColumnTitle">實習通，不迷路</h3>
            <ul>
              <li><a href="https://internx.me/zh-tw/dashboard/forum" target="_blank" rel="noopener">開放式實習論壇</a></li>
              <li><a href="https://internx.me/zh-tw/dashboard/connection" target="_blank" rel="noopener">人脈與小夥伴</a></li>
              <li><a href="https://internx.me/zh-tw/dashboard/activities" target="_blank" rel="noopener">職涯活動媒人婆</a></li>
            </ul>
          </div>
          <div class="footerColumn">
            <h3 class="footerColumnTitle">交接文件</h3>
            <ul>
              <li><a href="/spec">前端串接說明</a></li>
              <li><a href="https://internx.me/zh-tw/terms" target="_blank" rel="noopener">服務條款</a></li>
              <li><a href="https://internx.me/zh-tw/privacy" target="_blank" rel="noopener">隱私政策</a></li>
            </ul>
          </div>
        </div>
        <div class="footerBottom">
          <div class="l">© 2026 InternX・創作者專區 Demo（前端交接用）</div>
          <div class="r">internx.me@gmail.com</div>
        </div>
      </footer>`);
  }

  /* ---------- Modal ---------- */
  window.CZ.modal = function (innerHtml) {
    let overlay = document.getElementById("czModal");
    if (!overlay) {
      overlay = h(`<div class="modalOverlay" id="czModal"></div>`);
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) CZ.closeModal(); });
    }
    overlay.innerHTML = `<div class="modal">${innerHtml}</div>`;
    requestAnimationFrame(() => overlay.classList.add("show"));
  };
  window.CZ.closeModal = function () {
    const o = document.getElementById("czModal");
    if (o) o.classList.remove("show");
  };

  /* 認證標章說明彈窗（VerifiedRolePitchModal） */
  window.CZ.showPitch = function (creatorId) {
    const c = D.creators[creatorId];
    if (!c || !c.pitch) { CZ.toast("此標章尚無認證說明"); return; }
    CZ.modal(`
      <div class="modalHero"><span class="profileBadgePill profileBadgePillGold"><span class="pillEmoji"><i class="ri-quill-pen-line"></i></span><span class="pillLabel">${c.roleLabel}</span></span></div>
      <h3>${c.name} 的認證資訊</h3>
      <div class="modalField"><b>所在產業或公司</b><p>${c.pitch.organizationText}</p></div>
      <div class="modalField"><b>相關經歷與說明</b><p>${c.pitch.experienceText}</p></div>
      <div class="modalClose"><button class="btn btn-white btn-small" onclick="CZ.closeModal()">關閉</button></div>
    `);
  };

  /* 檢舉彈窗（對齊既有 ReportPostPopup 結構：原因 + 身分 + 說明 + Email）*/
  const REPORT_REASONS = {
    profile: [
      ["impersonation", "冒用身分／假冒他人"],
      ["unreal", "個人資料含不實資訊"],
      ["harassment", "騷擾或不當內容"],
      ["spam", "廣告或垃圾訊息"],
      ["other", "其他"],
    ],
    blog: [
      ["misinfo", "文章含不實資訊"],
      ["inappropriate", "不當或冒犯內容"],
      ["spam", "廣告或垃圾訊息"],
      ["copyright", "侵犯著作權"],
      ["other", "其他"],
    ],
  };
  const REPORT_ROLES = [["general", "一般使用者"], ["acquaintance", "我認識本人"], ["influenced", "曾與其互動／受影響"]];
  window.CZ.reportModal = function (kind, name) {
    const reasons = REPORT_REASONS[kind] || REPORT_REASONS.profile;
    const label = kind === "blog" ? "文章" : "創作者";
    CZ.modal(`
      <div class="modalHero"><div class="esIcon" style="background:#fde8e6;color:#d8392b"><i class="ri-flag-2-line"></i></div></div>
      <h3>檢舉${label}${name ? `：${name}` : ""}</h3>
      <p class="muted" style="text-align:center;margin:-6px 0 16px;font-size:13px">送出後將由平台管理員審核（對齊既有 reports 流程）。</p>
      <div class="modalField"><b>檢舉原因</b>
        <div id="rptReasons" style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
          ${reasons.map((r, i) => `<label class="reportOpt"><input type="radio" name="rptReason" value="${r[0]}" ${i === 0 ? "checked" : ""}> ${r[1]}</label>`).join("")}
        </div>
      </div>
      <div class="modalField"><b>您的身分</b>
        <select class="input" id="rptRole" style="margin-top:6px">${REPORT_ROLES.map(r => `<option value="${r[0]}">${r[1]}</option>`).join("")}</select>
      </div>
      <div class="modalField"><b>補充說明（選填）</b>
        <textarea class="textArea" id="rptDesc" rows="3" placeholder="請描述具體情況，協助我們審核。" style="margin-top:6px"></textarea>
      </div>
      <div class="modalField"><b>聯絡 Email（選填）</b>
        <input class="input" id="rptEmail" type="email" placeholder="若需回覆審核結果" style="margin-top:6px">
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px">
        <button class="btn btn-white btn-small" onclick="CZ.closeModal()">取消</button>
        <button class="btn btn-small" style="background:#d8392b" onclick="CZ.submitReport()"><i class="ri-send-plane-line"></i> 送出檢舉</button>
      </div>`);
  };
  window.CZ.submitReport = function () {
    CZ.closeModal();
    CZ.toast("檢舉已送出，我們會盡快審核（reports/processed:false）");
  };

  /* ---------- Toast ---------- */
  window.CZ.toast = function (msg) {
    let t = document.getElementById("czToast");
    if (!t) { t = h(`<div class="toast" id="czToast"></div>`); document.body.appendChild(t); }
    t.innerHTML = `<i class="ri-information-line"></i> ${msg}`;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2600);
  };

  /* ---------- 分頁切換 ---------- */
  function wireTabs(root) {
    (root || document).querySelectorAll("[data-tabs]").forEach(group => {
      group.querySelectorAll("[data-tab]").forEach(btn => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.tab;
          group.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("active", b === btn));
          document.querySelectorAll(`[data-pane="${group.dataset.tabs}"]`).forEach(p =>
            p.classList.toggle("active", p.dataset.paneKey === key));
        });
      });
    });
  }
  window.CZ.wireTabs = wireTabs;

  /* ---------- 組裝外框 ---------- */
  function mount() {
    document.body.prepend(buildTopBar());
    document.body.appendChild(buildUserDropdown());
    document.body.appendChild(buildMobileMenu());
    document.body.appendChild(buildBottomBar());
    document.body.appendChild(buildFooter());
    document.body.appendChild(h(`<div class="demoFlag"><i class="ri-flask-line"></i> 前端 Demo・假資料</div>`));

    // 使用者下拉
    const umb = document.getElementById("userMenuBtn");
    const dd = document.getElementById("userDropdown");
    umb && umb.addEventListener("click", () => { dd.style.display = "block"; });
    const ov = document.getElementById("userDropdownOverlay");
    ov && ov.addEventListener("click", () => { dd.style.display = "none"; });

    // 手機選單
    const hb = document.getElementById("hamburgerBtn");
    const mm = document.getElementById("mobileMenu");
    hb && hb.addEventListener("click", () => mm.classList.add("show"));
    const mc = document.getElementById("mobileMenuClose");
    mc && mc.addEventListener("click", () => mm.classList.remove("show"));
    mm && mm.addEventListener("click", (e) => { if (e.target === mm) mm.classList.remove("show"); });

    wireTabs(document);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
