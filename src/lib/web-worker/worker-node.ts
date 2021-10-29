import { callMethod, getter, setter, sync } from './worker-proxy';
import { getEnv } from './worker-environment';
import { getInstanceStateValue } from './worker-state';
import { insertIframe, runScriptContent } from './worker-exec';
import {
  InstanceIdKey,
  InterfaceTypeKey,
  NodeNameKey,
  webWorkerCtx,
  WinIdKey,
} from './worker-constants';
import { InterfaceType, NodeName, StateProp, WorkerMessageType } from '../types';
// import type { HTMLDocument } from './worker-document';
import { SCRIPT_TYPE, SCRIPT_TYPE_EXEC } from '../utils';
import type { WorkerProxy } from './worker-proxy-constructor';

// export const NodeProperties: PropertyDescriptorMap & ThisType<WorkerProxy> = {
//   href: {
//     get() {
//       // many sccripts just look for "href" on a node
//       // putting this here to prevent unnecessary main reads
//     },
//   },
//   nodeName: {
//     get() {
//       return this[NodeNameKey];
//     },
//   },
//   nodeType: {
//     get() {
//       return this[InterfaceTypeKey];
//     },
//   },
//   ownerDocument: {
//     get() {
//       return getEnv(this).$document$;
//     },
//   },
// };

// export const NodeMethods: ThisType<WorkerProxy> = {
//   appendChild(newNode: WorkerProxy) {
//     return insertBefore(this, newNode, null);
//   },
//   insertBefore(newNode: WorkerProxy, refNode: WorkerProxy | null) {
//     return insertBefore(this, newNode, refNode);
//   },
// };

// const insertBefore = (instance: WorkerProxy, newNode: WorkerProxy, refNode: WorkerProxy | null) => {
//   // ensure the node being added to the window's document
//   // is given the same winId as the window it's being added to
//   const winId = (newNode[WinIdKey] = instance[WinIdKey]);
//   const instanceId = newNode[InstanceIdKey];
//   const nodeName = newNode[NodeNameKey];
//   const isScript = nodeName === NodeName.Script;
//   const isIFrame = nodeName === NodeName.IFrame;

//   if (isScript) {
//     const scriptContent = getInstanceStateValue<string>(newNode, StateProp.innerHTML);

//     if (scriptContent) {
//       const errorMsg = runScriptContent(getEnv(newNode), instanceId, scriptContent, winId);
//       const datasetType = errorMsg ? 'pterror' : 'ptid';
//       const datasetValue = errorMsg || instanceId;

//       setter(newNode, ['type'], SCRIPT_TYPE + SCRIPT_TYPE_EXEC);
//       setter(newNode, ['dataset', datasetType], datasetValue);
//       setter(newNode, ['innerHTML'], scriptContent);
//     }
//   }

//   callMethod(instance, ['insertBefore'], [newNode, refNode]);

//   if (isIFrame) {
//     insertIframe(newNode);
//   }
//   if (isScript) {
//     sync();
//     webWorkerCtx.$postMessage$([WorkerMessageType.InitializeNextScript, winId]);
//   }

//   return newNode;
// };

export class Node {
  [WinIdKey]: number;
  [InstanceIdKey]: number;
  [InterfaceTypeKey]: InterfaceType;
  [NodeNameKey]: string | undefined;

  constructor(interfaceType: InterfaceType, instanceId: number, winId?: number, nodeName?: string) {
    this[InterfaceTypeKey] = interfaceType;
    this[WinIdKey] = winId!;
    this[InstanceIdKey] = instanceId!;
    this[NodeNameKey] = nodeName;

    // return proxy((this[InterfaceTypeKey] = interfaceType), this, []);
  }

  appendChild(node: Node) {
    return this.insertBefore(node, null);
  }

  get href() {
    // some scripts are just using node.href and looping up the tree
    // just adding this prop to all nodes to avoid unnecessary main access
    return;
  }
  set href(_: any) {}

  insertBefore(newNode: Node, referenceNode: Node | null) {
    // ensure the node being added to the window's document
    // is given the same winId as the window it's being added to
    const winId = (newNode[WinIdKey] = this[WinIdKey]);
    const instanceId = newNode[InstanceIdKey];
    const nodeName = newNode[NodeNameKey];
    const isScript = nodeName === NodeName.Script;
    const isIFrame = nodeName === NodeName.IFrame;

    if (isScript) {
      const scriptContent = getInstanceStateValue<string>(newNode, StateProp.innerHTML);

      if (scriptContent) {
        const errorMsg = runScriptContent(getEnv(newNode), instanceId, scriptContent, winId);
        const datasetType = errorMsg ? 'pterror' : 'ptid';
        const datasetValue = errorMsg || instanceId;

        setter(newNode, ['type'], SCRIPT_TYPE + SCRIPT_TYPE_EXEC);
        setter(newNode, ['dataset', datasetType], datasetValue);
        setter(newNode, ['innerHTML'], scriptContent);
      }
    }

    callMethod(this, ['insertBefore'], [newNode, referenceNode]);

    if (isIFrame) {
      insertIframe(newNode);
    }
    if (isScript) {
      sync();
      webWorkerCtx.$postMessage$([WorkerMessageType.InitializeNextScript, winId]);
    }

    return newNode;
  }

  get nodeName() {
    return this[NodeNameKey];
  }

  get nodeType() {
    return this[InterfaceTypeKey];
  }

  get ownerDocument(): HTMLDocument {
    return getEnv(this).$document$;
  }
}
