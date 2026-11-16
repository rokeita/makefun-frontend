// A make.fun frontend: the board of live bounties, a page for each bounty, its
// leaderboard and an account's public profile, on hash routes.
//
//   #/                              the board
//   #/bounty/<slug>                 one bounty
//   #/bounty/<slug>/leaderboard     its leaderboard
//   #/u/<handle>                    an account's public profile
//
// window.__shotReady is false while a page loads and true once its data is on
// screen, so a screenshot script knows when to capture. Countdowns tick once
// a second by updating the text of the elements that carry them, never by
// rebuilding the page.

import { getBounties, getBounty, getLeaderboard, getProfile, requestCount } from './api.js';
import { boardRow, boardShell, bounty, leaderboard, leaderboardRows, profile, takesEntries } from './views.js';
import { plural, timeLeft } from './format.js';

const app = document.getElementById('app');
const reqs = document.getElementById('reqs');

function noteRequests() {
  if (reqs) reqs.textContent = `${requestCount()} API request${requestCount() === 1 ? '' : 's'} this session (answers cached, revalidated by ETag)`;
}

function fail(err) {
  app.innerHTML = `<p role="alert">Could not load this page: ${err.message}. <a href="${location.hash || '#/'}">Try again</a></p>`;
  document.title = 'Error | make.fun bounties';
  noteRequests();
  window.__shotReady = true;
}

function focusHeading() {
  const h1 = app.querySelector('h1');
  if (h1) {
    h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: true });
  }
}

// --- Board: the list is re-rendered alone, so typing in the search box never loses focus. ---

let boardData = [];
let boardShown = 0;

function boardVisible() {
  const q = (document.getElementById('board-search').value || '').trim().toLowerCase();
  const filter = document.getElementById('board-filter').value;
  const sort = document.getElementById('board-sort').value;
  const now = Date.now();
  let rows = boardData.filter((b) => {
    if (q && !(b.title || '').toLowerCase().includes(q) && !(b.slug || '').includes(q)) return false;
    if (filter === 'open') return takesEntries(b);
    if (filter === 'closing') return takesEntries(b) && new Date(b.deadline).getTime() - now < 86400000;
    return true;
  });
  const pot = (b) => Number(b.potUsd ?? b.rewardAmount ?? 0);
  if (sort === 'pot') rows.sort((a, b) => pot(b) - pot(a));
  else if (sort === 'entries') rows.sort((a, b) => (b.submissionCount || 0) - (a.submissionCount || 0));
  else rows.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  return rows;
}

function renderBoardRows() {
  const rows = boardVisible();
  document.getElementById('board-rows').innerHTML = rows.map(boardRow).join('') || '<li>No bounties match.</li>';
  document.getElementById('board-count').textContent = `${plural(rows.length, 'bounty')} shown of ${boardData.length} listed.`;
}

async function renderBoard(refresh) {
  if (!refresh) app.innerHTML = boardShell();
  const search = document.getElementById('board-search');
  const filter = document.getElementById('board-filter');
  const sort = document.getElementById('board-sort');
  if (!refresh) {
    search.addEventListener('input', renderBoardRows);
    filter.addEventListener('change', renderBoardRows);
    sort.addEventListener('change', renderBoardRows);
    document.getElementById('board-refresh').addEventListener('click', () => renderBoard(true));
    document.getElementById('lookup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const handle = document.getElementById('lookup-handle').value.trim();
      if (handle) location.hash = `#/u/${encodeURIComponent(handle)}`;
    });
    document.getElementById('board-controls').addEventListener('submit', (e) => e.preventDefault());
  }
  try {
    const data = await getBounties();
    boardData = Array.isArray(data.items) ? data.items : [];
    renderBoardRows();
  } catch (err) {
    if (!refresh) fail(err);
    window.__shotReady = true;
    return;
  }
  document.title = 'make.fun bounties';
  noteRequests();
  window.__shotReady = true;
}

// --- Leaderboard: the first 25 rows, then more on demand. ---

let leaderEntries = [];

function renderLeader(data) {
  leaderEntries = Array.isArray(data.entries) ? data.entries : [];
  app.innerHTML = leaderboard(data);
  const more = document.getElementById('leader-more');
  if (more) {
    more.addEventListener('click', () => {
      const shown = document.querySelectorAll('#leader-rows tr').length;
      const next = leaderEntries.slice(shown, shown + 25);
      document.getElementById('leader-rows').insertAdjacentHTML('beforeend', leaderboardRows(next));
      if (shown + next.length >= leaderEntries.length) more.remove();
    });
  }
}

// --- Router ---

async function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const bountyMatch = hash.match(/^#\/bounty\/([^/]+)(?:\/leaderboard)?\/?$/);
  const profileMatch = hash.match(/^#\/u\/([^/]+)\/?$/);
  app.innerHTML = '<p role="status">Loading…</p>';
  try {
    if (bountyMatch) {
      const slug = decodeURIComponent(bountyMatch[1]);
      if (hash.includes('/leaderboard')) {
        const data = await getLeaderboard(slug);
        renderLeader(data);
        document.title = `Leaderboard: ${(data.competition && data.competition.title) || slug} | make.fun bounties`;
      } else {
        const b = await getBounty(slug);
        app.innerHTML = bounty(b);
        document.title = `${b.title} | make.fun bounties`;
      }
    } else if (profileMatch) {
      const handle = decodeURIComponent(profileMatch[1]);
      const p = await getProfile(handle);
      app.innerHTML = profile(p);
      document.title = `@${p.handle} | make.fun bounties`;
    } else {
      await renderBoard(false);
      focusHeading();
      window.scrollTo(0, 0);
      return;
    }
  } catch (err) {
    fail(err);
    return;
  }
  noteRequests();
  focusHeading();
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

// Countdowns: update the text in place, once a second.
setInterval(() => {
  document.querySelectorAll('[data-deadline]').forEach((el) => {
    el.textContent = timeLeft(el.getAttribute('data-deadline'));
  });
}, 1000);

window.addEventListener('hashchange', render);
render();
