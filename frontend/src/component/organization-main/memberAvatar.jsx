import { useEffect, useRef, useState } from "react";
import {
  getCachedMemberAvatar,
  loadMemberAvatar,
} from "../../util/memberAvatar";

// Renders a member avatar that is fetched only once it scrolls into view.
// While loading — or when the member has no photo — it shows the fallback
// (usually the member's initials) so large rosters never download every image.
export default function MemberAvatar({
  memberId,
  hasAvatar = false,
  version = 0,
  alt = "",
  imgClassName,
  wrapperClassName = "shrink-0",
  children,
}) {
  // `loaded` remembers the last fetch result together with the member version
  // it belongs to, so a stale image never flashes for a different member.
  const [loaded, setLoaded] = useState(null);
  const wrapperRef = useRef(null);

  const key = `${memberId}:${version || 0}`;
  const cached = hasAvatar ? getCachedMemberAvatar(memberId, version) : null;
  const url = cached || (loaded && loaded.key === key ? loaded.url : null);

  useEffect(() => {
    if (!hasAvatar || url) return undefined;

    const node = wrapperRef.current;
    if (!node) return undefined;

    let cancelled = false;
    const load = () => {
      loadMemberAvatar(memberId, version).then((loadedUrl) => {
        if (!cancelled && loadedUrl) setLoaded({ key, url: loadedUrl });
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      load();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [memberId, hasAvatar, url, version, key]);

  return (
    <div ref={wrapperRef} className={wrapperClassName}>
      {url ? <img src={url} alt={alt} className={imgClassName} /> : children}
    </div>
  );
}
