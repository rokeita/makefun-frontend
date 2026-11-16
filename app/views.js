// The four pages, each a function from API data to HTML. All values are escaped
// before they reach the page; links are the only thing that leaves the app.

import { bytes, date, esc, money, pct, plural, timeLeft } from './format.js';

/** The reward as it stands now: the prize plus any entry fees paid into it. */
export function pot(b) {
  return money(b.potUsd ?? b.rewardAmount);
}

/** The entry fee, when the bounty charges one. */
export function fee(b) {
  return b.entryFeeUsd ? `${money(b.entryFeeUsd)} fee` : 'no fee';
}

/** Whether a bounty still takes entries: its deadline, not its status alone. */
export function takesEntries(b) {
  return b.status === 'open' && new Date(b.deadline).getTime() > Date.now();
}

function bountyLink(b) {
  return `<a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a>`;
}

/** One board row: title, live pot, fee, time left, entries. */
export function boardRow(b) {
  const open = takesEntries(b);
  const soon = open && new Date(b.deadline).getTime() - Date.now() < 86400000;
  return `<li class="row">
    <div class="row-title">${bountyLink(b)}
      <span class="cat">${esc(b.category || '')}</span>
      ${soon ? '<span class="badge closing">closing soon</span>' : ''}
      ${open ? '' : '<span class="badge ended">entries closed</span>'}
    </div>
    <div class="row-meta">
      <span class="pot" title="Live pot: reward plus entry fees paid">${pot(b)}</span>
      <span>${fee(b)}</span>
      <span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span>
      <span>${plural(b.submissionCount, 'entry')}</span>
    </div>
  </li>`;
}

/** The board shell: controls are rendered once, rows are filled by app.js so typing never loses focus. */
export function boardShell() {
  return `<h1>Open bounties</h1>
  <p class="lede">Live bounties on make.fun. Each reward is its live pot — the prize plus every entry fee paid into it.</p>
  <form class="controls" id="board-controls" role="search" aria-label="Filter bounties">
    <label>Search <input type="search" id="board-search" placeholder="Search bounties…" autocomplete="off"></label>
    <label>Show
      <select id="board-filter">
        <option value="open">Open for entries</option>
        <option value="closing">Closing within 24 hours</option>
        <option value="all">All listed</option>
      </select>
    </label>
    <label>Sort by
      <select id="board-sort">
        <option value="deadline">Closing soonest</option>
        <option value="pot">Biggest pot</option>
        <option value="entries">Most entries</option>
      </select>
    </label>
    <button type="button" id="board-refresh">Refresh</button>
  </form>
  <p id="board-count" role="status"></p>
  <ul class="board" id="board-rows"></ul>
  <section class="lookup" aria-labelledby="lookup-h">
    <h2 id="lookup-h">Look up an account</h2>
    <form id="lookup-form">
      <label>Handle <input id="lookup-handle" placeholder="royal-keita" autocomplete="off" spellcheck="false"></label>
      <button type="submit">View profile</button>
    </form>
  </section>`;
}

/** A bounty's page: summary, live pot and fee split, dates, rewards, description, rules. */
export function bounty(b) {
  const open = takesEntries(b);
  const potN = Number(b.potUsd ?? b.rewardAmount);
  const rewardN = Number(b.rewardAmount);
  const feesN = Number.isFinite(potN) && Number.isFinite(rewardN) ? Math.max(0, potN - rewardN) : 0;
  const rewards = Array.isArray(b.rewardsNow) ? b.rewardsNow : [];
  const rewardRows = rewards
    .map((r) => `<tr><td>${r.place}</td><td>${money(r.amountUsd)}</td><td>${money(r.feeShareUsd)}</td></tr>`)
    .join('');
  return `<p><a href="#/">← All bounties</a></p>
  <h1>${esc(b.title)}</h1>
  <p class="lede">${esc(b.summary || '')}</p>
  <p>
    ${open ? '<span class="badge open">Open for entries</span>' : '<span class="badge ended">Entries closed</span>'}
    <span class="cat">${esc(b.category || '')}</span>
    ${(b.skills || []).map((s) => `<span class="tag">${esc(s)}</span>`).join(' ')}
  </p>
  <dl class="facts">
    <dt>Live pot</dt><dd><strong>${pot(b)}</strong>${feesN > 0 ? ` — ${money(rewardN)} reward + ${money(feesN)} from ${plural(b.entryFeePayers || 0, 'entry fee')}` : ''}</dd>
    ${b.entryFeeUsd ? `<dt>Entry fee</dt><dd>${money(b.entryFeeUsd)}</dd>` : ''}
    <dt>Deadline</dt><dd>${date(b.deadline)} (<span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span>)</dd>
    <dt>Opened</dt><dd>${date(b.opensAt || b.publishedAt)}</dd>
    <dt>Entries</dt><dd>${plural(b.submissionCount, 'entry')}</dd>
  </dl>
  <p><a class="button" href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard →</a>
  <a class="button" href="https://make.fun/bounty/${encodeURIComponent(b.slug)}">View on make.fun ↗</a></p>
  ${rewardRows ? `<h2>Rewards</h2>
  <table class="rewards"><thead><tr><th scope="col">Place</th><th scope="col">Prize</th><th scope="col">Fee share</th></tr></thead><tbody>${rewardRows}</tbody></table>` : ''}
  <h2>Description</h2>
  <div class="description">${esc(b.description || '')}</div>`;
}

