/**
 * Stand-alone frame primitives for V3Artboard. Self-contained -- a new project
 * can import these without bringing in the manager-notifications-v2 page tree.
 *
 * Mirrors the canonical primitives originally in pages/manager-notifications-v2/shell.tsx,
 * but lives in components/v3artboard/ so V3Artboard never reaches into a page folder.
 */

import React from 'react'
import type { ScreenPlatform, StateConfig } from './types'

/* ── iOS status bar ────────────────────────────────────────────────────── */

export const IOSStatusBar: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div className={`flex items-center justify-between px-7 pb-1 pt-3 text-[11px] font-semibold ${dark ? 'text-white' : 'text-brand-black'}`}>
    <span>9:41</span>
    <div className="flex items-center gap-1.5">
      <div className="flex items-end gap-[1.5px]">
        {[4, 6, 8, 10].map((h, i) => (
          <div key={i} className={`w-[3px] rounded-[1px] ${dark ? 'bg-white' : 'bg-brand-black'}`} style={{ height: h, opacity: i === 3 ? 0.3 : 1 }} />
        ))}
      </div>
      <span className="text-[10px] tracking-tight">5G</span>
      <div className="flex items-center gap-[2px]">
        <div className={`relative rounded-[2px] border ${dark ? 'border-white/60' : 'border-brand-black/50'}`} style={{ width: 22, height: 11 }}>
          <div className={`absolute rounded-[1px] ${dark ? 'bg-white' : 'bg-brand-black'}`} style={{ inset: '1.5px' }} />
        </div>
        <div className={`h-[7px] w-[2px] rounded-r-sm ${dark ? 'bg-white/40' : 'bg-grey-20'}`} />
      </div>
    </div>
  </div>
)

/* ── PhoneFrame: bezeled mobile-web phone (358 × 780) ─────────────────── */

export const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative flex w-[358px] flex-col overflow-hidden rounded-[2.5rem] border border-grey-20 bg-white" style={{ height: 780, boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}>
    {children}
  </div>
)

/* ── NativeFrame: iPhone-like hardware shell with Dynamic Island ──────── */

export const NativeFrame: React.FC<{ children: React.ReactNode; darkScreen?: boolean }> = ({ children, darkScreen }) => (
  <div className="relative flex w-[358px] flex-col overflow-hidden rounded-[2.75rem]" style={{ height: 780, background: '#111', boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
    <div className="absolute left-0 top-[118px] w-[2px] h-7  rounded-r-sm" style={{ background: '#333' }} />
    <div className="absolute left-0 top-[160px] w-[2px] h-10 rounded-r-sm" style={{ background: '#333' }} />
    <div className="absolute left-0 top-[208px] w-[2px] h-10 rounded-r-sm" style={{ background: '#333' }} />
    <div className="absolute right-0 top-[148px] w-[2px] h-16 rounded-l-sm" style={{ background: '#333' }} />
    <div className={`absolute inset-[2px] rounded-[2.65rem] overflow-hidden ${darkScreen ? '' : 'bg-white'}`}>
      <div className="absolute top-3 left-1/2 z-30 -translate-x-1/2">
        <div className="flex items-center justify-center rounded-full" style={{ width: 126, height: 36, background: '#000' }}>
          <div className="w-3 h-3 rounded-full" style={{ background: '#1a1a1a', boxShadow: 'inset 0 0 0 1px #333' }} />
        </div>
      </div>
      {children}
    </div>
  </div>
)

/* ── DesktopFrame: browser-chrome wrapper (1440 × 800) ────────────────── */

export const DesktopFrame: React.FC<{ children: React.ReactNode; url?: string }> = ({ children, url = 'app.example.com' }) => (
  <div className="relative overflow-hidden rounded-lg border border-grey-20 bg-grey-03" style={{ width: 1440, height: 800, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
    <div className="flex items-center gap-2 border-b border-grey-12 bg-white px-4 py-2">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
      </div>
      <div className="flex-1 mx-4 max-w-[480px] rounded-md border border-grey-12 bg-grey-03 px-3 py-1 text-center text-[11px] text-grey-50">{url}</div>
    </div>
    <div className="relative overflow-hidden" style={{ height: 'calc(100% - 33px)' }}>{children}</div>
  </div>
)

/* ── createPlatformRenderer: dispatch helper for ScreenMode.renderFrame ─ */

export function createPlatformRenderer(renderers: {
  web?:    (state: StateConfig) => React.ReactNode
  mobile?: (state: StateConfig) => React.ReactNode
  native?: (state: StateConfig) => React.ReactNode
}): (state: StateConfig, platform: ScreenPlatform) => React.ReactNode {
  return (state, platform) => {
    const fn = renderers[platform] ?? renderers.native ?? renderers.mobile ?? renderers.web
    return fn ? fn(state) : null
  }
}
