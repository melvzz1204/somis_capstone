import { useEffect, useRef } from "react";
import LogoutButton from "./logoutButton";
import NavCountBadge from "./navCountBadge";

export default function MobileTabBar({
  items,
  activeItem,
  onChange,
  label = "Portal navigation",
}) {
  const navRef = useRef(null);

  // With many portal tabs the bar scrolls horizontally. Keep the selected tab
  // visible instead of leaving it clipped off-screen after a programmatic
  // change (for example when an overview card opens another tab).
  useEffect(() => {
    const activeButton = navRef.current?.querySelector(
      '[data-active="true"]',
    );
    activeButton?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeItem]);

  return (
    <nav ref={navRef} className="mobile-tabbar" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="mobile-tabbar-item"
          data-active={activeItem === item.id}
          aria-current={activeItem === item.id ? "page" : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          <span>{item.shortLabel || item.label}</span>
          {item.count !== undefined && <NavCountBadge count={item.count} />}
        </button>
      ))}
      <LogoutButton variant="mobile" showConfirmModal={true} />
    </nav>
  );
}
