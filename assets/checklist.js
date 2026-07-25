/* 串接進度看板 — /checklist
   項目清單來自 assets/checklist-items.json（版控在 repo 裡）；
   勾選狀態與留言存在伺服器（/api/*，PostgreSQL），所以換裝置也看得到同一份進度。 */
(function () {
  "use strict";

  var LABEL = { todo: "未開始", doing: "進行中", done: "已完成", blocked: "卡住" };
  var ORDER = ["todo", "doing", "done", "blocked"];
  // 與 /handoff 的「開發排程：短 / 中 / 長期」同一套分期；group.stage 由 checklist-items.json 帶
  var STAGE = { short: "短期", mid: "中期", long: "長期" };
  var STAGE_SUB = { short: "0–2 個月・立即開工", mid: "2–4 個月", long: "另案排程" };
  var LS_WHO = "handoff_who";
  var LS_KEY = "handoff_key";
  var LS_OPEN = "handoff_open";

  var DEF = { status: "todo", by: "", at: null };

  var items = null;      // checklist-items.json
  var state = null;      // { storage, items:{}, notes:[], writeProtected }
  var filter = "all";
  // /handoff 的排程看板點過來時帶 ?stage=short|mid|long，直接聚焦那一期
  var stage = (location.search.match(/[?&]stage=(short|mid|long)/) || [])[1] || "all";
  var openSet = new Set(JSON.parse(localStorage.getItem(LS_OPEN) || "[]"));
  var root = document.getElementById("ck");

  /* ---------------- helpers ---------------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function who() { return (localStorage.getItem(LS_WHO) || "").trim(); }
  function key() { return localStorage.getItem(LS_KEY) || ""; }

  function fmt(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    if (isNaN(d)) return "";
    var p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function ago(ts) {
    if (!ts) return "";
    var s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (isNaN(s)) return "";
    if (s < 90) return "剛剛";
    if (s < 3600) return Math.round(s / 60) + " 分鐘前";
    if (s < 86400) return Math.round(s / 3600) + " 小時前";
    return Math.round(s / 86400) + " 天前";
  }

  function toast(msg) { if (window.CZ && CZ.toast) CZ.toast(msg); else alert(msg); }

  function groups() {
    return items.groups.filter(function (g) { return stage === "all" || g.stage === stage; });
  }

  function allItems() {
    var out = [];
    groups().forEach(function (g) { g.items.forEach(function (it) { out.push({ group: g, item: it }); }); });
    return out;
  }

  // 不受分期篩選影響的全量，用來算分期分頁上的數字
  function everyItem() {
    var out = [];
    items.groups.forEach(function (g) { g.items.forEach(function (it) { out.push({ group: g, item: it }); }); });
    return out;
  }

  function st(id) { return (state.items && state.items[id]) || DEF; }

  function notesFor(id) {
    return (state.notes || []).filter(function (n) { return n.itemId === id; });
  }

  /* ---------------- server ---------------- */

  function post(path, body) {
    return fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-handoff-key": key() },
      body: JSON.stringify(body || {}),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var err = new Error(j.error || ("HTTP " + r.status));
          err.code = j.error;
          throw err;
        }
        return j;
      });
    });
  }

  function load() {
    return fetch("/api/state?v=" + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (s) { state = s; state.fetchedAt = Date.now(); });
  }

  /* ---------------- write guard ---------------- */

  function guard() {
    if (!who()) {
      toast("請先在上方填「你是誰」，這樣我才知道是誰更新的");
      var el = document.getElementById("whoInput");
      if (el) { el.focus(); el.style.borderColor = "#d8392b"; }
      return false;
    }
    if (state.writeProtected && !key()) {
      toast("請先在上方輸入通行碼並按解鎖");
      var k = document.getElementById("keyInput");
      if (k) { k.focus(); k.style.borderColor = "#d8392b"; }
      return false;
    }
    return true;
  }

  function onWriteError(e) {
    if (e && e.code === "bad_key") {
      localStorage.removeItem(LS_KEY);
      toast("通行碼不正確，請重新輸入");
      render();
    } else {
      toast("儲存失敗：" + (e && e.message ? e.message : "未知錯誤"));
    }
  }

  /* ---------------- actions ---------------- */

  function setStatus(itemId, status) {
    if (!guard()) return;
    var prev = st(itemId);
    state.items[itemId] = { status: status, by: who(), at: new Date().toISOString() };
    render();
    post("/api/status", { itemId: itemId, status: status, by: who() }).catch(function (e) {
      state.items[itemId] = prev;
      render();
      onWriteError(e);
    });
  }

  function addNote(itemId, body, kind) {
    if (!guard()) return Promise.resolve(false);
    return post("/api/note", { itemId: itemId, body: body, author: who(), kind: kind })
      .then(function (r) {
        state.notes.push(r.note);
        if (kind === "blocker" && itemId !== "_general" && st(itemId).status !== "blocked") {
          state.items[itemId] = { status: "blocked", by: who(), at: new Date().toISOString() };
          post("/api/status", { itemId: itemId, status: "blocked", by: who() }).catch(function () {});
        }
        render();
        return true;
      })
      .catch(function (e) { onWriteError(e); return false; });
  }

  function resolveNote(id, resolved) {
    if (!guard()) return;
    var n = state.notes.find(function (x) { return x.id === id; });
    if (n) n.resolved = resolved;
    render();
    post("/api/note/resolve", { id: id, resolved: resolved }).catch(onWriteError);
  }

  /* ---------------- render ---------------- */

  function counts() {
    var c = { todo: 0, doing: 0, done: 0, blocked: 0, total: 0 };
    allItems().forEach(function (x) { c[st(x.item.id).status]++; c.total++; });
    return c;
  }

  function lastUpdated() {
    var t = 0;
    // 只看清單裡還存在的項目 —— 清單改版後留在資料庫的舊 id 不該左右「最後更新」時間
    var live = {};
    everyItem().forEach(function (x) { live[x.item.id] = true; });
    Object.keys(state.items || {}).forEach(function (k2) {
      if (!live[k2]) return;
      var v = new Date(state.items[k2].at).getTime();
      if (v > t) t = v;
    });
    (state.notes || []).forEach(function (n) {
      var v = new Date(n.at).getTime();
      if (v > t) t = v;
    });
    return t ? new Date(t).toISOString() : null;
  }

  function renderPanel(c) {
    var pct = function (n) { return c.total ? (n / c.total * 100).toFixed(2) + "%" : "0%"; };
    var lu = lastUpdated();
    var w = esc(who());
    var locked = state.writeProtected && !key();

    return '' +
      '<div class="ckPanel">' +
        '<div class="ckPanelHead">' +
          '<div>' +
            '<div class="ckBig">' + c.done + ' <small>／ ' + c.total + ' 項已完成</small></div>' +
            '<div class="ckHint" style="margin-top:4px">' +
              (lu ? '最後更新 ' + esc(fmt(lu)) + '（' + esc(ago(lu)) + '）' : '還沒有人更新過') +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="btn btn-white btn-small" id="btnRefresh"><i class="ri-refresh-line"></i> 重新整理</button>' +
            '<button class="btn btn-white btn-small" id="btnCopy"><i class="ri-clipboard-line"></i> 複製摘要</button>' +
          '</div>' +
        '</div>' +
        '<div class="ckBar">' +
          '<i class="done" style="width:' + pct(c.done) + '"></i>' +
          '<i class="doing" style="width:' + pct(c.doing) + '"></i>' +
          '<i class="blocked" style="width:' + pct(c.blocked) + '"></i>' +
        '</div>' +
        '<div class="ckLegend">' +
          ['all', 'todo', 'doing', 'done', 'blocked'].map(function (f) {
            var n = f === 'all' ? c.total : c[f];
            var label = f === 'all' ? '全部' : LABEL[f];
            return '<button class="ckCount' + (filter === f ? ' on' : '') + '" data-f="' + f + '">' +
              (f === 'all' ? '' : '<span class="dot"></span>') + label + ' ' + n + '</button>';
          }).join('') +
        '</div>' +
        '<div class="ckWho">' +
          '<div class="ckField"><label for="whoInput">你是誰（會標在每次更新上）</label>' +
            '<input id="whoInput" type="text" placeholder="例：阿哲" value="' + w + '" maxlength="40" /></div>' +
          (locked
            ? '<div class="ckField"><label for="keyInput">通行碼</label>' +
              '<input id="keyInput" type="password" placeholder="向 Jean 索取" maxlength="80" /></div>' +
              '<button class="btn btn-small" id="btnUnlock"><i class="ri-lock-unlock-line"></i> 解鎖</button>'
            : (state.writeProtected
                ? '<div class="ckHint" style="padding-bottom:9px"><i class="ri-lock-unlock-line" style="color:#1a9e5c"></i> 已解鎖，可以更新進度</div>'
                : '')) +
        '</div>' +
      '</div>';
  }

  function renderBlockers() {
    // 出現在這裡的條件：狀態標成「卡住」，或是有還沒解決的問題留言 —— 兩者都需要 Jean 回。
    // 不受分期篩選影響：卡住的東西不管在哪一期都要浮上來。
    var blocked = everyItem().filter(function (x) {
      if (st(x.item.id).status === "blocked") return true;
      return notesFor(x.item.id).some(function (n) { return n.kind === "blocker" && !n.resolved; });
    });
    var openGeneral = (state.notes || []).filter(function (n) {
      return n.itemId === "_general" && n.kind === "blocker" && !n.resolved;
    });
    if (!blocked.length && !openGeneral.length) return "";

    var rows = blocked.map(function (x) {
      var ns = notesFor(x.item.id).filter(function (n) { return !n.resolved; });
      var last = ns[ns.length - 1];
      return '<div class="ckAlertRow">' +
        '<div class="t">' + esc(x.item.title) + '</div>' +
        (last ? '<div class="q">' + esc(last.body) + '</div><div class="m">' + esc(last.author || "") + '・' + esc(fmt(last.at)) + '</div>'
              : '<div class="m">標成卡住，還沒寫下問題</div>') +
        '<div style="margin-top:8px"><button class="btn btn-white btn-small ckJump" data-id="' + esc(x.item.id) + '">看這項 →</button></div>' +
      '</div>';
    }).join("");

    var gRows = openGeneral.map(function (n) {
      return '<div class="ckAlertRow">' +
        '<div class="t">其他問題</div>' +
        '<div class="q">' + esc(n.body) + '</div>' +
        '<div class="m">' + esc(n.author || "") + '・' + esc(fmt(n.at)) + '</div>' +
      '</div>';
    }).join("");

    return '<div class="ckAlert">' +
      '<h2><i class="ri-error-warning-line"></i> 需要你回覆 ' + (blocked.length + openGeneral.length) + ' 件</h2>' +
      '<p class="sub">標成「卡住」或還沒解決的問題留言都會列在這裡。處理完按「標為已解決」就會消失。</p>' +
      rows + gRows +
    '</div>';
  }

  function renderItem(g, it) {
    var s = st(it.id);
    var ns = notesFor(it.id);
    var openBlockers = ns.filter(function (n) { return n.kind === "blocker" && !n.resolved; }).length;
    var isOpen = openSet.has(it.id);
    var show = filter === "all" || s.status === filter;

    return '<div class="ckItem' + (isOpen ? ' open' : '') + (show ? '' : ' hide') + '" data-s="' + s.status + '" data-id="' + esc(it.id) + '">' +
      '<div class="ckRow" data-toggle="' + esc(it.id) + '">' +
        '<div class="ckMark">' + (s.status === "done" ? '<i class="ri-check-line"></i>' : s.status === "blocked" ? '<i class="ri-close-line"></i>' : s.status === "doing" ? '<i class="ri-loader-4-line"></i>' : '') + '</div>' +
        '<div class="ckMain">' +
          '<div class="ckTitle">' + esc(it.title) + '</div>' +
          '<div class="ckMeta">' +
            '<span class="ckRef">' + esc(it.ref) + '</span>' +
            (it.note ? '<span class="ckBadge staging"><i class="ri-information-line"></i> 有提醒</span>' : '') +
            (openBlockers ? '<span class="ckBadge blocker">' + openBlockers + ' 個問題待回</span>' : '') +
            (ns.length && !openBlockers ? '<span class="ckBadge note">' + ns.length + ' 則留言</span>' : '') +
            (s.at ? '<span class="ckWhen">' + esc(LABEL[s.status]) + '・' + esc(s.by || "") + ' ' + esc(ago(s.at)) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<i class="ri-arrow-down-s-line ckCaret"></i>' +
      '</div>' +
      '<div class="ckBody">' +
        '<p class="ckDetail">' + esc(it.detail) + '</p>' +
        (it.note ? '<div class="ckWarn" style="margin-bottom:12px"><i class="ri-information-line"></i> ' + esc(it.note) + '</div>' : '') +
        '<div class="ckAccept"><b>怎樣算做完：</b>' + esc(it.accept) + '</div>' +
        '<div class="ckStates">' +
          ORDER.map(function (v) {
            return '<button class="ckState' + (s.status === v ? ' on' : '') + '" data-v="' + v + '" data-set="' + esc(it.id) + '">' + LABEL[v] + '</button>';
          }).join('') +
        '</div>' +
        '<div class="ckNotes">' +
          ns.map(renderNote).join('') +
          '<div class="ckAdd">' +
            '<textarea placeholder="卡在哪裡？需要什麼資訊或決策？（會顯示給 Jean）" data-note="' + esc(it.id) + '"></textarea>' +
            '<div class="ckAddBtns">' +
              '<button class="btn btn-small" style="background:#d8392b" data-send="' + esc(it.id) + '" data-kind="blocker"><i class="ri-error-warning-line"></i> 回報問題</button>' +
              '<button class="btn btn-white btn-small" data-send="' + esc(it.id) + '" data-kind="note"><i class="ri-chat-1-line"></i> 一般留言</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderNote(n) {
    return '<div class="ckNote ' + (n.kind === "blocker" ? "blocker" : "") + (n.resolved ? " resolved" : "") + '">' +
      '<div class="nh">' +
        '<b>' + esc(n.author || "匿名") + '</b>' +
        '<span>' + esc(fmt(n.at)) + '</span>' +
        (n.kind === "blocker" ? '<span class="ckBadge blocker">問題</span>' : '') +
        (n.resolved ? '<span class="ckBadge note">已解決</span>' : '') +
        '<button class="na" data-resolve="' + n.id + '" data-to="' + (n.resolved ? "0" : "1") + '">' +
          (n.resolved ? "標回未解決" : "標為已解決") + '</button>' +
      '</div>' +
      '<div class="nb">' + esc(n.body) + '</div>' +
    '</div>';
  }

  // 分期分頁 —— 和 /handoff「開發排程：短 / 中 / 長期」是同一套分期，數字則是即時的
  function renderStageTabs() {
    var tabs = ["all", "short", "mid", "long"].map(function (s) {
      var pool = items.groups.filter(function (g) { return s === "all" || g.stage === s; });
      var total = 0, done = 0;
      pool.forEach(function (g) {
        g.items.forEach(function (it) { total++; if (st(it.id).status === "done") done++; });
      });
      return '<button class="ckStageTab' + (stage === s ? " on" : "") + '" data-stage="' + s + '">' +
        '<b>' + (s === "all" ? "全部階段" : STAGE[s]) + '</b>' +
        '<span>' + (s === "all" ? "計畫全貌" : STAGE_SUB[s]) + '</span>' +
        '<em>' + done + '／' + total + '</em>' +
      '</button>';
    }).join("");
    return '<div class="ckStageBar">' + tabs + '</div>';
  }

  function renderGroup(g) {
    var done = g.items.filter(function (it) { return st(it.id).status === "done"; }).length;
    var visible = g.items.filter(function (it) { return filter === "all" || st(it.id).status === filter; }).length;
    return '<div class="ckGroup" id="' + esc(g.id) + '"' + (visible ? '' : ' style="display:none"') + '>' +
      '<div class="ckGroupHead">' +
        '<h3>' + esc(g.title) + '</h3>' +
        (g.stage ? '<span class="ckStagePill s-' + esc(g.stage) + '">' + esc(STAGE[g.stage] || "") + '・' + esc(g.weeks || "") + '</span>' : '') +
        '<span class="sum">' + esc(g.summary) + '</span>' +
        '<span class="frac">' + done + '／' + g.items.length + '</span>' +
      '</div>' +
      g.items.map(function (it) { return renderItem(g, it); }).join('') +
    '</div>';
  }

  function renderGeneral() {
    var ns = notesFor("_general");
    return '<div class="ckGroup">' +
      '<div class="ckGroupHead"><h3>其他問題／整體留言</h3>' +
        '<span class="sum">不屬於上面任何一項的疑問、建議或環境問題寫這裡。</span></div>' +
      '<div style="padding:14px 18px 18px">' +
        (ns.length ? ns.map(renderNote).join('') : '<p class="ckHint" style="margin:0 0 8px">還沒有留言。</p>') +
        '<div class="ckAdd">' +
          '<textarea placeholder="例：拿不到 staging 的 Firebase 權限、規格哪裡看不懂⋯" data-note="_general"></textarea>' +
          '<div class="ckAddBtns">' +
            '<button class="btn btn-small" style="background:#d8392b" data-send="_general" data-kind="blocker"><i class="ri-error-warning-line"></i> 回報問題</button>' +
            '<button class="btn btn-white btn-small" data-send="_general" data-kind="note"><i class="ri-chat-1-line"></i> 一般留言</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function render() {
    var c = counts();
    var warn = "";
    if (state.storage === "file") {
      warn = '<div class="ckWarn"><i class="ri-alert-line"></i> 目前寫入的是暫存檔（沒連上資料庫），重新部署後進度可能遺失。請告知 Jean 檢查 DATABASE_URL。</div>';
    } else if (state.storage === "error") {
      warn = '<div class="ckWarn"><i class="ri-alert-line"></i> 資料庫讀取失敗：' + esc(state.error || "") + '。請先別更新，告知 Jean。</div>';
    }

    root.innerHTML =
      warn +
      renderPanel(c) +
      renderBlockers() +
      renderStageTabs() +
      '<div class="ckToolbar"><span class="ckHint"><i class="ri-book-2-line"></i> 分期與週次沿用 <a href="/handoff#roadmap">開發排程</a>；每項的規格出處寫在標籤上，完整內容看 <a href="/handoff#doc">交接文件</a>。</span></div>' +
      groups().map(renderGroup).join('') +
      renderGeneral();

    wire();
  }

  /* ---------------- events ---------------- */

  function wire() {
    root.querySelectorAll("[data-toggle]").forEach(function (el) {
      el.addEventListener("click", function () {
        var id = el.dataset.toggle;
        if (openSet.has(id)) openSet.delete(id); else openSet.add(id);
        localStorage.setItem(LS_OPEN, JSON.stringify(Array.from(openSet)));
        var item = root.querySelector('.ckItem[data-id="' + CSS.escape(id) + '"]');
        if (item) item.classList.toggle("open", openSet.has(id));
      });
    });

    root.querySelectorAll("[data-set]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        setStatus(el.dataset.set, el.dataset.v);
      });
    });

    root.querySelectorAll("[data-send]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = el.dataset.send;
        var ta = root.querySelector('textarea[data-note="' + CSS.escape(id) + '"]');
        var text = ta && ta.value.trim();
        if (!text) { toast("先寫一下內容"); ta && ta.focus(); return; }
        el.disabled = true;
        addNote(id, text, el.dataset.kind).then(function (ok) {
          el.disabled = false;
          if (ok) { openSet.add(id); toast(el.dataset.kind === "blocker" ? "問題已送出，Jean 打開這頁就會看到" : "留言已送出"); }
        });
      });
    });

    root.querySelectorAll("[data-resolve]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        resolveNote(Number(el.dataset.resolve), el.dataset.to === "1");
      });
    });

    root.querySelectorAll(".ckCount").forEach(function (el) {
      el.addEventListener("click", function () { filter = el.dataset.f; render(); });
    });

    root.querySelectorAll(".ckStageTab").forEach(function (el) {
      el.addEventListener("click", function () {
        stage = el.dataset.stage;
        // 網址跟著走，這樣分享連結就能直接指到某一期
        var url = location.pathname + (stage === "all" ? "" : "?stage=" + stage);
        history.replaceState(null, "", url);
        render();
      });
    });

    root.querySelectorAll(".ckJump").forEach(function (el) {
      el.addEventListener("click", function () {
        var id = el.dataset.id;
        openSet.add(id);
        localStorage.setItem(LS_OPEN, JSON.stringify(Array.from(openSet)));
        filter = "all";
        stage = "all";   // 卡住的項目可能不在目前篩選的分期，先解除篩選才跳得到
        render();
        var t = root.querySelector('.ckItem[data-id="' + CSS.escape(id) + '"]');
        if (t) t.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    var whoEl = document.getElementById("whoInput");
    if (whoEl) {
      whoEl.addEventListener("input", function () {
        localStorage.setItem(LS_WHO, whoEl.value.trim());
        whoEl.style.borderColor = "";
      });
    }

    var unlock = document.getElementById("btnUnlock");
    if (unlock) {
      var tryKey = function () {
        var k = document.getElementById("keyInput").value.trim();
        if (!k) return;
        fetch("/api/check-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: k }),
        }).then(function (r) {
          if (r.ok) { localStorage.setItem(LS_KEY, k); toast("已解鎖，可以更新進度了"); render(); }
          else toast("通行碼不正確");
        });
      };
      unlock.addEventListener("click", tryKey);
      document.getElementById("keyInput").addEventListener("keydown", function (e) {
        if (e.key === "Enter") tryKey();
      });
    }

    var rf = document.getElementById("btnRefresh");
    if (rf) rf.addEventListener("click", function () { load().then(render).then(function () { toast("已更新"); }); });

    var cp = document.getElementById("btnCopy");
    if (cp) cp.addEventListener("click", copySummary);
  }

  function copySummary() {
    // 摘要一律涵蓋全部階段，不受目前篩選影響
    var all = everyItem();
    var c = { done: 0, doing: 0, blocked: 0, total: all.length };
    all.forEach(function (x) { var s = st(x.item.id).status; if (c[s] != null) c[s]++; });
    var lines = ["實習通 串接進度（" + fmt(new Date().toISOString()) + "）",
      "完成 " + c.done + "／" + c.total + "　進行中 " + c.doing + "　卡住 " + c.blocked, ""];
    items.groups.forEach(function (g) {
      var done = g.items.filter(function (it) { return st(it.id).status === "done"; }).length;
      lines.push("【" + g.title + "】" + done + "／" + g.items.length);
      g.items.forEach(function (it) {
        var s = st(it.id);
        if (s.status === "todo") return;
        lines.push("  " + (s.status === "done" ? "[x]" : s.status === "blocked" ? "[!]" : "[~]") + " " + it.title);
      });
    });
    var blocked = everyItem().filter(function (x) { return st(x.item.id).status === "blocked"; });
    if (blocked.length) {
      lines.push("", "卡住的項目：");
      blocked.forEach(function (x) {
        var ns = notesFor(x.item.id).filter(function (n) { return !n.resolved; });
        var last = ns[ns.length - 1];
        lines.push("  - " + x.item.title + (last ? "：" + last.body.replace(/\n/g, " ") : ""));
      });
    }
    lines.push("", location.origin + "/checklist");
    var text = lines.join("\n");
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .then(function () { toast("摘要已複製，可以貼到 LINE"); })
      .catch(function () { window.prompt("複製這段：", text); });
  }

  /* ---------------- boot ---------------- */

  Promise.all([
    fetch("/assets/checklist-items.json?v=" + Date.now()).then(function (r) { return r.json(); }),
    load(),
  ]).then(function (r) {
    items = r[0];
    render();
    // /checklist#payout-club 這種連結直接跳到該階段
    var anchor = location.hash.slice(1);
    if (anchor) {
      var target = document.getElementById(anchor);
      if (target) target.scrollIntoView({ block: "start" });
    }
  }).catch(function (e) {
    root.innerHTML = '<div class="ckWarn"><i class="ri-alert-line"></i> 載入失敗：' + esc(e.message) + '</div>';
  });

  // 有人在另一台機器更新時，切回分頁會自動抓最新的
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && state && Date.now() - state.fetchedAt > 20000) load().then(render);
  });
})();
