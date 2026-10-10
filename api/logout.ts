import { clearSessionCookie, route, send } from "./_lib.js";

export default route(["POST"], async (_req, res) => {
  clearSessionCookie(res);
  send(res, 200, { ok: true });
});
