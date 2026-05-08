import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type {
  V3ArtboardSpec,
  ScreenMode,
  ScreenPlatform,
  SidebarSection,
  ArtboardSection,
  ArtboardStep,
  ArtboardFrameRef,
  ContextCard,
  ViewMode,
  V3ArtboardTheme,
  ComponentFocusConfigResolved,
} from './types'
import {
  validateSpec,
  autoWrapFrame,
  loadPersisted,
  savePersisted,
  parseHash,
  serializeHash,
  buildThemeStyle,
  deriveSidebarFromModes,
  isAutoSidebar,
  autoSectionTitle,
  autoSectionMeta,
  resolveComponentFocus,
} from './internal/runtime'
import { ComponentFocusPanel, ComponentFocusDetailPanel } from './internal/component-focus'
import { Sidebar, type SidebarTab } from './internal/sidebar'

const PLATFORM_LABELS: Record<ScreenPlatform, string> = { web: 'Desktop', mobile: 'Mobile', native: 'Native' }
const DEFAULT_WELCOME_HELP = [
  { kbd: 'Cmd / Ctrl + scroll', text: 'Zoom in & out' },
  { kbd: 'Click any frame',     text: 'Open the live viewer' },
  { kbd: 'Sidebar',              text: 'Jump between flows + states' },
  { kbd: '←  →',                 text: 'Step prev / next' },
]

/* ── Layout primitives ────────────────────────────────────────────────── */

const StepBadge: React.FC<{ value: number | string; color?: string }> = ({ value, color = '#03072d' }) => (
  <div
    className="flex items-center justify-center rounded-full text-white text-xs font-bold shrink-0"
    style={{ width: 24, height: 24, background: color }}
  >
    {value}
  </div>
)

const ArrowSeparator: React.FC = () => (
  <div className="flex items-center justify-center px-6 self-center" data-v3-arrow>
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M8 20H32M32 20L24 12M32 20L24 28" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
)

const VLineSeparator: React.FC = () => (
  <div className="mx-12 self-stretch flex items-center" data-v3-vline>
    <div className="w-px h-full" style={{ background: 'var(--v3-border, #d7d6da)' }} />
  </div>
)

const PlatformPill: React.FC<{ label: string }> = ({ label }) => (
  <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-blue-500">{label}</p>
)

const FlowBadge: React.FC<{ label: string; bg?: string }> = ({ label, bg }) => (
  <div className="flex items-center justify-center rounded-lg text-white text-sm font-bold px-3 py-1" style={{ background: bg ?? 'var(--v3-accent, #402AFF)' }}>
    {label}
  </div>
)

/* ── F1 — Welcome help modal ──────────────────────────────────────────── */

const WelcomeHelpModal: React.FC<{ items: { kbd: string; text: string }[]; onClose: () => void }> = ({ items, onClose }) => (
  <div
    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 font-perk-sans"
    onClick={onClose}
    data-v3-help-modal
  >
    <div
      className="bg-white rounded-2xl max-w-[480px] w-full mx-4 p-8"
      style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--v3-text, #03072d)' }}>Welcome</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--v3-text-muted, #73727c)' }}>Navigate this prototype like Figma.</p>
      <ul className="space-y-3 mb-6">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-3">
            <span
              className="shrink-0 px-2 py-1 rounded-md font-mono text-[12px] whitespace-nowrap"
              style={{ background: 'var(--v3-bg-muted, #f8f8fb)', border: '1px solid var(--v3-border, #d7d6da)', color: 'var(--v3-text, #03072d)' }}
            >{it.kbd}</span>
            <span className="text-sm" style={{ color: 'var(--v3-text, #03072d)' }}>{it.text}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-md text-white text-sm font-bold transition-colors"
          style={{ background: 'var(--v3-accent, #402aff)' }}
        >Got it</button>
      </div>
    </div>
  </div>
)

/* ── Floating viewer nav (with help button F1) ────────────────────────── */

