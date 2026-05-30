import {useTranslation} from "react-i18next";


interface BoardSearchProps {
  value: string
  onChange: (value: string) => void
}

export function BoardSearch({ value, onChange }: BoardSearchProps) {
  const { t } = useTranslation()
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
        placeholder={t('sidebar.search.search-placeholder')}
        aria-label={t('sidebar.search.search')}
      />
      {value && (
        <button
          className="board-search__clear"
          onClick={() => onChange('')}
          aria-label={t('sidebar.search.clear')}
        >
          ×
        </button>
      )}
    </div>
  )
}