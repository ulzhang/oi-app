export type PipState = 'started' | 'active' | 'stopped' | 'error';

export type PipStateChangedEvent = {
  state: PipState;
  message?: string;
};

export type OiCameraPipModuleEvents = {
  onPipStateChanged: (event: PipStateChangedEvent) => void;
};
