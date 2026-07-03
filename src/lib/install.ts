export const INSTALL_DISMISS_KEY = "tapas-install-dismissed";
export const INSTALL_REQUEST_EVENT = "tapas-install-request";

export function isStandaloneApp() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes this only at runtime.
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function requestInstallPrompt() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(INSTALL_REQUEST_EVENT));
}

export function resetInstallCardsForNextLogin() {
  if (typeof window === "undefined") return;
  Object.keys(window.sessionStorage)
    .filter((key) => key.startsWith("tapas-install-card-dismissed:home") || key.startsWith("tapas-install-card-dismissed:profile"))
    .forEach((key) => window.sessionStorage.removeItem(key));
}
