export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'fdo-theme';

/**
 * Runs in <head> before first paint: applies a saved theme so a Day user never
 * sees a Night flash. Night (the `data-theme` default on <html>) otherwise.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;
