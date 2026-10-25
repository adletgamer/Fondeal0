# Documentation guide

Start here when reviewing the project. A document's existence is not evidence that its proposed feature is deployed.

## Current operating documents

| Document | Use |
| --- | --- |
| [Operating model](operating-model.md) | Current product truth, security boundaries and release gates |
| [Roadmap](roadmap.md) | Ordered delivery and acceptance criteria |
| [Business approval strategy](strategy/business-onboarding-underwriting-agentic-payments.md) | Peru-first KYB, underwriting, Passport and agentic verification design; Stage 1 scope |
| [Deployment and database](deployment-and-database.md) | Environment precedence, migrations and health checks |
| [Risk register](risks.md) | Threats to trust, money and operations |
| [Bounded x402 evidence acquisition](rfc/0003-evidence-acquisition-x402.md) | Experimental, server-only Testnet evidence acquisition; not wired to an admin action |
| [ADRs](adr/) | Durable architecture decisions and trade-offs |
| [KYB evidence boundary](adr/0010-kyb-evidence-boundary.md) | Declaration-only intake, provider failure handling and upload gate |
| [Admin back-office and decision authority](adr/0011-admin-back-office-and-decision-authority.md) | Privilege planes, who decides KYB, increments for `apps/admin` |
| [Contract initialization, roles and funds safety](adr/0012-contract-initialization-roles-and-funds-safety.md) | Pre-Testnet contract hardening and its consequences |
| [Current Testnet deployment](../deployments/README.md) | Which contract ids are current and which are deprecated |
| [Testnet deployment](testnet-deployment.md) | Deploy, wire and verify the contracts on Stellar Testnet; known gaps |
| [KYB policy v1 (draft, Spanish)](kyb/policy-v1.md) | What a reviewer must confirm, accepted sources, reason codes; awaiting owner approval |

## Historical proposals and research

[Architecture](architecture.md), [product v2](product-v2.md), [Passport v2](passport-v2.md), [score specification](score-spec.md) and [research](research.md) contain earlier designs and assumptions. Check the current code and operating model before using them as product claims. The dated documents in [audits](audits/) and [stabilization](stabilization/) describe a past baseline, not a continuously verified production state.

## Documentation rule

For every release, update the operating model and roadmap alongside code. Record the target environment, evidence, decision owner, migration/deployment order and rollback. Label user-facing capabilities **concept**, **sandbox**, **Testnet** or **live**; never infer live status from a passing build or a preview deployment.
