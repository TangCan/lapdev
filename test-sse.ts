// SSE 流式日志测试脚本
async function testSSE() {
  console.log('=== 测试 SSE 流式日志功能 ===\n');
  
  try {
    console.log('📡 正在连接到 http://localhost:3000/api/bmad/install...');
    
    const response = await fetch('http://localhost:3000/api/bmad/install', {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
        'Origin': 'http://localhost:5173',
      },
    });

    console.log(`✅ 连接成功，状态码: ${response.status}`);
    console.log(`📋 响应头:`);
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (!response.body) {
      console.error('❌ 响应体为空');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let lineCount = 0;
    let totalBytes = 0;

    console.log('\n📡 开始接收 SSE 流...\n');

    const startTime = Date.now();
    const timeout = setTimeout(() => {
      console.log('\n⏰ 超时警告：10秒内未收到任何数据');
    }, 10000);

    while (true) {
      console.log('🔄 等待数据...');
      const { done, value } = await reader.read();
      
      if (done) {
        clearTimeout(timeout);
        console.log('\n✅ SSE 流接收完成');
        break;
      }

      const chunk = decoder.decode(value);
      totalBytes += value.length;
      
      console.log(`\n📥 收到数据块 (${value.length} 字节):`);
      console.log(`原始内容: "${chunk}"`);

      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const content = line.slice(5).trim();
          
          try {
            const result = JSON.parse(content);
            console.log('\n📊 安装结果:', JSON.stringify(result, null, 2));
          } catch {
            lineCount++;
            console.log(`[${lineCount}] ${content}`);
          }
        } else if (line.trim()) {
          console.log(`其他行: "${line}"`);
        }
      }
    }

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`\n📈 测试完成:`);
    console.log(`  - 接收日志数: ${lineCount}`);
    console.log(`  - 接收字节数: ${totalBytes}`);
    console.log(`  - 耗时: ${elapsed.toFixed(2)} 秒`);
    
  } catch (error) {
    console.error('❌ SSE 测试失败:', error);
  }
}

testSSE();
