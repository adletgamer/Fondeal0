# Third-party skill provenance

Copied by hand after reading every file. No installer CLI was run. Re-review before updating.

| Skill | Source | Commit | Local changes |
| --- | --- | --- | --- |
| `taste-skill` (name: `design-taste-frontend`) | https://github.com/Leonxlnx/taste-skill (`skills/taste-skill`, MIT) | `6010f91` (2026-10-20) | `evals/` omitted |
| `ui-ux-pro-max` | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (`.claude/skills/ui-ux-pro-max`, MIT) | `56ea9cf` (2026-10-15) | `scripts/tests/` omitted; script paths in SKILL.md made project-relative (no `CLAUDE_PLUGIN_ROOT`) |

Capabilities to know about:

- `taste-skill/scripts/*.mjs` (Node 22+) launch a headless local Chrome/Edge (`lib/cdp.mjs`), serve local files on 127.0.0.1, write `.taste-skill/` in the project and `~/.taste-skill/history.json`, and `assets.mjs` fetches public-domain images from Openverse, Wikimedia, the Met, AIC, NASA and archive.org. None run unless invoked.
- `ui-ux-pro-max/scripts/*.py` use only the Python standard library over the bundled CSV files; no network. `--persist` writes `design-system/<slug>/` only when asked.
