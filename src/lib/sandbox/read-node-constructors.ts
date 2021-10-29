import { InterfaceType, NodeConstructor, NodeConstructorMember } from '../types';
import { debug, getConstructorName, isValidMemberName, logMain } from '../utils';

export const readNodeConstructors = (win: any) => {
  // get all HTML*Element constructors on window
  const htmlCstrNames = Object.getOwnPropertyNames(win).filter((c) => /^HTML.+Element$/.test(c));

  const cstrNames =
    `Node,CharacterData,Text,Comment,DocumentFragment,Element,HTMLElement,SVGElement,Document,HTMLDocument,DocumentType,HTMLMediaElement`
      .split(',')
      .concat(htmlCstrNames);

  const cstrs: NodeConstructor[] = [];
  const readCstrs = new Set<string>();

  const doc: Document = win.document;
  const docImpl = doc.implementation.createHTMLDocument();

  cstrNames.map((cstrName, index) => {
    if (!readCstrs.has(cstrName)) {
      readCstrs.add(cstrName);

      const CstrPrototype = win[cstrName].prototype;
      const superCstrName = Object.getPrototypeOf(CstrPrototype).constructor.name;
      const htmlTagName = getHtmlTagNameFromConstructor(cstrName);

      const implementation = getDomImplementation(docImpl, index, htmlTagName);

      const members: NodeConstructorMember[] = [];

      if (index === 0) {
        // get all members on Node
        for (const memberName in implementation) {
          readMember(members, implementation, memberName);
        }
      } else {
        // only get this constructor's prototype members
        Object.keys(Object.getOwnPropertyDescriptors(CstrPrototype)).map((memberName) =>
          readMember(members, implementation, memberName)
        );
      }

      cstrs.push([cstrName, superCstrName, (implementation as Node).nodeName, members]);
    }
  });

  if (debug) {
    logMain(`Read Node Constructors: ${cstrs.length}`);
  }

  return cstrs;
};

const readMember = (members: NodeConstructorMember[], implementation: any, memberName: string) => {
  if (isValidMemberName(memberName)) {
    const value = implementation[memberName];
    const memberType = typeof value;

    if (memberType === 'function') {
      members.push([memberName, InterfaceType.Function]);
    } else if (memberType === 'object' && value != null) {
      if (value.nodeType) {
        members.push([memberName, value.nodeType]);
      } else {
        members.push([memberName, getConstructorName(value)]);
      }
    } else if (memberType !== 'symbol') {
      // everything else that's not a symbol
      if (memberName.toUpperCase() === memberName) {
        // static property, let's get its value
        members.push([memberName, InterfaceType.Property, value]);
      } else {
        members.push([memberName, InterfaceType.Property]);
      }
    }
  }
};

const getDomImplementation = (
  docImpl: Document,
  cstrIndex: number,
  tagName: string | undefined
): any => {
  if (cstrIndex < 3) {
    // Node / Text
    return docImpl.createTextNode('');
  } else if (cstrIndex === 3) {
    // Comment
    return docImpl.createComment('');
  } else if (cstrIndex === 4) {
    // DocumentFragment
    return docImpl.createDocumentFragment();
  } else if (cstrIndex < 7) {
    // Element / HTMLElement
    return docImpl.head;
  } else if (cstrIndex === 7) {
    // SVGElement
    return docImpl.createElementNS('http://www.w3.org/2000/svg', 'svg');
  } else if (cstrIndex < 10) {
    // Document / HTMLDocument
    return docImpl;
  } else if (cstrIndex === 10) {
    // DocumentType
    return docImpl.doctype;
  } else {
    // create an element from the tag name
    return docImpl.createElement(tagName!);
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
  if (t.startsWith('H')) {
    t = t.substr(4).replace('Element', '');
    return htmlConstructorToTagMap[t] || t;
  }
};
