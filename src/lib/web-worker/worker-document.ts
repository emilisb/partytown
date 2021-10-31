import { callMethod, setter } from './worker-proxy';
import { createEnvironment, getEnv, getEnvWindow } from './worker-environment';
import { getOrCreateNodeInstance } from './worker-constructors';
import { getPartytownScript } from './worker-exec';
import { NodeName } from '../types';
import type { Node } from './worker-node';
import { randomId, SCRIPT_TYPE } from '../utils';
import { WinIdKey } from './worker-constants';

export const DocumentDescriptorMap: PropertyDescriptorMap & ThisType<Node> = {
  body: {
    get() {
      return getEnv(this).$body$;
    },
  },

  createElement: {
    value(tagName: string) {
      tagName = tagName.toUpperCase();

      const winId = this[WinIdKey];
      const instanceId = randomId();
      const elm = getOrCreateNodeInstance(winId, instanceId, tagName);

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
    value(ns: string, tagName: string) {
      tagName = tagName.toUpperCase();
      const winId = this[WinIdKey];
      const instanceId = randomId();
      const elm = getOrCreateNodeInstance(instanceId, winId, tagName);

      callMethod(this, ['createElementNS'], [ns, tagName], instanceId);

      return elm;
    },
  },

  createTextNode: {
    value(text: string) {
      const winId = this[WinIdKey];
      const instanceId = randomId();

      const node = getOrCreateNodeInstance(winId, instanceId, NodeName.Text);

      callMethod(this, ['createTextNode'], [text], instanceId);

      return node;
    },
  },

  createEvent: {
    value: (type: string) => new Event(type),
  },

  currentScript: {
    get() {
      const winId = this[WinIdKey];
      const currentScriptId = getEnv(this).$currentScriptId$!;
      if (currentScriptId > 0) {
        return getOrCreateNodeInstance(winId, currentScriptId, NodeName.Script);
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

  getElementsByTagName: {
    value(tagName: string) {
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
    value: {
      hasFeature: () => true,
    },
  },

  location: {
    get() {
      return getEnv(this).$location$;
    },
    set(url) {
      getEnv(this).$location$.href = url + '';
    },
  },

  nodeType: {
    value: 9,
  },

  readyState: {
    value: 'complete',
  },
};
