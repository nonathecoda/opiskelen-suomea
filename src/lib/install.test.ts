import { describe, expect, it } from "vitest";
import { phoneOf } from "./install";

const IPHONE_SAFARI_26 =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const IPHONE_SAFARI_18 =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.0.0 Mobile/15E148 Safari/604.1";
const IPHONE_FIREFOX = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/143.0 Mobile/15E148 Safari/605.1.15";
const IPHONE_EDGE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/140.0 Mobile/15E148 Safari/605.1.15";
const IPHONE_INSTAGRAM = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0";
const ANDROID_CHROME = "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
const ANDROID_SAMSUNG = "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36";
const ANDROID_FIREFOX = "Mozilla/5.0 (Android 15; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0";
const ANDROID_EDGE = "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 EdgA/140.0";
const ANDROID_WEBVIEW = "Mozilla/5.0 (Linux; Android 15; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/140.0.0.0 Mobile Safari/537.36";
const IPAD_AS_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15";
const MAC = IPAD_AS_MAC;
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

describe("install", () => {
  it("tells each browser on an iPhone", () => {
    expect(phoneOf(IPHONE_SAFARI_26, 5)).toEqual({ device: "ios", browser: "safari", ios26: true });
    expect(phoneOf(IPHONE_SAFARI_18, 5)).toEqual({ device: "ios", browser: "safari", ios26: false });
    expect(phoneOf(IPHONE_CHROME, 5)?.browser).toBe("chrome");
    expect(phoneOf(IPHONE_FIREFOX, 5)?.browser).toBe("firefox");
    expect(phoneOf(IPHONE_EDGE, 5)?.browser).toBe("edge");
  });
  it("tells each browser on Android", () => {
    expect(phoneOf(ANDROID_CHROME, 5)).toEqual({ device: "android", browser: "chrome", ios26: false });
    expect(phoneOf(ANDROID_SAMSUNG, 5)?.browser).toBe("samsung");
    expect(phoneOf(ANDROID_FIREFOX, 5)?.browser).toBe("firefox");
    expect(phoneOf(ANDROID_EDGE, 5)?.browser).toBe("edge");
  });
  it("knows an iPad that says it is a Mac", () => {
    expect(phoneOf(IPAD_AS_MAC, 5)?.device).toBe("ios");
  });
  it("knows a page inside another app", () => {
    expect(phoneOf(IPHONE_INSTAGRAM, 5)?.browser).toBe("in-app");
    expect(phoneOf(ANDROID_WEBVIEW, 5)?.browser).toBe("in-app");
  });
  it("finds no phone on a computer", () => {
    expect(phoneOf(MAC, 0)).toBeNull();
    expect(phoneOf(WINDOWS, 0)).toBeNull();
  });
});
