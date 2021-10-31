import { EventHandler, StateProp } from '../types';
import { getInstanceStateValue, setInstanceStateValue } from './worker-state';
import { noop } from '../utils';
import type { Node } from './worker-node';

export const HTMLSrcElementProperties: PropertyDescriptorMap & ThisType<Node> = {
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

export const HTMLSrcElementMethods: ThisType<Node> = {
  addEventListener(...args: any[]) {
    const eventName = args[0];
    const callbacks = getInstanceStateValue<EventHandler[]>(this, eventName) || [];
    callbacks.push(args[1]);
    setInstanceStateValue(this, eventName, callbacks);
  },
};
