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
  // ensure that the redirect is to the same host as the request (i.e. the proxy)
  const requestUrl = new URL(request.url);
  if (redirectUrl.host == requestUrl.host) {
    redirectUrl.host = request.headers.get("host") ?? "";
  }
  response.headers.set("location", redirectUrl.toString());
  return redirectUrl;
}
