import { callMethod, getter } from './worker-proxy';
import { constantProps, getInstanceStateValue, setInstanceStateValue } from './worker-state';
import { HTMLElement } from './worker-element';
import { StateProp } from '../types';
import type { WorkerProxy } from './worker-proxy-constructor';

export class HTMLStyleElement extends HTMLElement {
  get sheet() {
    return new CSSStyleSheet(this);
  }
}

class CSSStyleSheet {
  ownerNode: WorkerProxy;

  constructor(ownerNode: WorkerProxy) {
    this.ownerNode = ownerNode;
  }

  get cssRules() {
    const ownerNode = this.ownerNode;
    return new Proxy(
      {},
      {
        get(target: any, propKey) {
          const propName = String(propKey);
          if (propName === 'item') {
            return (index: number) => getCssRule(ownerNode, index);
          }
          if (propName === 'length') {
            return getCssRules(ownerNode).length;
          }
          if (!isNaN(propName as any)) {
            return getCssRule(ownerNode, propName);
          }
          return target[propKey];
        },
      }
    );
  }

  insertRule(ruleText: string, index: number | undefined) {
    const cssRules = getCssRules(this.ownerNode);
    index = index === undefined ? 0 : index;
    if (index >= 0 && index <= cssRules.length) {
      callMethod(this.ownerNode, ['sheet', 'insertRule'], [ruleText, index]);
      // insert bogus data so the array/length is correct
      // but later on, if we ever want to "read" this inserted rule
      // we do a real lookup to get the dom correct data
      cssRules.splice(index, 0, 0);
    }
    return index;
  }

  deleteRule(index: number) {
    callMethod(this.ownerNode, ['sheet', 'deleteRule'], [index]);
    const cssRules = getCssRules(this.ownerNode);
    cssRules.splice(index, 1);
  }
}

constantProps(CSSStyleSheet, { type: 'text/css' });

const getCssRules = (ownerNode: WorkerProxy): any[] => {
  let cssRules = getInstanceStateValue(ownerNode, StateProp.cssRules);
  if (!cssRules) {
    cssRules = getter(ownerNode, ['sheet', 'cssRules']);
    setInstanceStateValue(ownerNode, StateProp.cssRules, cssRules);
  }
  return cssRules;
};

const getCssRule = (ownerNode: WorkerProxy, index: any) => {
  let cssRules = getCssRules(ownerNode);
  if (cssRules[index] === 0) {
    cssRules[index] = getter(ownerNode, ['sheet', 'cssRules', parseInt(index, 10)]);
  }
  return cssRules[index];
};
