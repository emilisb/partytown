import { initSandbox } from './init-sandbox';

if (document.domain === 'editor.wix.com') {
  document.domain = 'wix.com';
}

initSandbox(window);
