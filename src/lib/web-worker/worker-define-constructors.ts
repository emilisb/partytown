import { ApplyPathType, InterfaceInfo, InterfaceType } from '../types';
import {
  ApplyPathKey,
  cachedTree,
  InstanceIdKey,
  nodeConstructors,
  WinIdKey,
} from './worker-constants';
import { callMethod, getter, queue, setter } from './worker-proxy';
import { defineConstructorName, logWorkerGlobalConstructor, randomId } from '../utils';
import { DocumentDescriptorMap } from './worker-document';
import { ElementDescriptorMap } from './worker-element';
import { HTMLAnchorDescriptorMap } from './worker-anchor';
import { HTMLCanvasDescriptorMap } from './worker-canvas';
import { Node } from './worker-node';
import { serializeForMain } from './worker-serialization';
import { WorkerProxy, WorkerTrapProxy } from './worker-proxy-constructor';

export const defineWorkerInterface = (interfaceInfo: InterfaceInfo) => {
  const cstrName = interfaceInfo[0];
  const superCstrName = interfaceInfo[1];
  const members = interfaceInfo[2];
  const nodeName = interfaceInfo[3];

  const SuperCstr = TrapConstructors[cstrName]
    ? WorkerTrapProxy
    : superCstrName === 'Object'
    ? WorkerProxy
    : (self as any)[superCstrName];

  const Cstr = ((self as any)[cstrName] = defineConstructorName(
    cstrName === 'Node' ? Node : class extends SuperCstr {},
    cstrName
  ));

  if (nodeName) {
    nodeConstructors[nodeName] = Cstr;
  }

  members.map(([memberName, memberType, staticValue]) => {
    if (!(memberName in Cstr.prototype) && !(memberName in Node.prototype)) {
      // member not already in the constructor's prototype
      if (typeof memberType === 'string') {
        defineProxyProperty(Cstr, memberName, memberType);
      } else {
        // interface type
        if (memberType === InterfaceType.Function) {
          // method that should access main
          definePrototypeValue(Cstr, memberName, function (this: Node, ...args: any[]) {
            return callMethod(this, [memberName], args);
          });
        } else if (memberType > 0) {
          // property
          if (staticValue !== undefined) {
            // static property that doesn't change
            // and no need to access main
            definePrototypeValue(Cstr, memberName, staticValue);
          } else {
            // property getter/setter that should access main
            definePrototypeProperty(Cstr, memberName, {
              get(this: Node) {
                return getter(this, [memberName]);
              },
              set(this: Node, value) {
                return setter(this, [memberName], value);
              },
            });
          }
        }
      }
    }
  });
};

const TrapConstructors: { [cstrName: string]: 1 } = { CSSStyleDeclaration: 1, NamedNodeMap: 1 };

export const patchPrototypes = () => {
  definePrototypePropertyDescriptor(self.Element, ElementDescriptorMap);
  definePrototypePropertyDescriptor(self.Document, DocumentDescriptorMap);
  definePrototypePropertyDescriptor(self.HTMLAnchorElement, HTMLAnchorDescriptorMap);
  definePrototypePropertyDescriptor(self.HTMLCanvasElement, HTMLCanvasDescriptorMap);

  definePrototypeNodeType(self.Comment, 8);
  definePrototypeNodeType(self.DocumentType, 10);
  definePrototypeNodeType(self.DocumentFragment, 11);

  cachedTreeProps(Node, nodeTreePropNames);
  cachedTreeProps(self.Element, elementTreePropNames);
  cachedTreeProps(self.DocumentFragment, elementTreePropNames);
};

const nodeTreePropNames =
  'childNodes,firstChild,isConnected,lastChild,nextSibling,parentElement,parentNode,previousSibling';

const elementTreePropNames =
  'childElementCount,children,firstElementChild,lastElementChild,nextElementSibling,previousElementSibling';

const definePrototypeValue = (Cstr: any, memberName: string, value: any) =>
  definePrototypeProperty(Cstr, memberName, {
    value,
  });

const definePrototypeNodeType = (Cstr: any, nodeType: number) =>
  definePrototypeValue(Cstr, 'nodeType', nodeType);

const defineProxyProperty = (Cstr: WorkerProxy, memberName: string, proxiedCstrName: string) =>
  definePrototypeProperty(Cstr, memberName, {
    get(this: WorkerProxy) {
      const winId = this[WinIdKey];
      const instanceId = this[InstanceIdKey];
      const applyPath = [...this[ApplyPathKey], memberName];
      const PropCstr: typeof WorkerProxy = (self as any)[proxiedCstrName];
      const propInstance = new PropCstr(winId, instanceId, applyPath);
      return propInstance;
    },
  });

const definePrototypeProperty = (Cstr: any, memberName: string, descriptor: PropertyDescriptor) =>
  Object.defineProperty(Cstr.prototype, memberName, { ...descriptor, configurable: true });

const definePrototypePropertyDescriptor = (Cstr: any, propertyDescriptorMap: any) =>
  Object.defineProperties(Cstr.prototype, propertyDescriptorMap);

const cachedTreeProps = (Cstr: any, treeProps: string) =>
  treeProps.split(',').map((propName) =>
    definePrototypeProperty(Cstr, propName, {
      get(this: WorkerProxy) {
        let cacheKey = getDimensionCacheKey(this, propName);
        let result = cachedTree.get(cacheKey);
        if (!result) {
          result = getter(this, [propName]);
          cachedTree.set(cacheKey, result);
        }
        return result;
      },
    })
  );

const getDimensionCacheKey = (instance: WorkerProxy, memberName: string) =>
  instance[WinIdKey] + '.' + instance[InstanceIdKey] + '.' + memberName;

export const createGlobalConstructorProxy = (winId: number, cstrName: string) => {
  const GlobalCstr = class {
    constructor(...args: any[]) {
      const instanceId = randomId();
      const workerProxy = new WorkerProxy(winId, instanceId);

      queue(workerProxy, [
        ApplyPathType.GlobalConstructor,
        cstrName,
        serializeForMain(winId, instanceId, args),
      ]);

      logWorkerGlobalConstructor(winId, cstrName, args);

      return workerProxy;
    }
  };

  return defineConstructorName(GlobalCstr, cstrName);
};

const setterMethods =
  'addEventListener,removeEventListener,createElement,createTextNode,insertBefore,insertRule,deleteRule,setAttribute,setItem,removeItem,classList.add,classList.remove,classList.toggle'.split(
    ','
  );
