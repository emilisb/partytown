import { getUrl } from './worker-exec';
// import { HTMLElement } from './worker-element';
import { setInstanceStateValue } from './worker-state';
import { setter } from './worker-proxy';
import { StateProp } from '../types';
import type { WorkerProxy } from './worker-proxy-constructor';

export const HTMLAnchorDescriptorMap: PropertyDescriptorMap & ThisType<WorkerProxy> = {
  hash: {
    get() {
      return getUrl(this).hash;
    },
  },
  host: {
    get() {
      return getUrl(this).host;
    },
  },
  hostname: {
    get() {
      return getUrl(this).hostname;
    },
  },
  href: {
    get() {
      return getUrl(this).href;
    },
    set(href) {
      href = href + '';
      setInstanceStateValue(this, StateProp.url, href);
      setter(this, ['href'], href);
    },
  },
  origin: {
    get() {
      return getUrl(this).origin;
    },
  },
  pathname: {
    get() {
      return getUrl(this).pathname;
    },
  },
  port: {
    get() {
      return getUrl(this).port;
    },
  },
  protocol: {
    get() {
      return getUrl(this).protocol;
    },
  },
  search: {
    get() {
      return getUrl(this).search;
    },
  },
};
