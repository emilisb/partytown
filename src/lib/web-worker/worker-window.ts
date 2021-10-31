import { NodeName, PlatformInstanceId } from '../types';
import { ApplyPathKey, environments, InstanceIdKey, WinIdKey } from './worker-constants';
import { createNodeInstance, getOrCreateNodeInstance } from './worker-constructors';
import { getEnv } from './worker-environment';
import { createImageConstructor } from './worker-image';
import { Location } from './worker-location';
import { createNavigator } from './worker-navigator';
import type { Node } from './worker-node';
import { WorkerProxy } from './worker-proxy-constructor';

const LocationKey = Symbol();
const ParentWinIdKey = Symbol();

export class Window extends WorkerProxy {
  [LocationKey]: Location;
  [ParentWinIdKey]: number;
  Image: any;
  Window: any;

  body: HTMLBodyElement;
  document: Document;
  documentElement: HTMLHtmlElement;
  globalThis: Window;
  head: HTMLHeadElement;
  navigator: Navigator;
  self: Window;
  window: Window;

  constructor(winId: number, parentWinId: number, url: string) {
    super(winId, PlatformInstanceId.window);

    this.document = createNodeInstance(
      winId,
      PlatformInstanceId.document,
      NodeName.Document
    ) as any;
    this.documentElement = createNodeInstance(
      winId,
      PlatformInstanceId.documentElement,
      NodeName.DocumentElement
    ) as any;
    this.head = createNodeInstance(winId, PlatformInstanceId.head, NodeName.Head) as any;
    this.body = createNodeInstance(winId, PlatformInstanceId.body, NodeName.Body) as any;

    this[LocationKey] = new Location(url);
    this[ParentWinIdKey] = parentWinId;

    this.globalThis = this.self = this.window = this;

    this.Image = createImageConstructor(winId);
    this.Window = Window;

    // win.name = name + (debug ? `${normalizedWinId($winId$)} (${$winId$})` : ($winId$ as any));
    this.navigator = createNavigator(winId);
  }

  get frameElement() {
    if (this[WinIdKey] === this[ParentWinIdKey]) {
      return null;
    }

    // the winId of an iframe's window is the same
    // as the instanceId of the containing iframe element
    const env = getEnv(this);
    const iframeElementWinId = env.$parentWinId$;
    const iframeElementInstanceId = this[WinIdKey];
    return getOrCreateNodeInstance(iframeElementWinId, iframeElementInstanceId, NodeName.IFrame);
  }

  get location() {
    return this[LocationKey];
  }
  set location(loc: any) {
    this[LocationKey].href = loc + '';
  }

  get origin() {
    return this[LocationKey].origin;
  }

  get parent() {
    return environments[this[ParentWinIdKey]].$window$;
  }

  get top(): any {
    for (const envWinId in environments) {
      if (environments[envWinId].$winId$ === environments[envWinId].$parentWinId$) {
        return environments[envWinId].$window$;
      }
    }
  }
}

const initWindowInstance = (win: any) => {
  // win[WinIdKey] = $winId$;
  // win[InstanceIdKey] = PlatformInstanceId.window;
  // win[ApplyPathKey] = [];
  // // bind web worker global functions to the environment window
  // // window.atob = self.atob.bind(self);
  // for (const globalName in self) {
  //   if (!(globalName in win)) {
  //     // global properties already in the web worker global
  //     // that we can put onto the environment window
  //     // function examples: atob(), fetch()
  //     // object examples: crypto, performance, indexedDB
  //     win[globalName] =
  //       typeof self[globalName] === 'function'
  //         ? (win[globalName] = (self as any)[globalName].bind(self))
  //         : self[globalName];
  //   }
  // }
  // // assign web worker global properties to the environment window
  // // window.Promise = self.Promise
  // Object.getOwnPropertyNames(self).map((globalName) => {
  //   if (!(globalName in win)) {
  //     win[globalName] = (self as any)[globalName];
  //   }
  // });
  // create the same HTMLElement constructors that were found on main's window
  // and add each constructor to the windown environment
  // window.HTMLParagraphElement = class extends HTMLElement {...}
  // Object.keys(nodeConstructors).map(
  //   (tagName) => (win[nodeConstructors[tagName].name] = nodeConstructors[tagName])
  // );
  // create interface properties found on window
  // window.history = {...}
  // webWorkerCtx.$windowMemberNames$.map((memberName) => {
  //   const $interfaceType$ = webWorkerCtx.$windowMembers$[memberName];
  //   const isFunctionInterface = $interfaceType$ === InterfaceType.Function;
  //   const isValidInterface =
  //     isFunctionInterface || $interfaceType$ > InterfaceType.DocumentFragmentNode;
  //   if (
  //     isValidInterface &&
  //     (!(memberName in win) || windowFunctionWhiteList.includes(memberName))
  //   ) {
  //     // functions or properites that were found on the main thread's window
  //     // that should have a proxy created on this environment window
  //     win[memberName] = isFunctionInterface
  //       ? (...args: any[]) => callMethod(win, [memberName], args)
  //       : proxy($interfaceType$, win, ['window', memberName]);
  //   }
  // });
  // create global constructor proxies
  // window.MutationObserver = class {...}
  // webWorkerCtx.$interfaces$.map((i) => {
  //   const interfaceType = i[0];
  //   const memberName = i[1];
  //   win[memberName] = createGlobalConstructorProxy($winId$, interfaceType, memberName);
  // });
  // win.Image = createImageConstructor($winId$);
  // win.Window = Window;
  // win.name = name + (debug ? `${normalizedWinId($winId$)} (${$winId$})` : ($winId$ as any));
  // win.navigator = createNavigator($winId$);
  // win.screen = new WorkerProxy($winId$, PlatformInstanceId.window, ['screen']);
  // windowPropertyWhiteList.map((propName) =>
  //   Object.defineProperty(win, propName, {
  //     get: () => getter($window$, [propName]),
  //     set: (value) => setter($window$, [propName], value),
  //   })
  // );
};
