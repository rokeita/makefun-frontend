// make.fun's public API: read-only GET requests, open to any origin (CORS).
// The full API is described at https://make.fun/api/openapi.json.
//
// Answers are cached in memory and revalidated with ETags: the API binds its
// ETags to the minute, so a cached answer is served without a request while it
// is under a minute old, and after that an If-None-Match revalidation answers
// 304 when nothing changed. `requests` counts real network fetches only.

const API = 'https://make.fun/api';
const FRESH_MS = 60000;

const cache = new Map();
let requests = 0;

/** Real network fetches this session (cache hits do not count). */
export function requestCount() {
  return requests;
}

async function get(path) {
  const url = API + path;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < FRESH_MS) return hit.body;
  const headers = {};
  if (hit && hit.etag) headers['If-None-Match'] = hit.etag;
  requests += 1;
  const res = await fetch(url, { headers });
  if (res.status === 304 && hit) {
    hit.at = Date.now();
    return hit.body;
  }
  if (!res.ok) throw new Error(`make.fun API ${res.status} for ${path}`);
  const body = await res.json();
  cache.set(url, { etag: res.headers.get('ETag'), body, at: Date.now() });
  return body;
}

/** The open bounties: { items: [...] } (activity=times leaves out the activity a board does not show). */
export const getBounties = () => get('/competitions?status=open&activity=times&limit=100');

/** One bounty, by its slug. */
export const getBounty = (slug) => get(`/competitions/${encodeURIComponent(slug)}`);

/** A bounty's leaderboard: { competition, phase, columns, entries: [...] }. */
export const getLeaderboard = (slug) => get(`/competitions/${encodeURIComponent(slug)}/leaderboard`);

/** An account's public profile, by its handle. */
export const getProfile = (handle) => get(`/profiles/${encodeURIComponent(handle)}`);
