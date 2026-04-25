import { Request } from 'express';

export const cookieExtractor = (req: Request, item: string): string | null => {
  // console.log(`Extracting cookie: ${item}`);
  // console.log(`from: ${JSON.stringify(req.cookies)}`);
  if (req && req.cookies) {
    // console.log(`Found cookie: ${item} => ${req.cookies[item]}`);
    return (req.cookies[item] as string) || null;
  }
  return null;
};
