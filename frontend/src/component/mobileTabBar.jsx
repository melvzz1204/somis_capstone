import LogoutButton from "./logoutButton";
import NavCountBadge from "./navCountBadge";

export default function MobileTabBar({
  items,
  activeItem,
  onChange,
  label = "Portal navigation",
}) {
  return (
    <nav className="mobile-tabbar" aria-label={label}>
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
