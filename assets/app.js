/* 臺灣客家知識體系觀察站 — 前端（無框架，資料來自 data/data.js） */
(function () {
  'use strict';
  const D = window.HKO_DATA;
  const P = D.people;
  const SCH = D.schools;
  const ORDER = ['nuu', 'ncu', 'nycu'];
  const SC = { nuu: 'var(--s-nuu)', ncu: 'var(--s-ncu)', nycu: 'var(--s-nycu)' };
  const HK = new RegExp(D.keywords, 'g');
  const IND = new RegExp(D.indKeywords, 'g');
  const $main = document.getElementById('main');
  const tip = document.getElementById('tip');
  const fmt = n => (n == null ? '—' : Number(n).toLocaleString('zh-TW'));
  const pct = (a, b) => (b ? Math.round(a / b * 1000) / 10 : 0);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hl = (s, re) => esc(s).replace(new RegExp(re.source, 'g'), m => '<mark>' + m + '</mark>');
  document.getElementById('genDate').textContent = ' 資料擷取日期：' + D.generated + '。';

  // theme toggle
  const root = document.documentElement;
  try { const t = localStorage.getItem('hko-theme'); if (t) root.dataset.theme = t; } catch (e) { }
  document.getElementById('themeBtn').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('hko-theme', root.dataset.theme); } catch (e) { }
  });

  // tooltip
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let left = x + 14, top = y + 14;
    if (left + r.width > innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > innerHeight - 8) top = y - r.height - 14;
    tip.style.left = Math.max(8, left) + 'px'; tip.style.top = Math.max(8, top) + 'px';
  }
  const hideTip = () => { tip.hidden = true; };
  document.addEventListener('scroll', hideTip, { passive: true });

  const CATS = D.projCats;
  const MAINCATS = ['國科會', '客委會', '文化部', '教育部'];
  const isActive = p => p.status === 'active';
  const statusLabel = p => p.status === 'retired' ? '退休' : (p.status === 'left' ? '離職' : (p.status === 'former' ? '非現任' : ''));
  const ACT = P.filter(isActive);
  // aggregates
  function agg(list) {
    const a = { n: list.length, withHakkaPub: 0, withHakkaAny: 0, pubs: 0, hakkaPubs: 0, hakkaPubs5y: 0, projects: 0, hakkaProjects: 0, hakkaProjAmt: 0, medals: 0, honors: 0, self: 0, ind: 0, iuc: 0, cat: {} };
    CATS.forEach(c => a.cat[c] = 0);
    list.forEach(p => {
      const s = p.stats;
      if (s.hakkaPubs) a.withHakkaPub++;
      if (s.hakkaPubs || s.hakkaProjects) a.withHakkaAny++;
      a.pubs += s.pubs; a.hakkaPubs += s.hakkaPubs; a.hakkaPubs5y += s.hakkaPubs5y;
      a.projects += s.projects; a.hakkaProjects += s.hakkaProjects; a.hakkaProjAmt += s.hakkaProjAmt;
      a.ind += s.indPubs;
      if (p.medals.length) a.medals++;
      if (p.medals.length || (p.awards || []).length) a.honors++;
      CATS.forEach(c => a.cat[c] += (s.hakkaProjByCat || {})[c] || 0);
      a.iuc += s.hakkaIUC || 0;
      if (p.heritage && p.heritage.self) a.self++;
    });
    return a;
  }
  const bySchool = s => ACT.filter(p => p.school === s);
  const catLine = a => MAINCATS.map(c => `${c} ${a.cat[c]}`).join(' · ') + ` · 其他 ${CATS.filter(c => !MAINCATS.includes(c)).reduce((x, c) => x + a.cat[c], 0)}`;
  const depts = s => [...new Set(bySchool(s).map(p => p.dept))];

  function heritageTags(p) {
    const t = [];
    (p.awards || []).forEach(m => t.push(`<span class="tag award" title="${esc(m.label)}">◆ ${m.year} 客家貢獻獎</span>`));
    if (p.heritage && p.heritage.self) t.push('<span class="tag self" title="本人公開自述">✓ 自述客家淵源</span>');
    p.medals.forEach(m => t.push(`<span class="tag medal" title="${esc(m.label)}">★ ${m.year - 1911}年客家獎章</span>`));
    if (!t.length) t.push('<span class="tag none">未見公開紀錄</span>');
    return t.join('');
  }

  // ---------- views ----------
  function viewHome() {
    const all = agg(ACT), ret = P.filter(p => !isActive(p)), aret = agg(ret);
    let h = `<section class="hero">
      <div class="eyebrow">三校客家學院 · 專任師資研究觀察</div>
      <h1>誰在建構臺灣客家知識體系？</h1>
      <p class="lede">本站彙整國立聯合大學客家研究學院、國立中央大學客家學院、國立陽明交通大學客家文化學院共 ${all.n} 位現任專任教師（另收錄 ${ret.length} 位退休、離職教師）的公開研究紀錄，統計其客家、客語、客庄相關的著作，以及國科會、客委會、文化部、教育部與產學合作等研究計畫。所有數字都可點入個人頁核對逐筆原始條目。</p>
      <div class="kpis">
        <div class="kpi"><div class="v">${all.n}</div><div class="l">現任專任教師</div><div class="s">3 校 · ${new Set(P.map(p => p.school + p.dept)).size} 個系所</div></div>
        <div class="kpi"><div class="v">${all.withHakkaPub}</div><div class="l">有客家相關著作的教師</div><div class="s">占 ${pct(all.withHakkaPub, all.n)}%</div></div>
        <div class="kpi"><div class="v">${fmt(all.hakkaPubs)}</div><div class="l">客家相關著作（篇／冊）</div><div class="s">占全部登錄著作 ${pct(all.hakkaPubs, all.pubs)}%</div></div>
        <div class="kpi"><div class="v">${fmt(all.hakkaProjects)}</div><div class="l">客家相關研究計畫（件）</div><div class="s">國科會 ${all.cat['國科會']} · 客委會 ${all.cat['客委會']} · 其他 ${all.hakkaProjects - all.cat['國科會'] - all.cat['客委會']}｜其中產學合作／委辦 ${all.iuc}</div></div>
      </div>
    </section>`;

    h += `<section class="section"><div class="section-head"><h2>三校比較</h2><p>點選卡片進入該校教師名錄</p></div><div class="cards">`;
    ORDER.forEach(s => {
      const L = bySchool(s), a = agg(L);
      h += `<article class="card" style="--c:${SC[s]}">
        <h3>${SCH[s].name}</h3><div class="sub">${SCH[s].college}</div>
        <dl>
          <dt>現任專任教師</dt><dd>${a.n} 人</dd>
          <dt>有客家相關著作</dt><dd>${a.withHakkaPub} 人（${pct(a.withHakkaPub, a.n)}%）</dd>
          <dt>客家相關著作</dt><dd>${fmt(a.hakkaPubs)} ／ ${fmt(a.pubs)}</dd>
          <dt>近五年（2021–）客家著作</dt><dd>${fmt(a.hakkaPubs5y)}</dd>
          <dt>客家相關研究計畫</dt><dd>${a.hakkaProjects} 件</dd>
          ${MAINCATS.map(c => `<dt style="padding-left:12px;font-size:14px">└ ${c}</dt><dd style="font-weight:500">${a.cat[c]}</dd>`).join('')}
          <dt style="padding-left:12px;font-size:14px">└ 其他機關、企業／法人等</dt><dd style="font-weight:500">${a.hakkaProjects - MAINCATS.reduce((x, c) => x + a.cat[c], 0)}</dd>
          <dt>其中產學合作／委辦案</dt><dd>${a.iuc} 件</dd>
          <dt>獲客家貢獻獎／專業獎章</dt><dd>${a.honors} 人</dd>
          <dt>退休／離職教師（另列）</dt><dd>${P.filter(p => p.school === s && !isActive(p)).length} 人</dd>
        </dl>
        <div class="depts">${depts(s).map(d => { const x = agg(L.filter(p => p.dept === d)); return `<div><span>${esc(d)}</span><span>${x.withHakkaPub}/${x.n} 人</span></div>`; }).join('')}</div>
        <a class="more" href="#/faculty?school=${s}">查看該校教師 →</a>
      </article>`;
    });
    h += `</div></section>`;

    h += `<section class="section"><div class="section-head"><h2>客家研究投入程度</h2><p>同一把尺、三校並列</p></div><div class="grid2">
      <div class="chart" id="c1"></div><div class="chart" id="c2"></div></div>
      <div class="chart" id="c3" style="margin-top:14px"></div></section>`;

    h += `<section class="section"><div class="section-head"><h2>客家相關計畫的來源</h2><p>現任專任教師為主持人或共同主持人、主題與客家／客語／客庄相關的計畫件數</p></div>
      <div class="table-wrap"><table><thead><tr><th>學校</th>${CATS.map(c => `<th class="num">${c}</th>`).join('')}<th class="num">合計</th><th class="num">其中產學合作／委辦</th></tr></thead><tbody>
      ${ORDER.map(s => { const a = agg(bySchool(s)); return `<tr tabindex="0" data-href="#/faculty?school=${s}"><td><span class="dot" style="--c:${SC[s]}"></span>${SCH[s].short}</td>${CATS.map(c => `<td class="num">${a.cat[c] || '·'}</td>`).join('')}<td class="num"><b>${a.hakkaProjects}</b></td><td class="num">${a.iuc}</td></tr>`; }).join('')}
      <tr style="cursor:default"><td><b>三校合計</b></td>${CATS.map(c => `<td class="num"><b>${all.cat[c] || '·'}</b></td>`).join('')}<td class="num"><b>${all.hakkaProjects}</b></td><td class="num"><b>${all.iuc}</b></td></tr>
      </tbody></table></div><p class="note" style="color:var(--muted);font-size:13px;margin:8px 0 0">來源：國科會研究人才查詢（國科會）、政府研究資訊系統 GRB（客委會、文化部、教育部、地方政府等）、中央大學教師履歷平台（高教深耕、產學合作、其他補助）、各系所教師個人頁。依委託或補助機關分欄；「其中產學合作／委辦」另計委辦、委託、勞務或標示為產學合作的計畫（不論機關）。跨來源重複的計畫只算一次。</p></section>`;

    h += `<section class="section"><div class="section-head"><h2>系所一覽</h2><p>依客家相關著作數排序，點選列進入該系所名錄</p></div><div class="table-wrap"><table><thead><tr>
      <th>系所</th><th class="num">教師</th><th class="num">有客家著作</th><th class="num">客家著作</th><th class="num hide-sm">客家著作占比</th><th class="num">客家計畫</th></tr></thead><tbody>`;
    const rows = [];
    ORDER.forEach(s => depts(s).forEach(d => rows.push({ s, d, a: agg(ACT.filter(p => p.school === s && p.dept === d)) })));
    rows.sort((x, y) => y.a.hakkaPubs - x.a.hakkaPubs).forEach(r => {
      h += `<tr tabindex="0" data-href="#/faculty?school=${r.s}&dept=${encodeURIComponent(r.d)}"><td><span class="dot" style="--c:${SC[r.s]}"></span><b>${esc(r.d)}</b><small style="display:block;color:var(--muted);font-size:12px;margin-left:14px">${SCH[r.s].short}</small></td>
        <td class="num">${r.a.n}</td><td class="num">${r.a.withHakkaPub}</td><td class="num">${fmt(r.a.hakkaPubs)}</td><td class="num hide-sm">${pct(r.a.hakkaPubs, r.a.pubs)}%</td><td class="num">${r.a.hakkaProjects}</td></tr>`;
    });
    h += `</tbody></table></div></section>`;

    h += `<section class="section"><div class="callout"><b>關於「客家淵源／客籍」</b>：族群身分屬於個人資料，本站不以姓氏、籍貫或研究主題推論任何人的族群。只有在本人公開自述，或有公開的客家事務表彰紀錄（客家委員會「客家貢獻獎」「客家事務專業獎章」）時，才會標示並附上出處。目前收錄的 ${P.length} 位教師中，有 ${agg(P).honors} 位獲客家貢獻獎或列名於已查核年度的客家事務專業獎章名單，本人公開自述客家淵源的紀錄有 ${agg(P).self} 筆。<a href="#/method">詳見方法說明</a>。</div></section>`;
    $main.innerHTML = h;

    hbarChart(document.getElementById('c1'), '有客家相關著作的教師比例', '分母為該校現任專任教師數', ORDER.map(s => { const a = agg(bySchool(s)); return { s, v: pct(a.withHakkaPub, a.n), sub: `${a.withHakkaPub}/${a.n} 人` }; }));
    hbarChart(document.getElementById('c2'), '客家相關著作占全部登錄著作比例', '分母為國科會研究人才資料登錄之著作總數', ORDER.map(s => { const a = agg(bySchool(s)); return { s, v: pct(a.hakkaPubs, a.pubs), sub: `${a.hakkaPubs}/${a.pubs} 筆` }; }));
    lineChart(document.getElementById('c3'));
    bindRows();
  }

  function hbarChart(el, title, note, data) {
    const max = Math.max(100, ...data.map(d => d.v));
    el.innerHTML = `<h3>${title}</h3><p class="note">${note}</p>` + data.map(d => `
      <div class="hbar" style="--c:${SC[d.s]}" data-tip="${esc(SCH[d.s].name)}：${d.v}%（${d.sub}）">
        <span class="lab">${SCH[d.s].short}</span><span class="track"><span class="fill" style="width:${d.v / max * 100}%"></span></span><span class="val">${d.v}%</span></div>`).join('');
    el.querySelectorAll('.hbar').forEach(b => {
      b.addEventListener('mousemove', e => showTip(b.dataset.tip, e.clientX, e.clientY));
      b.addEventListener('mouseleave', hideTip);
    });
  }

  function lineChart(el) {
    const Y0 = 2000, Y1 = 2025, years = []; for (let y = Y0; y <= Y1; y++) years.push(y);
    const series = ORDER.map(s => { const cnt = {}; bySchool(s).forEach(p => p.pubs.forEach(x => { if (x.hakka && x.year >= Y0 && x.year <= Y1) cnt[x.year] = (cnt[x.year] || 0) + 1; })); return { s, vals: years.map(y => cnt[y] || 0) }; });
    const max = Math.max(...series.flatMap(x => x.vals)); const top = Math.ceil(max / 10) * 10 || 10;
    const W = 1000, H = 300, m = { l: 36, r: 84, t: 14, b: 28 };
    const x = i => m.l + i * (W - m.l - m.r) / (years.length - 1);
    const y = v => m.t + (H - m.t - m.b) * (1 - v / top);
    let g = '';
    for (let t = 0; t <= top; t += top / 5) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" stroke-width="1"/><text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="var(--muted)">${t}</text>`;
    years.forEach((yy, i) => { if (yy % 5 === 0) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="12" fill="var(--muted)">${yy}</text>`; });
    let lines = '', labels = [];
    series.forEach(se => {
      lines += `<path d="${se.vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ')}" fill="none" stroke="${SC[se.s]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      // label at the last year with a value
      labels.push({ s: se.s, yv: y(se.vals[se.vals.length - 1]) });
    });
    labels.sort((a, b) => a.yv - b.yv); for (let i = 1; i < labels.length; i++) if (labels[i].yv - labels[i - 1].yv < 16) labels[i].yv = labels[i - 1].yv + 16;
    const lab = labels.map(l => `<text x="${W - m.r + 8}" y="${l.yv + 4}" font-size="13" fill="var(--ink-2)">${SCH[l.s].short}</text>`).join('');
    el.innerHTML = `<h3>客家相關著作的年度產出</h3><p class="note">依著作出版年份，2000–2025 年，三校專任教師合計（2026 年資料尚不完整，未列入）</p>
      <div class="legend">${ORDER.map(s => `<span><i style="background:${SC[s]}"></i>${SCH[s].name}</span>`).join('')}</div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="三校客家相關著作年度數量折線圖" style="display:block;touch-action:pan-y">
        ${g}<line x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line-2)"/>
        ${lines}${lab}<line id="xh" x1="0" x2="0" y1="${m.t}" y2="${y(0)}" stroke="var(--muted)" stroke-dasharray="3 3" visibility="hidden"/>
        <g id="dots"></g><rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="transparent" id="hit"/></svg>
      <details class="all"><summary>以表格檢視</summary><div class="table-wrap" style="margin-top:8px"><table><thead><tr><th>年</th>${ORDER.map(s => `<th class="num">${SCH[s].short}</th>`).join('')}</tr></thead><tbody>${years.slice().reverse().map((yy) => { const i = yy - Y0; return `<tr style="cursor:default"><td>${yy}</td>${series.map(se => `<td class="num">${se.vals[i]}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div></details>`;
    const svg = el.querySelector('svg'), hit = svg.querySelector('#hit'), xh = svg.querySelector('#xh'), dots = svg.querySelector('#dots');
    function move(e) {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const i = Math.max(0, Math.min(years.length - 1, Math.round((p.x - m.l) / ((W - m.l - m.r) / (years.length - 1)))));
      xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.setAttribute('visibility', 'visible');
      dots.innerHTML = series.map(se => `<circle cx="${x(i)}" cy="${y(se.vals[i])}" r="5" fill="${SC[se.s]}" stroke="var(--surface)" stroke-width="2"/>`).join('');
      showTip(`<b>${years[i]} 年</b><br>` + series.map(se => `${SCH[se.s].short}：${se.vals[i]} 筆`).join('<br>'), e.clientX, e.clientY);
    }
    hit.addEventListener('mousemove', move);
    hit.addEventListener('mouseleave', () => { hideTip(); xh.setAttribute('visibility', 'hidden'); dots.innerHTML = ''; });
  }

  // faculty list
  const state = { q: '', school: '', dept: '', st: '', sort: 'hakkaPubs', dir: -1 };
  function viewFaculty(params) {
    state.school = params.get('school') || ''; state.dept = params.get('dept') || '';
    const deptOpts = ORDER.filter(s => !state.school || s === state.school).flatMap(s => depts(s).map(d => [s, d]));
    $main.innerHTML = `<div class="crumb"><a href="#/">總覽</a> / 師資名錄</div>
      <div class="section-head" style="margin-top:0"><h2>師資名錄</h2><p>預設依客家相關著作數排序；點選任一位教師，查看逐筆佐證資料</p></div>
      <div class="filters">
        <input type="search" id="q" placeholder="搜尋姓名、系所…" value="${esc(state.q)}" aria-label="搜尋">
        <select id="fs" aria-label="學校"><option value="">全部學校</option>${ORDER.map(s => `<option value="${s}" ${s === state.school ? 'selected' : ''}>${SCH[s].name}</option>`).join('')}</select>
        <select id="fd" aria-label="系所"><option value="">全部系所</option>${deptOpts.map(([s, d]) => `<option value="${esc(d)}" ${d === state.dept ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>
        <select id="fst" aria-label="在職狀態"><option value="">全部（含退休、離職）</option><option value="active" ${state.st === 'active' ? 'selected' : ''}>僅現任專任</option><option value="retired" ${state.st === 'retired' ? 'selected' : ''}>僅退休／離職</option></select>
        <span class="count" id="cnt"></span>
      </div>
      <div class="table-wrap"><table><thead><tr>
        <th class="num" title="依客家相關著作數排名">名次</th><th><button data-k="name">姓名</button></th><th class="hide-sm">系所</th>
        <th class="num"><button data-k="hakkaPubs">客家著作 ▼</button></th><th class="num hide-sm"><button data-k="pubs">全部著作 ↕</button></th>
        <th class="num hide-sm"><button data-k="share">占比 ↕</button></th><th class="num"><button data-k="hakkaProjects">客家計畫 ↕</button></th>
        <th>客家淵源紀錄</th></tr></thead><tbody id="tb"></tbody></table></div>`;
    const q = document.getElementById('q'), fs = document.getElementById('fs'), fd = document.getElementById('fd');
    q.addEventListener('input', () => { state.q = q.value; draw(); });
    fs.addEventListener('change', () => { location.hash = '#/faculty' + (fs.value ? '?school=' + fs.value : ''); });
    fd.addEventListener('change', () => { state.dept = fd.value; draw(); });
    const fst = document.getElementById('fst'); fst.addEventListener('change', () => { state.st = fst.value; draw(); });
    $main.querySelectorAll('th button').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; state.dir = state.sort === k ? -state.dir : (k === 'name' ? 1 : -1); state.sort = k; draw(); }));
    function draw() {
      let L = P.filter(p => (!state.school || p.school === state.school) && (!state.dept || p.dept === state.dept) && (!state.st || (state.st === 'active' ? isActive(p) : !isActive(p))) && (!state.q || (p.name + p.dept + SCH[p.school].name + p.title).includes(state.q.trim())));
      // rank by hakka publications (competition ranking), ties broken by hakka projects then total pubs
      const byHakka = (a, b) => (b.stats.hakkaPubs - a.stats.hakkaPubs) || (b.stats.hakkaProjects - a.stats.hakkaProjects) || (b.stats.pubs - a.stats.pubs) || a.name.localeCompare(b.name, 'zh-Hant');
      const rk = {}; L.slice().sort(byHakka).forEach((p, i, arr) => { rk[p.id] = (i && arr[i - 1].stats.hakkaPubs === p.stats.hakkaPubs) ? rk[arr[i - 1].id] : i + 1; });
      const key = p => state.sort === 'name' ? p.name : (p.stats[state.sort] == null ? -1 : p.stats[state.sort]);
      L.sort((a, b) => { const x = key(a), y = key(b); const c = (typeof x === 'string' ? x.localeCompare(y, 'zh-Hant') : x - y) * state.dir; return c || byHakka(a, b); });
      $main.querySelectorAll('th button').forEach(b => { const k = b.dataset.k; if (k !== 'name') b.textContent = b.textContent.replace(/ [▼▲↕]$/, '') + (state.sort === k ? (state.dir < 0 ? ' ▼' : ' ▲') : ' ↕'); });
      document.getElementById('cnt').textContent = `${L.length} 位`;
      document.getElementById('tb').innerHTML = L.map(p => `<tr tabindex="0" data-href="#/p/${encodeURIComponent(p.id)}">
        <td class="num rank">${rk[p.id]}</td><td><a class="nm" href="#/p/${encodeURIComponent(p.id)}"><span class="dot" style="--c:${SC[p.school]}"></span>${esc(p.name)}${statusLabel(p) ? ` <span class="tag ret">${statusLabel(p)}</span>` : ''}<small>${esc(p.title)}<span class="show-sm"> · ${SCH[p.school].short}</span></small></a></td>
        <td class="hide-sm">${SCH[p.school].short}<br><small style="color:var(--muted)">${esc(p.dept)}</small></td>
        <td class="num"><b>${p.stats.hakkaPubs}</b></td><td class="num hide-sm">${p.stats.pubs}</td>
        <td class="num hide-sm">${p.stats.share == null ? '—' : p.stats.share + '%'}<span class="minibar"><b style="width:${p.stats.share || 0}%"></b></span></td>
        <td class="num" title="${esc(CATS.filter(c => p.stats.hakkaProjByCat[c]).map(c => c + ' ' + p.stats.hakkaProjByCat[c]).join('、'))}">${p.stats.hakkaProjects}</td><td>${heritageTags(p)}</td></tr>`).join('') || `<tr><td colspan="8" class="empty">沒有符合條件的教師</td></tr>`;
      bindRows();
    }
    draw();
  }

  function bindRows() {
    $main.querySelectorAll('tr[data-href]').forEach(tr => {
      tr.addEventListener('click', e => { if (e.target.closest('a')) return; location.hash = tr.dataset.href; });
      tr.addEventListener('keydown', e => { if (e.key === 'Enter') location.hash = tr.dataset.href; });
    });
  }

  // person
  function viewPerson(id) {
    const p = P.find(x => x.id === id);
    if (!p) { $main.innerHTML = '<p>找不到這位教師。<a href="#/faculty">回名錄</a></p>'; return; }
    const s = p.stats;
    const hp = p.pubs.filter(x => x.hakka), ip = p.pubs.filter(x => x.ind);
    const hj = p.projects.filter(x => x.hakka), ij = p.projects.filter(x => x.ind);
    const oj = (p.otherProjects || []), hoj = oj.filter(x => x.hakka), ioj = oj.filter(x => x.ind);
    const oLi = (x, re) => `<li><span class="yr">${x.year ? x.year + ' 年' : ''}</span><div><div class="t">${hl(x.title, re)}</div><div class="s">${esc(x.src === '系所個人頁' ? '' : x.agency)}${x.amount ? ` <span class="amt">· NT$ ${fmt(x.amount)}</span>` : ''} · 來源：${(x.srcs || [x.src]).map((sr, i) => `<a href="${esc((x.urls || [x.url])[i])}" target="_blank" rel="noopener">${esc(sr === 'GRB' ? '政府研究資訊系統 GRB' : sr)} ↗</a>`).join('、')}</div><div class="k">${x.kind === '產學合作' ? '<span class="tag iuc">產學合作／委辦</span>' : ''}${(x.kw.length ? x.kw : x.ikw || []).map(k => `<span class="tag">${esc(k)}</span>`).join('')}</div></div></li>`;
    const pubLi = (x, re) => `<li><span class="yr">${esc(x.ym || '')}</span><div><div class="t">${hl(x.title, re)}</div><div class="s">${esc(x.type)}${x.source ? ' · ' + hl(x.source, re) : ''}${x.authors ? ' · ' + esc(x.authors) : ''}</div><div class="k">${(x.kw.length ? x.kw : x.ikw || []).map(k => `<span class="tag">${esc(k)}</span>`).join('')}</div></div></li>`;
    const projLi = (x, re) => `<li><span class="yr">${x.year ? x.year + ' 年度' : ''}</span><div><div class="t">${hl(x.title, re)}</div><div class="s">${esc(x.type)} · 學門：${esc(x.field)} · ${esc(x.role)} <span class="amt">· NT$ ${fmt(x.amount)}</span></div><div class="k">${x.kind === '產學合作' ? '<span class="tag iuc">產學合作／委辦</span>' : ''}${(x.kw.length ? x.kw : x.ikw || []).map(k => `<span class="tag">${esc(k)}</span>`).join('')}</div></div></li>`;
    const her = p.heritage || {};
    let h = `<div class="crumb"><a href="#/">總覽</a> / <a href="#/faculty?school=${p.school}">${SCH[p.school].name}</a> / <a href="#/faculty?school=${p.school}&dept=${encodeURIComponent(p.dept)}">${esc(p.dept)}</a></div>
      <div class="p-head"><div style="flex:1;min-width:240px"><h1>${esc(p.name)}</h1>
        <div class="meta">${statusLabel(p) ? `<span class="tag ret">${statusLabel(p)}</span> ` : ''}<span class="dot" style="--c:${SC[p.school]}"></span>${SCH[p.school].name}${SCH[p.school].college} · ${esc(p.dept)} · ${esc(p.title)}</div>
        <div class="p-links"><a class="btn" href="${esc(p.profile)}" target="_blank" rel="noopener">系所師資頁 ↗</a>${p.nstc ? `<a class="btn" href="${esc(p.nstc)}" target="_blank" rel="noopener">國科會研究人才資料 ↗</a>` : ''}</div></div></div>
      <div class="p-stats">
        <div class="kpi"><div class="v">${s.hakkaPubs}</div><div class="l">客家相關著作</div><div class="s">全部 ${s.pubs} 筆</div></div>
        <div class="kpi"><div class="v">${s.share == null ? '—' : s.share + '%'}</div><div class="l">客家著作占比</div></div>
        <div class="kpi"><div class="v">${s.hakkaPubs5y}</div><div class="l">近五年客家著作</div><div class="s">2021 年以後</div></div>
        <div class="kpi"><div class="v">${s.hakkaProjects}</div><div class="l">客家相關研究計畫</div><div class="s">${CATS.filter(c => s.hakkaProjByCat[c]).map(c => c + ' ' + s.hakkaProjByCat[c]).join(' · ') || '—'}${s.hakkaIUC ? `｜產學合作／委辦 ${s.hakkaIUC}` : ''}</div></div>
        <div class="kpi"><div class="v">${s.hakkaProjAmt ? fmt(Math.round(s.hakkaProjAmt / 1e4)) : '0'}</div><div class="l">客家計畫核定經費（萬元）</div></div>
      </div>`;

    h += `<section class="section"><div class="box"><h3>客家淵源紀錄</h3>`;
    if (her.self) h += `<p><span class="tag self">✓ 本人公開自述</span> ${esc(her.self.quote || '')} ${her.self.url ? `<a href="${esc(her.self.url)}" target="_blank" rel="noopener">出處 ↗</a>` : ''}</p>`;
    else h += `<p class="empty">截至資料擷取日，未查得本人公開自述族群背景的資料。本站不依姓氏、籍貫或研究主題推論族群身分。</p>`;
    if ((p.awards || []).length) h += `<p>${p.awards.map(m => `<span class="tag award">◆ ${esc(m.label)}</span> <a href="${esc(m.url)}" target="_blank" rel="noopener">客家委員會公告 ↗</a>`).join('<br>')}</p><p class="empty" style="font-size:13px">「客家貢獻獎」為客家委員會表彰對客家語言、文化、研究與公共事務有卓越貢獻者的最高榮譽，屬於客家貢獻紀錄，不等同族群身分。</p>`;
    if (p.medals.length) h += `<p>${p.medals.map(m => `<span class="tag medal">★ ${esc(m.label)}</span> <a href="${esc(m.url)}" target="_blank" rel="noopener">客家委員會公告 ↗</a>`).join('<br>')}</p><p class="empty" style="font-size:13px">「客家事務專業獎章」表彰對客家事務的長期專業貢獻，屬於客家參與紀錄，不等同族群身分。本項依公告名單的姓名比對，請以公告原文為準。</p>`;
    h += `</div></section>`;

    h += `<section class="section"><div class="section-head"><h2>客家相關著作 <small style="font-size:15px;color:var(--muted)">${hp.length} 筆</small></h2><p>來源：國科會研究人才查詢 · 著作目錄${p.nstcPubs ? ` · <a href="${esc(p.nstcPubs)}" target="_blank" rel="noopener">原始頁面 ↗</a>` : ''}</p></div>
      <div class="box">${hp.length ? `<ul class="ev-list">${hp.map(x => pubLi(x, HK)).join('')}</ul>` : '<p class="empty">國科會資料中未見標題或刊名含客家關鍵詞的著作。</p>'}</div></section>`;

    h += `<section class="section"><div class="section-head"><h2>客家相關研究計畫 <small style="font-size:15px;color:var(--muted)">${hj.length + hoj.length} 件</small></h2><p>依委託或補助機關分組；跨來源重複者只列一次</p></div>`;
    if (!hj.length && !hoj.length) h += `<div class="box"><p class="empty">未見與客家、客語、客庄相關的計畫紀錄。</p></div>`;
    if (hj.length) h += `<div class="box" style="margin-bottom:10px"><h3>國科會 <small style="font-size:14px;color:var(--muted)">${hj.length} 件 · 來源：國科會研究人才查詢・計畫總覽${p.nstcProj ? ` · <a href="${esc(p.nstcProj)}" target="_blank" rel="noopener">原始頁面 ↗</a>` : ''}</small></h3><ul class="ev-list">${hj.map(x => projLi(x, HK)).join('')}</ul></div>`;
    CATS.filter(c => c !== '國科會').forEach(c => { const L = hoj.filter(x => x.cat === c); if (L.length) h += `<div class="box" style="margin-bottom:10px"><h3>${c} <small style="font-size:14px;color:var(--muted)">${L.length} 件</small></h3><ul class="ev-list">${L.map(x => oLi(x, HK)).join('')}</ul></div>`; });
    h += `</section>`;

    if (ip.length || ij.length || ioj.length) h += `<section class="section"><div class="section-head"><h2>客庄地域／間接相關 <small style="font-size:15px;color:var(--muted)">${ip.length + ij.length + ioj.length} 筆</small></h2><p>標題含客庄地名或客家文化指標詞（如美濃、南庄、桐花、鍾肇政），未計入上方統計</p></div>
      <div class="box"><ul class="ev-list">${ip.map(x => pubLi(x, IND)).join('')}${ij.map(x => projLi(x, IND)).join('')}${ioj.map(x => oLi(x, IND)).join('')}</ul></div></section>`;

    if (p.supp && p.supp.length) h += `<section class="section"><div class="section-head"><h2>系所個人頁補充條目 <small style="font-size:15px;color:var(--muted)">${p.supp.length} 筆</small></h2><p>系所網頁上含客家關鍵詞的著作／計畫列，可能與國科會資料重複，僅供參照、不計入統計 · <a href="${esc(p.profile)}" target="_blank" rel="noopener">原始頁面 ↗</a></p></div>
      <div class="box"><ul class="ev-list">${p.supp.map(t => `<li><span class="yr"></span><div class="t" style="font-weight:400">${hl(t, HK)}</div></li>`).join('')}</ul></div></section>`;

    const others = p.pubs.filter(x => !x.hakka && !x.ind), otherJ = p.projects.filter(x => !x.hakka && !x.ind), otherO = oj.filter(x => !x.hakka && !x.ind);
    if (others.length || otherJ.length || otherO.length) h += `<section class="section"><details class="all"><summary>展開其餘著作 ${others.length} 筆、計畫 ${otherJ.length + otherO.length} 件（未判定為客家相關）</summary><div class="box" style="margin-top:8px"><ul class="ev-list">${others.map(x => pubLi(x, HK)).join('')}${otherJ.map(x => projLi(x, HK)).join('')}${otherO.map(x => oLi(x, HK)).join('')}</ul></div></details></section>`;
    if (!p.pubs.length && !p.projects.length) h += `<section class="section"><div class="callout">這位教師在國科會研究人才系統中沒有公開的著作或計畫資料，因此統計為 0；這不代表沒有客家相關研究，請參考系所個人頁。</div></section>`;
    $main.innerHTML = h;
  }

  function viewMethod() {
    $main.innerHTML = `<div class="crumb"><a href="#/">總覽</a> / 方法與限制</div><article class="prose">
    <h1 style="font-size:32px">方法與限制</h1>
    <h2>1. 師資名單</h2>
    <p>名單取自三校各系所官方網站的「專任師資」頁（${D.generated} 擷取），範圍為：</p>
    <ul>
      <li>國立聯合大學客家研究學院：客家語言與傳播研究所、文化觀光產業學系、文化創意與數位行銷學系</li>
      <li>國立中央大學客家學院：客家語文暨社會科學學系（含系主任、專案教師）、法律與政府研究所</li>
      <li>國立陽明交通大學客家文化學院：人文社會學系、傳播與科技學系</li>
    </ul>
    <p>主要統計只計<b>現任專任教師</b>（不含兼任、合聘、講座）。另收錄<b>退休教師</b>：系所網站列為退休／榮譽教授者、經本站維護者確認已退休者（部分系所網站尚未更新），以及國科會「研究人才查詢」以系所為條件查得、仍登錄於該系所但已不在系所專任名單上的教師。已離開該校者標示為「離職」。退休與離職教師在名錄中加註標籤，可用篩選切換；總覽各項數字只計現任教師。</p>
    <h2>2. 研究成果</h2>
    <p>著作以國家科學及技術委員會「研究人才查詢」的「著作目錄」為統一來源，三校格式一致，能用同一把尺比較。著作目錄由教師自行登錄，完整度因人而異；同一著作重複登錄（同標題、同年份）只算一次。</p>
    <h2>3. 研究計畫的來源</h2>
    <ul>
      <li><b>國科會</b>：國科會研究人才查詢的「計畫總覽」。</li>
      <li><b>客委會、文化部、教育部、地方政府及其他政府機關</b>：政府研究資訊系統（GRB）中以該教師為計畫主持人的計畫，依 GRB 的「計畫主管機關」分類。GRB 以人員代碼區分同名者，只保留與本校系所執行計畫為同一人代碼的資料。GRB 中的國科會／科技部計畫已由國科會資料涵蓋，不重複計入。</li>
      <li><b>產學合作、教育部高教深耕等校內登錄計畫</b>：中央大學「教師履歷平台」的產學合作計畫、高教深耕計畫與其他補助（其他補助未標示委託機關，歸為「其他」）。</li>
      <li><b>系所個人頁</b>：聯合大學三系所、陽明交大人文社會學系與傳播與科技學系教師個人頁中的「研究計畫」「產學合作計畫」等段落（中央大學系所網站沒有教師個人頁，改用教師履歷平台），依文中的委託／補助機關分類。</li>
      <li><b>產學合作／委辦</b>：與委託機關分開計算。凡教師列於「產學合作」段落、標示委辦／委託／勞務，或委託單位為企業、財團法人、基金會、協會的計畫，都標為產學合作／委辦（例如客家委員會委辦的客庄村史輔導、督導訪查計畫），但標明「學術補助」者除外。國科會產學合作類計畫也計入。</li>
    </ul>
    <p>不同來源的同一計畫（標題相同或相互包含）只算一次。限制：陽明交大學術成果平台有機器人驗證、聯合大學沒有公開的計畫查詢系統，因此兩校的產學合作計畫取自教師個人頁；未在個人頁列出計畫的教師，產學合作可能低估。</p>
    <h2>4. 「客家相關」的判定</h2>
    <p><b>著作</b>：標題或收錄出處（刊名、出版者）出現下列任一關鍵詞，即判定為客家相關。因此刊登於《全球客家研究》、《客家研究》等期刊的論文也會計入。</p>
    <p><code>${esc(D.keywords)}</code></p>
    <p><b>計畫</b>：國科會學門代碼為「客家研究」、計畫名稱或關鍵詞含上述關鍵詞，或主管機關為客家委員會、地方客家事務機關。</p>
    <p><b>客庄地域／間接相關</b>：只含客庄地名或客家文化指標詞（下列），但沒有上述關鍵詞的條目另外列出，<b>不計入</b>主要統計，供讀者自行判斷：</p>
    <p><code>${esc(D.indKeywords)}</code></p>
    <p>關鍵詞判定是可檢驗、可重現的規則，但必然有誤差：未在標題點出客家的客家研究會被漏算，標題提到客家但重點不在客家的作品則會被計入。每位教師的個人頁都列出被計入的每一筆資料，方便核對。</p>
    <h2>5. 客家淵源／客籍</h2>
    <p>族群身分屬於個人資料。本站<b>不</b>依姓氏、籍貫、出生地或研究主題推論任何人的族群，只在下列情況標示並附上出處：</p>
    <ul>
      <li><b>本人公開自述</b>：本人在公開受訪、自傳、著作序言、個人網頁等處說明自己具客家背景（存放於 <code>data/heritage.json</code>，每筆須附原文與網址）。</li>
      <li><b>客家貢獻獎</b>：客家委員會公告的歷屆得主（終身貢獻獎、傑出成就獎、特別貢獻獎），依 ${D.awardSources.map(m => `<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.label)}</a>`).join('、')} 比對。屬客家貢獻紀錄，不等同族群身分。</li>
      <li><b>客家事務專業獎章</b>：列名於客家委員會公告的獲獎名單。這是客家事務貢獻的紀錄，不等同族群身分；比對方式為姓名比對，同名者可能誤判。已查核的名單：${D.medalSources.map(m => `<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.label)}</a>`).join('、')}。更早年度的名單尚未納入。</li>
    </ul>
    <p>「未見公開紀錄」只表示本站尚未查到公開資料，<b>不代表</b>當事人不具客家淵源。歡迎教師本人或知情者提供公開出處，以更新資料。</p>
    <h2>6. 重現與更新</h2>
    <p>擷取與分析程式放在儲存庫的 <code>tools/</code> 目錄；原始擷取資料在 <code>data/raw/</code>，網站使用的資料在 <code>data/data.json</code>。說明見 README。</p>
    </article>`;
  }

  // router
  function route() {
    hideTip();
    const hsh = location.hash || '#/';
    const [path, qs] = hsh.slice(1).split('?');
    const params = new URLSearchParams(qs || '');
    let nav = 'home';
    if (path.startsWith('/p/')) { viewPerson(decodeURIComponent(path.slice(3))); nav = 'faculty'; }
    else if (path === '/faculty') { viewFaculty(params); nav = 'faculty'; }
    else if (path === '/method') { viewMethod(); nav = 'method'; }
    else viewHome();
    document.querySelectorAll('.nav a').forEach(a => { if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', route);
  route();
})();
