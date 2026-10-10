# Building 3D Scroll Portfolios

A skill for Claude Code (and other coding agents that support skills) that helps you build a portfolio that feels like a place: a scroll-driven 3D journey through your career, a live video version of you, little quests and achievements along the way, and a private resume request form.

It is written from a real build, so most of the rules in it exist because something went wrong once.

## What's inside

```
building-3d-scroll-portfolios/
  SKILL.md          when to use it, the architecture, hard rules, how to check your work
  architecture.md   scroll engine, chapter ledger, camera, rendering choices
  avatar.md         turning your photos into short video clips with Google Flow (Veo)
  worlds.md         miniature career worlds, quests and achievements
  qa.md             copy, privacy, mobile and testing checklists
  reference/        working code you can adapt (scroll conductor, camera rig,
                    world helpers, game state, video encoding, resume form)
```

## Install

Claude Code looks for personal skills in `~/.claude/skills/`.

```bash
git clone https://github.com/laasya2005/building-3d-scroll-portfolios.git
cp -R building-3d-scroll-portfolios/building-3d-scroll-portfolios ~/.claude/skills/
```

Then start Claude Code and ask for something like "help me build a 3D portfolio that tells my career as a journey". The skill loads on its own when it's relevant.

## Stack it assumes

Vite, React, TypeScript, Three.js with React Three Fiber and drei, GSAP and Lenis, deployed on Vercel. The resume form uses Resend; set `OWNER_EMAIL` in your Vercel environment variables instead of putting your email in code.

## Credits

These helped shape the approach:

- [Kage](https://github.com/MengTo/kage) by Meng To
- [MengTo/Skills](https://github.com/MengTo/Skills), especially the 3D scroll worlds skill. `reference/conductor.ts` is adapted from it (MIT).
- [3d-portfolio](https://github.com/akashrmalhotra/3d-portfolio) by Akash Malhotra
- ThreeUI's guide to building interactive websites

## License

MIT. See [LICENSE](LICENSE).
