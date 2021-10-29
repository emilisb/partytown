import { callMethod, getter, setter } from './worker-proxy';
import { getEnv } from './worker-environment';
import { getInstanceStateValue, setInstanceStateValue } from './worker-state';
// import { HTMLSrcElement } from './worker-element';
import { resolveUrl } from './worker-exec';
import { StateProp } from '../types';
import type { WorkerProxy } from './worker-proxy-constructor';

const innerHTMLDescriptor: PropertyDescriptor & ThisType<WorkerProxy> = {
  get() {
    return getInstanceStateValue<string>(this, StateProp.innerHTML) || '';
  },
  set(scriptContent: string) {
    setInstanceStateValue(this, StateProp.innerHTML, scriptContent);
  },
};

export const HTMLScriptElement: PropertyDescriptorMap & ThisType<WorkerProxy> = {
  innerHTML: innerHTMLDescriptor,
  innerText: innerHTMLDescriptor,

  src: {
    get() {
      return getInstanceStateValue<string>(this, StateProp.url) || '';
    },
    set(url: string) {
      url = resolveUrl(getEnv(this), url);
      setInstanceStateValue(this, StateProp.url, url);
      setter(this, ['src'], url);
    },
  },

  getAttribute: {
    value: function (attrName: string) {
      if (attrName === 'src') {
        return (this as any).src;
      }
      return callMethod(this, ['getAttribute'], [attrName]);
    },
  },

  setAttribute: {
    value: function (attrName: string, attrValue: any) {
      if (attrName === 'src') {
        (this as any).src = attrValue;
      } else {
        callMethod(this, ['setAttribute'], [attrName, attrValue]);
      }
    },
  },

  // getAttribute(attrName: string) {
  //   if (attrName === 'src') {
  //     return this.src;
  //   }
  //   return callMethod(this, ['getAttribute'], [attrName]);
  // }

  // setAttribute(attrName: string, attrValue: any) {
  //   if (attrName === 'src') {
  //     this.src = attrValue;
  //   } else {
  //     callMethod(this, ['setAttribute'], [attrName, attrValue]);
  //   }
  // }

  textContent: innerHTMLDescriptor,

  type: {
    get() {
      return getter(this, ['type']);
    },
    set(type: string) {
      if (type !== 'text/javascript') {
        setter(this, ['type'], type);
      }
    },
  },
};
