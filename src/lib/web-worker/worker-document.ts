import { callMethod, setter } from './worker-proxy';
import { cachedReadonlyProps, constantProps } from './worker-state';
import { createEnvironment, getEnv, getEnvWindow } from './worker-environment';
import { debug, defineConstructorName, randomId, SCRIPT_TYPE } from '../utils';
import { getOrCreateInstance } from './worker-constructors';
import { getPartytownScript } from './worker-exec';
// import { HTMLElement } from './worker-element';
import { InterfaceType, NodeName } from '../types';
import { WinIdKey } from './worker-constants';
// import type { WorkerProxy } from './worker-proxy-constructor';
import type { Node } from './worker-node';

export const DocumentDescriptorMap: PropertyDescriptorMap & ThisType<Node> = {
  body: {
    get() {
      return getEnv(this).$body$;
    },
  },

  createElement: {
    value: function (tagName: string) {
      tagName = tagName.toUpperCase();

      const winId = this[WinIdKey];
      const instanceId = randomId();
      const elm = getOrCreateInstance(InterfaceType.Element, instanceId, winId, tagName);

      callMethod(this, ['createElement'], [tagName], instanceId);

      if (tagName === NodeName.IFrame) {
        // an iframe element's instanceId is the same as its contentWindow's winId
        // and the contentWindow's parentWinId is the iframe element's winId
        createEnvironment({ $winId$: instanceId, $parentWinId$: winId, $url$: 'about:blank' });

        setter(elm, ['srcdoc'], getPartytownScript());
      } else if (tagName === NodeName.Script) {
        setter(elm, ['type'], SCRIPT_TYPE);
      }

      return elm;
    },
  },

  createElementNS: {
    value: function (ns: string, tagName: string) {
      tagName = tagName.toUpperCase();
      const winId = this[WinIdKey];
      const instanceId = randomId();
      const elm = getOrCreateInstance(InterfaceType.Element, instanceId, winId, tagName);

      callMethod(this, ['createElementNS'], [ns, tagName], instanceId);

      return elm;
    },
  },

  createTextNode: {
    value: function (text: string) {
      const winId = this[WinIdKey];
      const instanceId = randomId();

      const node = getOrCreateInstance(InterfaceType.TextNode, instanceId, winId);

      callMethod(this, ['createTextNode'], [text], instanceId);

      return node;
    },
  },

  createEvent: {
    value: (type: string) => new Event(type),
  },

  currentScript: {
    get() {
      const currentScriptId = getEnv(this).$currentScriptId$!;
      if (currentScriptId > 0) {
        return getOrCreateInstance(
          InterfaceType.Element,
          currentScriptId,
          this[WinIdKey],
          NodeName.Script
        );
      }
      return null;
    },
  },

  defaultView: {
    get() {
      return getEnvWindow(this);
    },
  },

  documentElement: {
    get() {
      return getEnv(this).$documentElement$;
    },
  },

  // doctype: {
  //   get() {
  //     return getEnv(this).$documentElement$;
  //   },
  // },

  getElementsByTagName: {
    value: function (tagName: string) {
      tagName = tagName.toUpperCase();
      if (tagName === NodeName.Body) {
        return [getEnv(this).$body$];
      } else if (tagName === NodeName.Head) {
        return [getEnv(this).$head$];
      } else {
        return callMethod(this, ['getElementsByTagName'], [tagName]);
      }
    },
  },

  head: {
    get() {
      return getEnv(this).$head$;
    },
  },

  implementation: {
    get: () => ({
      hasFeature: () => true,
    }),
  },

  location: {
    get() {
      return getEnv(this).$location$;
    },
    set(url) {
      getEnv(this).$location$.href = url + '';
    },
  },
};
