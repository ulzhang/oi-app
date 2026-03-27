import { NativeModule, requireNativeModule } from 'expo';
import { OiCameraPipModuleEvents } from './oi-camera-pip.types';

declare class OiCameraPipModule extends NativeModule<OiCameraPipModuleEvents> {
  startCamera(): Promise<boolean>;
  startPip(): Promise<boolean>;
  stopPip(): void;
  stopCamera(): void;
  isPipActive(): boolean;
  getDeviceStatus(): { batteryLevel: number; thermalState: string; isCharging: boolean };
  donateSiriShortcut(): void;
}

export default requireNativeModule<OiCameraPipModule>('OiCameraPip');
