const express = require('express');
const app = express();

// 匹配所有路由和请求方法
app.all('/*', async (req, res) => {
    const targetUrl = req.query.url;
    const action = req.query.action;

    // ==========================================
    // 分支 1：获取 Koyeb 节点的真实出口 IP
    // ==========================================
    if (action === 'get_ip') {
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            return res.json({
                success: true,
                edge_ip: ipData.ip,
                platform: 'Koyeb (Frankfurt/Washington)'
            });
        } catch (e) {
            return res.status(500).json({ success: false, error: e.message });
        }
    }

    // ==========================================
    // 分支 2：代理 B站 请求
    // ==========================================
    if (!targetUrl) {
        return res.status(400).send('请提供目标 URL ?url=... 或使用 ?action=get_ip 获取节点IP');
    }

    try {
        const headers = { ...req.headers };
        
        // 🚨 核心防风控：抹除 Koyeb 的默认代理头和本机 Host
        delete headers['host'];
        delete headers['x-forwarded-for'];
        delete headers['x-real-ip'];
        delete headers['x-koyeb-ray-id'];

        // 🚨 核心防风控：强制伪装 Host 为目标网站
        headers['Host'] = new URL(targetUrl).hostname;

        const options = {
            method: req.method,
            headers: headers,
            // GET 和 HEAD 请求不能有 body
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body
        };

        const response = await fetch(targetUrl, options);
        
        // 透传目标网站的响应头给你的 Python 脚本
        response.headers.forEach((value, name) => {
            res.setHeader(name, value);
        });

        // 返回状态码和二进制数据流
        res.status(response.status);
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

    } catch (e) {
        res.status(500).send('请求目标地址失败: ' + e.message);
    }
});

// Koyeb 默认会将服务暴露在 8000 端口，这里通过 process.env.PORT 动态获取
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Koyeb proxy is running on port ${PORT}`);
});
