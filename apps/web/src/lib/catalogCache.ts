import { INITIAL_TESTS_CATALOG, INITIAL_PANELS, INITIAL_DOCTORS, TestItem, PanelItem } from './catalogData';
import { apiRequest } from './api';

export type DoctorItem = (typeof INITIAL_DOCTORS)[number];

let cachedTests: TestItem[] = [...INITIAL_TESTS_CATALOG];
let cachedPanels: PanelItem[] = [...INITIAL_PANELS];
let cachedDoctors: DoctorItem[] = [...INITIAL_DOCTORS];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000;

const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try { cb(); } catch {}
  });
}

if (typeof window !== 'undefined') {
  try {
    const rawTests = localStorage.getItem('labryo_cached_tests');
    const rawPanels = localStorage.getItem('labryo_cached_panels');
    const rawDoctors = localStorage.getItem('labryo_cached_doctors');
    if (rawTests) cachedTests = JSON.parse(rawTests);
    if (rawPanels) cachedPanels = JSON.parse(rawPanels);
    if (rawDoctors) cachedDoctors = JSON.parse(rawDoctors);
  } catch {}
}

export const catalogCache = {
  getTests(): TestItem[] { return cachedTests; },
  getPanels(): PanelItem[] { return cachedPanels; },
  getDoctors(): DoctorItem[] { return cachedDoctors; },
  isStale(): boolean { return Date.now() - lastFetchTime > CACHE_TTL_MS; },
  subscribe(callback: () => void): () => void {
    subscribers.add(callback);
    return () => { subscribers.delete(callback); };
  },
  async refresh(force = false): Promise<{ tests: TestItem[]; panels: PanelItem[]; doctors: DoctorItem[] }> {
    if (!force && !catalogCache.isStale() && cachedTests.length > 0) {
      return { tests: cachedTests, panels: cachedPanels, doctors: cachedDoctors };
    }
    try {
      const [testsRes, doctorsRes] = await Promise.all([apiRequest('/tests'), apiRequest('/doctors')]);
      if (testsRes?.tests && Array.isArray(testsRes.tests) && testsRes.tests.length > 0) cachedTests = testsRes.tests;
      if (testsRes?.panels && Array.isArray(testsRes.panels) && testsRes.panels.length > 0) cachedPanels = testsRes.panels;
      if (doctorsRes && Array.isArray(doctorsRes) && doctorsRes.length > 0) cachedDoctors = doctorsRes;
      lastFetchTime = Date.now();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('labryo_cached_tests', JSON.stringify(cachedTests));
          localStorage.setItem('labryo_cached_panels', JSON.stringify(cachedPanels));
          localStorage.setItem('labryo_cached_doctors', JSON.stringify(cachedDoctors));
        } catch {}
      }
      notifySubscribers();
    } catch (err) {
      console.warn('[CatalogCache] Background refresh failed, using cached catalog:', err);
    }
    return { tests: cachedTests, panels: cachedPanels, doctors: cachedDoctors };
  },
  update(tests?: TestItem[], panels?: PanelItem[], doctors?: DoctorItem[]) {
    if (tests && Array.isArray(tests)) cachedTests = tests;
    if (panels && Array.isArray(panels)) cachedPanels = panels;
    if (doctors && Array.isArray(doctors)) cachedDoctors = doctors;
    lastFetchTime = Date.now();
    if (typeof window !== 'undefined') {
      try {
        if (tests) localStorage.setItem('labryo_cached_tests', JSON.stringify(tests));
        if (panels) localStorage.setItem('labryo_cached_panels', JSON.stringify(panels));
        if (doctors) localStorage.setItem('labryo_cached_doctors', JSON.stringify(doctors));
      } catch {}
    }
    notifySubscribers();
  },
  clear() {
    lastFetchTime = 0;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('labryo_cached_tests');
        localStorage.removeItem('labryo_cached_panels');
      } catch {}
    }
  },
};