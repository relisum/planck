interface BoardSearchProps {
  value: string
  onChange: (value: string) => void
}

export function BoardSearch({ value, onChange }: BoardSearchProps) {
  return (
    <div className="board-search">
      <svg
        className="board-search__icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="4.5" />
        <path d="M10.5 10.5L14 14" strokeLinecap="round" />
      </svg>
      <input
        className="board-search__input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Поиск досок..."
        aria-label="Поиск досок"
      />
      {value && (
        <button
          className="board-search__clear"
          onClick={() => onChange('')}
          aria-label="Очистить поиск"
        >
          ×
        </button>
      )}
    </div>
  )
}