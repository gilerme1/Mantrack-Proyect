import React from 'react'
import * as SelectPrimitive  from '@radix-ui/react-select'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { DayPicker }         from 'react-day-picker'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { Icon, ICONS }       from './UI.jsx'
import 'react-day-picker/style.css'

/* ─── CSS injected once ─────────────────────────────────────────────── */
const STYLES = `
/* ── Select ─────────────────────────────────────────────────────────── */
.rdx-select-trigger {
  display: inline-flex; align-items: center; justify-content: space-between;
  gap: 8px; width: 100%; height: 100%; min-height: 38px;
  background-color: var(--bg); border: 1px solid var(--border-light);
  border-radius: var(--radius-sm); padding: 9px 13px;
  color: var(--text); font-size: 13.5px; font-family: var(--font-sans);
  cursor: pointer; outline: none; white-space: nowrap;
  transition: border-color .15s, box-shadow .15s;
}
[data-theme="light"] .rdx-select-trigger { background-color: #fff; border-color: var(--border); }
.rdx-select-trigger:focus, .rdx-select-trigger[data-state="open"] {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(99,102,241,.18), 0 0 0 1px var(--accent);
}
.rdx-select-trigger[data-placeholder] > span:first-child { color: var(--text-muted); }
.rdx-select-trigger svg { flex-shrink: 0; transition: transform .18s; }
.rdx-select-trigger[data-state="open"] svg { transform: rotate(180deg); }

.rdx-select-content {
  background: var(--modal-bg);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 200;
  animation: fadeUp .15s cubic-bezier(.16,1,.3,1);
  min-width: var(--radix-select-trigger-width);
}
.rdx-select-viewport { padding: 6px; }
.rdx-select-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: var(--radius-sm);
  font-size: 13.5px; font-family: var(--font-sans); color: var(--text);
  cursor: pointer; outline: none; user-select: none;
  transition: background .1s;
}
.rdx-select-item:hover, .rdx-select-item[data-highlighted] {
  background: var(--surface-hover);
}
.rdx-select-item[data-state="checked"] { color: var(--accent); font-weight: 600; }
.rdx-select-item-indicator { margin-left: auto; }
.rdx-select-separator {
  height: 1px; background: var(--border); margin: 4px 8px;
}
.rdx-select-label {
  padding: 6px 12px 2px;
  font-size: 10px; font-weight: 700; letter-spacing: .07em;
  text-transform: uppercase; color: var(--text-muted);
}

/* ── Tooltip ─────────────────────────────────────────────────────────── */
.rdx-tooltip-content {
  background: var(--surface-hover);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 5px 10px;
  font-size: 12px; font-weight: 500; font-family: var(--font-sans);
  color: var(--text); box-shadow: var(--shadow);
  max-width: 240px; line-height: 1.4;
  animation: fadeIn .12s ease;
  z-index: 300;
}
.rdx-tooltip-arrow { fill: var(--border-light); }

/* ── Popover ─────────────────────────────────────────────────────────── */
.rdx-popover-content {
  background: var(--modal-bg);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 16px;
  z-index: 200;
  animation: fadeUp .15s cubic-bezier(.16,1,.3,1);
}
.rdx-popover-arrow { fill: var(--border-light); }

/* ── DayPicker ───────────────────────────────────────────────────────── */
.rdp-root {
  --rdp-accent-color: var(--accent) !important;
  --rdp-accent-background-color: var(--accent-soft) !important;
  --rdp-day-font: var(--font-sans) !important;
  font-family: var(--font-sans) !important;
  font-size: 13px !important;
  color: var(--text) !important;
}
.rdp-month_caption { font-size: 13px !important; font-weight: 700 !important; color: var(--text) !important; }
.rdp-nav button { color: var(--text-secondary) !important; border-radius: var(--radius-sm) !important; }
.rdp-nav button:hover { background: var(--surface-hover) !important; }
.rdp-weekday { font-size: 11px !important; font-weight: 700 !important; color: var(--text-muted) !important; }
.rdp-day button {
  border-radius: var(--radius-sm) !important;
  font-family: var(--font-sans) !important;
  font-size: 13px !important;
  color: var(--text) !important;
  transition: background .1s !important;
}
.rdp-day button:hover { background: var(--surface-hover) !important; }
.rdp-selected button {
  background: var(--accent) !important;
  color: #fff !important;
  font-weight: 600 !important;
}
.rdp-today button { color: var(--accent) !important; font-weight: 700 !important; }
.rdp-outside button { color: var(--text-muted) !important; opacity: .5 !important; }

/* ── ColorPicker ─────────────────────────────────────────────────────── */
.react-colorful { width: 100% !important; border-radius: var(--radius-sm) !important; }
.react-colorful__saturation { border-radius: var(--radius-sm) var(--radius-sm) 0 0 !important; }
.react-colorful__last-control { border-radius: 0 0 var(--radius-sm) var(--radius-sm) !important; }
.react-colorful__pointer {
  width: 20px !important; height: 20px !important;
  border: 2px solid #fff !important;
  box-shadow: 0 1px 6px rgba(0,0,0,.4) !important;
}
.color-input-row {
  display: flex; align-items: center; gap: 8px; margin-top: 10px;
}
.color-preview {
  width: 32px; height: 32px; border-radius: var(--radius-sm);
  border: 1px solid var(--border-light); flex-shrink: 0;
}
.color-hex-input {
  flex: 1; background-color: var(--bg); border: 1px solid var(--border-light);
  border-radius: var(--radius-sm); padding: 6px 10px;
  color: var(--text); font-size: 13px; font-family: var(--font-mono);
  outline: none; transition: border-color .15s, box-shadow .15s;
  text-transform: uppercase;
}
[data-theme="light"] .color-hex-input { background-color: #fff; }
.color-hex-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(99,102,241,.18);
}
`

