# Design System - Fleur-Inspired Glass Morphism

This TikTok Analytics dashboard now uses the same design language as the Fleur React Native app for a consistent, cohesive experience across both platforms.

## Color Palette

### Background
- **Primary Dark**: `#120d0a` - Deep brown-black base
- **Background Image**: `dashboard.png` at 50% opacity overlay
- Used as the main background color throughout the app with a subtle textured background

### Glass Effects
- **Glass Background**: `rgba(255, 255, 255, 0.08)` - Subtle white overlay
- **Glass Hover**: `rgba(255, 255, 255, 0.12)` - Interactive glass effect
- **Border Default**: `rgba(255, 255, 255, 0.20)` - Subtle white borders
- **Border Strong**: `rgba(255, 255, 255, 0.35)` - Emphasized borders

### Typography
- **Text Primary**: `#ffffff` - Pure white for headings
- **Text Secondary**: `rgba(255, 255, 255, 0.70)` - 70% opacity for labels
- **Text Tertiary**: `rgba(255, 255, 255, 0.60)` - 60% opacity for hints
- **Text Disabled**: `rgba(255, 255, 255, 0.40)` - 40% opacity for disabled

## Components

### Glass Cards
All cards use the glassmorphism effect:
```css
background: rgba(255, 255, 255, 0.08);
border: 1px solid rgba(255, 255, 255, 0.20);
border-radius: 16px;
backdrop-filter: blur(10px);
```

### Buttons
- **Primary Actions**: Glass card with border-strong on hover
- **Rounded Pills**: `border-radius: 9999px` for pill-shaped buttons
- **Icon Dots**: Circular 22-32px containers with glass background

### Form Inputs
- Glass card background
- White text with placeholder at 40% opacity
- Focus state: 2px white/30% ring + border-strong

### Badges & Pills
- Glass card background
- Rounded-full (pill shape)
- White text with border for emphasis
- Used for: engagement rates, hashtags, status indicators

### Modal/Overlays
- **Backdrop**: `bg-black/70` with `backdrop-blur-sm`
- **Content**: Glass card with `border-fleur-border-strong`
- **Max width**: 2xl for detail views

## Typography Scale

### Headings
- **H1/Page Title**: `text-2xl font-bold text-white`
- **H2/Section**: `text-xl font-bold text-white`
- **H3/Card Title**: `text-lg font-bold text-white`

### Body Text
- **Primary**: `text-sm font-medium text-white`
- **Secondary**: `text-sm text-white/70`
- **Caption**: `text-xs text-white/60`

### Data Display
- **Large Numbers**: `text-2xl font-bold text-white`
- **Metrics**: `text-lg font-bold text-white`
- **Labels**: `text-sm font-semibold text-white/70`

## Spacing

### Cards
- **Padding**: 14-16px (p-4 or p-6 depending on content density)
- **Gap**: 10-14px between elements
- **Margin Bottom**: 8px (mb-8) for sections

### Grid Layouts
- **Overview**: 4 columns on lg, 2 on md, 1 on mobile
- **Filters**: 4 columns on lg, 2 on md, 1 on mobile
- **Gap**: 16px (gap-4)

## Border Radius

- **Cards**: 16px
- **Buttons/Inputs**: 8-12px
- **Pills/Badges**: 9999px (fully rounded)
- **Icons**: 50% (circular)
- **Modal**: 16px

## Shadows & Effects

### Backdrop Blur
Used on:
- Glass cards: `backdrop-filter: blur(10px)`
- Modal overlays: `backdrop-blur-sm`

### Hover States
- Increase glass opacity: `0.08 → 0.12`
- Strengthen border: `0.20 → 0.35`
- Add `transition-all` for smooth animations

### Focus States
- Ring: `focus:ring-2 focus:ring-white/30`
- Border: `focus:border-fleur-border-strong`

## Icons & Emojis

### Section Headers
Each section has an icon in a circular glass container:
- 📊 Performance Overview
- 🔍 Filters
- 🎥 Videos
- 📈 Analytics

### Stat Indicators
- 👁️ Views
- ❤️ Likes
- 💬 Comments
- 🔄 Shares
- ⚡ Velocity
- 📅 Cadence

## Custom Tailwind Classes

### Added to `tailwind.config.js`:
```javascript
colors: {
  'fleur-dark': '#120d0a',
  'fleur-glass': 'rgba(255, 255, 255, 0.08)',
  'fleur-glass-hover': 'rgba(255, 255, 255, 0.12)',
  'fleur-border': 'rgba(255, 255, 255, 0.20)',
  'fleur-border-strong': 'rgba(255, 255, 255, 0.35)',
}
```

### Utility Classes in CSS:
- `.glass-card` - Standard glass morphism card
- `.glass-card-hover` - Hover state for interactive cards

## Accessibility

### Contrast Ratios
- White text on dark background exceeds WCAG AA standards
- Minimum opacity for readable text: 70%
- Interactive elements have distinct hover states

### Focus Indicators
- Visible focus rings on all interactive elements
- Color: `white/30` with 2px width

### Scrollbars
- Custom styled to match dark theme
- Visible but subtle
- Hover state for better feedback

## Responsive Breakpoints

Using Tailwind defaults:
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

### Mobile Optimizations
- Single column layouts on mobile
- Touch-friendly 44px minimum tap targets
- Simplified navigation
- Scrollable tables with horizontal overflow

## Animation & Transitions

### Default Transitions
- `transition-all` for hover states
- `transition-colors` for color changes
- Duration: 150-200ms (Tailwind default)

### Loading States
- Spinning animation for loaders
- Opacity transitions for content loading
- Skeleton loaders match glass card style

## Comparison: Before vs After

### Before (Light Theme)
- White backgrounds
- Gray borders
- Colored badges (blue, red, green)
- Traditional card shadows
- Light gray text

### After (Fleur Dark Theme)
- Deep dark brown background (#120d0a)
- Same dashboard.png background image as Fleur app (50% opacity)
- Glass morphism cards
- White text with opacity variations
- Subtle white borders
- Backdrop blur effects
- Consistent with Fleur native app

## Usage Examples

### Creating a Glass Card
```jsx
<div className="glass-card p-4 glass-card-hover transition-all">
  {content}
</div>
```

### Section Header
```jsx
<div className="flex items-center gap-3 mb-6">
  <div className="w-8 h-8 rounded-full flex items-center justify-center glass-card">
    <span className="text-lg">📊</span>
  </div>
  <h2 className="text-xl font-bold text-white">Section Title</h2>
</div>
```

### Stat Display
```jsx
<div className="glass-card p-4">
  <p className="text-sm font-medium text-white/70">Label</p>
  <p className="text-2xl font-bold mt-1 text-white">{value}</p>
</div>
```

### Badge/Pill
```jsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white border border-fleur-border">
  {text}
</span>
```

---

**Note**: This design system is synchronized with the Fleur React Native app to ensure a seamless user experience across web and mobile platforms.

