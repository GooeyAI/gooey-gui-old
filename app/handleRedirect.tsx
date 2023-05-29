const redirectStatuses = [301, 302, 303, 307, 308];

export function handleRedirectResponse({
  request,
  response,
}: {
  request: Request;
  response: Response;
  basePath?: string;
}): URL | null {
  // if the response is not a redirect, return null
  if (!redirectStatuses.includes(response.status)) return null;
  // get the redirect target
  const redirectUrl = new URL(response.headers.get("location") ?? "/");
  const old = redirectUrl.toString();
  console.log("incoming request", request, response);
  // ensure that the redirect is to the same host as the request (i.e. the proxy)
  const requestUrl = new URL(request.url);
  if (redirectUrl.host == requestUrl.host) {
    redirectUrl.host = request.headers.get("host") ?? "";
  }
  console.log(
    "handle redirect",
    request.url,
    "->",
    old,
    "->",
    redirectUrl.toString()
  );
  response.headers.set("location", redirectUrl.toString());
  return redirectUrl;
}
