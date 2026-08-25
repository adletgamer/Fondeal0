# ADR-0001: Record architecture decisions (and use MADR)

- **Status:** Accepted
- **Date:** 2026-08-25
- **Deciders:** CTO/Founder

## Context
Fondealo targets the Stellar Community Fund. The Build Award explicitly rewards technically detailed, well-structured submissions with a complete architecture outline and clear reasoning. We need a lightweight, durable record of *why* each contested decision was made, phase by phase, that a reviewer can read.

## Decision
Every significant, hard-to-reverse decision is captured as a short ADR in `docs/adr/` using a lightweight MADR-style template (Context / Decision / Consequences / Alternatives). ADRs are immutable once Accepted; a change is a new ADR that supersedes the old one.

## Consequences
- (+) Reviewer-legible decision trail; faster onboarding; forces us to state trade-offs.
- (+) Directly supports SCF "submission quality" and "architecture outline" criteria.
- (−) Small ongoing writing overhead; discipline required at phase gates.

## Alternatives considered
- No ADRs (decisions live in PRs/heads) — rejected: not legible to reviewers, lost context.
- Heavyweight RFC process — rejected: too slow for a hackathon-speed MVP.
