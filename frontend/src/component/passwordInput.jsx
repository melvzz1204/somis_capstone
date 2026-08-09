export default function PasswordInput({
  id,
  value,
  onChange,
  name,
  placeholder,
  autoComplete,
  required = false,
  className = "",
  showPassword,
  onToggleVisibility,
}) {
  const visibilityLabel = showPassword ? "Hide password" : "Show password";

  return (
    <div className="password-field">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        name={name}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={`field-control password-field-control ${className}`}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="password-toggle"
        aria-label={visibilityLabel}
        aria-pressed={showPassword}
        title={visibilityLabel}
      >
        {showPassword ? (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.8 10.8 0 0112 4c5 0 8.5 4 9.5 6.1a4.4 4.4 0 010 3.8 13.7 13.7 0 01-2.1 3M6.6 6.6A14.4 14.4 0 002.5 10a4.4 4.4 0 000 3.9C3.5 16 7 20 12 20a10.7 10.7 0 004.1-.8"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2.5 12S6 5 12 5s9.5 7 9.5 7S18 19 12 19 2.5 12 2.5 12z"
            />
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
          </svg>
        )}
      </button>
    </div>
  );
}
