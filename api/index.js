// 强制使用 Edge 边缘运行环境
export const config = { runtime: 'edge' };

export default async function handler(request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('缺少目标 URL', { status: 400 });
  }

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  modifiedRequest.headers.delete('x-forwarded-for');
  modifiedRequest.headers.delete('x-vercel-ip');
  modifiedRequest.headers.delete('x-vercel-forwarded-for');

  try {
    return await fetch(modifiedRequest);
  } catch (e) {
    return new Response('Vercel 请求目标失败: ' + e.message, { status: 500 });
  }
}
