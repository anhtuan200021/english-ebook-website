// Apply phone typography only on Android; no tracking or stored device data.
if (/\bAndroid\b/i.test(navigator.userAgent)) {
  document.documentElement.classList.add("android-phone");
}
