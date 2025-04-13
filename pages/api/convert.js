import axios from 'axios';

export default async function handler(req, res) {
  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    const { model, messages } = req.body;

    // 确保请求数据完整
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '请求数据不完整' });
    }

    // 从环境变量获取API密钥
    const apiKey = process.env.YUNWU_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API密钥未配置' });
    }

    // 配置API请求
    const payload = {
      model,
      messages,
      stream: false // 不使用流式响应
    };

    // API端点
    const url = "https://yunwu.ai/v1/chat/completions";

    // 发送请求
    const response = await axios.post(url, payload, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 180000 // 3分钟超时
    });

    // 处理响应
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      
      // 从响应中提取图片URL
      const imageUrl = extractImageUrl(content);
      
      if (imageUrl) {
        return res.status(200).json({ imageUrl });
      } else {
        return res.status(404).json({ error: '无法从响应中获取图片URL' });
      }
    } else {
      return res.status(500).json({ error: '接收到的响应格式不正确' });
    }
  } catch (error) {
    console.error('API请求失败:', error);
    return res.status(500).json({ 
      error: '处理请求时出错', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
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