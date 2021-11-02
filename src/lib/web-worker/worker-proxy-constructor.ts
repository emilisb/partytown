import type { ApplyPath } from '../types';
import { ApplyPathKey, InstanceIdKey, NodeNameKey, WinIdKey } from './worker-constants';
import { getter, setter } from './worker-proxy';

export class WorkerProxy {
  [WinIdKey]: number;
  [InstanceIdKey]: number;
  [ApplyPathKey]: string[];
  [NodeNameKey]: string | undefined;

  constructor(winId: number, instanceId: number, applyPath?: ApplyPath, nodeName?: string) {
    this[WinIdKey] = winId!;
    this[InstanceIdKey] = instanceId!;
    this[ApplyPathKey] = applyPath || [];
    this[NodeNameKey] = nodeName;
  }
}

export class WorkerTrapProxy extends WorkerProxy {
  constructor(winId: number, instanceId: number, applyPath?: ApplyPath, nodeName?: string) {
    super(winId, instanceId, applyPath, nodeName);
    
    return new Proxy(this, {
      get(instance, propName) {
        return getter(instance, [propName]);
      },
      set(instance, propName, propValue) {
        setter(instance, [propName], propValue);
        return true;
      },
    });
  }
}
