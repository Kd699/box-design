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
  platforms: ScreenPlatform[]
  states: StateConfig[]
  /** Render the live, interactive frame for this state + platform (viewer surface). */
  renderFrame: (state: StateConfig, platform: ScreenPlatform) => React.ReactNode
  /** Render the static, no-op frame for this state + platform (artboard surface). */
  renderArtboardFrame: (state: StateConfig, platform: ScreenPlatform) => React.ReactNode
  /** Label shown in the floating nav pill for this state. */
  floatingNavLabel: (state: StateConfig) => string
}

/* ── Brand ─────────────────────────────────────────────────────────────── */

export interface BrandConfig {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  /** Sidebar active-state highlight tints, cycled per sidebar section. */
  conceptColors?: { bg: string; text: string }[]
}

/* ── Sidebar (left panel manifest) ─────────────────────────────────────── */

export interface SidebarOption {
  modeId: string
  stateId: string
  platform: ScreenPlatform
  /** Single-letter label shown in the multi-platform pill (e.g. 'D', 'M'). */
  platformLabel: string
}

export interface SidebarItem {
  id: string
  label: string
  description?: string
  options: SidebarOption[]
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
  /** Render a separator after this step. true = arrow; 'vline' = vertical line; undefined/false = none. */
  arrowAfter?: boolean | 'vline'
}

export interface ArtboardSection {
  id: string
  /** Top divider style. 'thick' = solid border-grey-20, 'dashed' = dashed, 'none' = no divider. */
  divider?: 'thick' | 'dashed' | 'none'
  /** Flow badge (e.g. "Flow 2") rendered before the section title. */
  flowBadge?: { label: string; bg?: string }
  title?: string
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

export interface ComponentFocusConfig {
  id: string
  label: string
  level: 'atom' | 'molecule' | 'organism'
  /** Child component IDs (informational; rendered as a chip list when present). */
  children?: string[]
  states: ComponentFocusState[]
  /** Where this component appears in the modes/states/platforms graph. */
  usedIn: ComponentFocusUsage[]
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
  sidebar: SidebarSection[]
  artboard: ArtboardSection[]
  context?: ContextCard[]
  defaults?: V3ArtboardDefaults
  /** Optional third tab — components catalog (E9). */
  componentFocus?: ComponentFocusConfig[]
}

/* ── defineV3ArtboardSpec helper (E12) ─────────────────────────────────── */
/** Identity at runtime; preserves literal types via const-narrowing at write time. */
export function defineV3ArtboardSpec<S extends V3ArtboardSpec>(spec: S): S {
  return spec
}
