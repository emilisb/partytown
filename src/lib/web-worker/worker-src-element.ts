import { EventHandler, StateProp } from '../types';
import { noop } from '../utils';
import type { WorkerProxy } from './worker-proxy-constructor';
import { getInstanceStateValue, setInstanceStateValue } from './worker-state';

export const HTMLSrcElementProperties: PropertyDescriptorMap & ThisType<WorkerProxy> = {
  async: {
    get: () => true,
    set: noop,
  },
  defer: {
    get: () => true,
    set: noop,
  },
  onload: {
    get() {
      let callbacks = getInstanceStateValue<EventHandler[]>(this, StateProp.loadHandlers);
      return (callbacks && callbacks[0]) || null;
    },
    set(cb) {
      setInstanceStateValue(this, StateProp.loadHandlers, cb ? [cb] : null);
    },
  },
  onerror: {
    get() {
      let callbacks = getInstanceStateValue<EventHandler[]>(this, StateProp.errorHandlers);
      return (callbacks && callbacks[0]) || null;
    },
    set(cb) {
      setInstanceStateValue(this, StateProp.errorHandlers, cb ? [cb] : null);
    },
  },
};

export const HTMLSrcElementMethods: ThisType<WorkerProxy> = {
  addEventListener(...args: any[]) {
    let eventName = args[0];
    let callbacks = getInstanceStateValue<EventHandler[]>(this, eventName) || [];
    callbacks.push(args[1]);
    setInstanceStateValue(this, eventName, callbacks);
  },
};
