import { debug, logWorker, normalizedWinId } from '../utils';
import { environments, webWorkerCtx, WinIdKey } from './worker-constants';
import { InitializeEnvironmentData, WorkerMessageType } from '../types';
import { Window } from './worker-window';

export const createEnvironment = ({ $winId$, $parentWinId$, $url$ }: InitializeEnvironmentData) => {
  if (environments[$winId$]) {
    // this environment (iframe) is already initialized
    environments[$winId$].$location$.href = $url$;
  } else {
    // create a simulated global environment for this window
    new Window($winId$, $parentWinId$, $url$);

    if (debug) {
      const winType = $winId$ === $parentWinId$ ? 'top' : 'iframe';
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
