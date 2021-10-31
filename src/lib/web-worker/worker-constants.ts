import type {
  InterfaceInfo,
  RefHandler,
  StateMap,
  WebWorkerContext,
  WebWorkerEnvironment,
} from '../types';
import type { Node } from './worker-node';

export const WinIdKey = Symbol();
export const InstanceIdKey = Symbol();
export const NodeNameKey = Symbol();
export const ApplyPathKey = Symbol();

export const webWorkerInstances = new Map<number, Node>();
export const webWorkerRefsByRefId: { [refId: number]: RefHandler } = {};
export const webWorkerRefIdsByRef = new WeakMap<RefHandler, number>();
export const nodeConstructors: { [nodeName: string]: typeof Node } = {};

export const webWorkerState: StateMap = {};
export const webWorkerCtx: WebWorkerContext = {} as any;
export const webWorkerInterfaces: InterfaceInfo[] = [];

export const environments: { [winId: number]: WebWorkerEnvironment } = {};

export const cachedDimensions = new Map<string, any>();
export const cachedTree = new Map<string, any>();
