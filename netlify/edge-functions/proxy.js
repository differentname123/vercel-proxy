export default async (request, context) => {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('请提供目标 URL ?url=...', { status: 400 });
  }

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  // 剥离 Netlify 代理特征头，防止 B站 识别出真实 IP 或代理行为
  modifiedRequest.headers.delete('x-nf-client-connection-ip');
  modifiedRequest.headers.delete('x-forwarded-for');
  modifiedRequest.headers.delete('x-real-ip');

  try {
    const response = await fetch(modifiedRequest);
    return response;
  } catch (e) {
    return new Response('请求目标地址失败: ' + e.message, { status: 500 });
  }
};
