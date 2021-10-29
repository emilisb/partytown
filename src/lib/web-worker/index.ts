import { callWorkerRefHandler } from './worker-serialization';
import { createEnvironment } from './worker-environment';
import { debug, logWorker, normalizedWinId } from '../utils';
import { environments, webWorkerCtx } from './worker-constants';
import { ForwardMainTriggerData, MessageFromSandboxToWorker, WorkerMessageType } from '../types';
import { initNextScriptsInWebWorker } from './worker-exec';
import { initWebWorker } from './init-web-worker';
import { workerForwardedTriggerHandle } from './worker-forwarded-trigger';

const queuedEvents: MessageEvent<MessageFromSandboxToWorker>[] = [];

const receiveMessageFromSandboxToWorker = (ev: MessageEvent<MessageFromSandboxToWorker>) => {
  const msg = ev.data;
  const msgType = msg[0];

  if (webWorkerCtx.$isInitialized$) {
    if (msgType === WorkerMessageType.InitializeNextScript) {
      // message from main to web worker that it should initialize the next script
      initNextScriptsInWebWorker(msg[1]);
    } else if (msgType === WorkerMessageType.RefHandlerCallback) {
      // main has called a worker ref handler
      callWorkerRefHandler(msg[1]);
    } else if (msgType === WorkerMessageType.ForwardMainTrigger) {
      workerForwardedTriggerHandle(msg[1] as ForwardMainTriggerData);
    } else if (msgType === WorkerMessageType.InitializeEnvironment) {
      createEnvironment(msg[1]);
    } else if (msgType === WorkerMessageType.InitializedEnvironment) {
      environments[msg[1]].$isInitialized$ = 1;

      if (debug) {
        const winId = msg[1];
        const env = environments[winId];
        const winType = env.$isTop$ ? 'top' : 'iframe';
        logWorker(
          `Initialized ${winType} window ${normalizedWinId(winId)} environment (${winId}) 🎉`,
          winId
        );
      }
    }
  } else if (msgType === WorkerMessageType.MainDataResponseToWorker) {
    // received initial main data
    // merge it into the web worker context object
    Object.assign(webWorkerCtx, msg[1]);
    // we're not done yet, let's also request all the HTML constructor data too
    // splitting out initialization into multiple postMessages so it's not a long running task
    postMessage([WorkerMessageType.NodeConstructorsRequestFromWorker]);
  } else if (msgType === WorkerMessageType.NodeConstructorsResponseToWorker) {
    // initialize the web worker with the received the main data
    initWebWorker(msg[1]);
    // send to the main thread that the web worker has been initialized
    webWorkerCtx.$postMessage$([WorkerMessageType.InitializedWebWorker]);

    // replay any of the queued events we already have
    // before the web worker was initialized
    if (debug && queuedEvents.length) {
      logWorker(`Queued ready messages: ${queuedEvents.length}`);
    }
    queuedEvents.slice().forEach(receiveMessageFromSandboxToWorker);
    queuedEvents.length = 0;
  } else {
    // the web worker hasn't finished initializing yet, let's store
    // this event so it can be re-ran after initialization
    queuedEvents.push(ev);
  }
};

self.onmessage = receiveMessageFromSandboxToWorker;

postMessage([WorkerMessageType.MainDataRequestFromWorker]);
