import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import * as geoip from 'geoip-lite';

export interface RequestMetadata {
  ipAddress: string;
  userAgent: string;
  device: string;
  deviceId: string;
  deviceType: string;
  os: string;
  browser: string;
  geoCountry: string | null;
  geoCity: string | null;
  geoLatitude: string | null;
  geoLongitude: string | null;
  isSecure: boolean;
  timeStamp: Date;
}

export function extractRequestMetadata(req: Request): RequestMetadata {
  // parsing the raw user agent data
  const ua = req.headers['user-agent'] || '';
  const parser = new UAParser(ua);
  const uaResult = parser.getResult();

  // console.log({ client: uaResult });
  // console.log({ header: req.headers });
  //   IP Address
  const ipAddress =
    req.ip ||
    (req.headers['x-forward-for'] as string)?.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown';

  const geo = geoip.lookup(ipAddress);

  // Device info
  const deviceCategory = uaResult.device.type || 'desktop';

  const os =
    (Array.isArray(req.headers['sec-ch-ua-platform'])
      ? req.headers['sec-ch-ua-platform'][0]
      : req.headers['sec-ch-ua-platform']) ||
    uaResult.os.name ||
    'unknown';

  const deviceModel =
    [uaResult.device.vendor, uaResult.device.model].filter(Boolean).join(' ') ||
    'unknown';
  const browser = [uaResult.browser.name, uaResult.browser.major]
    .filter(Boolean)
    .join(' ');

  //   Device ID (Sent by the client)
  const deviceId = (req.headers['x-device-id'] as string) || 'unknown';

  // Geo (Injected by cloudeflare, AWS, or Nginx GeoIp module)
  const geoCountry =
    (req.headers['cf-ipcountry'] as string) ||
    (req.headers['cloudefront-viewer-country'] as string) ||
    (req.header['x-geo-country'] as string) ||
    geo?.country ||
    null;

  const geoCity =
    (req.headers['cf-ipcity'] as string) ||
    (req.headers['cloudefront-viewer-city'] as string) ||
    (req.headers['x-geo-city'] as string) ||
    geo?.city ||
    null;

  const geoLongitude =
    (req.headers['cf-iplongitude'] as string) ||
    (req.headers['cloudefront-viewer-longitude'] as string) ||
    (req.headers['x-geo-longitude'] as string) ||
    geo?.ll?.[1]?.toString() ||
    null;

  const geoLatitude =
    (req.headers['cf-iplatitude'] as string) ||
    (req.headers['cloudefront-viewer-latitude'] as string) ||
    (req.headers['x-geo-latitude'] as string) ||
    geo?.ll?.[0]?.toString() ||
    null;

  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const currentTime = new Date();

  const requestMetadata: RequestMetadata = {
    ipAddress,
    userAgent: ua,
    device: deviceModel,
    os,
    deviceId,
    deviceType: deviceCategory,
    browser,
    geoCountry,
    geoCity,
    geoLatitude,
    geoLongitude,
    isSecure,
    timeStamp: currentTime,
  };

  // console.log({ requestMetadata });
  return requestMetadata;
}
