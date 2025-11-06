import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from '@/lib/capacitor';

export function useHaptics() {
  const impact = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Haptics failed:', error);
    }
  };

  const notification = async (type: NotificationType = NotificationType.Success) => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.error('Haptics failed:', error);
    }
  };

  return {
    light: () => impact(ImpactStyle.Light),
    medium: () => impact(ImpactStyle.Medium),
    heavy: () => impact(ImpactStyle.Heavy),
    success: () => notification(NotificationType.Success),
    warning: () => notification(NotificationType.Warning),
    error: () => notification(NotificationType.Error),
  };
}
