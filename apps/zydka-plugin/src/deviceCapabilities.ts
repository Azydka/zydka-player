/**
 * Device capabilities that change which controls the player shows.
 */

/** The part of an HTMLMediaElement this check needs. */
export interface VolumeProbe {
  volume: number;
}

const PROBE_VOLUME = 0.5;

/**
 * Whether a web page can set the media volume on this device.
 *
 * iPhone and iPad (every browser there uses WebKit) ignore writes to
 * `HTMLMediaElement.volume`: the value stays at 1 and only the hardware
 * buttons change the level. The check writes a value and reads it back
 * instead of sniffing the user agent, so any other device with the same
 * restriction is covered too.
 *
 * If the probe cannot be created or throws, the slider is kept: hiding a
 * working control would be worse than showing one that does nothing.
 */
export function canControlMediaVolume(
  createProbe: () => VolumeProbe | null | undefined = defaultProbe,
): boolean {
  try {
    const probe = createProbe();

    if (!probe) return true;

    probe.volume = PROBE_VOLUME;

    return Math.abs(probe.volume - PROBE_VOLUME) < 0.01;
  } catch {
    return true;
  }
}

function defaultProbe(): VolumeProbe | null {
  if (typeof document === 'undefined') return null;

  return document.createElement('audio');
}
