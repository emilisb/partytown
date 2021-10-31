import { InstanceIdKey, WinIdKey } from './worker-constants';
import type { Node } from './worker-node';
import { serializeInstanceForMain } from './worker-serialization';
import { WorkerProxy } from './worker-proxy-constructor';

export const HTMLCanvasDescriptorMap: PropertyDescriptorMap & ThisType<Node> = {
  getContext: {
    value: function (...args: any[]) {
      return new WorkerProxy(this[WinIdKey], this[InstanceIdKey], [
        'getContext',
        serializeInstanceForMain(this, args),
      ]);
    },
  },
};
