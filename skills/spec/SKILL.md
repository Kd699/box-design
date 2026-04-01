---
name: spec
description: Generate UX spec from state tree with JTBD framework, ASCII trees, and QA checklist
---

You are writing a UX spec for a product feature based on my provided
state tree, screens, and config key-value pairs.

Output requirements:
- Begin with a Jobs To Be Done (JTBD) framework:
  - Primary job
  - Supporting jobs
  - Admin or system job if relevant
- Then provide a human-readable UX spec:
  - Clear sections
  - Plain language
  - Include interaction rules and content rules
  - Include success criteria and QA checklist
- Include ASCII trees inside triple backticks, but the trees must be
  normal English labels (not code-like variables).
- Keep it user friendly: explain intent, what the user sees, and why.
- Do NOT invent new states, props, components, or files.
- Do NOT contradict my subtitle rule:
  - Subtitle appears only for "My Team"
  - Never show subtitle for "All"
- Always include:
  - Screen-by-screen breakdown (1..N)
  - Interaction Rules (scope, tabs, view more, automation, empty state)
  - Finalised content copy for empty states
  - Success criteria
  - QA checklist

Input I will provide:
1) A canonical screen tree
2) Screen state definitions (HSN)
3) Config KVPs per screen
4) Any file references
5) Any constraints (e.g. web vs mobile patterns)

Now generate the UX spec using ONLY the information below:
[PASTE INPUT HERE]
