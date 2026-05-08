import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type {
  V3ArtboardSpec,
  ScreenMode,
  ScreenPlatform,
  SidebarOption,
  SidebarItem,
  ArtboardSection,
  ArtboardStep,
  ArtboardFrameRef,
  ContextCard,
  ViewMode,
  V3ArtboardTheme,
} from './types'
import {
  validateSpec,
  autoWrapFrame,
  loadPersisted,
  savePersisted,
  parseHash,
  serializeHash,
  buildThemeStyle,
} from './internal/runtime'
import { ComponentFocusPanel } from './internal/component-focus'

// V3Artboard.tsx imports types only from './types' (self-contained).
// Frame primitives live in './frames' and are consumed by mode authors,
// not by the runtime itself -- the runtime only dispatches ScreenMode.renderFrame.

const PLATFORM_LABELS: Record<ScreenPlatform, string> = { web: 'Desktop', mobile: 'Mobile', native: 'Native' }
const DEFAULT_CONCEPT_COLORS = [
  { bg: 'bg-blue-50',    text: 'text-blue-700' },
  { bg: 'bg-p1-50',      text: 'text-primary-1' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700' },
]
const TONE_STYLES: Record<ContextCard['tone'], { border: string; bg: string; dot: string; title: string; body: string }> = {
  info:    { border: 'border-blue-200',  bg: 'bg-blue-50',  dot: 'bg-blue-500',  title: 'text-blue-900',  body: 'text-blue-800' },
  warn:    { border: 'border-amber-200', bg: 'bg-amber-50', dot: 'bg-amber-500', title: 'text-amber-900', body: 'text-amber-800' },
  success: { border: 'border-grey-12',   bg: 'bg-grey-03',  dot: 'bg-green-500', title: 'text-brand-black', body: 'text-grey-50' },
  neutral: { border: 'border-grey-12',   bg: 'bg-grey-03',  dot: 'bg-grey-50',   title: 'text-brand-black', body: 'text-grey-50' },
}

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
  <div className="flex items-center justify-center px-6 self-center">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M8 20H32M32 20L24 12M32 20L24 28" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
)

const VLineSeparator: React.FC = () => (
  <div className="mx-12 self-stretch flex items-center">
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

/* ── Floating viewer nav (dynamic island) ─────────────────────────────── */

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
}> = ({ label, platforms, activePlatform, onPlatformChange, viewMode, onViewModeChange, onPrev, onNext, canPrev, canNext }) => {
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
      </div>
    </div>
  )
}

/* ── Artboard frame (clickable static frame) ──────────────────────────── */

const ArtboardClickFrame: React.FC<{
  modes: readonly ScreenMode[]
  ref_: ArtboardFrameRef
  onClick: () => void
}> = ({ modes, ref_, onClick }) => {
  const mode = modes.find((m) => m.id === ref_.modeId)
  const state = mode?.states.find((s) => s.id === ref_.stateId)
  if (!mode || !state) {
    return <div className="text-red-500 text-xs p-4 border border-red-200 rounded">Missing {ref_.modeId}/{ref_.stateId}</div>
  }
  const label = ref_.label ?? PLATFORM_LABELS[ref_.platform]
  const raw = mode.renderArtboardFrame(state, ref_.platform)
  const rendered = ref_.rawFrame ? raw : autoWrapFrame(raw, ref_.platform)
  return (
    <div className="cursor-pointer rounded-xl transition-all hover:shadow-[0_0_0_3px_rgba(64,42,255,0.35)]" onClick={onClick}>
      <PlatformPill label={label} />
      <div className="pointer-events-none">{rendered}</div>
    </div>
  )
}

/* ── Artboard step (badge + title + frames) ───────────────────────────── */

const ArtboardStepBlock: React.FC<{
  step: ArtboardStep
  modes: readonly ScreenMode[]
  onFrameClick: (modeId: string, stateId: string, platform: ScreenPlatform) => void
}> = ({ step, modes, onFrameClick }) => (
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
        <ArtboardClickFrame key={`${f.modeId}-${f.stateId}-${f.platform}`} modes={modes} ref_={f} onClick={() => onFrameClick(f.modeId, f.stateId, f.platform)} />
      ))}
    </div>
  </div>
)

/* ── Artboard section ─────────────────────────────────────────────────── */