/** A leaderboard: rank, entrant, title, judge win rate, validity, dossier size. */
export function leaderboardRows(entries) {
  return entries
    .map(
      (e) => `<tr>
      <td>${e.rank}</td>
      <td><a href="#/u/${encodeURIComponent(e.handle)}">${esc(e.handle)}</a></td>
      <td>${esc(e.title || '')}</td>
      <td>${pct(e.values && e.values.judge)}</td>
      <td>${e.values && e.values.valid ? '✓' : '—'}</td>
      <td>${bytes(e.values && e.values.bytes)}</td>
    </tr>`,
    )
    .join('');
}

export function leaderboard(data) {
  const c = data.competition || {};
  const entries = Array.isArray(data.entries) ? data.entries : [];
  return `<p><a href="#/bounty/${encodeURIComponent(c.slug)}">← ${esc(c.title || 'Bounty')}</a></p>
  <h1>Leaderboard</h1>
  <p class="lede">${esc(c.title || '')} · ${esc((data.phase && data.phase.title) || '')}${data.phase && data.phase.ends_at ? ` · ends ${date(data.phase.ends_at)}` : ''}</p>
  <p role="status">${plural(entries.length, 'entry')} ranked by judge win rate${data.tie_break ? ` · ties broken by ${esc(data.tie_break.title || 'size')}` : ''}.</p>
  <table class="leader">
    <thead><tr><th scope="col">#</th><th scope="col">Entrant</th><th scope="col">Entry</th><th scope="col">Win rate</th><th scope="col">Valid</th><th scope="col">Size</th></tr></thead>
    <tbody id="leader-rows">${leaderboardRows(entries.slice(0, 25))}</tbody>
  </table>
  ${entries.length > 25 ? `<p><button type="button" id="leader-more">Show more</button></p>` : ''}`;
}

/** An account's public profile: picture, bio, links, record, entries. */
export function profile(p) {
  const img = p.avatar && p.avatar.url ? `https://make.fun${p.avatar.url}` : '';
  const r = p.record || {};
  const links = [
    p.github_login ? `<a href="https://github.com/${encodeURIComponent(p.github_login)}">GitHub</a>` : '',
    p.x ? `<a href="https://x.com/${encodeURIComponent(p.x)}">X</a>` : '',
    p.discord ? `<span>Discord: ${esc(p.discord)}</span>` : '',
    p.wallet && p.wallet.address ? `<a href="${esc(p.wallet.explorer_url || '')}">Wallet</a>` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const solutions = (p.solutions || [])
    .map(
      (s) => `<li>
      <a href="#/bounty/${encodeURIComponent(s.competition.slug)}">${esc(s.competition.title)}</a>
      <span>${s.placement ? `placed #${s.placement}` : 'entered'}${s.prize_usd ? ` · won ${money(s.prize_usd)}` : ''}</span>
    </li>`,
    )
    .join('');
  return `<p><a href="#/">← All bounties</a></p>
  <div class="profile-head">
    ${img ? `<img crossorigin="anonymous" src="${esc(img)}" alt="" width="96" height="96">` : ''}
    <div>
      <h1>@${esc(p.handle)}</h1>
      ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
      ${links ? `<p>${links}</p>` : ''}
      <p class="muted">Joined ${date(p.joined_at)}</p>
    </div>
  </div>
  <dl class="facts stats">
    <dt>Entered</dt><dd>${r.competitions_entered ?? 0}</dd>
    <dt>Placed</dt><dd>${r.competitions_placed ?? 0}</dd>
    <dt>Won</dt><dd>${r.competitions_won ?? 0}</dd>
    <dt>Prize money</dt><dd>${money(r.prize_usd ?? 0)}</dd>
  </dl>
  <h2>Entries</h2>
  ${solutions ? `<ul class="solutions">${solutions}</ul>` : '<p>No entries yet.</p>'}`;
}
