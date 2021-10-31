// import type { InterfaceType } from '../types';
// import { InstanceIdKey, InterfaceTypeKey, NodeNameKey, WinIdKey } from './worker-constants';
// import { proxy } from './worker-proxy__OLD';

// export class WorkerProxy__OLD {
//   [WinIdKey]: number;
//   [InstanceIdKey]: number;
//   [InterfaceTypeKey]: InterfaceType;
//   [NodeNameKey]: string | undefined;

//   constructor(interfaceType: InterfaceType, instanceId: number, winId?: number, nodeName?: string) {
//     this[InterfaceTypeKey] = interfaceType;
//     this[WinIdKey] = winId!;
//     this[InstanceIdKey] = instanceId!;
//     this[NodeNameKey] = nodeName;

//     // return proxy((this[InterfaceTypeKey] = interfaceType), this, []);
//   }
// }
