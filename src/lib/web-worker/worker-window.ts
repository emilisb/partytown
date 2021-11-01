import { createNavigator } from './worker-navigator';
import { createImageConstructor } from './worker-image';
import { createNodeInstance, getOrCreateNodeInstance } from './worker-constructors';
import { debug, definePrototypeValue, normalizedWinId } from '../utils';
import { environments, WinIdKey } from './worker-constants';
import { getEnv } from './worker-environment';
import { Location } from './worker-location';
import { NodeName, PlatformInstanceId } from '../types';
import { WorkerProxy } from './worker-proxy-constructor';

export class Window extends WorkerProxy {
  constructor($winId$: number, $parentWinId$: number, url: string) {
    super($winId$, PlatformInstanceId.window);

    const $document$ = createNodeInstance(
      $winId$,
      PlatformInstanceId.document,
      NodeName.Document
    ) as any;

    const $documentElement$ = createNodeInstance(
      $winId$,
      PlatformInstanceId.documentElement,
      NodeName.DocumentElement
    ) as any;

    const $head$ = createNodeInstance($winId$, PlatformInstanceId.head, NodeName.Head) as any;

    const $body$ = createNodeInstance($winId$, PlatformInstanceId.body, NodeName.Body) as any;

    environments[$winId$] = {
      $winId$,
      $parentWinId$,
      $window$: this as any,
      $document$,
      $documentElement$,
      $head$,
      $body$,
      $location$: new Location(url) as any,
    };

    // assign global properties already in the web worker global
    // that we can put onto the environment window
    for (const globalName in self) {
      console.log(globalName);
      if (!(globalName in this)) {
        // global properties already in the web worker global
        const value = self[globalName] as any;
        if (value != null) {
          // function examples: atob(), fetch()
          // object examples: crypto, performance, indexedDB
          // boolean examples: isSecureContext, crossOriginIsolated
          const isFunction = typeof value === 'function' && !value.toString().startsWith('class');
          (this as any)[globalName] = isFunction ? value.bind(self) : value;
        }
      }
    }

    // assign web worker global properties to the environment window
    // window.Promise = self.Promise
    Object.getOwnPropertyNames(self).map((globalName) => {
      if (!(globalName in this)) {
        console.log(globalName);
        (this as any)[globalName] = (self as any)[globalName];
      }
    });
  }

  get body() {
    return getEnv(this).$body$;
  }

  get document() {
    return getEnv(this).$document$;
  }

  get documentElement() {
    return getEnv(this).$documentElement$;
  }

  get frameElement() {
    const env = getEnv(this);
    const parentWinId = env.$parentWinId$;
    const winId = env.$winId$;

    if (winId === parentWinId) {
      // this is the top window, not in an iframe
      return null;
    }

    // the winId of an iframe's window is the same
    // as the instanceId of the containing iframe element
    return getOrCreateNodeInstance(parentWinId, winId, NodeName.IFrame);
  }

  get globalThis() {
    return this;
  }

  get head() {
    return getEnv(this).$head$;
  }

  get location() {
    return getEnv(this).$location$;
  }
  set location(loc: any) {
    getEnv(this).$location$.href = loc + '';
  }

  get Image() {
    return createImageConstructor(this[WinIdKey]);
  }

  get name() {
    const winId = this[WinIdKey];
    return name + (debug ? `${normalizedWinId(winId)} (${winId})` : (winId as any));
  }

  get navigator() {
    return createNavigator(this[WinIdKey]);
  }

  get origin() {
    return getEnv(this).$location$.origin;
  }

  get parent() {
    return environments[getEnv(this).$parentWinId$].$window$;
  }

  get self() {
    return this;
  }

  get top(): any {
    for (const envWinId in environments) {
      if (environments[envWinId].$winId$ === environments[envWinId].$parentWinId$) {
        return environments[envWinId].$window$;
      }
    }
  }

  get window() {
    return this;
  }
}

export const patchWebWorkerWindowPrototype = () => {
  // we already assigned the same prototypes found on the main thread's Window
  // to the worker's Window, but actually it assigned a few that are already on
  // the web worker's global we can use instead. So manually set which web worker
  // globals we can reuse, instead of calling the main access.
  // These same window properties will be assigned to the window instance
  // when Window is constructed, and these won't make calls to the main thread.
  const webWorkerGlobals =
    'atob,btoa,crypto,indexedDB,navigator,performance,requestAnimationFrame'.split(',');
  webWorkerGlobals.map((memberName) => delete (Window as any).prototype[memberName]);
};

const initWindowInstance2 = (win: any) => {
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
