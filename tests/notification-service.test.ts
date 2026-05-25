import assert from "node:assert/strict";
import test from "node:test";
import { createTranslationNotifier } from "../services/notificationService";

class FakeDocument {
  title = "AA Translator";
  hidden = true;
  private readonly listeners = new Set<() => void>();

  addEventListener(_type: "visibilitychange", listener: () => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "visibilitychange", listener: () => void): void {
    this.listeners.delete(listener);
  }

  show(): void {
    this.hidden = false;
    for (const listener of this.listeners) {
      listener();
    }
  }
}

class FakeWindow {
  private readonly listeners = new Set<() => void>();

  addEventListener(_type: "focus", listener: () => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "focus", listener: () => void): void {
    this.listeners.delete(listener);
  }

  focus(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

const createTimerHost = () => {
  let nextTimer = 1;
  const callbacks = new Map<number, () => void>();

  return {
    setInterval(callback: () => void): unknown {
      const id = nextTimer++;
      callbacks.set(id, callback);
      return id;
    },
    clearInterval(id: unknown): void {
      callbacks.delete(Number(id));
    },
    tick(): void {
      for (const callback of callbacks.values()) {
        callback();
      }
    },
    get activeCount(): number {
      return callbacks.size;
    },
  };
};

test("translation notifier requests permission from a user-triggered translation", async () => {
  let requested = false;
  const notification = class {
    static permission: NotificationPermission = "default";
    static async requestPermission(): Promise<NotificationPermission> {
      requested = true;
      notification.permission = "granted";
      return "granted";
    }

    constructor(_title: string, _options?: NotificationOptions) {}
  };
  const timer = createTimerHost();
  const notifier = createTranslationNotifier({
    notification,
    document: new FakeDocument(),
    window: new FakeWindow(),
    setInterval: timer.setInterval,
    clearInterval: timer.clearInterval,
  });

  assert.equal(await notifier.requestPermission(true), "granted");
  assert.equal(requested, true);
});

test("translation notifier emits a system notification and blinks the title while hidden", () => {
  const sent: Array<{ title: string; body?: string }> = [];
  const notification = class {
    static permission: NotificationPermission = "granted";
    static async requestPermission(): Promise<NotificationPermission> {
      return "granted";
    }

    constructor(title: string, options?: NotificationOptions) {
      sent.push({ title, body: options?.body });
    }
  };
  const document = new FakeDocument();
  const timer = createTimerHost();
  const notifier = createTranslationNotifier({
    notification,
    document,
    window: new FakeWindow(),
    setInterval: timer.setInterval,
    clearInterval: timer.clearInterval,
  });

  notifier.notify({ title: "번역 완료", body: "12개 항목 완료" }, true);

  assert.deepEqual(sent, [{ title: "번역 완료", body: "12개 항목 완료" }]);
  assert.equal(document.title, "번역 완료 - AA Translator");
  timer.tick();
  assert.equal(document.title, "AA Translator");
  timer.tick();
  assert.equal(document.title, "번역 완료 - AA Translator");
});

test("translation notifier restores the title when the user returns", () => {
  const notification = class {
    static permission: NotificationPermission = "denied";
    static async requestPermission(): Promise<NotificationPermission> {
      return "denied";
    }

    constructor(_title: string, _options?: NotificationOptions) {}
  };
  const document = new FakeDocument();
  const window = new FakeWindow();
  const timer = createTimerHost();
  const notifier = createTranslationNotifier({
    notification,
    document,
    window,
    setInterval: timer.setInterval,
    clearInterval: timer.clearInterval,
  });

  notifier.notify({ title: "번역 실패", body: "Provider error" }, true);
  assert.equal(document.title, "번역 실패 - AA Translator");
  assert.equal(timer.activeCount, 1);

  document.show();

  assert.equal(document.title, "AA Translator");
  assert.equal(timer.activeCount, 0);
});
