/* =====================================================================
   創作者專區 Demo — 卡片渲染 helper（保持各頁一致）
   ===================================================================== */
(function () {
  const D = window.CZ_DATA;
  const R = (window.CZ = window.CZ || {});

  // 空狀態保險卡（任一分頁無資料時的友善提示）
  R.emptyState = function (opts) {
    opts = opts || {};
    const cta = opts.ctaText
      ? `<a class="btn btn-white btn-small esCta" href="${opts.ctaHref || '#'}"${opts.ctaHref ? '' : ' onclick="CZ.toast(\'平台既有功能\');return false"'}><i class="ri-${opts.ctaIcon || 'add-line'}"></i> ${opts.ctaText}</a>`
      : "";
    return `<div class="emptyState">
      <div class="esIcon"><i class="ri-${opts.icon || 'inbox-line'}"></i></div>
      <h4>${opts.title || '還沒有內容'}</h4>
      <p>${opts.desc || ''}</p>${cta}
    </div>`;
  };

  // 角色標章膠囊（沿用 ProfileBadge）
  R.badgePill = function (creator, opts) {
    opts = opts || {};
    const gold = creator.role === "verified-creator";
    const icon = creator.role === "industry-expert" ? "briefcase-4-line"
      : creator.role === "collaboration-partner" ? "handshake-line" : "quill-pen-line";
    const cls = gold ? "profileBadgePillGold" : "profileBadgePillBlue";
    const compact = opts.compact ? "profileBadgePillCompact" : "";
    const click = opts.clickable ? `clickable" onclick="event.preventDefault();event.stopPropagation();CZ.showPitch('${creator.id}')` : "";
    return `<span class="profileBadgePill ${cls} ${compact} ${click}"><span class="pillEmoji"><i class="ri-${icon}"></i></span><span class="pillLabel">${creator.roleLabel}</span></span>`;
  };

  // 創作者目錄卡
  R.creatorCard = function (c) {
    const tags = (c.specialties || []).flatMap(s => s.skills).slice(0, 3)
      .map(s => `<span class="cz-tag-mini">${s}</span>`).join("");
    return `
      <a class="cz-creator-card" href="/creator?id=${c.id}">
        <div class="cz-cc-top">
          ${R.avatar(c.initials, c.color, 60, "cz-cc-avatar")}
          <div style="min-width:0">
            <div class="cz-cc-name">${c.name} ${R.badgePill(c, { compact: true })}</div>
            <div class="cz-cc-headline">${c.headline}</div>
          </div>
        </div>
        <p class="cz-cc-bio">${c.bio}</p>
        <div class="cz-cc-tags">${tags}</div>
        <div class="cz-cc-foot">
          <span class="m"><i class="ri-user-heart-line"></i> <b>${(c.followers||0).toLocaleString()}</b> 追蹤</span>
          <span class="m"><i class="ri-article-line"></i> <b>${(c.blogs||[]).length}</b> 文章</span>
          <span class="m"><i class="ri-calendar-event-line"></i> <b>${(c.hostedEvents||[]).length}</b> 活動</span>
        </div>
      </a>`;
  };

  // 部落格卡
  R.blogCard = function (b) {
    const author = D.creators[b.author];
    return `
      <a class="postCard" href="/blog-article?id=${b.id}">
        <div class="postTextContent">
          <span class="postCategory">${b.category}</span>
          <h3 class="postTitle">${b.title}</h3>
          <p class="postExcerpt">${b.excerpt}</p>
          <div class="postMeta">
            <span class="postAuthor">${author ? author.name : ""}</span>
            <span>${b.date}</span>
            <span><i class="ri-time-line"></i> ${b.readTime} 分鐘</span>
          </div>
          <div class="postStats">
            <span class="stat"><i class="ri-eye-line"></i> ${(b.views||0).toLocaleString()}</span>
            <span class="stat"><i class="ri-heart-line"></i> ${b.likes||0}</span>
          </div>
        </div>
        <div class="postImage"><i class="ri-quill-pen-line"></i></div>
      </a>`;
  };

  // 活動卡（過往辦過的活動）
  R.activityCard = function (e) {
    const past = e.past;
    const showcase = past && e.showcase ? `
      <div class="showcasePanel">
        <div class="showcaseHeadline">${e.showcase.headline.replace(/[，,、]\s*滿意度.*$/, '')}</div>
        <div class="showcaseMeta"><span><i class="ri-star-fill" style="color:#e2a200"></i> ${e.showcase.rating} / 5</span><span>回饋 ${e.showcase.count} 份</span></div>
      </div>` : `
      <div class="activityMeta">
        <span class="m"><i class="ri-money-dollar-circle-line"></i> ${e.fee}</span>
        <span class="m"><i class="ri-map-pin-line"></i> ${e.venue}</span>
      </div>`;
    return `
      <a class="activityCard" href="#" onclick="CZ.toast('活動詳情為平台既有頁面 /activity/[id]');return false">
        <div class="activityImage">
          <i class="ri-${e.typeIcon}"></i>
          <span class="typeTag ${past?"past":""}"><i class="ri-${e.typeIcon}"></i> ${e.type}</span>
        </div>
        <div class="activityBody">
          <div class="activityDate">${e.date}・${e.venue}</div>
          <h3 class="activityTitle">${e.title}</h3>
          ${showcase}
        </div>
      </a>`;
  };

  // 社群連結 chip（LinkedIn / IG）
  R.socialChip = function (link) {
    return `<a class="socialLinkChip" href="${link.url}" target="_blank" rel="noopener"><i class="ri-${link.icon}"></i><span class="platformName">${link.label}</span><span class="username">${link.username}</span></a>`;
  };

  // 專長分類群組（SkillGroup）
  R.skillGroups = function (specialties) {
    return (specialties || []).map(g => `
      <div class="skillGroup">
        <div class="skillGroupTitle">${g.category}</div>
        <div class="skillTags">${g.skills.map(s => `<span class="chip">${s}</span>`).join("")}</div>
      </div>`).join("");
  };
})();
