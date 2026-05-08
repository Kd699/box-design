import type React from 'react'

/* ── Core mode types (self-contained -- do NOT import from sibling pages) ── */

export type ScreenPlatform = 'web' | 'mobile' | 'native'

export interface StateConfig {
  id: string
  label: string
  description?: string
}

export interface ScreenMode {
  id: string
  label: string
  /** Optional concept tag (used by some labs for grouping). */
  concept?: string
  /** F16: optional description shown in sidebar (tooltip) and as artboard subtitle. */
  description?: string
  platforms: ScreenPlatform[]
  states: StateConfig[]
  /** Render the live, interactive frame for this state + platform (viewer surface).
   *  F6: third argument is project-defined sharedProps (passed through by runtime). */
  renderFrame: (state: StateConfig, platform: ScreenPlatform, sharedProps?: unknown) => React.ReactNode
  /** Render the static, no-op frame for this state + platform (artboard surface). */
  renderArtboardFrame: (state: StateConfig, platform: ScreenPlatform) => React.ReactNode
  /** Label shown in the floating nav pill for this state. */
  floatingNavLabel: (state: StateConfig) => string
  /** F4: per-mode opt-out of FloatingNav + appShell wrapper.
   *  Boolean or predicate (state)=>boolean. When true, mode renders at full viewport. */
  fullScreenViewer?: boolean | ((state: StateConfig) => boolean)
}

/* ── Brand ─────────────────────────────────────────────────────────────── */

export interface BrandWelcomeHelpItem {
  kbd: string
  text: string
}

export interface BrandConfig {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  /** Sidebar active-state highlight tints, cycled per sidebar section. */
  conceptColors?: { bg: string; text: string }[]
  /** F1: keyboard cheat sheet for the welcome help modal. If omitted a default list is used. */
  welcomeHelp?: BrandWelcomeHelpItem[]
}

/* ── Sidebar (left panel manifest) ─────────────────────────────────────── */

export interface SidebarOption {
  modeId: string
  stateId: string
  platform: ScreenPlatform
  /** Single-letter label shown in the multi-platform pill (e.g. 'D', 'M'). */
  platformLabel: string
}

export interface SidebarSubgroup {
  label: string
  items: SidebarItem[]
}

export interface SidebarItem {
  id: string
  label: string
  description?: string
  options: SidebarOption[]
  /** F14: nested subgroup rendered indented under this item. v9 supports a single level only. */
  subgroup?: SidebarSubgroup
}

export interface SidebarSection {
  sectionLabel: string
  items: SidebarItem[]
}

/* ── Artboard (declarative layout for the static comparison view) ──────── */

export interface ArtboardFrameRef {
  modeId: string
  stateId: string
  platform: ScreenPlatform
  /** Override platform label above the frame; default = capitalized platform. */
  label?: string
  /** Opt out of v8 auto-wrap chrome detection. Caller takes responsibility. */
  rawFrame?: boolean
}

export interface ArtboardStep {
  /** Numeric or short text badge (e.g. 1, 'A'). */
  badge?: number | string
  /** Override the dark default badge color (e.g. '#6B7280' for a 'D' badge). */
  badgeColor?: string
  title?: string
  description?: string
  /** Inline pill annotation (e.g. "Optionally add search bar"). */
  pill?: { label: string; bg?: string; color?: string }
  /** Constrain the step width (e.g. 380 to keep a long description from sprawling). */
  maxWidth?: number | string
  /** Horizontal cluster of frames inside this step. */
  frames: ArtboardFrameRef[]
  /** Render a separator after this step. true = arrow; 'vline' = vertical line; false = none.
   *  F19: undefined defaults to auto-arrow (renders an arrow if a next step exists). */
  arrowAfter?: boolean | 'vline'
}

export interface ArtboardSection {
  id: string
  /** Top divider style. 'thick' = solid border-grey-20, 'dashed' = dashed, 'none' = no divider. */
  divider?: 'thick' | 'dashed' | 'none'
  /** Flow badge (e.g. "Flow 2") rendered before the section title. */
  flowBadge?: { label: string; bg?: string }
  title?: string
  /** F16: subtitle rendered under the section heading (text-grey-50 small). */
  subtitle?: string
  /** Long descriptive paragraph under the section title (rendered above steps). */
  description?: string
  /** Small uppercase label shown above the steps (e.g. "Filter options"). */
  preLabel?: string
  steps: ArtboardStep[]
}

/* ── Sidebar context cards (optional info panels at the bottom) ────────── */

export interface ContextCard {
  tone: 'info' | 'warn' | 'success' | 'neutral'
  title: string
  items: string[]
}

/* ── Defaults ──────────────────────────────────────────────────────────── */

export type ViewMode = 'viewer' | 'artboard'

export interface V3ArtboardDefaults {
  viewMode?: ViewMode
  platform?: ScreenPlatform
  /** 0.1 — 1.0 */
  zoom?: number
}

/* ── Component focus registry (E9 — third "Components" tab) ─────────────── */

export interface ComponentFocusState {
  label: string
  render: (platform: ScreenPlatform) => React.ReactNode
}

export interface ComponentFocusUsage {
  modeId: string
  stateId: string
  platform: ScreenPlatform
}

/** F20: minimum-ceremony shape — only `id` and (optionally) `render` or `states` required. */
export interface ComponentFocusConfig {
  id: string
  /** Optional. Defaults to title-cased id. */
  label?: string
  /** Optional. Defaults to 'atom'. */
  level?: 'atom' | 'molecule' | 'organism'
  /** Optional. Defaults to []. */
  children?: string[]
  /** Optional shortcut: when provided AND `states` is omitted, runtime
   *  synthesises `[{ label: 'default', render }]`. */
  render?: (platform: ScreenPlatform) => React.ReactNode
  /** Optional. Defaults to single-state derived from `render`, or [] if neither given. */
  states?: ComponentFocusState[]
  /** Optional. Defaults to []. */
  usedIn?: ComponentFocusUsage[]
  /** Optional explicit platform override; otherwise derived from `usedIn`. */
  platforms?: ScreenPlatform[]
}

/** Internal — runtime-normalised shape with all fields filled in. */
export interface ComponentFocusConfigResolved {
  id: string
  label: string
  level: 'atom' | 'molecule' | 'organism'
  children: string[]
  states: ComponentFocusState[]
  usedIn: ComponentFocusUsage[]
  platforms: ScreenPlatform[]
}

/* ── Theme override (E11 — CSS variable theming) ───────────────────────── */

export interface V3ArtboardTheme {
  surface?: string
  text?: string
  textMuted?: string
  border?: string
  accent?: string
}

/* ── Top-level spec ────────────────────────────────────────────────────── */

export interface V3ArtboardSpec {
  brand: BrandConfig
  modes: readonly ScreenMode[]
  /** F2: optional. When omitted/empty, sidebar is auto-derived from `modes`. */
  sidebar?: SidebarSection[]
  artboard: ArtboardSection[]
  context?: ContextCard[]
  defaults?: V3ArtboardDefaults
  /** Optional third tab — components catalog (E9). */
  componentFocus?: ComponentFocusConfig[]
  /** F9: 'grid' (default v8 ComponentFocusPanel) or 'detail' (one-at-a-time radio + main canvas). */
  componentFocusLayout?: 'grid' | 'detail'
}

/* ── defineV3ArtboardSpec helper (E12) ─────────────────────────────────── */
/** Identity at runtime; preserves literal types via const-narrowing at write time. */
export function defineV3ArtboardSpec<S extends V3ArtboardSpec>(spec: S): S {
  return spec
}
