import API from "../api/axios";

// Member avatars are not part of the roster JSON. Each is fetched on demand
// from GET /orgmembers/:id/avatar and kept as an in-memory object URL so a
// member's photo is downloaded at most once per version.
const MAX_CACHED_AVATARS = 250;
const cache = new Map(); // "id:version" -> object URL
const pending = new Map(); // "id:version" -> Promise<string | null>

const keyFor = (memberId, version) => `${memberId}:${version || 0}`;

const rememberAvatar = (key, url) => {
  cache.set(key, url);
  if (cache.size > MAX_CACHED_AVATARS) {
    const oldestKey = cache.keys().next().value;
    const oldestUrl = cache.get(oldestKey);
    cache.delete(oldestKey);
    if (oldestUrl) URL.revokeObjectURL(oldestUrl);
  }
};

export const getCachedMemberAvatar = (memberId, version) =>
  memberId ? cache.get(keyFor(memberId, version)) || null : null;

export const loadMemberAvatar = (memberId, version) => {
  if (!memberId) return Promise.resolve(null);

  const key = keyFor(memberId, version);
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (pending.has(key)) return pending.get(key);

  const request = API.get(`/orgmembers/${memberId}/avatar`, {
    responseType: "blob",
  })
    .then((blob) => {
      if (!(blob instanceof Blob) || blob.size === 0) return null;
      const url = URL.createObjectURL(blob);
      rememberAvatar(key, url);
      return url;
    })
    .catch(() => null)
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, request);
  return request;
};
