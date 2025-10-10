import { FiSearch, FiTrendingUp } from 'react-icons/fi'
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

  const inputClass = "w-full px-3 py-2 glass-card rounded-lg focus:ring-2 focus:ring-white/30 focus:border-fleur-border-strong outline-none text-white placeholder-white/40 transition-all"
  
  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center glass-card">
            <FiSearch className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-white hover:text-white/80 font-semibold underline transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-white/70 mb-2">
            Search Caption
          </label>
          <input
            type="text"
            value={filters.searchText}
            onChange={(e) => updateFilter('searchText', e.target.value)}
            placeholder="Search captions..."
            className={inputClass}
          />
        </div>

        {/* Date Range Start */}
        <div>
          <label className="block text-sm font-semibold text-white/70 mb-2">
            From Date
          </label>
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Date Range End */}
        <div>
          <label className="block text-sm font-semibold text-white/70 mb-2">
            To Date
          </label>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Duration Bucket */}
        <div>
          <label className="block text-sm font-semibold text-white/70 mb-2">
            Duration
          </label>
          <select
            value={filters.durationBucket}
            onChange={(e) => updateFilter('durationBucket', e.target.value)}
            className={inputClass}
          >
            <option value="all">All Durations</option>
            <option value="short">&lt;10s (Short)</option>
            <option value="medium">10-20s (Medium)</option>
            <option value="long">&gt;20s (Long)</option>
          </select>
        </div>

        {/* Hashtag Filter */}
        <div>
          <label className="block text-sm font-semibold text-white/70 mb-2">
            Hashtag
          </label>
          <input
            type="text"
            value={filters.hashtag}
            onChange={(e) => updateFilter('hashtag', e.target.value)}
            placeholder="#hashtag"
            className={inputClass}
          />
        </div>

        {/* Top Movers Toggle */}
        <div className="flex items-end">
          <label className="flex items-center space-x-2 cursor-pointer glass-card px-3 py-2 rounded-lg glass-card-hover transition-all">
            <input
              type="checkbox"
              checked={filters.showTopMovers}
              onChange={(e) => updateFilter('showTopMovers', e.target.checked)}
              className="w-4 h-4 text-white border-fleur-border rounded focus:ring-white/30"
            />
            <span className="text-sm font-semibold text-white flex items-center gap-1">
              Top Movers (24h) <FiTrendingUp className="w-4 h-4" />
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}

export default Filters

