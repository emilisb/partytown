import { debug, getConstructorName, isValidMemberName, logMain, noop } from '../utils';
import { InterfaceType, InterfaceInfo, InterfaceMember, InitWebWorkerData } from '../types';

export const readMainPlatform = (win: any) => {
  const doc = win.document;
  const $config$ = win.partytown || {};
  const $libPath$ = ($config$.lib || '/~partytown/') + (debug ? 'debug/' : '');

  const initWebWorkerData: InitWebWorkerData = {
    $config$,
    $libPath$: new URL($libPath$, win.location + '') + '',
    $interfaces$: readMainInterfaces(win, doc),
  };

  if (debug) {
  }

  return initWebWorkerData;
};

const readMainInterfaces = (win: any, doc: Document) => {
  const startTime = debug ? performance.now() : 0;

  const docImpl = doc.implementation.createHTMLDocument();
  const textNode = docImpl.createTextNode('');
  const comment = docImpl.createComment('');
  const frag = docImpl.createDocumentFragment();
  const elm = docImpl.createElement('i');
  const svg = docImpl.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const canvas = docImpl.createElement('canvas');
  const canvasRenderingContext2D = canvas.getContext('2d');
  const mutationObserver = new MutationObserver(noop);
  const resizeObserver = new ResizeObserver(noop);

  // get all HTML*Element constructors on window
  // and create each element to get their implementation
  const elms = Object.getOwnPropertyNames(win)
    .filter((c) => /^HTML.+Element$/.test(c))
    .map((htmlCstrName) => {
      const htmlTagName = getHtmlTagNameFromConstructor(htmlCstrName);
      return docImpl.createElement(htmlTagName);
    });

  const impls: any[] = [
    win.localStorage,
    win.history,
    win.screen,

    mutationObserver,
    resizeObserver,

    textNode,
    comment,
    frag,
    elm,
    elm.attributes,
    elm.classList,
    elm.dataset,
    elm.style,
    svg,
    docImpl,
    docImpl.doctype!,
    canvasRenderingContext2D!,
    ...elms,
  ].map((impl) => {
    const cstrName = impl.constructor.name;
    const CstrPrototype = win[cstrName].prototype;
    return [cstrName, CstrPrototype, impl];
  });

  const interfaces: InterfaceInfo[] = [
    readImplentation('Window', win),
    readImplentation('Node', textNode)
  ];

  impls.map(([cstrName, CstrPrototype, impl]) =>
    readOwnImplentation(interfaces, cstrName, CstrPrototype, impl)
  );

  if (debug) {
    logMain(
      `Read ${interfaces.length} interfaces in ${(performance.now() - startTime).toFixed(1)}ms`
    );
  }

  return interfaces;
};

const readImplentation = ( cstrName: string, impl:any) => {
  const interfaceMembers: InterfaceMember[] = [];
  const interfaceInfo: InterfaceInfo = [cstrName, 'Object', interfaceMembers];
  for (const memberName in impl) {
    readImplentationMember(interfaceMembers, impl, memberName);
  }
  return interfaceInfo
}

const readOwnImplentation = (
  interfaces: InterfaceInfo[],
  cstrName: string,
  CstrPrototype: any,
  impl: any
) => {
  if (cstrName !== 'Object' && !interfaces.some((i) => i[0] === cstrName)) {
    const SuperCstr = Object.getPrototypeOf(CstrPrototype);
    const superCstrName = SuperCstr.constructor.name;
    const interfaceMembers: InterfaceMember[] = [];

    readOwnImplentation(interfaces, superCstrName, SuperCstr, impl);

    Object.keys(Object.getOwnPropertyDescriptors(CstrPrototype)).map((memberName) =>
      readImplentationMember(interfaceMembers, impl, memberName)
    );

    const interfaceInfo: InterfaceInfo = [
      cstrName,
      superCstrName,
      interfaceMembers,
      (impl as Node).nodeName,
    ];

    interfaces.push(interfaceInfo);
  }
};

const readImplentationMember = (
  interfaceMembers: InterfaceMember[],
  implementation: any,
  memberName: string
) => {
  if (isValidMemberName(memberName)) {
    const value = implementation[memberName];
    const memberType = typeof value;

    if (memberType === 'function') {
      interfaceMembers.push([memberName, InterfaceType.Function]);
    } else if (memberType === 'object' && value != null) {
      if (value.nodeType) {
        interfaceMembers.push([memberName, value.nodeType]);
      } else {
        interfaceMembers.push([memberName, getConstructorName(value)]);
      }
    } else if (memberType !== 'symbol') {
      // everything else that's not a symbol
      if (memberName.toUpperCase() === memberName) {
        // static property, let's get its value
        interfaceMembers.push([memberName, InterfaceType.Property, value]);
      } else {
        interfaceMembers.push([memberName, InterfaceType.Property]);
      }
    }
  }
};

const htmlConstructorToTagMap: { [key: string]: string } = {
  Anchor: 'A',
  DList: 'DL',
  Image: 'IMG',
  OList: 'OL',
  Paragraph: 'P',
  TableCaption: 'CAPTION',
  TableCell: 'TD',
  TableCol: 'COLGROUP',
  TableRow: 'TR',
  TableSection: 'TBODY',
  UList: 'UL',
};

const getHtmlTagNameFromConstructor = (t: string) => {
  t = t.substr(4).replace('Element', '');
  return htmlConstructorToTagMap[t] || t;
};
