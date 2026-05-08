import React, { useMemo, useState } from 'react'
import type {
  V3ArtboardSpec,
  ScreenMode,
  ScreenPlatform,
  SidebarOption,
  SidebarItem,
  SidebarSection,
  ContextCard,
  ViewMode,
  ComponentFocusConfigResolved,
} from '../types'

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

export type SidebarTab = 'viewer' | 'artboard' | 'components'

const highlight = (text: string, q: string): React.ReactNode => {
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-yellow-100 rounded-sm">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  )
}

const itemMatches = (item: SidebarItem, q: string): boolean => {
  if (!q) return true
  const ql = q.toLowerCase()
  if (item.label.toLowerCase().includes(ql)) return true
  if (item.description && item.description.toLowerCase().includes(ql)) return true
  if (item.subgroup) {
    if (item.subgroup.label.toLowerCase().includes(ql)) return true
    if (item.subgroup.items.some((s) => itemMatches(s, q))) return true
  }
  return false
}

export interface SidebarProps {
  spec: V3ArtboardSpec
  effectiveSidebar: SidebarSection[]
  validationIssues: string[]
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
  resolvedComponents: ComponentFocusConfigResolved[]
  componentFocusLayout: 'grid' | 'detail'
  activeComponentId: string | null
  onComponentSelect: (id: string) => void
  activeComponentStateIndex: number
  onComponentStateIndexChange: (i: number) => void
  onHelpClick: () => void
}

