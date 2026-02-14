# SDLC Assist — UX Design Reference

> **Design File:** `Planning/sdlc-assist-design.pen`
> **Reference Kit:** `Planning/pencil-shadcn.pen` (shadcn/ui style)
> **Last Updated:** 2026-02-14

---

## 1. Theme System

Supports **Light** and **Dark** mode (user-selectable via user menu dropdown).

### Color Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `$--background` | `#fafafa` | `#0a0a0a` | Page background |
| `$--foreground` | `#0a0a0a` | `#fafafa` | Primary text |
| `$--card` | `#fafafa` | `#171717` | Card background |
| `$--card-foreground` | `#0a0a0a` | `#fafafa` | Card text |
| `$--primary` | `#171717` | `#e5e5e5` | Primary buttons, brand |
| `$--primary-foreground` | `#fafafa` | `#171717` | Text on primary |
| `$--secondary` | `#f5f5f5` | `#262626` | Secondary buttons |
| `$--secondary-foreground` | `#171717` | `#fafafa` | Text on secondary |
| `$--muted` | `#f5f5f5` | `#262626` | Muted backgrounds |
| `$--muted-foreground` | `#737373` | `#a3a3a3` | Placeholder/secondary text |
| `$--destructive` | `#e7000b` | `#ff666999` | Danger actions |
| `$--border` | `#e5e5e5` | `#ffffff1a` | Borders, dividers |
| `$--input` | `#e5e5e5` | `#ffffff1a` | Input borders |
| `$--ring` | `#a3a3a3` | `#737373` | Focus rings |
| `$--accent` | `#f5f5f5` | `#262626` | Accent backgrounds |
| `$--accent-foreground` | `#171717` | `#fafafa` | Accent text |
| `$--sidebar` | `#fafafa` | `#18181b` | Sidebar background |
| `$--sidebar-accent` | `#f4f4f4` | `#2a2a30` | Active sidebar item BG |
| `$--sidebar-foreground` | `#09090b` | `#fafafa` | Sidebar text |
| `$--sidebar-border` | `#e4e4e7` | `#ffffff1a` | Sidebar border |
| `$--sidebar-primary` | `#18181b` | `#1447e6` | Sidebar primary |
| `$--sidebar-primary-foreground` | `#fafafa` | `#fafafa` | Sidebar primary text |
| `$--sidebar-ring` | `#71717a` | `#71717a` | Sidebar ring |
| `$--popover` | `#fafafa` | `#171717` | Dropdown/popover BG |
| `$--popover-foreground` | `#0a0a0a` | `#fafafa` | Popover text |
| `$--white` | `#ffffff` | `#ffffff` | Pure white |
| `$--black` | `#000000` | `#000000` | Pure black |

### Typography

| Property | Value |
|----------|-------|
| Font Family | `Inter` |
| Base Size | `14px` |
| Line Height | `1.43` (20px at 14px) |
| Headings Weight | `600` |
| Body Weight | `normal` (400) |
| Label Weight | `500` |

---

## 2. Component Library

All components are in `sdlc-assist-design.pen`. IDs below reference the reusable component definitions.

### Buttons

| Component | ID | Key Descendants |
|-----------|-----|----------------|
| Button/Default | `uvA79` | Icon: `pQf6M`, Label: `4zx1d` |
| Button/Secondary | `cJZKT` | Icon: `7d9JM`, Label: `S9sbP` |
| Button/Outline | `QRg0b` | Icon: `C7HRW`, Label: `ZYBE8` |
| Button/Ghost | `SGV5S` | Icon: `DoqlQ`, Label: `u96Hq` |
| Button/Destructive | `CGTMZ` | Icon: `KAGqE`, Label: `xdhcs` |

### Form Inputs

| Component | ID | Key Descendants |
|-----------|-----|----------------|
| Input Group/Default | `ECPbD` | Label: `zIYEq`, Value: `RwOK4` |
| Textarea Group/Default | `qMGBr` | Label: `XNnff`, Value: `Ph1l5` |

### Cards

| Component | ID | Slots/Descendants |
|-----------|-----|-------------------|
| Card | `zUJ5m` | Header: `1GLgJ`, Content: `CdrVt`, Actions: `mjfBH` |

### Navigation

