// import type { HTMLElement } from './worker-element';
import { InterfaceType, NodeName } from '../types';
import { webWorkerInstances } from './worker-constants';
import { WorkerProxy } from './worker-proxy-constructor';

export const createInstance = (
  interfaceType: InterfaceType,
  instanceId: number,
  winId: number,
  nodeName?: string
) => {
  nodeName =
    interfaceType === InterfaceType.TextNode
      ? NodeName.Text
      : interfaceType === InterfaceType.CommentNode
      ? NodeName.Comment
      : interfaceType === InterfaceType.DocumentFragmentNode
      ? NodeName.DocumentFragment
      : interfaceType === InterfaceType.Document
      ? NodeName.Document
      : interfaceType === InterfaceType.DocumentTypeNode
      ? NodeName.DocumentTypeNode
      : nodeName;
  return new (getConstructor(nodeName))(interfaceType, instanceId, winId, nodeName);
};

export const getOrCreateInstance = (
  interfaceType: InterfaceType,
  instanceId: number,
  winId: number,
  nodeName?: string
) => {
  let instance = webWorkerInstances.get(instanceId);
  if (!instance) {
    instance = createInstance(interfaceType, instanceId, winId, nodeName);
    webWorkerInstances.set(instanceId, instance);
  }
  return instance;
};

const getConstructor = (nodeName?: string): typeof WorkerProxy => {
  if (nodeName) {
    if (nodeConstructors[nodeName!]) {
      return nodeConstructors[nodeName!];
    } else if (nodeName!.includes('-')) {
      return nodeConstructors.UNKNOWN;
    } else {
      return (self as any).HTMLElement;
    }
  } else {
    return WorkerProxy;
  }
};

export const nodeConstructors: { [tagName: string]: any } = {};

const constructorToTagMap: { [key: string]: string } = {
  ANCHOR: 'A',
  DLIST: 'DL',
  IMAGE: 'IMG',
  OLIST: 'OL',
  PARAGRAPH: 'P',
  TABLECAPTION: 'CAPTION',
  TABLECELL: 'TD',
  TABLECOL: 'COLGROUP',
  TABLEROW: 'TR',
  TABLESECTION: 'TBODY',
  ULIST: 'UL',
};

export const getTagNameFromConstructor = (t: string) => {
  if (t.startsWith('HTML')) {
    t = t.substr(4).replace('Element', '').toUpperCase();
    return constructorToTagMap[t] || t;
  }
};

export const constructEvent = (eventProps: any) =>
  new Proxy(new Event(eventProps.type, eventProps), {
    get: (target: any, propName) =>
      propName in eventProps ? eventProps[propName] : target[String(propName)],
  });
