/**
 * Wraps async Express middleware so rejections reach `next(err)`.
 * @param {(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<unknown>} fn
 */
export function attachAsyncMw(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