| Component | ID | Key Descendants |
|-----------|-----|----------------|
| Sidebar | `085z0` | Header: `TtJqq`, Content: `Hb5nJ`, Footer: `Weny8` |
| Sidebar Item/Active | `LIaG6` | Icon: `3Vmov`, Label: `u4cJ4` |
| Sidebar Item/Default | `76z44` | (ref of LIaG6, no fill) |
| Sidebar Section Title | `Kvf3g` | Label: `lefYM` |
| Breadcrumb Item/Current | `lBWnB` | Text: `uKrs1` |
| Breadcrumb Item/Default | `pF88D` | Text: `uKrs1` (muted) |
| Breadcrumb Separator | `6DqQk` | chevron-right icon |

### Tabs

| Component | ID | Key Descendants |
|-----------|-----|----------------|
| Tab Item/Active | `2NvHw` | Label: `eiLI2` |
| Tab Item/Inactive | `TPwhI` | Label: `eiLI2` (muted) |
| Tabs (container) | `vPvoa` | Slot-based |

### Data Table

| Component | ID | Key Descendants |
|-----------|-----|----------------|
| Table | `WXA4P` | Slot-based container |
| Table Row | `UMdPW` | Slot for cells |
| Table Cell | `GpgbU` | Slot for content |
| Table Column Header | `KX2v8` | Label: `VkvXo` |

### Feedback & Status

| Component | ID | Key Descendants |
|-----------|-----|----------------|
| Avatar/Text | `gHWu9` | Title: `RbplI` |
| Badge/Default | `tEzeb` | Text: `Uahdv` |
| Badge/Secondary | `08c8b` | Text: `SerU4` |
| Progress | `MH2Ku` | Fill: `D7MYY` |

### Dropdowns / Menus

| Component | ID | Key Descendants |
|-----------|-----|----------------|
| Dropdown | `yl8fh` | Popover container |
| List Item/Unchecked | `1o5oI` | Icon: `kbrTc`, Label: `QC7ZO` |
| List Divider | `uWKIf` | Line separator |

---

## 3. Screen Inventory (Phase 1)

| # | Screen | Node ID | Route | Status |
|---|--------|---------|-------|--------|
| 1 | Login | `9ww35` | `/login` | ✅ Done |
| 2 | Dashboard | `7zXbN` | `/dashboard` | ✅ Done |
| 3 | Project View — Planning & Analysis | `urMst` | `/projects/:id/planning` | ✅ Done |

### Screen Details

**Login (`9ww35`):**
- Centered card (400px) on `$--background`
- Logo (layers icon) + "SDLC Assist" title + "Sign in to your account" subtitle
- Username & Password input fields
- Full-width Sign In button (primary)

**Dashboard (`7zXbN`):**
- Sidebar (256px) with brand, nav items, project list, user footer
- Header bar (64px) with breadcrumbs + avatar/name dropdown
- "Projects" page title + "New Project" button (primary)
- Data table: 5 columns (Project Name, Status, Owner, Last Updated, Actions)
- 3 sample project rows with Active/Draft badges

**Project View (`urMst`):**
- Sidebar (256px, E-Commerce Platform active)
- Header: breadcrumbs (Projects > E-Commerce Platform) + avatar
- "E-Commerce Platform" page title
- 5 SDLC Phase Tabs: Planning & Analysis (active), Design, Implementation, Testing, Maintenance
- Progress bar (40%) with label
- 5 requirement section cards: Business, Functional, Non-Functional, Technical Constraints, Risk Assessment
- Each card: title + textarea + Save button

---

## 4. Spacing & Layout

| Context | Value |
|---------|-------|
| Screen width | 1440px |
| Screen height | 900px |
| Sidebar width | 256px |
| Header height | 64px |
| Content padding | 32px |
| Section gap | 24px |
| Card padding | 24px |
| Form field gap | 16px |
| Button gap | 12px |
| Corner radius (cards) | 8px |
| Corner radius (buttons/inputs) | 6px |
| Corner radius (avatars/progress) | 9999px |

---

## 5. Icon System

Using **Lucide** icon font throughout.

| Context | Icon Name |
|---------|-----------|
| App logo | `layers` |
| Dashboard | `layout-dashboard` |
| Projects | `folder` |
| Save | `save` |
| Add/Create | `plus` |
| User menu | `chevron-down` |
| Breadcrumb separator | `chevron-right` |
| Actions menu | `ellipsis` |
| Settings | `settings` |
| Logout | `log-out` |
| Lock (coming soon) | `lock` |
| Search | `search` |
| Sun (light mode) | `sun` |
| Moon (dark mode) | `moon` |
| Edit | `pencil` |
| Delete | `trash-2` |
