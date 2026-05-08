import React from 'react'
import type { ComponentFocusConfig, ScreenPlatform } from '../types'

const PLATFORM_LABELS: Record<ScreenPlatform, string> = { web: 'Desktop', mobile: 'Mobile', native: 'Native' }

export function derivePlatforms(usedIn: ComponentFocusConfig['usedIn']): ScreenPlatform[] {
  const set = new Set<ScreenPlatform>()
  usedIn.forEach((u) => set.add(u.platform))
  const out: ScreenPlatform[] = []
  for (const p of ['web', 'mobile', 'native'] as const) if (set.has(p)) out.push(p)
  return out
}

export const ComponentFocusPanel: React.FC<{ component: ComponentFocusConfig }> = ({ component }) => {
  const platforms = derivePlatforms(component.usedIn)
  return (
    <div className="overflow-auto px-8 py-6 pt-16" style={{ height: 'calc(100vh - 49px)', background: 'var(--v3-bg-muted, #e8e8ec)' }}>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: '#EEF0FF', color: 'var(--v3-accent, #402aff)' }}>{component.level}</span>
        <h2 className="text-xl font-bold" style={{ color: 'var(--v3-text, #03072d)' }}>{component.label}</h2>
      </div>
      {component.children && component.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {component.children.map((c) => (
            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-white" style={{ border: '1px solid var(--v3-border, #d7d6da)', color: 'var(--v3-text-muted, #73727c)' }}>{c}</span>
          ))}
        </div>
      )}
      <div className="space-y-8">
        {component.states.map((st, si) => (
          <div key={si}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--v3-text-muted, #73727c)' }}>{st.label}</p>
            <div className="flex items-start gap-6 flex-wrap">
              {platforms.map((p) => (
                <div key={p}>
                  <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-blue-500">{PLATFORM_LABELS[p]}</p>
                  <div>{st.render(p)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
