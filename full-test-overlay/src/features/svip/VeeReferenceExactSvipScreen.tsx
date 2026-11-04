/**
 * VEE — REFERENCE-LOCKED SVIP (1–5)
 *
 * Pixel source: FIVE screenshots supplied by the Vee owner. Not redesigned.
 * The artwork, colors, geometry, animals, ribbons, cards, borders and curved
 * tier selector are from the owner's exact source images.
 *
 * This component is a React Native presentation layer for VEE TEST ONLY.
 * It DOES NOT and MUST NOT issue wallet debits, membership grants, Firebase
 * writes, premium feature toggles, or pretend that these exist.
 * Connect the real host callbacks and state as detailed in README.
 *
 * ASSET LIMITATION: Flattened screenshots cannot offer independently editable
 * badges/frames/text. To make the displayed labels truly dynamic with perfect
 * visual fidelity, obtain the original layered art, especially for stat text.
 */

import React, {memo, useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {Image} from 'expo-image';
import {SafeAreaView} from 'react-native-safe-area-context';
// TEST ONLY (2026-11-04, boss order): the SVIP page's frame reward shows
// the animated dragon frame. Imported from the already-uploaded package.
import VeeSvip1DragonFrame from './VeeSvip1DragonFrame';

const DESIGN_W = 736;
const DESIGN_H = 1472;
const PRICE_BY_TIER: Readonly<Record<1 | 2 | 3 | 4 | 5, number>> = {
  1: 10000,
  2: 20000,
  3: 30000,
  4: 40000,
  5: 60000,
};

// These are exactly the 5 user-provided images, optimized as lossless-layout
// WebP files. These are NOT newly generated versions or lookalike artwork.
const REFERENCE_IMAGES = {
  1: require('../../../assets/svip/reference/svip-1-reference.webp'),
  2: require('../../../assets/svip/reference/svip-2-reference.webp'),
  3: require('../../../assets/svip/reference/svip-3-reference.webp'),
  4: require('../../../assets/svip/reference/svip-4-reference.webp'),
  5: require('../../../assets/svip/reference/svip-5-reference.webp'),
} as const;

export type SvipTierNumber = 1 | 2 | 3 | 4 | 5;
export interface ReferenceSvipMembership {
  tier: number;
  expiry: number; // epoch milliseconds, from real Vee SVIP service
}
export interface ReferenceSvipProps {
  onBack: () => void;
  onOpenSvipStore?: () => void;
  onOpenSvipGifts?: () => void;
  onOpenClothingRights?: () => void;
  onOpenSeniorRights?: () => void;
  /** Use Vee's real existing joinSvipWaitlist, NEVER a pretend purchase. */
  onJoinWaitlist: () => Promise<void>;
  /** Opens the real diamond top-up screen; omitted = no recharge button. */
  onRecharge?: () => void;
  currentMembership: ReferenceSvipMembership | null;
  isOnWaitlist: boolean;
  /** Source-of-truth server prices; fallback is the owner's exact 10/20/30/40/60k. */
  prices?: Partial<Record<SvipTierNumber, number>>;
  /** Supply only when obtained from Vee's actual backend; no invented progress. */
  toppedUpLast30Days?: number | null;
  initialTier?: SvipTierNumber;
}

const TILE_INFO = [
  {key: 'badge', title: 'SVIP Badge / Logo', req: 1,
    detail: 'Original badge art shown in the selected SVIP reference.'},
  {key: 'frame', title: 'Royal Profile Frame', req: 1,
    detail: 'Decorative member profile frame. It is not a sixth SVIP privilege.'},
  {key: 'entryEffect', title: 'Entry Effect', req: 2,
    detail: 'Existing SVIP entry-effect entitlement, available starting at SVIP 2.'},
  {key: 'nameplate', title: 'SVIP Nameplate', req: 1,
    detail: 'Exclusive SVIP nameplate, available starting at SVIP 1.'},
  {key: 'roomRights', title: 'Room Rights', req: 3,
    detail: 'Anti-kick and Kick-out privileges start at SVIP 3. The fifth image in the reference is decorative artwork, not proof of an additional reward.'},
] as const;

type TileInfo = (typeof TILE_INFO)[number];

// Source-image coordinate map from 736x1472 original screenshots.
// Hit areas are invisible; all visible art remains the user's original.
const TILE_BOXES = [
  {x: 27, y: 1041, w: 218, h: 178},
  {x: 259, y: 1041, w: 218, h: 178},
  {x: 494, y: 1041, w: 216, h: 178},
  {x: 27, y: 1278, w: 328, h: 177},
  {x: 384, y: 1278, w: 328, h: 177},
] as const;

const GOLD = '#F0D89A';
const BACKGROUND = '#090605';

function asTier(n: number): SvipTierNumber {
  return (Math.max(1, Math.min(5, Math.round(n)))) as SvipTierNumber;
}
function amount(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
function actualMemberText(m: ReferenceSvipMembership | null): string {
  if (m && m.tier >= 1 && m.tier <= 5 && m.expiry > Date.now()) {
    return `Currently : SVIP${m.tier}`;
  }
  return 'Currently : non-SVIP';
}

// Responsive scale: all shapes retain their exact relative positions.
function area(box: {x: number; y: number; w: number; h: number}, scale: number) {
  return {
    left: box.x * scale,
    top: box.y * scale,
    width: box.w * scale,
    height: box.h * scale,
  };
}

const OverlayButton = memo(function OverlayButton({
  label, box, scale, onPress,
}: {
  label: string;
  box: {x: number; y: number; w: number; h: number};
  scale: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={1}
      style={[styles.touchArea, area(box, scale)]}
    />
  );
});

/** Displayed without fake wallet deductions or synthetic rewards. */
export default function VeeReferenceExactSvipScreen(props: ReferenceSvipProps) {
  const {width} = useWindowDimensions();
  const screenWidth = Math.min(width, 430);
  const scale = screenWidth / DESIGN_W;
  const [tier, setTier] = useState<SvipTierNumber>(props.initialTier ?? 1);
  const [selectedTile, setSelectedTile] = useState<TileInfo | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const showDetail = useCallback((index: number) => setSelectedTile(TILE_INFO[index]), []);
  const source = REFERENCE_IMAGES[tier];
  const price = props.prices?.[tier] ?? PRICE_BY_TIER[tier];
  const memberStatus = actualMemberText(props.currentMembership);
  const active = props.currentMembership != null && props.currentMembership.expiry > Date.now();
  const memberTier = active ? props.currentMembership!.tier : 0;
  const currentTierPrice = useMemo(() => `${amount(price)} Diamonds`, [price]);
  const previewStatus = selectedTile ? tier >= selectedTile.req : false;
  const entitlementStatus = selectedTile
    ? active && memberTier >= selectedTile.req
    : false;

  const selectTier = useCallback((number: number) => {
    if (number >= 1 && number <= 5) setTier(asTier(number));
  }, []);

  const joinWaitlist = useCallback(async () => {
    if (joining || props.isOnWaitlist) return;
    setJoining(true);
    try {
      await props.onJoinWaitlist();
      // The real service must resolve before feedback is shown.
      Alert.alert('Request received', 'You have joined the Vee SVIP waitlist.');
      setStoreOpen(false);
    } catch (_error) {
      Alert.alert('Unable to join', 'Could not contact the Vee service. Please try again.');
    } finally {
      setJoining(false);
    }
  }, [joining, props.isOnWaitlist, props.onJoinWaitlist]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.outer}
      >
        <View style={[styles.artboard, {width: screenWidth, height: DESIGN_H * scale}]}>
          <Image
            source={source}
            style={{width: screenWidth, height: DESIGN_H * scale}}
            contentFit="fill"
            cachePolicy="memory-disk"
            transition={0}
            accessibilityLabel={`SVIP ${tier} artwork from the owner's exact reference screenshot`}
          />

          {/* TEST ONLY (2026-11-04, boss order): SVIP1's frame reward on the
              SVIP page shows the animated dragon frame — the user-facing
              reward users claim from here. NOT a profile avatar frame.
              Tier 1 only; other tiers keep their baked tile art. The dark
              backing hides the baked wreath so the tile reads as one clean
              dragon reward; tile taps still pass through to the detail modal. */}
          {tier === 1 ? (
            <View
              pointerEvents="none"
              style={[
                area({x: 259, y: 1041, w: 218, h: 178}, scale),
                styles.dragonTileBack,
                {borderRadius: 14 * scale},
              ]}
            >
              <VeeSvip1DragonFrame size={178 * scale} enabled visible screenFocused allowAnimation />
            </View>
          ) : null}

          {/* Original reference's back and store symbols: real touch callbacks. */}
          <OverlayButton label="Back" scale={scale} box={{x: 0, y: 9, w: 82, h: 87}} onPress={props.onBack} />
          <OverlayButton label="SVIP store" scale={scale} box={{x: 643, y: 9, w: 93, h: 95}}
            onPress={() => props.onOpenSvipStore ? props.onOpenSvipStore() : setStoreOpen(true)} />

          {/* Curved tier path on the original reference art. */}
          <OverlayButton label={`Previous SVIP tier`} scale={scale} box={{x: 15, y: 545, w: 127, h: 115}} onPress={() => selectTier(tier - 1)} />
          <OverlayButton label={`Selected SVIP ${tier} information`} scale={scale} box={{x: 200, y: 600, w: 150, h: 100}} onPress={() => setStoreOpen(true)} />
          <OverlayButton label="Next SVIP tier" scale={scale} box={{x: 423, y: 551, w: 124, h: 112}} onPress={() => selectTier(tier + 1)} />
          <OverlayButton label="Skip to next SVIP tier" scale={scale} box={{x: 616, y: 477, w: 119, h: 113}} onPress={() => selectTier(tier + 2)} />

          {/* Cover ONLY the raster's stale example strings, and overlay real data.
              This is necessary to avoid displaying fictional status/payment data. */}
          <View pointerEvents="none" style={[styles.statMask, area({x: 222, y: 707, w: 313, h: 70}, scale)]} />
          <View pointerEvents="none" style={[styles.centeredStat, area({x: 168, y: 707, w: 398, h: 70}, scale)]}>
            <Text numberOfLines={1} style={[styles.statusText, {fontSize: 23 * scale}]}>{memberStatus}</Text>
          </View>
          <View pointerEvents="none" style={[styles.statMask, area({x: 542, y: 748, w: 191, h: 45}, scale)]} />
          <View pointerEvents="none" style={[styles.rightStat, area({x: 480, y: 748, w: 229, h: 45}, scale)]}>
            <Text numberOfLines={1} style={[styles.priceText, {fontSize: 21 * scale}]}>{currentTierPrice}</Text>
          </View>
          <View pointerEvents="none" style={[styles.statMask, area({x: 430, y: 834, w: 300, h: 53}, scale)]} />
          <View pointerEvents="none" style={[styles.rightStat, area({x: 393, y: 837, w: 323, h: 48}, scale)]}>
            <Text numberOfLines={1} style={[styles.subStat, {fontSize: 18 * scale}]}>
              {props.toppedUpLast30Days == null
                ? 'Top-up data unavailable'
                : `Topped up in 30 days : ${amount(props.toppedUpLast30Days)}`}
            </Text>
          </View>

          {/* Header ornaments/rights and gifts image also have real touch behavior. */}
          <OverlayButton label="View SVIP top-up and membership information" scale={scale}
            box={{x: 20, y: 782, w: 691, h: 66}} onPress={() => setStoreOpen(true)} />
          <OverlayButton label="SVIP Clothing Rights" scale={scale}
            box={{x: 32, y: 967, w: 315, h: 61}}
            onPress={() => props.onOpenClothingRights ? props.onOpenClothingRights() : setSelectedTile(TILE_INFO[0])} />
          <OverlayButton label="SVIP Senior Rights" scale={scale}
            box={{x: 422, y: 967, w: 215, h: 61}}
            onPress={() => props.onOpenSeniorRights ? props.onOpenSeniorRights() : setSelectedTile(TILE_INFO[4])} />
          <OverlayButton label="SVIP Gifts" scale={scale}
            box={{x: 636, y: 939, w: 99, h: 102}}
            onPress={() => props.onOpenSvipGifts
              ? props.onOpenSvipGifts()
              : Alert.alert('SVIP Gifts', 'The Vee gifts screen must be connected by the host app.')} />
          {/* Exactly the visible five cards; their bitmap art is never replaced. */}
          {TILE_BOXES.map((box, index) => (
            <OverlayButton
              key={TILE_INFO[index].key}
              label={`${TILE_INFO[index].title} details`}
              box={box}
              scale={scale}
              onPress={() => showDetail(index)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Real interactive details: correct tier inclusion vs user entitlement. */}
      <Modal
        transparent
        visible={selectedTile != null}
        animationType="fade"
        onRequestClose={() => setSelectedTile(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogEyebrow}>VEE ROYAL SVIP {tier}</Text>
            <Text style={styles.dialogTitle}>{selectedTile?.title}</Text>
            <Text style={styles.dialogText}>{selectedTile?.detail}</Text>
            <Text style={styles.dialogStatus}>
              {previewStatus ? `Included in SVIP ${tier}` : `Available from SVIP ${selectedTile?.req}`}
            </Text>
            <Text style={styles.dialogSubstatus}>
              {entitlementStatus ? 'Active in your membership' : 'Not active in your membership'}
            </Text>
            <Pressable accessibilityRole="button" style={styles.dialogButton} onPress={() => setSelectedTile(null)}>
              <Text style={styles.dialogButtonText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* The screenshot's store symbol opens real host navigation if provided;
          otherwise exposes only the existing verified waitlist action. */}
      <Modal transparent visible={storeOpen} animationType="fade" onRequestClose={() => setStoreOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogEyebrow}>VEE ROYAL SVIP</Text>
            <Text style={styles.dialogTitle}>{`SVIP ${tier} — ${currentTierPrice}`}</Text>
            <Text style={styles.dialogText}>30-day membership. Diamond checkout is not yet confirmed as available in Vee Test. You can request an invitation to the actual waitlist.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={props.isOnWaitlist ? 'Already on waitlist' : 'Join real SVIP waitlist'}
              disabled={joining || props.isOnWaitlist}
              style={[styles.dialogButton, (joining || props.isOnWaitlist) && styles.disabled]}
              onPress={joinWaitlist}
            >
              {joining ? <ActivityIndicator color="#201026" /> :
                <Text style={styles.dialogButtonText}>{props.isOnWaitlist ? 'ON WAITLIST' : 'JOIN WAITLIST'}</Text>}
            </Pressable>
            {props.onRecharge ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recharge diamonds"
                style={styles.rechargeButton}
                onPress={props.onRecharge}
              >
                <Text style={styles.rechargeButtonText}>RECHARGE DIAMONDS</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" style={styles.closeLink} onPress={() => setStoreOpen(false)}>
              <Text style={styles.closeLinkText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: BACKGROUND},
  outer: {alignItems: 'center', paddingBottom: 3},
  artboard: {position: 'relative', overflow: 'hidden', backgroundColor: BACKGROUND},
  touchArea: {position: 'absolute', backgroundColor: 'transparent'},
  // TEST ONLY: backing for the SVIP1 dragon frame reward tile (tile color
  // sampled from the tier-1 reference art). Covers the baked wreath.
  dragonTileBack: {position: 'absolute', backgroundColor: '#302523', alignItems: 'center', justifyContent: 'center'},
  // Mask rectangles only cover stale sample text from the screenshots.
  statMask: {position: 'absolute', backgroundColor: '#080604'},
  centeredStat: {position: 'absolute', alignItems: 'center', justifyContent: 'center'},
  rightStat: {position: 'absolute', alignItems: 'flex-end', justifyContent: 'center'},
  statusText: {fontFamily: 'serif', color: GOLD, textAlign: 'center', includeFontPadding: false},
  priceText: {fontFamily: 'serif', color: '#A8A0A2', includeFontPadding: false},
  subStat: {fontFamily: 'serif', color: '#807B7D', includeFontPadding: false},
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.77)', justifyContent: 'flex-end'},
  dialog: {
    backgroundColor: '#21162F', borderTopLeftRadius: 25, borderTopRightRadius: 25,
    borderColor: '#A88552', borderTopWidth: 1, paddingHorizontal: 26,
    paddingTop: 26, paddingBottom: 36,
  },
  dialogEyebrow: {color: '#D9BC8A', fontWeight: '700', fontSize: 11, letterSpacing: 2},
  dialogTitle: {color: '#FFEAC9', fontSize: 24, fontWeight: '700', marginTop: 10},
  dialogText: {color: '#E1D1D7', fontSize: 14, lineHeight: 21, marginTop: 12},
  dialogStatus: {color: '#E9C087', fontSize: 14, fontWeight: '700', marginTop: 18},
  dialogSubstatus: {color: '#ABA0B8', fontSize: 12, marginTop: 6},
  dialogButton: {minHeight: 52, backgroundColor: '#E6BF89', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 23},
  dialogButtonText: {color: '#2F1935', fontSize: 14, fontWeight: '800', letterSpacing: 1},
  rechargeButton: {minHeight: 52, backgroundColor: 'transparent', borderRadius: 14,
    borderWidth: 1, borderColor: '#E6BF89',
    justifyContent: 'center', alignItems: 'center', marginTop: 12},
  rechargeButtonText: {color: '#E6BF89', fontSize: 14, fontWeight: '800', letterSpacing: 1},
  disabled: {opacity: 0.65},
  closeLink: {minHeight: 45, justifyContent: 'center', alignItems: 'center', marginTop: 6},
  closeLinkText: {color: '#BBA7CC', fontSize: 14},
});
