// import { debug, getConstructorName, isValidMemberName, logMain, noop } from '../utils';
// import { InitWebWorkerData, InterfaceInfo, InterfaceType, MainWindow } from '../types';

// export const readMainInterfaces = (win: MainWindow) => {
//   // web worker has requested data from the main thread
//   const doc = win.document;
//   const $config$ = win.partytown || {};
//   const $libPath$ = ($config$.lib || '/~partytown/') + (debug ? 'debug/' : '');
//   const $url$ = win.location + '';

//   const docImpl = doc.implementation.createHTMLDocument();
//   const elm = docImpl.createElement('i');
//   const canvas = docImpl.createElement('canvas');
//   const canvasRenderingContext2D = canvas.getContext('2d');

//   const implementations: MainImplementation[] = [
//     [InterfaceType.Window, win],
//     [InterfaceType.CSSStyleDeclaration, elm.style],
//     [InterfaceType.Document, docImpl],
//     [InterfaceType.DocumentFragmentNode, docImpl.createDocumentFragment()],
//     [InterfaceType.DOMStringMap, elm.dataset],
//     [InterfaceType.DOMTokenList, elm.classList],
//     [InterfaceType.Element, elm],
//     [InterfaceType.CanvasRenderingContext2D, canvasRenderingContext2D],
//     [InterfaceType.History, win.history],
//     [InterfaceType.Location, win.location],
//     [InterfaceType.MutationObserver, new MutationObserver(noop)],
//     [InterfaceType.NamedNodeMap, elm.attributes],
//     [InterfaceType.ResizeObserver, new ResizeObserver(noop)],
//     [InterfaceType.Screen, win.screen],
//     [InterfaceType.Storage, win.localStorage],
//     [InterfaceType.TextNode, docImpl.createTextNode('')],
//   ].map((i) => [...i, getConstructorName(i[1] as any)]) as any;

//   const initWebWorkerData: InitWebWorkerData = {
//     $config$,
//     $libPath$: new URL($libPath$, $url$) + '',
//     $interfaces$: implementations.map(([interfaceType, impl, cstrName]) => {
//       let memberName: string;
//       let value: any;
//       let type: string;
//       let objCstrName: string;
//       let objImpl: MainImplementation | undefined;
//       let interfaceInfo: any = [interfaceType, cstrName, {}];

//       // for (memberName in impl) {
//       //   if (isValidMemberName(memberName)) {
//       //     value = impl[memberName];
//       //     type = typeof value;
//       //     if (type === 'function') {
//       //       interfaceInfo[2][memberName] = InterfaceType.Function;
//       //     } else if (type === 'object') {
//       //       objCstrName = getConstructorName(value);
//       //       objImpl = implementations.find((i) => i[2] === objCstrName);
//       //       if (objImpl) {
//       //         // this object's constructor is one of the interfaces we care about
//       //         interfaceInfo[2][memberName] = objImpl[0];
//       //       }
//       //     }
//       //   }
//       // }

//       return interfaceInfo;
//     }),
//   };

//   if (debug) {
//     logMain(`Read window interfaces: ${initWebWorkerData.$interfaces$.length}`);
//   }

//   return initWebWorkerData;
// };

// type MainImplementation = [InterfaceType, any, string];
