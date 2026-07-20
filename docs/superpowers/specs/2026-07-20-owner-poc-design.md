# Vetly Owner POC — "Mediterranean Warmth" Design

**Date:** 2026-07-20
**Status:** Approved (user approved design in session; requested immediate implementation)

## Purpose

A look-and-feel demo web app for the owner-first pivot. Pure frontend with
realistic Greek mock data — no backend, no real auth. Goal: put it in front of
the team and real pet owners to validate the design direction before investing
in the production app.

## Scope

Three flows, mobile-first, scaling to desktop. All UI text in Greek.

1. **Onboarding** — welcome screen → mock signup (name + email) → add-pet
   wizard (species → name → optional birthday/breed → optional photo), one
   question per screen, progress dots, skippable steps → celebration moment →
   home.
2. **Home / pet profile** — Greek greeting by time of day, pet glass card as
   hero (photo, auto-computed age, breed), quick-action row (AI chat active;
   reminders + health book stubbed as "coming soon"). Pet card opens profile:
   glass header over gradient, basic info, mock health timeline.
3. **AI chat** — sea-toned gradient backdrop, pet context chip, suggested
   Greek question chips, mocked streaming responses (timer-based token reveal,
   markdown rendering), 5–6 pre-scripted realistic Q&A pairs.

**Out of scope:** real auth, reminders flow, vet directory, PWA setup, backend
work, tests beyond lint + type-check.

## Visual system

Core idea: **warm Mediterranean gradients as the canvas, glass as the surface.**

- **Palette:** warm sand base `#FAF6EF`; terracotta primary `#C96F4A`; olive
  `#7A8450` and Aegean teal `#1D7A8C` accents; warm charcoal `#2E2A25` text.
  No pure white or pure black. Warm sections use sand → pale coral gradients;
  chat uses pale aqua → Aegean teal.
- **Typography:** Commissioner (headings) + Inter (body), Greek + Latin
  subsets, via next/font/google.
- **Icons:** Lucide only — no emoji in UI chrome. Pet avatars: photo with
  warm paw-icon fallback. One emoji allowed: the celebration screen.
- **Glass rule:** glass (ReactBits GlassSurface-style, backdrop-filter with
  blur fallback) for elevated content — pet card, chat container, bottom nav,
  modals. Solid soft surfaces for dense reading content.

## Motion

Framer Motion: staggered card entrances, spring button presses, wizard step
transitions, streaming chat reveal, confetti celebration. All animations
< 300ms except celebrations.

## Tech

- Next.js 15 App Router + TypeScript + Tailwind CSS v4
- lucide-react, framer-motion (motion), GlassSurface component copied/adapted
- Hand-rolled minimal primitives (Button, Input, Chip) styled to the system
- Mock data in typed fixtures (`lib/mock/`); state in React context,
  persisted to localStorage so demos survive refresh
- Lives in `vetly-owner-poc/` at repo root, sibling to `vetly-front/`

## Success criteria

- New user reaches a personalized home in under 2 minutes of tapping
- Chat demo always looks alive (scripted answers stream convincingly)
- Zero generic-SaaS feel: no flat white cards, no emoji icons, Greek text
  throughout
- `npm run lint` and `tsc --noEmit` pass; `npm run build` succeeds
