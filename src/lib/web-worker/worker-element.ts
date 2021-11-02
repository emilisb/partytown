import { NodeNameKey } from './worker-constants';
import type { Node } from './worker-node';

export const ElementDescriptorMap: PropertyDescriptorMap & ThisType<Node> = {
  localName: {
    get() {
      return this[NodeNameKey]!.toLowerCase();
    },
  },
  namespaceURI: {
    get() {
      return 'http://www.w3.org/' + (this[NodeNameKey] === 'SVG' ? '2000/svg' : '1999/xhtml');
    },
  },
  nodeType: {
    value: 1,
  },
  tagName: {
    get() {
      return this[NodeNameKey];
    },
  },
};

// export class HTMLElement extends Node {
//   get localName() {
//     return this.nodeName!.toLowerCase();
//   }

//   get namespaceURI() {
//     return 'http://www.w3.org/' + (this.tagName === 'SVG' ? '2000/svg' : '1999/xhtml');
//   }

//   get tagName() {
//     return this.nodeName;
//   }
// }

// export class HTMLSrcElement extends HTMLElement {
//   addEventListener(...args: any[]) {
//     let eventName = args[0];
//     let callbacks = getInstanceStateValue<EventHandler[]>(this, eventName) || [];
//     callbacks.push(args[1]);
//     setInstanceStateValue(this, eventName, callbacks);
//   }

//   get async() {
//     return true;
//   }
//   set async(_: boolean) {}

//   get defer() {
//     return true;
//   }
//   set defer(_: boolean) {}

//   get onload() {
//     let callbacks = getInstanceStateValue<EventHandler[]>(this, StateProp.loadHandlers);
//     return (callbacks && callbacks[0]) || null;
//   }
//   set onload(cb: EventHandler | null) {
//     setInstanceStateValue(this, StateProp.loadHandlers, cb ? [cb] : null);
//   }

//   get onerror() {
//     let callbacks = getInstanceStateValue<EventHandler[]>(this, StateProp.errorHandlers);
//     return (callbacks && callbacks[0]) || null;
//   }
//   set onerror(cb: EventHandler | null) {
//     setInstanceStateValue(this, StateProp.errorHandlers, cb ? [cb] : null);
//   }
// }
