// AI 功能测试脚本
// 用法: node test_ai.js

// 模拟 Anthropic API 调用
async function testAnthropicCall() {
  const baseUrl = 'https://api.yunjunet.cn';
  const apiKey = '你的-api-key'; // 替换为真实 key
  const model = 'step-3.5-flash';

  console.log('=== 测试 Anthropic API 调用 ===\n');

  try {
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: 'Hello, 请用中文回复' }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API 错误:', response.status, error);
      return;
    }

    const data = await response.json();
    console.log('✅ 调用成功！');
    console.log('\nAI 回复:');
    console.log(data.content[0].text);
  } catch (error) {
    console.error('❌ 网络或配置错误:', error.message);
  }
}

// 测试数据库配置
async function testDatabase() {
  console.log('\n=== 测试数据库连接 ===\n');

  try {
    // 动态导入 pg 模块（如果已安装）
    const { Client } = require('pg');

    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'wedding_planner',
      user: 'postgres',
      password: '', // 信任认证
      ssl: false,
    });

    await client.connect();
    console.log('✅ 数据库连接成功');

    // 测试查询
    const res = await client.query('SELECT COUNT(*) FROM users');
    console.log('📊 users 表记录数:', res.rows[0].count);

    await client.end();
    console.log('✅ 连接已关闭');
  } catch (error) {
    console.error('❌ 数据库错误:', error.message);
    console.log('提示: 确保 PostgreSQL 正在运行且已创建 wedding_planner 数据库');
  }
}

// 主函数
async function main() {
  console.log(' wedding-planner 测试工具\n');
  console.log('选择测试:');
  console.log('1. 测试 AI API (需要 API Key)');
  console.log('2. 测试数据库连接');
  console.log('3. 两者都测试');

  const choice = process.argv[2] || '3';

  if (choice === '1' || choice === '3') {
    await testAnthropicCall();
  }

  if (choice === '2' || choice === '3') {
    await testDatabase();
  }
}

main().catch(console.error);
