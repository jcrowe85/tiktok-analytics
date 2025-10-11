import { FiSearch, FiTrendingUp, FiX } from 'react-icons/fi'
import type { Filters as FilterType } from '../types'

interface FiltersProps {
  filters: FilterType
  setFilters: React.Dispatch<React.SetStateAction<FilterType>>
  setShowFilters: (show: boolean) => void
}

function Filters({ filters, setFilters, setShowFilters }: FiltersProps) {
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
      aiQualityBand: 'all',
    })
  }

  const hasActiveFilters = 
    filters.searchText ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.durationBucket !== 'all' ||
    filters.hashtag ||
    filters.showTopMovers ||
    filters.aiQualityBand !== 'all'

  const modernInputClass = "px-4 py-3 modern-input text-white placeholder-white/50 transition-all text-sm font-medium"
  
  return (
    <div className="mb-8">
      <div className="modern-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/90">Filter Videos</h3>
          <button
            onClick={() => setShowFilters(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all"
            title="Close filters"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={filters.searchText}
            onChange={(e) => updateFilter('searchText', e.target.value)}
            placeholder="Search videos, captions, hashtags..."
            className={`${modernInputClass} pl-12 w-full`}
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
            className={`${modernInputClass} w-36`}
          />
          <span className="text-white/40 text-sm font-medium">to</span>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
            className={`${modernInputClass} w-36`}
          />
        </div>

        {/* Duration */}
        <select
          value={filters.durationBucket}
          onChange={(e) => updateFilter('durationBucket', e.target.value)}
          className={`${modernInputClass} w-32`}
        >
          <option value="all">All Durations</option>
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
          className={`${modernInputClass} w-32`}
        />

        {/* AI Quality Band */}
        <select
          value={filters.aiQualityBand}
          onChange={(e) => updateFilter('aiQualityBand', e.target.value)}
          className={`${modernInputClass} w-36`}
          title="Filter by AI Quality Score"
        >
          <option value="all">All AI Quality</option>
          <option value="pass">✅ Pass (80+)</option>
          <option value="revise">⚠️ Revise (60-79)</option>
          <option value="reshoot">❌ Reshoot (&lt;60)</option>
        </select>

        {/* Top Movers Toggle */}
        <label className="flex items-center gap-3 cursor-pointer modern-input px-4 py-3 transition-all hover:bg-white/8">
          <input
            type="checkbox"
            checked={filters.showTopMovers}
            onChange={(e) => updateFilter('showTopMovers', e.target.checked)}
            className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500/30"
          />
          <span className="text-sm text-white font-medium flex items-center gap-2">
            <FiTrendingUp className="w-4 h-4" />
            Top Movers
          </span>
        </label>

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-all px-4 py-3 rounded-xl hover:bg-white/5 border border-white/10 hover:border-white/20"
            title="Clear all filters"
          >
            <FiX className="w-4 h-4" />
            Clear All
          </button>
        )}
        </div>
      </div>
    </div>
  )
}

export default Filters

