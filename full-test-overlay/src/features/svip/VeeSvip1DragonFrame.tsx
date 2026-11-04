/**
 * VEE SVIP1 / Mint Dragon — drop-in visual component.
 * Source: supplied original frame and locally rendered 3-second subtle hair / whisker loop.
 * Host owns entitlement checks, route visibility and navigation. No Firebase or wallet calls.
 * Uses existing expo-image; no native module or new dependency required.
 */
import React, { memo } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

const ANIMATED_FRAME = require('./assets/vee_svip1_dragon_whiskers_microfur_512.webp');
const STATIC_FRAME = require('./assets/vee_svip1_dragon_static_512.png');

export type VeeSvip1DragonFrameProps = {
  /** Width / height in dp. Same square source; parent must reserve this space. */
  size?: number;
  /** TRUE only if the host has confirmed SVIP1 frame entitlement. */
  enabled: boolean;
  /** Pass navigation focus from the host route, not assumed here. */
  screenFocused: boolean;
  /** Pass visibility from host list or voice-room seat if relevant. */
  visible: boolean;
  /** Pass OS/app reduced-motion preference when available. */
  reducedMotion?: boolean;
  /** Host may disable animation for device policy or many simultaneous frames. */
  allowAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const VeeSvip1DragonFrame = memo(function VeeSvip1DragonFrame({
  size = 140,
  enabled,
  screenFocused,
  visible,
  reducedMotion = false,
  allowAnimation = true,
  style,
}: VeeSvip1DragonFrameProps) {
  if (!enabled || !visible) return null;
  const animate = screenFocused && !reducedMotion && allowAnimation;
  return (
    <View pointerEvents="none" style={[styles.container, { width: size, height: size }, style]} accessible accessibilityLabel="Vee SVIP 1 dragon profile frame">
      <Image
        source={animate ? ANIMATED_FRAME : STATIC_FRAME}
        style={styles.image}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={0}
        recyclingKey={animate ? 'svip1-dragon-animated' : 'svip1-dragon-static'}
      />
    </View>
  );
});
const styles = StyleSheet.create({ container: { overflow: 'visible' }, image: { width: '100%', height: '100%' } });
export default VeeSvip1DragonFrame;
