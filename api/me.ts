import { getSessionUser, route, send } from "./_lib.js";

export default route(["GET"], async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return send(res, 401, { error: "Não autenticado" });
  send(res, 200, { username: user.username });
});
