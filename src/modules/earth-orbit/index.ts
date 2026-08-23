import { EarthOrbitModule } from './EarthOrbitModule';

const mounted = new Map<HTMLElement, EarthOrbitModule>();

function syncModules(): void {
  document.querySelectorAll<HTMLElement>('[data-earth-orbit-v01]').forEach((host) => {
    if (mounted.has(host)) return;
    const module = new EarthOrbitModule(host);
    mounted.set(host, module);
    void module.init().catch((error: unknown) => {
      console.error('Earth Orbit V0.1 failed to initialize.', error);
      host.dataset.orbitError = 'true';
      const loading = host.querySelector<HTMLElement>('[data-orbit-loading]');
      if (loading) {
        loading.hidden = false;
        loading.textContent = '互動場景載入失敗，請重新整理頁面。';
      }
    });
  });

  mounted.forEach((module, host) => {
    if (host.isConnected) return;
    module.destroy();
    mounted.delete(host);
  });
}

const observer = new MutationObserver(syncModules);
observer.observe(document.documentElement, { childList: true, subtree: true });
syncModules();
