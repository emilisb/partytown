import { debug, logMain, PT_EXTERNAL_WORKER_SET, PT_IFRAME_APPENDED } from '../utils';
import { getAndSetInstanceId } from './main-instances';
import { mainAccessHandler } from './main-access-handler';
import {
  MainWindow,
  MessageFromWorkerToSandbox,
  MessengerRequestCallback,
  PartytownWebWorker,
  WorkerMessageType,
} from '../types';
import { onMessageFromWebWorker } from './on-messenge-from-worker';
import { registerWindow } from './main-register-window';
import syncCreateMessenger from '@sync-create-messenger';
import WebWorkerUrl from '@web-worker-url';

export const initSandbox = async (sandboxWindow: any) => {
  let worker: PartytownWebWorker;

  const mainWindow: MainWindow = sandboxWindow.parent;
  const useExternalWorker = mainWindow.partytown?.useExternalWorker ?? false;

  const initWorker = async () => {
    const newWorker = await createWebWorker(mainWindow, useExternalWorker);

    newWorker.onmessage = (ev: MessageEvent<MessageFromWorkerToSandbox>) =>
      onMessageFromWebWorker(newWorker, mainWindow, ev.data);

    if (debug) {
      logMain(`Created web worker`);
      newWorker.onerror = (ev) => console.error(`Web Worker Error`, ev);
    }

    if (useExternalWorker) {
      newWorker.postMessage([WorkerMessageType.InitializedSandbox]);
    }

    return newWorker;
  };

  if (useExternalWorker) {
    mainWindow.addEventListener(PT_EXTERNAL_WORKER_SET, async () => {
      worker = await initWorker();
    });
  }

  const receiveMessage: MessengerRequestCallback = (accessReq, responseCallback) =>
    mainAccessHandler(worker, accessReq).then(responseCallback);

  const success = await syncCreateMessenger(sandboxWindow, receiveMessage);

  if (success) {
    worker = await initWorker();

    mainWindow.addEventListener<any>(PT_IFRAME_APPENDED, (ev: CustomEvent) => {
      const win: MainWindow = ev.detail;
      const winId = getAndSetInstanceId(win.frameElement);
      registerWindow(worker, winId, win);
    });
  }
};

const createWebWorker = async (
  mainWindow: MainWindow,
  useExternalWorker: boolean
): Promise<PartytownWebWorker> => {
  if (useExternalWorker) {
    return getExternalWebWorker(mainWindow);
  }

  return createNewWebWorker();
};

const createNewWebWorker = (): PartytownWebWorker => {
  return new Worker(WebWorkerUrl, { name: `Partytown 🎉` });
};

const getExternalWebWorker = async (mainWindow: MainWindow): Promise<PartytownWebWorker> => {
  if (mainWindow._ptWorker) {
    return mainWindow._ptWorker;
  }

  return new Promise<PartytownWebWorker>((resolve, reject) => {
    mainWindow.addEventListener(
      PT_EXTERNAL_WORKER_SET,
      () => {
        if (mainWindow._ptWorker) {
          resolve(mainWindow._ptWorker);
        } else {
          reject(new Error('Worker not set'));
        }
      },
      { once: true }
    );
  });
};