const ArtboardSectionBlock: React.FC<{
  section: ArtboardSection
  modes: readonly ScreenMode[]
  onFrameClick: (modeId: string, stateId: string, platform: ScreenPlatform) => void
}> = ({ section, modes, onFrameClick }) => {
  const dividerCls =
    section.divider === 'thick'  ? 'mt-12 pt-8 border-t-2 border-grey-20' :
    section.divider === 'dashed' ? 'mt-10 pt-8 border-t border-dashed border-grey-20' : ''
  return (
    <div className={dividerCls}>
      {(section.flowBadge || section.title) && (
        <div className="flex items-center gap-3 mb-6">
          {section.flowBadge && <FlowBadge label={section.flowBadge.label} bg={section.flowBadge.bg} />}
          {section.title && <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--v3-text, #03072d)' }}>{section.title}</span>}
        </div>
      )}
      {section.description && <p className="text-[12px] mb-6 max-w-[640px]" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{section.description}</p>}
      {section.preLabel && <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{section.preLabel}</p>}
      <div className="flex items-start">
        {section.steps.map((step, i) => (
          <React.Fragment key={i}>
            <ArtboardStepBlock step={step} modes={modes} onFrameClick={onFrameClick} />
            {step.arrowAfter === 'vline' ? <VLineSeparator /> : step.arrowAfter ? <ArrowSeparator /> : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

/* ── Sidebar ──────────────────────────────────────────────────────────── */

type SidebarTab = 'viewer' | 'artboard' | 'components'

const Sidebar: React.FC<{
  spec: V3ArtboardSpec
  viewMode: ViewMode
  tab: SidebarTab
  onTabChange: (t: SidebarTab) => void
  hasComponents: boolean
  activePlatform: ScreenPlatform
  onPlatformChange: (p: ScreenPlatform) => void
  activeMode: ScreenMode | null
  zoom: number
  onZoomChange: (z: number) => void
  activeModeId: string | null
  activeStateId: string | null
  itemPlatform: Record<string, ScreenPlatform>
  onItemPlatformChange: (itemId: string, p: ScreenPlatform) => void
  onSelect: (modeId: string, stateId: string, platform: ScreenPlatform) => void
  activeComponentId: string | null
  onComponentSelect: (id: string) => void
}> = (p) => {
  const colors = p.spec.brand.conceptColors ?? DEFAULT_CONCEPT_COLORS
  const isOptionActive = (opt: SidebarOption) => opt.modeId === p.activeModeId && opt.stateId === p.activeStateId
  const getActiveOption = (item: SidebarItem) => item.options.find(isOptionActive)
  const getSelectedPlatform = (item: SidebarItem): ScreenPlatform =>
    getActiveOption(item)?.platform ?? p.itemPlatform[item.id] ?? item.options[0]?.platform ?? 'web'

  const handleItemClick = (item: SidebarItem) => {
    const mode = p.spec.modes.find((m) => m.id === item.options[0]?.modeId)
    if (!mode || mode.states.length === 0 || mode.platforms.length === 0) {
      console.warn(`[V3Artboard] sidebar item "${item.id}" -> mode unavailable (no states/platforms); click ignored`)
      return
    }
    const opt = item.options.find((o) => o.platform === getSelectedPlatform(item)) ?? item.options[0]
    if (opt) p.onSelect(opt.modeId, opt.stateId, opt.platform)
  }

  const handleItemKey = (item: SidebarItem, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleItemClick(item)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 top-0 z-[60] flex flex-col bg-white" style={{ width: 288, borderRight: '1px solid var(--v3-border, #d7d6da)' }}>
      <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid var(--v3-border, #d7d6da)' }}>
        {p.spec.brand.icon && <div className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0" style={{ background: 'var(--v3-accent, #402aff)' }}>{p.spec.brand.icon}</div>}
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: 'var(--v3-text, #03072d)' }}>{p.spec.brand.title}</p>
          {p.spec.brand.subtitle && <p className="text-[10px]" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{p.spec.brand.subtitle}</p>}
        </div>
      </div>

      <div className="px-4 pt-3 pb-3 space-y-3 bg-white" style={{ borderBottom: '1px solid var(--v3-border, #d7d6da)' }}>
        <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--v3-bg-muted, #f8f8fb)', border: '1px solid var(--v3-border, #d7d6da)' }}>
          {(p.hasComponents ? (['viewer', 'artboard', 'components'] as const) : (['viewer', 'artboard'] as const)).map((m) => (
            <button key={m} onClick={() => p.onTabChange(m)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all ${p.tab === m ? 'bg-white shadow-sm' : ''}`}
              style={{ color: p.tab === m ? 'var(--v3-text, #03072d)' : 'var(--v3-text-muted, #73727c)' }}
            >{m}</button>
          ))}
        </div>

        {p.tab === 'viewer' && p.activeMode && (
          <div>
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--v3-text-muted, #73727c)' }}>Platform</p>
            <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--v3-bg-muted, #f8f8fb)', border: '1px solid var(--v3-border, #d7d6da)' }}>
              {p.activeMode.platforms.map((pf) => (
                <button key={pf} onClick={() => p.onPlatformChange(pf)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all ${p.activePlatform === pf ? 'bg-white shadow-sm' : ''}`}
                  style={{ color: p.activePlatform === pf ? 'var(--v3-text, #03072d)' : 'var(--v3-text-muted, #73727c)' }}>
                  {PLATFORM_LABELS[pf]}
                </button>
              ))}
            </div>
          </div>
        )}

        {p.tab === 'artboard' && (
          <div>
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--v3-text-muted, #73727c)' }}>Zoom</p>
            <div className="flex items-center gap-2">
              <button onClick={() => p.onZoomChange(Math.max(0.1, p.zoom - 0.05))} className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-bold hover:bg-grey-03" style={{ border: '1px solid var(--v3-border, #d7d6da)', color: 'var(--v3-text-muted, #73727c)' }}>-</button>
              <span className="flex-1 text-center text-xs font-semibold" style={{ color: 'var(--v3-text, #03072d)' }}>{Math.round(p.zoom * 100)}%</span>
              <button onClick={() => p.onZoomChange(Math.min(1, p.zoom + 0.05))} className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-bold hover:bg-grey-03" style={{ border: '1px solid var(--v3-border, #d7d6da)', color: 'var(--v3-text-muted, #73727c)' }}>+</button>
              <button onClick={() => p.onZoomChange(0.3)} className="rounded-md bg-white px-2 py-1 text-[10px] font-medium hover:bg-grey-03" style={{ border: '1px solid var(--v3-border, #d7d6da)', color: 'var(--v3-text-muted, #73727c)' }}>Reset</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {p.tab !== 'components' && p.spec.sidebar.map((section, sectionIdx) => {
          const { bg, text } = colors[sectionIdx % colors.length]
          return (
            <div key={section.sectionLabel} className="px-4 py-3" style={{ borderBottom: '1px solid var(--v3-border, #d7d6da)' }}>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{section.sectionLabel}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = !!getActiveOption(item)
                  const selPlatform = getSelectedPlatform(item)
                  const mode = p.spec.modes.find((m) => m.id === item.options[0]?.modeId)
                  const disabled = !mode || mode.states.length === 0 || mode.platforms.length === 0
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      aria-disabled={disabled}
                      onClick={() => handleItemClick(item)}
                      onKeyDown={(e) => handleItemKey(item, e)}
                      className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors cursor-pointer ${active ? `${bg} ${text}` : 'hover:bg-grey-03'} ${disabled ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[11px] font-semibold leading-snug flex-1 ${active ? '' : ''}`} style={!active ? { color: 'var(--v3-text, #03072d)' } : undefined}>{item.label}</p>
                        {item.options.length > 1 && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {item.options.map((opt) => (
                              <button key={opt.platform}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); p.onItemPlatformChange(item.id, opt.platform); p.onSelect(opt.modeId, opt.stateId, opt.platform) }}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all leading-none ${
                                  selPlatform === opt.platform
                                    ? active ? 'bg-white/40 text-current' : 'text-white'
                                    : active ? 'opacity-50 hover:opacity-80' : 'hover:bg-grey-06'
                                }`}
                                style={
                                  selPlatform === opt.platform && !active
                                    ? { background: 'var(--v3-accent, #402aff)' }
                                    : selPlatform !== opt.platform && !active
                                      ? { color: 'var(--v3-text-muted, #73727c)' }
                                      : undefined
                                }>
                                {opt.platformLabel[0]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {item.description && <p className={`text-[10px] leading-tight mt-0.5 opacity-80 ${active ? text : ''}`} style={!active ? { color: 'var(--v3-text-muted, #73727c)' } : undefined}>{item.description}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {p.tab === 'components' && p.spec.componentFocus && (
          <div className="px-4 py-3 space-y-1" style={{ borderBottom: '1px solid var(--v3-border, #d7d6da)' }}>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--v3-text-muted, #73727c)' }}>Components</p>
            {p.spec.componentFocus.map((c) => {
              const active = c.id === p.activeComponentId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => p.onComponentSelect(c.id)}
                  className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors ${active ? 'bg-p1-50 text-primary-1' : 'hover:bg-grey-03'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold" style={!active ? { color: 'var(--v3-text, #03072d)' } : undefined}>{c.label}</p>
                    <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{c.level}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {p.tab !== 'components' && p.spec.context && p.spec.context.length > 0 && (
          <div className="px-4 pb-6 space-y-3 pt-4" style={{ borderTop: '1px solid var(--v3-border, #d7d6da)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--v3-text-muted, #73727c)' }}>Context</p>
            {p.spec.context.map((card, i) => {
              const t = TONE_STYLES[card.tone]
              return (
                <div key={i} className={`rounded-xl border ${t.border} ${t.bg} p-3`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
                    <p className={`text-[11px] font-bold ${t.title}`}>{card.title}</p>
                  </div>
                  <ul className={`space-y-0.5 text-[10px] ${t.body}`}>
                    {card.items.map((line, li) => <li key={li}>{line}</li>)}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
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
}

export const V3Artboard = React.forwardRef<V3ArtboardHandle, V3ArtboardProps>(({ spec, theme }, ref) => {
  const { modes } = spec
  const defaults = spec.defaults ?? {}
  const storageKey = `v3artboard:${spec.brand.title}`
  const hasComponents = !!(spec.componentFocus && spec.componentFocus.length > 0)

  /* E1: validate spec once on mount */
  const validatedRef = useRef(false)
  if (!validatedRef.current) {
    validatedRef.current = true
    const issues = validateSpec(spec)
    if (issues.length > 0) {
      console.warn(`[V3Artboard] spec validation: ${issues.length} issue(s)`)
      issues.forEach((i) => console.warn(`[V3Artboard] spec validation: ${i}`))
    }
  }

  /* E4: zero-modes empty placeholder */
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

  /* E2: clamp default platform */
  const firstModePlatforms = modes[0].platforms
  let initialPlatform: ScreenPlatform = defaults.platform ?? firstModePlatforms[0] ?? 'web'
  if (defaults.platform && !firstModePlatforms.includes(defaults.platform)) {
    const fallback = firstModePlatforms[0] ?? 'web'
    console.warn(`[V3Artboard] defaults.platform "${defaults.platform}" not in modes[0].platforms; clamping to "${fallback}"`)
    initialPlatform = fallback
  }

  /* Read persisted + hash, in that order */
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

  // hash overrides persisted; either overrides defaults
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
  const [activeComponentId, setActiveComponentId] = useState<string | null>(hasComponents ? spec.componentFocus![0].id : null)
  const artboardRef = useRef<HTMLDivElement>(null)
  const panelWidth = panelOpen ? 288 : 0

  const viewMode: ViewMode = tab === 'components' ? 'viewer' : tab

  /* E5: persist on changes */
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

  /* E6: hash sync on selection change */
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

  /* Wheel zoom */
  useEffect(() => {
    const el = artboardRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        setZoom((z) => Math.min(1, Math.max(0.1, z + (e.deltaY > 0 ? -0.05 : 0.05))))
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [tab])

  /* Active mode/state with empty-state guards (E4) */
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
    return true
  }

  const handleArtboardFrameClick = (modeId: string, stateId: string, platform: ScreenPlatform) => {
    if (selectByIdsInternal(modeId, stateId, platform)) setTab('viewer')
  }

  /* E8: keyboard nav */
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
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentFlat, allStatesFlat.length])

  /* E7: imperative handle */
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

  const renderViewer = () => {
    if (!activeMode || !activeState || !activeModeHasPlatforms) {
      console.warn(`[V3Artboard] viewer skipped: mode "${activeMode?.id ?? '?'}" has no states or platforms`)
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-49px)]" style={{ background: 'var(--v3-bg-muted, #e8e8ec)' }}>
          <p className="text-xs" style={{ color: 'var(--v3-text-muted, #73727c)' }}>Mode has no renderable state.</p>
        </div>
      )
    }
    const availableW = (typeof window !== 'undefined' ? window.innerWidth : 1440) - panelWidth - 64
    const scale = activePlatform === 'web' ? Math.min(1, availableW / 1280) : 1
    return (
      <div className="flex items-start justify-center p-8 pt-16 min-h-[calc(100vh-49px)]" style={{ background: 'var(--v3-bg-muted, #e8e8ec)' }}>
        <div style={{ zoom: scale, flexShrink: 0 }}>{activeMode.renderFrame(activeState, activePlatform)}</div>
      </div>
    )
  }

  const renderArtboard = () => (
    <div ref={artboardRef} className="overflow-auto" style={{ height: 'calc(100vh - 49px)', background: 'var(--v3-bg-muted, #e8e8ec)' }}>
      <div className="origin-top-left px-8 py-6 pt-16" style={{ zoom }}>
        {spec.artboard.map((section) => (
          <ArtboardSectionBlock key={section.id} section={section} modes={modes} onFrameClick={handleArtboardFrameClick} />
        ))}
      </div>
    </div>
  )

  const activeComponent = hasComponents ? spec.componentFocus!.find((c) => c.id === activeComponentId) ?? spec.componentFocus![0] : null

  return (
    <div className="flex min-h-screen font-perk-sans" style={{ background: 'var(--v3-bg-muted, #f8f8fb)', ...buildThemeStyle(theme) }} data-v3artboard-root>
      {panelOpen && (
        <Sidebar
          spec={spec}
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
          activeComponentId={activeComponentId}
          onComponentSelect={setActiveComponentId}
        />
      )}

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
        {tab === 'components' && activeComponent && <ComponentFocusPanel component={activeComponent} />}
      </main>
    </div>
  )
})

V3Artboard.displayName = 'V3Artboard'

export default V3Artboard