export const Sidebar: React.FC<SidebarProps> = (p) => {
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

  const totalItems = useMemo(
    () => p.effectiveSidebar.reduce((acc, s) => acc + s.items.length, 0),
    [p.effectiveSidebar],
  )
  const [search, setSearch] = useState('')
  const showSearch = totalItems > 10

  const filteredSections: SidebarSection[] = useMemo(() => {
    if (!showSearch || !search) return p.effectiveSidebar
    return p.effectiveSidebar
      .map((sec) => ({ ...sec, items: sec.items.filter((it) => itemMatches(it, search)) }))
      .filter((sec) => sec.items.length > 0)
  }, [p.effectiveSidebar, search, showSearch])

  const [bannerExpanded, setBannerExpanded] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const showBanner = p.validationIssues.length > 0 && !bannerDismissed

  const renderItem = (item: SidebarItem, sectionIdx: number, indented = false): React.ReactNode => {
    const { bg, text } = colors[sectionIdx % colors.length]
    const active = !!getActiveOption(item)
    const selPlatform = getSelectedPlatform(item)
    const mode = p.spec.modes.find((m) => m.id === item.options[0]?.modeId)
    const disabled = !mode || mode.states.length === 0 || mode.platforms.length === 0
    return (
      <div key={item.id} className={indented ? 'pl-3 ml-2' : ''} style={indented ? { borderLeft: '1px solid var(--v3-border, #d7d6da)' } : undefined}>
        <div
          role="button"
          tabIndex={0}
          aria-disabled={disabled}
          onClick={() => handleItemClick(item)}
          onKeyDown={(e) => handleItemKey(item, e)}
          className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors cursor-pointer ${active ? `${bg} ${text}` : 'hover:bg-grey-03'} ${disabled ? 'opacity-40' : ''}`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              checked={active}
              readOnly
              className="shrink-0"
              style={{ accentColor: 'var(--v3-accent, #402aff)' }}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-[11px] font-semibold leading-snug flex-1" style={!active ? { color: 'var(--v3-text, #03072d)' } : undefined}>
              {showSearch ? highlight(item.label, search) : item.label}
            </p>
            {item.options.length > 1 && (
              <div className="flex items-center gap-0.5 shrink-0">
                {item.options.map((opt) => (
                  <button
                    key={opt.platform}
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
          {item.description && <p className={`text-[10px] leading-tight mt-0.5 opacity-80 ${active ? text : ''}`} style={!active ? { color: 'var(--v3-text-muted, #73727c)' } : undefined}>{showSearch ? highlight(item.description, search) : item.description}</p>}
        </div>
        {item.subgroup && (
          <div className="mt-1 mb-1">
            <p className="text-[9px] font-bold uppercase tracking-widest px-2 py-1" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{item.subgroup.label}</p>
            <div className="space-y-0.5">
              {item.subgroup.items.map((sub) => renderItem(sub, sectionIdx, true))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 top-0 z-[60] flex flex-col bg-white" style={{ width: 288, borderRight: '1px solid var(--v3-border, #d7d6da)' }}>
      <div className="sticky top-0 z-10 bg-white" style={{ borderBottom: '1px solid var(--v3-border, #d7d6da)' }}>
        <div className="flex items-center gap-2.5 px-5 py-4">
          {p.spec.brand.icon && <div className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0" style={{ background: 'var(--v3-accent, #402aff)' }}>{p.spec.brand.icon}</div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--v3-text, #03072d)' }}>{p.spec.brand.title}</p>
            {p.spec.brand.subtitle && <p className="text-[10px] truncate" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{p.spec.brand.subtitle}</p>}
          </div>
        </div>
        <div className="px-4 pb-3 space-y-3">
          <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--v3-bg-muted, #f8f8fb)', border: '1px solid var(--v3-border, #d7d6da)' }}>
            {(['viewer', 'artboard', 'components'] as const).map((m) => {
              const isComponents = m === 'components'
              const dis = isComponents && !p.hasComponents
              return (
                <button
                  key={m}
                  type="button"
                  disabled={dis}
                  title={dis ? 'no components registered' : undefined}
                  onClick={() => !dis && p.onTabChange(m)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all ${p.tab === m ? 'bg-white shadow-sm' : ''} ${dis ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ color: p.tab === m ? 'var(--v3-text, #03072d)' : 'var(--v3-text-muted, #73727c)' }}
                >{m}</button>
              )
            })}
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

          <button
            type="button"
            onClick={p.onHelpClick}
            data-v3-help-button
            className="flex items-center gap-2 px-3 py-2 rounded-md w-full text-xs font-semibold transition-colors hover:bg-grey-03"
            style={{ background: 'white', border: '1px solid var(--v3-border, #d7d6da)', color: 'var(--v3-text, #03072d)' }}
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-bold" style={{ background: 'var(--v3-bg-muted, #f8f8fb)', color: 'var(--v3-text-muted, #73727c)' }}>?</span>
            How to use this page
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showBanner && (
          <div className="m-3 rounded-md text-[11px] overflow-hidden" data-v3-validation-banner style={{ background: '#FFFBEB', border: '1px solid #F59E0B' }}>
            <div className="flex items-center justify-between px-3 py-2">
              <button type="button" className="flex-1 text-left font-semibold" style={{ color: '#92400E' }} onClick={() => setBannerExpanded((v) => !v)}>
                Spec validation: {p.validationIssues.length} issue{p.validationIssues.length === 1 ? '' : 's'} {bannerExpanded ? '▾' : '▸'}
              </button>
              <button type="button" onClick={() => setBannerDismissed(true)} className="text-xs px-1 ml-2" aria-label="Dismiss" style={{ color: '#92400E' }}>×</button>
            </div>
            {bannerExpanded && (
              <ul className="px-4 py-2 space-y-1 list-disc" style={{ color: '#92400E', borderTop: '1px solid #F59E0B' }}>
                {p.validationIssues.map((iss, i) => <li key={i} className="break-words">{iss}</li>)}
              </ul>
            )}
          </div>
        )}

        {showSearch && p.tab !== 'components' && (
          <div className="px-4 pt-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search states..."
              className="w-full rounded-md px-2 py-1.5 text-[11px]"
              style={{ background: 'var(--v3-bg-muted, #f8f8fb)', border: '1px solid var(--v3-border, #d7d6da)', color: 'var(--v3-text, #03072d)' }}
            />
          </div>
        )}

        {p.tab !== 'components' && filteredSections.map((section, sectionIdx) => {
          const mode = p.spec.modes.find((m) => m.id === section.items[0]?.options[0]?.modeId)
          const sectionDesc = mode?.description
          return (
            <div key={section.sectionLabel + sectionIdx} className="px-4 py-3" style={{ borderBottom: '1px solid var(--v3-border, #d7d6da)' }}>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest" title={sectionDesc} style={{ color: 'var(--v3-text-muted, #73727c)' }}>{section.sectionLabel}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => renderItem(item, sectionIdx))}
              </div>
            </div>
          )
        })}

        {p.tab === 'components' && (
          <div className="px-4 py-3 space-y-1" style={{ borderBottom: '1px solid var(--v3-border, #d7d6da)' }}>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--v3-text-muted, #73727c)' }}>Components</p>
            {p.resolvedComponents.map((c) => {
              const active = c.id === p.activeComponentId
              return (
                <div key={c.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => p.onComponentSelect(c.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.onComponentSelect(c.id) } }}
                    className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors cursor-pointer ${active ? 'bg-p1-50 text-primary-1' : 'hover:bg-grey-03'}`}
                  >
                    <div className="flex items-center gap-2">
                      <input type="radio" checked={active} readOnly className="shrink-0" style={{ accentColor: 'var(--v3-accent, #402aff)' }} tabIndex={-1} onClick={(e) => e.stopPropagation()} />
                      <p className="text-[11px] font-semibold flex-1" style={!active ? { color: 'var(--v3-text, #03072d)' } : undefined}>{c.label}</p>
                      <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{c.level}</span>
                    </div>
                  </div>
                  {active && p.componentFocusLayout === 'detail' && c.states.length > 1 && (
                    <div className="pl-3 ml-2 mt-1 space-y-0.5" style={{ borderLeft: '1px solid var(--v3-border, #d7d6da)' }}>
                      {c.states.map((st, si) => (
                        <label key={si} className={`flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 text-[11px] ${si === p.activeComponentStateIndex ? 'bg-p1-50 text-primary-1' : 'hover:bg-grey-03'}`}>
                          <input type="radio" name={`cstate-${c.id}`} checked={si === p.activeComponentStateIndex} onChange={() => p.onComponentStateIndexChange(si)} style={{ accentColor: 'var(--v3-accent, #402aff)' }} />
                          <span className="font-medium">{st.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
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
