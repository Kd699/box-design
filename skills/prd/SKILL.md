---
name: prd
description: Create canonical UX documentation with pure user language - no code speak
---

Activate when user types: /prd

## Core Rules

### 1. No Code Language
- No file paths, component names, or technical types
- No variable names, props, or state references
- "Modal" becomes "Popup"
- "validation" becomes "shows error if..."
- "session" becomes "until the page is refreshed"
- "responsive" becomes "depending on screen width"
- "state" becomes "what the user sees"
- "render" becomes "shows" or "displays"

### 2. Only What's Actually There
- Must reflect the live feature
- Read the codebase first to verify what exists
- If a feature exists but isn't connected, don't document it
- No assumptions about features not implemented

### 3. Pure UX Language
- Describe what the user sees and does
- Use plain English anyone can understand
- Focus on behaviour, not implementation
- A non-technical person should understand everything

### 4. Semantic Structure
- Page/screen layout first (top to bottom, left to right)
- Section by section breakdown
- States and behaviours for interactive elements
- User flows for multi-step processes

### 5. Complete Coverage
- All visible elements listed
- All interactive states documented
- All user flows covered
- All error states described in plain language

## Translation Guide

| Don't Say | Say Instead |
|-----------|-------------|
| Modal | Popup |
| Component | Section / Element |
| State | What the user sees |
| Render | Shows / Displays |
| Props | Settings |
| Callback | When clicked |
| Handler | Action |
| Validation | Shows error if... |
| Session | Until page is refreshed |
| Responsive | Depending on screen width |
| API | System |
| Fetch | Loads |
| Loading state | Shows loading spinner |
| Error state | Shows error message |
| Empty state | Shows empty message |
| Toggle | Switch |
| Dropdown | Selection menu |
| Input | Text field |
| Checkbox | Tick box |

## Workflow

1. Ask: "What's the URL or page where this feature lives?"
2. Find and read the actual codebase files
3. List all sections, elements, and interactions found
4. Generate document using pure UX language
5. Save as `DOCUMENTATION.md` in the feature folder

## Document Structure

```
# {Feature Name} - Feature Documentation

## Page Layout
{Top to bottom structure}

## {Section Name}
{What user sees, behaviours}

## {Interactive Element}
### Structure
### States (Default, Hover, Active, Error)
### Behaviour

## User Flows
### {Flow Name}
1. User does X
2. System shows Y
3. User does Z

## Current {Items}
| Column | Column |
```

## Hotkeys
- NW = Skip questions, generate now
- R = Regenerate section
- M = Show what's missing