let stylesInjected = false
function injectStyles() {
  if (stylesInjected) return
  const el = document.createElement('style')
  el.textContent = STYLES
  document.head.appendChild(el)
  stylesInjected = true
}

/* ─── Select ─────────────────────────────────────────────────────────── */
export function Select({ value, onValueChange, placeholder, options = [], children, disabled }) {
  injectStyles()
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger className="rdx-select-trigger">
        <SelectPrimitive.Value placeholder={placeholder} />
        <Icon path={ICONS.chevDown} size={14} stroke="var(--text-muted)" strokeWidth={2} />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="rdx-select-content" position="popper" sideOffset={6}>
          <SelectPrimitive.Viewport className="rdx-select-viewport">
            {children ?? options.map(opt => {
              const val   = typeof opt === 'object' ? opt.value : opt
              const label = typeof opt === 'object' ? opt.label : opt
              return (
                <SelectPrimitive.Item key={val} value={val} className="rdx-select-item">
                  <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="rdx-select-item-indicator">
                    <Icon path={ICONS.check} size={13} stroke="var(--accent)" strokeWidth={2.5} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              )
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export function SelectGroup({ label, children }) {
  return (
    <SelectPrimitive.Group>
      {label && <SelectPrimitive.Label className="rdx-select-label">{label}</SelectPrimitive.Label>}
      {children}
    </SelectPrimitive.Group>
  )
}

export function SelectItem({ value, children }) {
  return (
    <SelectPrimitive.Item value={value} className="rdx-select-item">
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="rdx-select-item-indicator">
        <Icon path={ICONS.check} size={13} stroke="var(--accent)" strokeWidth={2.5} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

/* ─── Tooltip ────────────────────────────────────────────────────────── */
export function TooltipProvider({ children }) {
  injectStyles()
  return <TooltipPrimitive.Provider delayDuration={400}>{children}</TooltipPrimitive.Provider>
}

export function Tooltip({ content, children, side = 'top' }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content className="rdx-tooltip-content" side={side} sideOffset={6}>
          {content}
          <TooltipPrimitive.Arrow className="rdx-tooltip-arrow" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

/* ─── Popover ────────────────────────────────────────────────────────── */
export function Popover({ trigger, children, align = 'start', side = 'bottom' }) {
  injectStyles()
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="rdx-popover-content"
          align={align} side={side} sideOffset={8}
          collisionPadding={12}
        >
          {children}
          <PopoverPrimitive.Arrow className="rdx-popover-arrow" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

/* ─── DatePicker ─────────────────────────────────────────────────────── */
export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha...' }) {
  injectStyles()
  const [open, setOpen] = React.useState(false)

  const formatted = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  const selected = value ? new Date(value + 'T00:00:00') : undefined

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button className="rdx-select-trigger" style={{ justifyContent: 'space-between' }}>
          <span style={{ color: formatted ? 'var(--text)' : 'var(--text-muted)' }}>
            {formatted ?? placeholder}
          </span>
          <Icon path={ICONS.calendar} size={14} stroke="var(--text-muted)" strokeWidth={2} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="rdx-popover-content"
          align="start" sideOffset={8} collisionPadding={12}
          style={{ padding: 8 }}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={d => {
              if (!d) return
              const iso = d.toLocaleDateString('sv')
              onChange(iso)
              setOpen(false)
            }}
            weekStartsOn={1}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

/* ─── ColorPicker ────────────────────────────────────────────────────── */
export function ColorPicker({ value = '#6366F1', onChange }) {
  injectStyles()
  return (
    <div>
      <HexColorPicker color={value} onChange={onChange} />
      <div className="color-input-row">
        <div className="color-preview" style={{ background: value }} />
        <HexColorInput
          className="color-hex-input"
          color={value}
          onChange={onChange}
          prefixed
        />
      </div>
    </div>
  )
}
