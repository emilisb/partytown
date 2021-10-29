import {} from './worker-state';
import { defineConstructorName, EMPTY_ARRAY, getLastMemberName, logWorker } from '../utils';
import { elementConstructors, getTagNameFromConstructor } from './worker-constructors';
// import { HTMLAnchorElement } from './worker-anchor';
// import { HTMLCanvasElement } from './worker-canvas';
// import { HTMLElement } from './worker-element';
// import { HTMLDocument } from './worker-document';
// import { HTMLIFrameElement } from './worker-iframe';
// import { HTMLScriptElement } from './worker-script';
// import { HTMLStyleElement } from './worker-style';
import { cachedTree, InstanceIdKey, webWorkerCtx, WinIdKey } from './worker-constants';
import { WorkerProxy } from './worker-proxy-constructor';
// import { NodeProperties } from './worker-node';
import { ElementDescriptorMap } from './worker-element';
import { Node } from './worker-node';
import { DocumentDescriptorMap } from './worker-document';
import { ApplyPath, InterfaceType, NodeConstructor } from '../types';
import { callMethod, getter, setter } from './worker-proxy';
import { HTMLAnchorDescriptorMap } from './worker-anchor';
import { HTMLCanvasDescriptorMap } from './worker-canvas';

export const initWebWorker = (nodeCstrs: NodeConstructor[]) => {
  webWorkerCtx.$forwardedTriggers$ = (webWorkerCtx.$config$.forward || EMPTY_ARRAY).map(
    (f) => f[0]
  );

  webWorkerCtx.$windowMembers$ = webWorkerCtx.$interfaces$[0][2];
  webWorkerCtx.$windowMemberNames$ = Object.keys(webWorkerCtx.$windowMembers$).filter(
    (m) => !webWorkerCtx.$forwardedTriggers$.includes(m)
  );

  webWorkerCtx.$postMessage$ = postMessage.bind(self);

  (self as any).postMessage = (self as any).importScripts = undefined;

  // const HtmlElementCstr = ((self as any).Element = (self as any).HTMLElement = HTMLElement);

  // const Node = createNodeConstructor(WorkerProxy);

  // cachedTreeProps(((self as any).Node = Node), nodeTreePropNames);

  // cachedTreeProps(((self as any).Node = Node), nodeTreePropNames);
  // cachedDimensionProps(HtmlElementCstr);
  // cachedDimensionMethods(HtmlElementCstr);
  // cachedTreeProps(HtmlElementCstr, elementTreePropNames);

  // (self as any).Document = HTMLDocument;

  // create the same HTMLElement constructors that were found on main's window
  // and add each constructor to the elementConstructors map, to be used by windows later
  // console.log(nodeCstrs);

  (self as any).Node = Node;

  nodeCstrs.map((nodeCstr) => {
    const cstrName = nodeCstr[0];
    const superCstrName = nodeCstr[1];
    const nodeName = nodeCstr[2];
    const members = nodeCstr[3];

    const Cstr = ((self as any)[cstrName] = defineConstructorName(
      (self as any)[cstrName]
        ? (self as any)[cstrName]
        : class extends (self as any)[superCstrName] {},
      cstrName
    ));

    elementConstructors[nodeName.toLowerCase()] = Cstr;

    members.map(([memberName, memberType, staticValue]) => {
      if (!(memberName in Cstr.prototype)) {
        // member not already in the constructor's prototype
        if (typeof memberType === 'string') {
          defineProxyProperty(Cstr, memberName, memberType);
        } else {
          // interface type
          if (memberType === InterfaceType.Property) {
            // property
            if (staticValue !== undefined) {
              // static property that doesn't change
              // and no need to access main
              defineValueProperty(Cstr, memberName, staticValue);
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
          } else if (memberType === InterfaceType.Function) {
            // method that should access main
            defineValueProperty(Cstr, memberName, function (this: Node, ...args: any[]) {
              return callMethod(this, [memberName], args);
            });
          }
        }
      }
    });
  });

  definePrototypePropertyDescriptor(self.Element, ElementDescriptorMap);
  definePrototypePropertyDescriptor(self.Document, DocumentDescriptorMap);

  definePrototypePropertyDescriptor(self.HTMLAnchorElement, HTMLAnchorDescriptorMap);
  definePrototypePropertyDescriptor(self.HTMLCanvasElement, HTMLCanvasDescriptorMap);

  cachedTreeProps(self.Node, nodeTreePropNames);
  cachedTreeProps(self.Element, elementTreePropNames);
  cachedTreeProps(self.DocumentFragment, elementTreePropNames);

  webWorkerCtx.$isInitialized$ = 1;

  logWorker(`Initialized web worker`);
};

const createPropProxy = <T = any>(
  instance: T,
  initApplyPath: ApplyPath,
  proxiedCstrName: string
): T =>
  new Proxy<any>(instance, {
    get(instance, propKey) {
      if (typeof propKey === 'symbol') {
        return instance[propKey];
      }

      const applyPath: ApplyPath = [...initApplyPath, String(propKey)];

      const interfaceInfo = webWorkerCtx.$interfaces$.find((i) => i[1] === proxiedCstrName);
      if (interfaceInfo) {
        const memberTypeInfo = interfaceInfo[2];
        const memberInfo = memberTypeInfo[getLastMemberName(applyPath)];
        if (memberInfo === InterfaceType.Function) {
          return (...args: any[]) => callMethod(instance, applyPath, args);
        }
      }

      // const stateValue = getInstanceStateValue<Function>(target, applyPath[0]);
      // if (typeof stateValue === 'function') {
      //   return (...args: any[]) => {
      //     const rtnValue = stateValue.apply(target, args);
      //     logWorkerCall(target, applyPath, args, rtnValue);
      //     return rtnValue;
      //   };
      // }

      return getter(instance, applyPath);
    },

    set(instance, propKey, value) {
      if (typeof propKey === 'symbol') {
        instance[propKey] = value;
      } else {
        setter(instance, [...initApplyPath, propKey], value);
      }
      // else if (shouldRestrictToWorker(interfaceType, propKey)) {
      //   // this value should only be set within the web worker world
      //   // it does not get passed and set to the main thread's window
      //   // set the value to just the window environment
      //   target[propKey] = value;
      //   logWorkerSetter(target, [propKey], value, true);
      // }
      // else {

      // }

      return true;
    },

    // has(target, propKey) {
    //   // if (c === InterfaceType.Window) {
    //   //   return true;
    //   // }
    //   return Reflect.has(target, propKey);
    // },
  });

const nodeTreePropNames =
  'childNodes,firstChild,isConnected,lastChild,nextSibling,parentElement,parentNode,previousSibling';

const elementTreePropNames =
  'childElementCount,children,firstElementChild,lastElementChild,nextElementSibling,previousElementSibling';

const defineValueProperty = (Cstr: any, memberName: string, value: any) =>
  definePrototypeProperty(Cstr, memberName, {
    value,
  });

const defineProxyProperty = (Cstr: any, memberName: string, proxiedCstrName: string) =>
  definePrototypeProperty(Cstr, memberName, {
    get() {
      return createPropProxy(this, [memberName], proxiedCstrName);
    },
  });

const definePrototypeProperty = (Cstr: any, memberName: string, descriptor: PropertyDescriptor) =>
  Object.defineProperty(Cstr.prototype, memberName, { ...descriptor, configurable: true });

const definePrototypePropertyDescriptor = (Cstr: any, propertyDescriptorMap: any) =>
  Object.defineProperties(Cstr.prototype, propertyDescriptorMap);

const definePrototypeProperties = (Cstr: any, propNames: string[]) =>
  propNames.map((propName) =>
    definePrototypeProperty(Cstr, propName, {
      get(this: Node) {
        return getter(this, [propName]);
      },
      set(this: Node, value) {
        return setter(this, [propName], value);
      },
    })
  );

const defineMethods = (Cstr: any, methodNames: string[]) =>
  methodNames.map((methodName) =>
    defineValueProperty(Cstr, methodName, function (this: Node, ...args: any[]) {
      return callMethod(this, [methodName], args);
    })
  );

const cachedTreeProps = (Cstr: any, treeProps: string) =>
  treeProps.split(',').map((propName) =>
    definePrototypeProperty(Cstr, propName, {
      get(this: Node) {
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

const getDimensionCacheKey = (instance: Node, memberName: string) =>
  instance[WinIdKey] + '.' + instance[InstanceIdKey] + '.' + memberName;
