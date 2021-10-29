// import { HTMLElement } from './worker-element';
import { InterfaceType } from '../types';
import { proxy } from './worker-proxy';
import type { WorkerProxy } from './worker-proxy-constructor';
import { serializeInstanceForMain } from './worker-serialization';

export const HTMLCanvasDescriptorMap: PropertyDescriptorMap & ThisType<WorkerProxy> = {
  getContext: {
    value: function (...args: any[]) {
      return proxy(InterfaceType.CanvasRenderingContext2D, this, [
        'getContext',
        serializeInstanceForMain(this, args),
      ]);
    },
  },
};
