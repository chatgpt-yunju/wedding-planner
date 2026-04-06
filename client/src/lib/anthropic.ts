// Anthropic API 调用封装
// 使用 yunjunet.cn 或其他兼容 Anthropic 的 endpoint

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export async function callAnthropic(config: AIConfig, messages: AnthropicMessage[], maxTokens = 1024): Promise<string> {
  const response = await fetch(`${config.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// 测试连接
export async function testAnthropicConnection(config: AIConfig): Promise<{ success: boolean; message: string }> {
  try {
    const result = await callAnthropic(config, [{ role: 'user', content: 'Hello' }], 10);
    return { success: true, message: '连接成功！' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
