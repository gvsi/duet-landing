export async function onRequest(context) {
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.delete('server');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
