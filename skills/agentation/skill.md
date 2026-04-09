# /agentation

Annotate UI elements directly in the browser and copy element + DOM context into a Claude Code prompt.

## What It Does

Agentation is a browser plugin that lets you click on any element in your running app and capture its full context -- component name, props, DOM structure, styles -- into a ready-to-use Claude Code prompt. This closes the gap between "I see a bug in the UI" and "Claude has the exact context to fix it."

Typical use: you spot a layout issue, click the element with the Agentation overlay, paste the captured context into Claude Code, and describe what needs to change.

## Requirements

The Agentation plugin must be installed first. It is rooted at `app.tsx` in your project. Without the plugin running, this skill has nothing to annotate.

## How to Trigger

Once the plugin is active:
1. Open your app in the browser
2. Use the Agentation overlay to click the element you want to annotate
3. Copy the generated context block
4. Paste into Claude Code with your instruction, e.g.:

```
/agentation

[paste captured context here]

The button label is truncated on mobile -- fix it.
```

Claude Code will use the DOM context, component path, and props to locate and fix the element precisely.

## Notes

- Works best when component names match file names (standard React conventions)
- If the overlay is not visible, check that the plugin is mounted in `app.tsx`
- Captured context includes: component tree, relevant props, computed styles, and the element's position in the DOM
