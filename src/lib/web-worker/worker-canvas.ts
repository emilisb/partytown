import { InstanceIdKey, WinIdKey } from './worker-constants';
import type { Node } from './worker-node';
import { serializeInstanceForMain } from './worker-serialization';
import { WorkerProxy } from './worker-proxy-constructor';

export const HTMLCanvasDescriptorMap: PropertyDescriptorMap & ThisType<Node> = {
  getContext: {
    value(...args: any[]) {
      debugger;
      const applyPath = ['getContext', serializeInstanceForMain(this, args)];
      return new WorkerProxy(this[WinIdKey], this[InstanceIdKey], applyPath);
    },
  },
};
