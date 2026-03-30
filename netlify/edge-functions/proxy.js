export default async (request, context) => {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  const action = url.searchParams.get('action');

  // ==========================================
  // 分支 1：获取当前边缘服务器的出口 IP
  // 触发条件：请求中携带 ?action=get_ip
  // ==========================================
  if (action === 'get_ip') {
    try {
      // 请求 ipify 接口获取 worker 的真实出口 IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      return new Response(JSON.stringify({ 
        success: true, 
        edge_ip: ipData.ip,
        platform: 'Netlify Edge'
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // ==========================================
  // 分支 2：原有的代理转发逻辑
  // 触发条件：请求中携带 ?url=...
  // ==========================================
  if (!targetUrl) {
    return new Response('请提供目标 URL ?url=... 或使用 ?action=get_ip 获取节点IP', { status: 400 });
  }

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  // 剥离代理特征头，防止目标网站识别
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
