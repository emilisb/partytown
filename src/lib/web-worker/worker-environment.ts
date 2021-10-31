import { cachedDimensionProps, cachedReadonlyProps } from './worker-state';
import { getter, setter } from './worker-proxy';
import { createImageConstructor } from './worker-image';
import { createNavigator } from './worker-navigator';
import { debug, logWorker, normalizedWinId } from '../utils';
import {
  ApplyPathKey,
  environments,
  InstanceIdKey,
  nodeConstructors,
  webWorkerCtx,
  WinIdKey,
} from './worker-constants';
import {
  InitializeEnvironmentData,
  InterfaceType,
  NodeName,
  PlatformInstanceId,
  WorkerMessageType,
} from '../types';
import { Location } from './worker-location';
import { WorkerProxy } from './worker-proxy-constructor';
import { createNodeInstance, getOrCreateNodeInstance } from './worker-constructors';

export const createEnvironment = ({
  $winId$,
  $parentWinId$,
  $isTop$,
  $url$,
}: InitializeEnvironmentData) => {
  if (environments[$winId$]) {
    // this environment (iframe) is already initialized
    environments[$winId$].$location$.href = $url$;
  } else {
    // create a simulated global environment for this window

    class Window {
      [WinIdKey]: number;
      [InstanceIdKey]: number;
      [ApplyPathKey]: string[];

      constructor() {
        initWindowInstance(this);
      }

      get document() {
        return $document$;
      }

      get frameElement() {
        if ($isTop$) {
          return null;
        }

        // the winId of an iframe's window is the same
        // as the instanceId of the containing iframe element
        const env = getEnv(this);
        const iframeElementInstanceId = this[WinIdKey];
        const iframeElementWinId = env.$parentWinId$;
        return getOrCreateNodeInstance(
          iframeElementWinId,
          iframeElementInstanceId,
          NodeName.IFrame
        );
      }

      get globalThis() {
        return getEnvWindow(this);
      }

      get location() {
        return $location$;
      }
      set location(loc: any) {
        $location$.href = loc + '';
      }

      get origin() {
        return $location$.origin;
      }

      get parent() {
        return environments[$parentWinId$].$window$;
      }

      get self() {
        return getEnvWindow(this);
      }

      get top() {
        for (const envWinId in environments) {
          if (environments[envWinId].$isTop$) {
            return environments[envWinId].$window$;
          }
        }
      }

      get window() {
        return getEnvWindow(this);
      }
    }

    const $document$ = createNodeInstance($winId$, PlatformInstanceId.document, NodeName.Document);

    const $documentElement$ = createNodeInstance(
      $winId$,
      PlatformInstanceId.documentElement,
      NodeName.DocumentElement
    );

    const $head$ = createNodeInstance($winId$, PlatformInstanceId.head, NodeName.Head);

    const $body$ = createNodeInstance($winId$, PlatformInstanceId.body, NodeName.Body);

    const $location$ = new Location($url$);

    const windowFunctionWhiteList =
      'addEventListener,removeEventListener,dispatchEvent,postMessage'.split(',');

    const windowPropertyWhiteList = 'onmessage,onload,onerror'.split(',');

    const initWindowInstance = (win: any) => {
      win[WinIdKey] = $winId$;
      win[InstanceIdKey] = PlatformInstanceId.window;
      win[ApplyPathKey] = [];

      // bind web worker global functions to the environment window
      // window.atob = self.atob.bind(self);
      for (const globalName in self) {
        if (!(globalName in win)) {
          // global properties already in the web worker global
          // that we can put onto the environment window
          // function examples: atob(), fetch()
          // object examples: crypto, performance, indexedDB
          win[globalName] =
            typeof self[globalName] === 'function'
              ? (win[globalName] = (self as any)[globalName].bind(self))
              : self[globalName];
        }
      }

      // assign web worker global properties to the environment window
      // window.Promise = self.Promise
      Object.getOwnPropertyNames(self).map((globalName) => {
        if (!(globalName in win)) {
          win[globalName] = (self as any)[globalName];
        }
      });

      // create the same HTMLElement constructors that were found on main's window
      // and add each constructor to the windown environment
      // window.HTMLParagraphElement = class extends HTMLElement {...}
      Object.keys(nodeConstructors).map(
        (tagName) => (win[nodeConstructors[tagName].name] = nodeConstructors[tagName])
      );

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

      win.Image = createImageConstructor($winId$);
      win.Window = Window;

      win.name = name + (debug ? `${normalizedWinId($winId$)} (${$winId$})` : ($winId$ as any));
      win.navigator = createNavigator($winId$);
      win.screen = new WorkerProxy($winId$, PlatformInstanceId.window, ['screen']);

      windowPropertyWhiteList.map((propName) =>
        Object.defineProperty(win, propName, {
          get: () => getter($window$, [propName]),
          set: (value) => setter($window$, [propName], value),
        })
      );
    };

    cachedReadonlyProps(Window, 'devicePixelRatio');
    cachedDimensionProps(Window);

    const $window$: any = new Window();

    environments[$winId$] = {
      $winId$,
      $parentWinId$,
      $window$,
      $document$: $document$ as any,
      $documentElement$: $documentElement$ as any,
      $head$: $head$ as any,
      $body$: $body$ as any,
      $location$,
      $isTop$,
      $run$: (script: string) => {
        const runInEnv = new Function(`with(this){${script}}`);
        runInEnv.apply($window$);
      },
    };

    if (debug) {
      const winType = $isTop$ ? 'top' : 'iframe';
      logWorker(
        `Created ${winType} window ${normalizedWinId($winId$)} environment (${$winId$})`,
        $winId$
      );
    }
  }

  webWorkerCtx.$postMessage$([WorkerMessageType.InitializeNextScript, $winId$]);
};

export const getEnv = (instance: { [WinIdKey]: number }) => environments[instance[WinIdKey]];

export const getEnvWindow = (instance: { [WinIdKey]: number }) => getEnv(instance).$window$;
