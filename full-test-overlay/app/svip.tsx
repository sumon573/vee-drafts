import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import VeeReferenceExactSvipScreen from '@/src/features/svip/VeeReferenceExactSvipScreen';
import {
  subscribeSvip, joinSvipWaitlist, isOnSvipWaitlist, isSvipActive, SvipState,
} from '@/src/features/svip/svipService';
import { getSvipTiers } from '@/src/features/svip/svipConfig';

/**
 * SvipReferenceHost — wires the owner-reference SVIP screen (exact
 * screenshots as backgrounds) to real Vee data, TEST APP ONLY.
 * Mirrors SvipRoyalHost's wiring: real membership from svip/{uid},
 * real waitlist, real server prices. No purchase: Join stays on the
 * waitlist. toppedUpLast30Days is intentionally NOT supplied — no
 * authorized source measures it, so the screen honestly shows
 * "Top-up data unavailable" instead of an invented number.
 */
export default function SvipRoute() {
  const router = useRouter();
  const { user } = useAuth();
  const [svip, setSvip] = useState<SvipState | null>(null);
  const [onWaitlist, setOnWaitlist] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    isOnSvipWaitlist(user.uid).then(setOnWaitlist).catch(() => {});
    const unsub = subscribeSvip(user.uid, setSvip, () => {});
    return unsub;
  }, [user?.uid]);

  const active = isSvipActive(svip);

  return (
    <VeeReferenceExactSvipScreen
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.push('/profile/settings' as never);
      }}
      onJoinWaitlist={async () => {
        if (!user?.uid) return;
        await joinSvipWaitlist(user.uid);
        setOnWaitlist(true);
      }}
      currentMembership={active && svip ? { tier: svip.tier, expiry: svip.expiry } : null}
      isOnWaitlist={onWaitlist}
      onRecharge={() => router.push('/profile/topup' as never)}
      prices={Object.fromEntries(getSvipTiers().map((t) => [t.tier, t.priceDiamonds]))}
    />
  );
}
