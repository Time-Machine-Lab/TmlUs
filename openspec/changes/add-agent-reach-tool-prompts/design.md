## Context

`tmlus tools` already has catalog-driven Tool discovery and Tool-specific flows. CodeGraph performs a real external CLI setup, while SkillClaw uses a document-preparation flow plus runtime actions. Agent Reach should be exposed as a maintained Tool entry, but the desired behavior is narrower: users only need a way to select install or update and copy the official prompt into their agent.

This fits TmlUs' local-first CLI boundary. TmlUs remains the team entry point for discovering recommended tools, but it does not become responsible for Agent Reach's Python installation, optional platform channels, cookies, browser login state, or doctor remediation.

## Goals / Non-Goals

**Goals:**

- Add Agent Reach to the `tmlus tools` catalog.
- Provide an interactive Agent Reach action picker with install and update choices.
- Provide direct command forms for install and update prompt rendering.
- Render the selected prompt with the same copy-focused CLI language used by SkillClaw help output.
- Keep output readable in quiet, CI, and non-TTY contexts.

**Non-Goals:**

- Do not install or update Agent Reach from TmlUs.
- Do not run `agent-reach`, `pipx`, `pip`, `gh`, `mcporter`, OpenCLI, or any platform-specific upstream tool.
- Do not create `~/.tmlus/env/agent-reach` or a maintained document package.
- Do not collect, store, print, or validate cookies, tokens, browser sessions, or platform credentials.
- Do not add hosted services, accounts, databases, background monitors, or API contracts.

## Decisions

### Decision: Use a prompt-only Tool adapter

Agent Reach will be represented as a catalog Tool with a prompt-only adapter/strategy instead of a document package or external CLI installer.

Rationale:
- The requested behavior is a small prompt launcher, not a local artifact preparation flow.
- Reusing `document-package` would imply local files and env state that are explicitly out of scope.
- Reusing `external-cli` would imply installation and verification behavior that TmlUs should not own for Agent Reach.

Alternative considered: Add `data/tools/agent-reach` with install/update runbooks. This was rejected because the final requirement is to show two fixed prompts only.

### Decision: Keep Agent Reach actions explicit

The interactive selection will show exactly two actions: install and update. Direct CLI actions will map to the same prompts.

Rationale:
- This mirrors the SkillClaw "copy prompt" interaction without adding hidden side effects.
- Direct actions keep CI and scripted usage deterministic.

Alternative considered: Make `tmlus tools agent-reach` print both prompts. This was rejected for interactive TTY usage because the user asked for two choices after entering the tool.

### Decision: Render prompts through the CLI UI renderer

Prompt text will be emitted through a dedicated renderer so visual style, quiet behavior, and fallback output stay consistent with existing command output.

Rationale:
- CLI visual output should remain centralized.
- The prompt box can reuse the existing SkillClaw help pattern without coupling Agent Reach to SkillClaw internals.

Alternative considered: Print strings directly inside the CLI command branch. This was rejected because it would bypass existing output style and make later prompt actions harder to test.

## Risks / Trade-offs

- [Risk] Users may expect TmlUs to install Agent Reach after selecting install. -> Mitigation: catalog purpose, action labels, and output copy must state that this is a prompt to give to an Agent.
- [Risk] Prompt-only Tool handling adds another Tool adapter style. -> Mitigation: keep the adapter narrow and test it through direct CLI behavior.
- [Risk] Non-TTY behavior could be ambiguous if `tmlus tools agent-reach` has no selected action. -> Mitigation: direct actions are required for non-interactive prompt selection; bare non-TTY usage can show supported actions without installing anything.
