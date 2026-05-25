type TimerId = unknown;

type NotificationLike = {
  new(title: string, options?: NotificationOptions): unknown;
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
};

type DocumentLike = {
  title: string;
  hidden: boolean;
  addEventListener: (type: 'visibilitychange', listener: () => void) => void;
  removeEventListener: (type: 'visibilitychange', listener: () => void) => void;
};

type WindowLike = {
  addEventListener: (type: 'focus', listener: () => void) => void;
  removeEventListener: (type: 'focus', listener: () => void) => void;
};

interface TranslationNotifierEnvironment {
  notification?: NotificationLike;
  document?: DocumentLike;
  window?: WindowLike;
  setInterval: (callback: () => void, ms: number) => TimerId;
  clearInterval: (timer: TimerId) => void;
}

export interface TranslationNotification {
  title: string;
  body: string;
}

const defaultEnvironment = (): TranslationNotifierEnvironment => ({
  notification: typeof Notification === 'undefined' ? undefined : Notification,
  document: typeof document === 'undefined' ? undefined : document,
  window: typeof window === 'undefined' ? undefined : window,
  setInterval: (callback, ms) => setInterval(callback, ms),
  clearInterval: (timer) => clearInterval(timer as ReturnType<typeof setInterval>),
});

export const createTranslationNotifier = (
  environment: TranslationNotifierEnvironment = defaultEnvironment(),
) => {
  let titleTimer: TimerId | undefined;
  let restoreTitle: string | undefined;
  let visibleListener: (() => void) | undefined;
  let focusListener: (() => void) | undefined;

  const stopTitleAlert = () => {
    if (titleTimer) {
      environment.clearInterval(titleTimer);
      titleTimer = undefined;
    }
    if (restoreTitle !== undefined && environment.document) {
      environment.document.title = restoreTitle;
    }
    restoreTitle = undefined;

    if (visibleListener && environment.document) {
      environment.document.removeEventListener('visibilitychange', visibleListener);
    }
    if (focusListener && environment.window) {
      environment.window.removeEventListener('focus', focusListener);
    }
    visibleListener = undefined;
    focusListener = undefined;
  };

  const requestPermission = async (enabled: boolean): Promise<NotificationPermission> => {
    if (!enabled || !environment.notification) {
      return 'denied';
    }
    if (environment.notification.permission !== 'default') {
      return environment.notification.permission;
    }
    return environment.notification.requestPermission();
  };

  const startTitleAlert = (label: string) => {
    const doc = environment.document;
    if (!doc?.hidden) {
      return;
    }

    stopTitleAlert();
    restoreTitle = doc.title || 'AA Translator';
    let showAlert = true;
    doc.title = `${label} - ${restoreTitle}`;
    titleTimer = environment.setInterval(() => {
      doc.title = showAlert ? restoreTitle! : `${label} - ${restoreTitle}`;
      showAlert = !showAlert;
    }, 1000);

    visibleListener = () => {
      if (!doc.hidden) {
        stopTitleAlert();
      }
    };
    focusListener = stopTitleAlert;
    doc.addEventListener('visibilitychange', visibleListener);
    environment.window?.addEventListener('focus', focusListener);
  };

  const notify = (notification: TranslationNotification, enabled: boolean) => {
    if (!enabled) {
      return;
    }
    if (enabled && environment.notification?.permission === 'granted') {
      new environment.notification(notification.title, { body: notification.body });
    }
    startTitleAlert(notification.title);
  };

  return {
    requestPermission,
    notify,
    stopTitleAlert,
  };
};

export const translationNotifier = createTranslationNotifier();
