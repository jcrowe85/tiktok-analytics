import { FiSearch, FiTrendingUp, FiX } from 'react-icons/fi'
import type { Filters as FilterType } from '../types'

interface FiltersProps {
  filters: FilterType
  setFilters: React.Dispatch<React.SetStateAction<FilterType>>
}

function Filters({ filters, setFilters }: FiltersProps) {
  const updateFilter = (key: keyof FilterType, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      searchText: '',
      dateRange: { start: '', end: '' },
      durationBucket: 'all',
      hashtag: '',
      showTopMovers: false,
    })
  }

  const hasActiveFilters = 
    filters.searchText ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.durationBucket !== 'all' ||
    filters.hashtag ||
    filters.showTopMovers

  const compactInputClass = "px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/40 outline-none text-white placeholder-white/50 transition-all text-sm"
  
  return (
    <div className="mb-6">
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={filters.searchText}
            onChange={(e) => updateFilter('searchText', e.target.value)}
            placeholder="Search..."
            className={`${compactInputClass} pl-9 w-48`}
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
            className={`${compactInputClass} w-32`}
          />
          <span className="text-white/40 text-sm">to</span>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
            className={`${compactInputClass} w-32`}
          />
        </div>

        {/* Duration */}
        <select
          value={filters.durationBucket}
          onChange={(e) => updateFilter('durationBucket', e.target.value)}
          className={`${compactInputClass} w-28`}
        >
          <option value="all">All</option>
          <option value="short">&lt;10s</option>
          <option value="medium">10-20s</option>
          <option value="long">&gt;20s</option>
        </select>

        {/* Hashtag */}
        <input
          type="text"
          value={filters.hashtag}
          onChange={(e) => updateFilter('hashtag', e.target.value)}
          placeholder="#hashtag"
          className={`${compactInputClass} w-24`}
        />

        {/* Top Movers Toggle */}
        <label className="flex items-center gap-2 cursor-pointer bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 transition-all">
          <input
            type="checkbox"
            checked={filters.showTopMovers}
            onChange={(e) => updateFilter('showTopMovers', e.target.checked)}
            className="w-3 h-3 text-white border-fleur-border rounded focus:ring-white/30"
          />
          <span className="text-sm text-white flex items-center gap-1">
            Top Movers <FiTrendingUp className="w-3 h-3" />
          </span>
        </label>

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
            title="Clear all filters"
          >
            <FiX className="w-3 h-3" />
            Clear
          </button>
        )}
        </div>
      </div>
    </div>
  )
}

export default Filters

