# Privacy Mode Feature

## Overview
A privacy toggle has been added to the dashboard that allows users to blur all names (user names and emails) displayed across the platform for privacy and screenshot purposes.

## Location
The privacy toggle is located in the top navigation bar, positioned between the left navigation and the user profile icon.

## How It Works

### Components Created
1. **PrivacyProvider** (`src/components/privacy-provider.tsx`)
   - React Context provider that manages the blur state globally
   - Persists user preference in localStorage
   - Provides `isBlurred` state and `toggleBlur` function

2. **PrivacyToggle** (`src/components/privacy-toggle.tsx`)
   - Eye icon button in the navigation bar
   - Shows EyeIcon when names are visible
   - Shows EyeOffIcon when names are blurred
   - Includes tooltip for better UX

3. **PrivacyBlur** (`src/components/privacy-blur.tsx`)
   - Wrapper component that applies blur effect to its children
   - Uses Tailwind CSS `blur-sm` class when privacy mode is active
   - Includes smooth transition animation

### Components Updated
The following components now support privacy mode and will blur names when enabled:

- `src/components/user-nav.tsx` - User dropdown menu
- `src/components/nav-header.tsx` - Navigation header (includes toggle)
- `src/components/ai-usage-leaderboard.tsx` - Main leaderboard table
- `src/components/team-members-table.tsx` - Team members list
- `src/components/profile-header.tsx` - User profile page header
- `src/components/summary-stats.tsx` - Dashboard statistics (top performer)
- `src/components/chat/user-profile-card.tsx` - Chat user profile card
- `src/components/chat/user-comparison-table.tsx` - Chat comparison table
- `src/components/chat/leaderboard-card.tsx` - Chat leaderboard card
- `src/components/dashboard-charts.tsx` - Dashboard charts (top performers chart shows "User 1", "User 2", etc.)
- `src/app/layout.tsx` - Root layout (wraps app with PrivacyProvider)

## Usage
1. Click the eye icon in the top navigation bar
2. Names and emails throughout the platform will be blurred
3. The preference is saved automatically and persists across sessions
4. Click the eye icon again to disable privacy mode

## CSS Classes Applied
When privacy mode is enabled, the following classes are applied:
- `blur-sm` - Creates the blur effect
- `select-none` - Prevents text selection of blurred content
- `transition-all duration-200` - Smooth animation when toggling

## Technical Details
- State management: React Context API
- Persistence: localStorage (key: `privacy-blur-names`)
- Styling: Tailwind CSS utility classes
- Icons: Lucide React (EyeIcon, EyeOffIcon)
