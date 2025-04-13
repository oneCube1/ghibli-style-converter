import axios from 'axios';

export default async function handler(req, res) {
  // 设置响应头，告诉浏览器不要等待结果
  res.setHeader('Connection', 'close');
  
  // 从环境变量获取API密钥
  const apiKey = process.env.YUNWU_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API密钥未配置' });
  }

  // 将请求转发到yunwu.ai，但不等待完整响应
  const forwardRequest = axios.post("https://yunwu.ai/v1/chat/completions", req.body, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  // 立即向客户端返回响应，表示请求已开始处理
  res.status(200).json({ status: 'processing' });
  
  // 让axios请求在后台继续执行，不会阻塞serverless函数
  // 这一步不会影响API响应
  forwardRequest.catch(error => {
    console.error('API请求失败:', error);
  });
}

// 从响应内容中提取图片URL
function extractImageUrl(content) {
  // 尝试匹配Markdown格式的图片链接
  const markdownPattern = /!\[.*?\]\((https?:\/\/[^)]+)\)/;
  const markdownMatch = content.match(markdownPattern);
  
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1];
  }
  
  // 尝试匹配直接的URL链接
  const urlPattern = /(https?:\/\/\S+\.(jpg|jpeg|png|gif))/i;
  const urlMatch = content.match(urlPattern);
  
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  
  return null;
} 