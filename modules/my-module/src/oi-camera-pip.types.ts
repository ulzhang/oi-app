export type PipState = 'started' | 'active' | 'stopped' | 'error';

export type PipStateChangedEvent = {
  state: PipState;
  message?: string;
};

export type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical';

export type DeviceStatusEvent = {
  batteryLevel: number;
  thermalState: ThermalState;
  isCharging: boolean;
};

export type OiCameraPipModuleEvents = {
  onPipStateChanged: (event: PipStateChangedEvent) => void;
  onDeviceStatusChanged: (event: DeviceStatusEvent) => void;
};
