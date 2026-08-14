# CONVENTIONAL — Volume 1 / Interactive Condominium

This repository contains an older implementation of CONVENTIONAL Volume 1. The task in `TASK.md` is a substantial redesign and supersedes the current implementation.

Before making implementation decisions, read completely:

- `TASK.md`
- `content/Numero 1 (1).md`
- `reference/qwen-original.html`

## Existing repository

The current `src/`, `public/`, Vite/Supabase setup and other existing application files belong to an older direction for Volume 1. Do not treat the current application architecture as something that must be preserved.

You may replace obsolete application code, reorganize the repository, remove unnecessary dependencies, and choose a simpler static architecture if that better follows `TASK.md`.

## Visual reference

`reference/qwen-original.html` is the primary visual reference.

Reuse its illustration language, SVG assets, proportions, palette, object design, useful interaction ideas and useful code. Do not preserve its architecture merely because it already exists.

Never overwrite `reference/qwen-original.html`.

## Editorial source

`content/Numero 1 (1).md` is the editorial source.

Use its real content whenever `TASK.md` asks for an article, story, quiz, dataset or other editorial material. Do not invent replacement editorial content where source material already exists.

## Priority

Follow `TASK.md` as the source of truth. In case of conflict between the existing repository, the visual reference and `TASK.md`, `TASK.md` wins.

Priorities:

1. mobile UX
2. working navigation
3. content system
4. interactions
5. long-form reader
6. elevator experience
7. quiz
8. visual quality
9. extra microanimations

Work directly on the implementation. Do not stop after analysing or proposing a plan unless a genuine blocker prevents implementation. Make reasonable product and technical decisions yourself and continue through implementation, testing and fixes.
