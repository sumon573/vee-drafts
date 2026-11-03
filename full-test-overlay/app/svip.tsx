// TEST-ONLY overlay (vee-drafts full-test-overlay): in the Vee Test app,
// /svip renders the approved Royal Snake-Dragon screen via the existing
// SvipRoyalHost (server-driven tiers/privileges/art + waitlist Join).
// Production is untouched: production app/svip.tsx still renders SvipMockupHost.
import SvipRoyalHost from '@/src/features/svip/SvipRoyalHost';

export default function SvipRoute() {
  return <SvipRoyalHost />;
}
