import type { ApplyPath } from '../types';
import { ApplyPathKey, InstanceIdKey, NodeNameKey, WinIdKey } from './worker-constants';

export class WorkerProxy {
  [WinIdKey]: number;
  [InstanceIdKey]: number;
  [NodeNameKey]: string | undefined;
  [ApplyPathKey]: string[];

  constructor(winId?: number, instanceId?: number, applyPath?: ApplyPath) {
    this[WinIdKey] = winId!;
    this[InstanceIdKey] = instanceId!;
    this[ApplyPathKey] = applyPath || [];
  }
}