const FloatingViewerNav: React.FC<{
  label: string
  platforms: ScreenPlatform[]
  activePlatform: ScreenPlatform
  onPlatformChange: (p: ScreenPlatform) => void
  viewMode: ViewMode
  onViewModeChange: (m: ViewMode) => void
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
  onHelp: () => void
}> = ({ label, platforms, activePlatform, onPlatformChange, viewMode, onViewModeChange, onPrev, onNext, canPrev, canNext, onHelp }) => {
  const btn = 'px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors'
  const btnOn = 'text-grey-50 hover:bg-grey-03 hover:text-brand-black'
  const btnOff = 'text-grey-20 cursor-not-allowed'
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[80] px-2 max-w-[calc(100vw-12px)] font-perk-sans">
      <div
        className="rounded-full bg-white inline-flex items-center gap-1.5 px-2 py-1.5"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--v3-border, #d7d6da)' }}
      >
        <button type="button" onClick={() => window.history.back()} className={`${btn} ${btnOn} flex items-center gap-1`}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-3 h-3">
            <path d="M10 3L5 8l5 5" />
          </svg>
          Back
        </button>
        <div className="h-5 w-px" style={{ background: 'var(--v3-border, #d7d6da)' }} />
        <button type="button" onClick={onPrev} disabled={!canPrev} className={`${btn} ${canPrev ? btnOn : btnOff}`}>Prev</button>
        <p className="px-2 text-[12px] font-semibold whitespace-nowrap max-w-[240px] truncate" style={{ color: 'var(--v3-text, #03072d)' }}>{label}</p>
        <button type="button" onClick={onNext} disabled={!canNext} className={`${btn} ${canNext ? btnOn : btnOff}`}>Next</button>
        <div className="h-5 w-px" style={{ background: 'var(--v3-border, #d7d6da)' }} />
        <div className="flex items-center p-0.5 rounded-full" style={{ background: 'var(--v3-bg-muted, #f8f8fb)', border: '1px solid var(--v3-border, #d7d6da)' }}>
          {platforms.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPlatformChange(p)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                activePlatform === p && viewMode === 'viewer'
                  ? 'bg-white text-brand-black shadow-sm'
                  : 'text-grey-50 hover:text-brand-black'
              }`}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="h-5 w-px" style={{ background: 'var(--v3-border, #d7d6da)' }} />
        <button
          type="button"
          onClick={() => onViewModeChange(viewMode === 'viewer' ? 'artboard' : 'viewer')}
          className={`${btn} font-semibold ${viewMode === 'artboard' ? 'text-white' : 'text-grey-50 hover:bg-grey-03 hover:text-brand-black'}`}
          style={viewMode === 'artboard' ? { background: 'var(--v3-accent, #402aff)' } : undefined}
        >
          {viewMode === 'artboard' ? 'Viewer' : 'Artboard'}
        </button>
        <button type="button" onClick={onHelp} aria-label="How to navigate" data-v3-help-button className={`${btn} ${btnOn} w-7 h-7 p-0 flex items-center justify-center`}>?</button>
      </div>
    </div>
  )
}

/* ── Artboard frame (clickable static frame) — F12, F13 ───────────────── */

const ArtboardClickFrame: React.FC<{
  modes: readonly ScreenMode[]
  ref_: ArtboardFrameRef
  showStateLabel: boolean
  onClick: () => void
}> = ({ modes, ref_, showStateLabel, onClick }) => {
  const mode = modes.find((m) => m.id === ref_.modeId)
  const state = mode?.states.find((s) => s.id === ref_.stateId)
  if (!mode || !state) {
    return <div className="text-red-500 text-xs p-4 border border-red-200 rounded">Missing {ref_.modeId}/{ref_.stateId}</div>
  }
  const platLabel = ref_.label ?? PLATFORM_LABELS[ref_.platform]
  const raw = mode.renderArtboardFrame(state, ref_.platform)
  const rendered = ref_.rawFrame ? raw : autoWrapFrame(raw, ref_.platform)
  // F13: state label + platform pill live OUTSIDE the (zoom) wrapper applied by the artboard parent.
  return (
    <div
      id={`frame-${mode.id}-${state.id}`}
      data-v3-frame
      className="cursor-pointer rounded-xl transition-all hover:shadow-[0_0_0_3px_rgba(64,42,255,0.35)] flex flex-col"
      onClick={onClick}
    >
      {showStateLabel && (
        <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--v3-text, #03072d)' }}>
          {state.label}
        </p>
      )}
      <PlatformPill label={platLabel} />
      <div className="pointer-events-none">{rendered}</div>
    </div>
  )
}

const ArtboardStepBlock: React.FC<{
  step: ArtboardStep
  modes: readonly ScreenMode[]
  showStateLabels: boolean
  onFrameClick: (modeId: string, stateId: string, platform: ScreenPlatform) => void
}> = ({ step, modes, showStateLabels, onFrameClick }) => (
  <div className="shrink-0" style={step.maxWidth ? { maxWidth: step.maxWidth } : undefined}>
    {(step.badge !== undefined || step.title) && (
      <div className="flex items-center gap-2 mb-1">
        {step.badge !== undefined && <StepBadge value={step.badge} color={step.badgeColor} />}
        {step.title && <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--v3-text, #03072d)' }}>{step.title}</span>}
      </div>
    )}
    {step.description && <p className="text-[11px] mb-3 ml-8" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{step.description}</p>}
    {step.pill && (
      <div className="ml-8 mb-3">
        <span style={{ background: step.pill.bg ?? '#EEF0FF', color: step.pill.color ?? 'var(--v3-accent, #402AFF)', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 8px' }}>
          {step.pill.label}
        </span>
      </div>
    )}
    <div className="flex items-start gap-6">
      {step.frames.map((f) => (
        <ArtboardClickFrame
          key={`${f.modeId}-${f.stateId}-${f.platform}`}
          modes={modes}
          ref_={f}
          showStateLabel={showStateLabels}
          onClick={() => onFrameClick(f.modeId, f.stateId, f.platform)}
        />
      ))}
    </div>
  </div>
)

/* ── F3, F16, F19 — artboard section ──────────────────────────────────── */

const ArtboardSectionBlock: React.FC<{
  section: ArtboardSection
  modes: readonly ScreenMode[]
  autoNumber: boolean
  showStateLabels: boolean
  onFrameClick: (modeId: string, stateId: string, platform: ScreenPlatform) => void
}> = ({ section, modes, autoNumber, showStateLabels, onFrameClick }) => {
  const dividerCls =
    section.divider === 'thick'  ? 'mt-12 pt-8 border-t-2 border-grey-20' :
    section.divider === 'dashed' ? 'mt-10 pt-8 border-t border-dashed border-grey-20' : ''

  const computedTitle = autoNumber ? autoSectionTitle(modes, section.id, section.title) : section.title
  const computedMeta = autoNumber ? autoSectionMeta(modes, section.id) : undefined

  const mode = modes.find((m) => m.id === section.id)
  const subtitle = section.subtitle ?? mode?.description

  return (
    <div className={dividerCls}>
      {(section.flowBadge || computedTitle) && (
        <div className="flex items-center gap-3 mb-2">
          {section.flowBadge && <FlowBadge label={section.flowBadge.label} bg={section.flowBadge.bg} />}
          {computedTitle && <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--v3-text, #03072d)' }}>{computedTitle}</span>}
          {computedMeta && <span className="text-xs" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{computedMeta}</span>}
        </div>
      )}
      {subtitle && <p className="text-xs mb-4" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{subtitle}</p>}
      {section.description && <p className="text-[12px] mb-6 max-w-[640px]" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{section.description}</p>}
      {section.preLabel && <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{section.preLabel}</p>}
      <div className="flex items-start">
        {section.steps.map((step, i) => {
          const isLast = i === section.steps.length - 1
          const sep = step.arrowAfter
          const renderSep = sep === 'vline'
            ? <VLineSeparator />
            : sep === false
              ? null
              : sep === true
                ? <ArrowSeparator />
                : isLast ? null : <ArrowSeparator />
          return (
            <React.Fragment key={i}>
              <ArtboardStepBlock step={step} modes={modes} showStateLabels={showStateLabels} onFrameClick={onFrameClick} />
              {renderSep}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

/* ── E7: Imperative ref API ───────────────────────────────────────────── */

export interface V3ArtboardHandle {
  selectByIds: (modeId: string, stateId: string, platform: ScreenPlatform) => boolean
  setViewMode: (mode: ViewMode) => void
  setZoom: (z: number) => void
  getCurrent: () => { modeId: string; stateId: string; platform: ScreenPlatform; viewMode: ViewMode; zoom: number }
}

/* ── Top-level V3Artboard ─────────────────────────────────────────────── */

export interface V3ArtboardProps {
  spec: V3ArtboardSpec
  theme?: V3ArtboardTheme
  /** F5 — optional app shell wrapper applied to viewer rendering. */
  appShell?: React.ComponentType<{ children: React.ReactNode }>
  /** F6 — sharedProps passed through to mode.renderFrame as 3rd arg. */
  sharedProps?: unknown
}

export const V3Artboard = React.forwardRef<V3ArtboardHandle, V3ArtboardProps>(({ spec, theme, appShell: AppShell, sharedProps }, ref) => {
  const { modes } = spec
  const defaults = spec.defaults ?? {}
  const storageKey = `v3artboard:${spec.brand.title}`
  const helpSeenKey = `v3artboard:helpSeen:${spec.brand.title}`
  const componentFocusLayout: 'grid' | 'detail' = spec.componentFocusLayout ?? 'grid'

  const resolvedComponents = useMemo<ComponentFocusConfigResolved[]>(
    () => (spec.componentFocus ?? []).map(resolveComponentFocus),
    [spec.componentFocus],
  )
  const hasComponents = resolvedComponents.length > 0

  const effectiveSidebar = useMemo<SidebarSection[]>(
    () => (isAutoSidebar(spec) ? deriveSidebarFromModes(modes) : (spec.sidebar ?? [])),
    [spec, modes],
  )
  const autoNumber = isAutoSidebar(spec)

  const validatedRef = useRef(false)
  const [validationIssues, setValidationIssues] = useState<string[]>([])
  if (!validatedRef.current) {
    validatedRef.current = true
    const issues = validateSpec(spec)
    if (issues.length > 0) {
      console.warn(`[V3Artboard] spec validation: ${issues.length} issue(s)`)
      issues.forEach((i) => console.warn(`[V3Artboard] spec validation: ${i}`))
    }
    const isDev = (typeof import.meta !== 'undefined') && (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV
    if (isDev) {
      setTimeout(() => setValidationIssues(issues), 0)
    }
  }

  if (modes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center font-perk-sans" style={{ background: 'var(--v3-bg-muted, #f8f8fb)', ...buildThemeStyle(theme) }}>
        <div className="text-center">
          <p className="text-base font-bold" style={{ color: 'var(--v3-text, #03072d)' }}>No modes configured.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--v3-text-muted, #73727c)' }}>Add to spec.modes[]</p>
        </div>
      </div>
    )
  }

  const firstModePlatforms = modes[0].platforms
  let initialPlatform: ScreenPlatform = defaults.platform ?? firstModePlatforms[0] ?? 'web'
  if (defaults.platform && !firstModePlatforms.includes(defaults.platform)) {
    const fallback = firstModePlatforms[0] ?? 'web'
    console.warn(`[V3Artboard] defaults.platform "${defaults.platform}" not in modes[0].platforms; clamping to "${fallback}"`)
    initialPlatform = fallback
  }

  const persisted = loadPersisted(storageKey)
  const hash = parseHash()

  const findByIds = (modeId?: string, stateId?: string): { mi: number; si: number } | null => {
    if (!modeId || !stateId) return null
    const mi = modes.findIndex((m) => m.id === modeId)
    if (mi < 0) return null
    const si = modes[mi].states.findIndex((s) => s.id === stateId)
    if (si < 0) return null
    return { mi, si }
  }

  const persistedIds = persisted
    ? findByIds(modes[persisted.activeModeIndex ?? -1]?.id, modes[persisted.activeModeIndex ?? -1]?.states[persisted.activeStateIndex ?? -1]?.id)
    : null
  const hashIds = findByIds(hash.m, hash.s)

  const initialMI = hashIds?.mi ?? persistedIds?.mi ?? 0
  const initialSI = hashIds?.si ?? persistedIds?.si ?? 0
  const initialPlat: ScreenPlatform =
    (hash.p && modes[initialMI]?.platforms.includes(hash.p) ? hash.p : null) ??
    (persisted?.activePlatform && modes[initialMI]?.platforms.includes(persisted.activePlatform) ? persisted.activePlatform : null) ??
    initialPlatform

  const [panelOpen, setPanelOpen] = useState<boolean>(persisted?.panelOpen ?? true)
  const [tab, setTab] = useState<SidebarTab>(((persisted?.viewMode as SidebarTab) ?? defaults.viewMode ?? 'artboard'))
  const [activeModeIndex, setActiveModeIndex] = useState(initialMI)
  const [activeStateIndex, setActiveStateIndex] = useState(initialSI)
  const [activePlatform, setActivePlatform] = useState<ScreenPlatform>(initialPlat)
  const [zoom, setZoom] = useState(persisted?.zoom ?? defaults.zoom ?? 0.3)
  const [itemPlatform, setItemPlatform] = useState<Record<string, ScreenPlatform>>(persisted?.itemPlatform ?? {})
  const [activeComponentId, setActiveComponentId] = useState<string | null>(hasComponents ? resolvedComponents[0].id : null)
  const [activeComponentStateIndex, setActiveComponentStateIndex] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpSeenInitialized, setHelpSeenInitialized] = useState(false)
  const artboardRef = useRef<HTMLDivElement>(null)
  const panelWidth = panelOpen ? 288 : 0

  const viewMode: ViewMode = tab === 'components' ? 'viewer' : tab

  useEffect(() => {
    if (helpSeenInitialized) return
    setHelpSeenInitialized(true)
    try {
      const seen = window.localStorage.getItem(helpSeenKey)
      if (!seen) setHelpOpen(true)
    } catch {}
  }, [helpSeenInitialized, helpSeenKey])

  const closeHelp = () => {
    try { window.localStorage.setItem(helpSeenKey, '1') } catch {}
    setHelpOpen(false)
  }

  useEffect(() => {
    savePersisted(storageKey, {
      viewMode: tab === 'components' ? undefined : tab,
      activeModeIndex,
      activeStateIndex,
      activePlatform,
      zoom,
      panelOpen,
      itemPlatform,
    })
  }, [storageKey, tab, activeModeIndex, activeStateIndex, activePlatform, zoom, panelOpen, itemPlatform])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mode = modes[activeModeIndex]
    const state = mode?.states[activeStateIndex]
    if (!mode || !state) return
    const next = serializeHash(mode.id, state.id, activePlatform)
    if (window.location.hash !== next) {
      try { window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`) } catch {}
    }
  }, [activeModeIndex, activeStateIndex, activePlatform, modes])

  /* F7 — cursor-anchored Cmd/Ctrl + scroll zoom */
  useEffect(() => {
    if (tab !== 'artboard') return
    const el = artboardRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const c = el
      const rect = c.getBoundingClientRect()
      setZoom((prev) => {
        const next = Math.max(0.1, Math.min(1, prev - e.deltaY * 0.002))
        const cx = (e.clientX - rect.left + c.scrollLeft) / prev
        const cy = (e.clientY - rect.top + c.scrollTop) / prev
        requestAnimationFrame(() => {
          c.scrollLeft = cx * next - (e.clientX - rect.left)
          c.scrollTop = cy * next - (e.clientY - rect.top)
        })
        return next
      })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [tab])

  const activeMode: ScreenMode | null = modes[activeModeIndex] ?? null
  const activeModeHasStates = !!activeMode && activeMode.states.length > 0
  const activeModeHasPlatforms = !!activeMode && activeMode.platforms.length > 0
  const clampedStateIndex = activeModeHasStates ? Math.min(activeStateIndex, activeMode!.states.length - 1) : 0
  const activeState = activeModeHasStates ? activeMode!.states[clampedStateIndex] : null

  const allStatesFlat = useMemo(
    () => modes.flatMap((m, mi) => m.states.map((_s, si) => ({ mi, si }))),
    [modes]
  )
  const currentFlat = allStatesFlat.findIndex((f) => f.mi === activeModeIndex && f.si === clampedStateIndex)

  const goToFlat = (idx: number) => {
    const e = allStatesFlat[idx]
    if (!e) return
    setActiveModeIndex(e.mi)
    setActiveStateIndex(e.si)
  }

  const selectByIdsInternal = (modeId: string, stateId: string, platform: ScreenPlatform): boolean => {
    const mi = modes.findIndex((m) => m.id === modeId)
    if (mi < 0) return false
    const mode = modes[mi]
    const si = mode.states.findIndex((s) => s.id === stateId)
    if (si < 0) return false
    if (!mode.platforms.includes(platform)) return false
    setActiveModeIndex(mi)
    setActiveStateIndex(si)
    setActivePlatform(platform)
    if (tab === 'artboard' && typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        document.getElementById(`frame-${modeId}-${stateId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      })
    }
    return true
  }

  const handleArtboardFrameClick = (modeId: string, stateId: string, platform: ScreenPlatform) => {
    const mi = modes.findIndex((m) => m.id === modeId)
    const mode = modes[mi]
    const si = mode?.states.findIndex((s) => s.id === stateId) ?? -1
    if (mi < 0 || si < 0) return
    if (!mode.platforms.includes(platform)) return
    setActiveModeIndex(mi)
    setActiveStateIndex(si)
    setActivePlatform(platform)
    setTab('viewer')
  }

  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      if (el.isContentEditable) return true
      return false
    }
    const handler = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return
      if ((e.metaKey || e.ctrlKey) && (e.key === '1' || e.key === '2')) {
        e.preventDefault()
        setTab(e.key === '1' ? 'viewer' : 'artboard')
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentFlat > 0) goToFlat(currentFlat - 1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (currentFlat < allStatesFlat.length - 1) goToFlat(currentFlat + 1)
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setHelpOpen(true)
      } else if (e.key === 'Escape' && helpOpen) {
        setHelpOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentFlat, allStatesFlat.length, helpOpen])

  useImperativeHandle(ref, () => ({
    selectByIds: (modeId, stateId, platform) => selectByIdsInternal(modeId, stateId, platform),
    setViewMode: (m) => setTab(m),
    setZoom: (z) => setZoom(Math.min(1, Math.max(0.1, z))),
    getCurrent: () => ({
      modeId: activeMode?.id ?? '',
      stateId: activeState?.id ?? '',
      platform: activePlatform,
      viewMode,
      zoom,
    }),
  }))

  const fullScreen = !!(activeMode && activeState && (
    typeof activeMode.fullScreenViewer === 'function'
      ? activeMode.fullScreenViewer(activeState)
      : activeMode.fullScreenViewer
  ))

  const renderViewer = () => {
    if (!activeMode || !activeState || !activeModeHasPlatforms) {
      console.warn(`[V3Artboard] viewer skipped: mode "${activeMode?.id ?? '?'}" has no states or platforms`)
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-49px)]" style={{ background: 'var(--v3-bg-muted, #e8e8ec)' }}>
          <p className="text-xs" style={{ color: 'var(--v3-text-muted, #73727c)' }}>Mode has no renderable state.</p>
        </div>
      )
    }
    const inner = activeMode.renderFrame(activeState, activePlatform, sharedProps)
    const wrapped = AppShell ? <AppShell>{inner}</AppShell> : inner
    const availableW = (typeof window !== 'undefined' ? window.innerWidth : 1440) - panelWidth - 64
    const scale = activePlatform === 'web' ? Math.min(1, availableW / 1280) : 1
    return (
      <div className="flex items-start justify-center p-8 pt-16 min-h-[calc(100vh-49px)]" style={{ background: 'var(--v3-bg-muted, #e8e8ec)' }}>
        <div style={{ zoom: scale, flexShrink: 0 }}>{wrapped}</div>
      </div>
    )
  }

  const renderArtboard = () => (
    <div ref={artboardRef} className="overflow-auto" style={{ height: 'calc(100vh - 49px)', background: 'var(--v3-bg-muted, #e8e8ec)' }}>
      <div className="origin-top-left px-8 py-6 pt-16" style={{ zoom }}>
        {spec.artboard.map((section) => (
          <ArtboardSectionBlock
            key={section.id}
            section={section}
            modes={modes}
            autoNumber={autoNumber}
            showStateLabels
            onFrameClick={handleArtboardFrameClick}
          />
        ))}
      </div>
    </div>
  )

  const activeComponent = hasComponents ? resolvedComponents.find((c) => c.id === activeComponentId) ?? resolvedComponents[0] : null

  const sidebar = panelOpen ? (
    <Sidebar
      spec={spec}
      effectiveSidebar={effectiveSidebar}
      validationIssues={validationIssues}
      viewMode={viewMode}
      tab={tab}
      onTabChange={setTab}
      hasComponents={hasComponents}
      activePlatform={activePlatform}
      onPlatformChange={setActivePlatform}
      activeMode={activeMode}
      zoom={zoom}
      onZoomChange={setZoom}
      activeModeId={activeMode?.id ?? null}
      activeStateId={activeState?.id ?? null}
      itemPlatform={itemPlatform}
      onItemPlatformChange={(itemId, pf) => setItemPlatform((prev) => ({ ...prev, [itemId]: pf }))}
      onSelect={selectByIdsInternal}
      resolvedComponents={resolvedComponents}
      componentFocusLayout={componentFocusLayout}
      activeComponentId={activeComponentId}
      onComponentSelect={(id) => { setActiveComponentId(id); setActiveComponentStateIndex(0) }}
      activeComponentStateIndex={activeComponentStateIndex}
      onComponentStateIndexChange={setActiveComponentStateIndex}
      onHelpClick={() => setHelpOpen(true)}
    />
  ) : null

  // F4 fullscreen viewer: bypass FloatingNav + AppShell when active state opts in
  if (tab === 'viewer' && fullScreen && activeMode && activeState) {
    return (
      <div className="font-perk-sans min-h-screen" style={{ background: 'var(--v3-bg-muted, #f8f8fb)', ...buildThemeStyle(theme) }} data-v3artboard-root data-v3-fullscreen>
        {sidebar}
        <main className="transition-all duration-200" style={{ marginLeft: panelWidth, minHeight: '100vh' }}>
          {activeMode.renderFrame(activeState, activePlatform, sharedProps)}
        </main>
        {helpOpen && <WelcomeHelpModal items={spec.brand.welcomeHelp ?? DEFAULT_WELCOME_HELP} onClose={closeHelp} />}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen font-perk-sans" style={{ background: 'var(--v3-bg-muted, #f8f8fb)', ...buildThemeStyle(theme) }} data-v3artboard-root>
      {sidebar}

      {tab !== 'components' && activeMode && activeState && (
        <FloatingViewerNav
          label={activeMode.floatingNavLabel(activeState)}
          platforms={activeMode.platforms}
          activePlatform={activePlatform}
          onPlatformChange={setActivePlatform}
          viewMode={viewMode}
          onViewModeChange={(m) => setTab(m)}
          onPrev={() => goToFlat(currentFlat - 1)}
          onNext={() => goToFlat(currentFlat + 1)}
          canPrev={currentFlat > 0}
          canNext={currentFlat < allStatesFlat.length - 1}
          onHelp={() => setHelpOpen(true)}
        />
      )}

      <main className="flex-1 transition-all duration-200" style={{ marginLeft: panelWidth }}>
        <button
          onClick={() => setPanelOpen((v) => !v)}
          className="fixed top-[14px] z-[70] flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:bg-grey-03"
          style={{ left: panelOpen ? 288 + 8 : 8, border: '1px solid var(--v3-border, #d7d6da)', color: 'var(--v3-text-muted, #73727c)' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-3.5 h-3.5">
            {panelOpen ? <path d="M10 3L5 8l5 5" /> : <path d="M6 3l5 5-5 5" />}
          </svg>
        </button>

        {tab === 'viewer' && renderViewer()}
        {tab === 'artboard' && renderArtboard()}
        {tab === 'components' && activeComponent && (
          componentFocusLayout === 'detail'
            ? <ComponentFocusDetailPanel component={activeComponent} activeStateIndex={activeComponentStateIndex} activePlatform={activePlatform} />
            : <ComponentFocusPanel component={activeComponent} />
        )}
      </main>

      {helpOpen && <WelcomeHelpModal items={spec.brand.welcomeHelp ?? DEFAULT_WELCOME_HELP} onClose={closeHelp} />}
    </div>
  )
})

V3Artboard.displayName = 'V3Artboard'

export default V3Artboard
