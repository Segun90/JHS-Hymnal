import { useEffect } from 'react';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useSettingsStore } from '@/stores/useSettingsStore';

const KEEP_AWAKE_TAG = 'jhs-app';

export function useKeepAwakeSetting(): void {
  const keepAwake = useSettingsStore((s) => s.keepAwake);

  useEffect(() => {
    if (keepAwake) {
      activateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    } else {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    }
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [keepAwake]);
}
