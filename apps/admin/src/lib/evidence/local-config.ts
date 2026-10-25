import 'server-only';
import { PrismaEvidenceAcquisitionRepository } from './prisma-acquisition-repository';
import { EvidenceOrchestrator } from './orchestrator';
import { SyntheticPeruRegistryProvider } from './synthetic-peru-x402-provider';
import { ServerPolicyAuthorizer, type SpendingLimits } from './spending-policy';

const TESTNET_LIMITS = {
  maxPerCall: 200_000n, // 0.02 USDC (Stellar token base units)
  maxPerApplication: 500_000n, // 0.05 USDC
  maxPerDay: 1_000_000n, // 0.10 USDC
} as const;

/** Returns null unless the operator explicitly enables a local Testnet-only demo. */
export function createLocalSyntheticEvidenceOrchestrator(): EvidenceOrchestrator | null {
  if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_LOCAL_X402_EVIDENCE !== 'true')
    return null;
  const endpoint = process.env.SYNTHETIC_REGISTRY_X402_URL;
  const allowedOrigin = process.env.SYNTHETIC_REGISTRY_ALLOWED_ORIGIN;
  const signerSecret = process.env.STELLAR_TESTNET_EVIDENCE_SIGNER_SECRET;
  const responsePublicKey = process.env.SYNTHETIC_REGISTRY_RESPONSE_PUBLIC_KEY;
  const recipient = process.env.SYNTHETIC_REGISTRY_PAY_TO;
  if (!endpoint || !allowedOrigin || !signerSecret || !responsePublicKey || !recipient) return null;

  const limits: SpendingLimits = {
    allowedProviders: new Set(['synthetic-registry-pe']),
    allowedCountries: new Set(['PE']),
    allowedEvidenceTypes: new Set(['ENTITY_STATUS']),
    allowedRecipients: new Set([recipient]),
    ...TESTNET_LIMITS,
  };
  const provider = new SyntheticPeruRegistryProvider({
    endpoint,
    allowedOrigins: new Set([allowedOrigin]),
    signerSecret,
    responsePublicKey,
    enabled: true,
  });
  return new EvidenceOrchestrator(
    provider,
    new PrismaEvidenceAcquisitionRepository(),
    new ServerPolicyAuthorizer(limits),
  );
}
