export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showResponseCompleteNotification(title="Clarix", showMessage) {
  console.log("Notification function called");
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  
  const isVisible = document.visibilityState === "visible";

  if (isVisible) {
    showMessage?.({
      type: "info",
      text: `Response ready for "${title}"`,
    });
    return;
  }

  new Notification("Response ready", {
    body: `Clarix has finished responding to "${title}"`,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  });
}