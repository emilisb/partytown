import { len } from '../utils';
import type { WorkerProxy } from './worker-proxy-constructor';

export class NodeList {
  private _: WorkerProxy[];

  constructor(nodes: WorkerProxy[]) {
    (this._ = nodes).map((node, index) => ((this as any)[index] = node));
  }
  entries() {
    return this._.entries();
  }
  forEach(cb: (value: WorkerProxy, index: number) => void, thisArg?: any) {
    this._.map(cb, thisArg);
  }
  item(index: number) {
    return (this as any)[index];
  }
  keys() {
    return this._.keys();
  }
  get length() {
    return len(this._);
  }
  values() {
    return this._.values();
  }
  [Symbol.iterator]() {
    return this._[Symbol.iterator]();
  }
}
