import { Capacitor, registerPlugin } from '@capacitor/core';

export interface FlowNativeBridgePlugin {
  getLaunchNotificationAction(): Promise<{ action: string | null }>;
  checkNotificationPermission(): Promise<{ granted: boolean }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  scheduleExpenseReminder(options: {
    delayHours?: number;
    delaySeconds?: number;
    delayMinutes?: number;
  }): Promise<{ success: boolean; triggerTime: number }>;
  cancelExpenseReminder(): Promise<{ success: boolean }>;

  // Backup system interfaces
  exportBackup(options: { fileName: string; json: string }): Promise<{
    success: boolean;
    finalFilePath: string;
    fileName: string;
    folder: string;
    cancelled?: boolean;
  }>;
  importBackup(): Promise<{
    cancelled: boolean;
    content?: string;
    fileName?: string;
  }>;
}

const FlowNativeBridge = registerPlugin<FlowNativeBridgePlugin>('FlowNativeBridge');

export const nativeBridge = {
  isAndroid: () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android',

  async getLaunchNotificationAction(): Promise<string | null> {
    if (!this.isAndroid()) return null;
    try {
      const res = await FlowNativeBridge.getLaunchNotificationAction();
      return res.action;
    } catch (e) {
      console.error('FlowNativeBridge: getLaunchNotificationAction failed', e);
      return null;
    }
  },

  async checkNotificationPermission(): Promise<boolean> {
    if (!this.isAndroid()) return true;
    try {
      const res = await FlowNativeBridge.checkNotificationPermission();
      return res.granted;
    } catch (e) {
      console.error('FlowNativeBridge: checkNotificationPermission failed', e);
      return false;
    }
  },

  async requestNotificationPermission(): Promise<boolean> {
    if (!this.isAndroid()) return true;
    try {
      const res = await FlowNativeBridge.requestNotificationPermission();
      return res.granted;
    } catch (e) {
      console.error('FlowNativeBridge: requestNotificationPermission failed', e);
      return false;
    }
  },

  async scheduleExpenseReminder(options: {
    delayHours?: number;
    delaySeconds?: number;
    delayMinutes?: number;
  }): Promise<boolean> {
    if (!this.isAndroid()) return false;
    try {
      const res = await FlowNativeBridge.scheduleExpenseReminder(options);
      return res.success;
    } catch (e) {
      console.error('FlowNativeBridge: scheduleExpenseReminder failed', e);
      return false;
    }
  },

  async cancelExpenseReminder(): Promise<boolean> {
    if (!this.isAndroid()) return false;
    try {
      const res = await FlowNativeBridge.cancelExpenseReminder();
      return res.success;
    } catch (e) {
      console.error('FlowNativeBridge: cancelExpenseReminder failed', e);
      return false;
    }
  },

  // Unified native backup methods
  async exportBackup(options: { fileName: string; json: string }): Promise<{
    success: boolean;
    finalFilePath: string;
    fileName: string;
    folder: string;
    cancelled?: boolean;
  }> {
    if (!this.isAndroid()) {
      throw new Error('exportBackup is only supported on Android native platform.');
    }
    return FlowNativeBridge.exportBackup(options);
  },

  async importBackup(): Promise<{
    cancelled: boolean;
    content?: string;
    fileName?: string;
  }> {
    if (!this.isAndroid()) {
      throw new Error('importBackup is only supported on Android native platform.');
    }
    return FlowNativeBridge.importBackup();
  }
};

