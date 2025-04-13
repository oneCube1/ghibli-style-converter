import { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resultImageUrl, setResultImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 处理文件选择
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // 创建预览URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      // 重置其他状态
      setResultImageUrl('');
      setProgressStatus('');
      setErrorMessage('');
    }
  };

  // 处理图片转换
  const handleConversion = async () => {
    if (!selectedFile) {
      setErrorMessage('请先选择一张图片');
      return;
    }

    setIsLoading(true);
    setProgressStatus('准备处理...');
    setErrorMessage('');

    try {
      // 将图片转换为Base64
      const base64Image = await convertToBase64(selectedFile);
      
      // 准备API请求数据
      const payload = {
        model: "gpt-4o-image-vip",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "保持图片主题和背景元素不变，把图片变成吉卜力风格"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      };

      // 直接发送API请求到yunwu.ai
      const response = await axios.post('https://yunwu.ai/v1/chat/completions', payload, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer sk-a1rL1XFLv6xMZ0qvZKJbuTAtTX51eLlvcIJTRbD0aMG6bQaz`,
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
          setResultImageUrl(imageUrl);
          setProgressStatus('转换完成!');
        } else {
          setErrorMessage('未能从响应中提取图片URL');
        }
      } else {
        setErrorMessage('接收到的响应格式不正确');
      }
    } catch (error) {
      console.error('转换过程出错:', error);
      setErrorMessage(`处理失败: ${error.message || '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 将文件转换为Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // 移除开头的 "data:image/jpeg;base64," 部分
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // 从响应内容中提取图片URL
  const extractImageUrl = (content) => {
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
  };

  // 下载结果图片
  const handleDownload = () => {
    if (resultImageUrl) {
      const link = document.createElement('a');
      link.href = resultImageUrl;
      link.download = 'ghibli_style_image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>吉卜力风格图片转换器</title>
        <meta name="description" content="将普通图片转换为吉卜力风格" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          吉卜力风格图片转换器
        </h1>

        <p className={styles.description}>
          上传一张图片，将其转换为吉卜力动画风格
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>选择图片</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            {previewUrl && (
              <div className={styles.imagePreview}>
                <h3>预览</h3>
                <img src={previewUrl} alt="预览图" />
              </div>
            )}
          </div>

          <div className={styles.card}>
            <button
              onClick={handleConversion}
              disabled={isLoading || !selectedFile}
              className={styles.button}
            >
              {isLoading ? '处理中...' : '转换图片'}
            </button>
            
            {progressStatus && (
              <p className={styles.status}>{progressStatus}</p>
            )}
            
            {errorMessage && (
              <p className={styles.error}>{errorMessage}</p>
            )}
            
            {resultImageUrl && (
              <div className={styles.resultContainer}>
                <h3>转换结果</h3>
                <img src={resultImageUrl} alt="转换后的图片" />
                <button
                  onClick={handleDownload}
                  className={styles.downloadButton}
                >
                  下载图片
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://github.com/yourusername/ghibli-style-converter"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by Next.js and Vercel
        </a>
      </footer>
    </div>
  );
} 
