import { test, expect } from '@playwright/test';

test.describe('WebSocket Tests', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3333';
  const wsURL = baseURL.replace('http://', 'ws://').replace('https://', 'wss://');

  test('[P0] should establish WebSocket connection', async ({ page }) => {
    await page.goto('/');
    
    const wsConnected = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const ws = new WebSocket(`${window.location.origin.replace('http', 'ws')}/api/v1/ws`);
        
        ws.onopen = () => {
          ws.close();
          resolve(true);
        };
        
        ws.onerror = () => {
          resolve(false);
        };
        
        setTimeout(() => {
          resolve(false);
        }, 5000);
      });
    });
    
    expect(wsConnected).toBe(true);
  });

  test('[P0] should receive file change notifications via WebSocket', async ({ page, request }) => {
    await page.goto('/');
    
    const testFileName = `/workspace/ws-test-${Date.now()}.txt`;
    
    const fileCreated = await page.evaluate(async (params) => {
      const { baseURL, testFile } = params;
      return new Promise<boolean>((resolve) => {
        const ws = new WebSocket(`${baseURL.replace('http://', 'ws://')}/api/v1/ws`);
        let receivedNotification = false;
        
        ws.onopen = () => {
          // Send subscribe message first
          ws.send(JSON.stringify({ type: 'subscribe' }));
          
          // Create file after WebSocket is connected
          fetch(`${baseURL}/api/v1/files/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: testFile,
              type: 'file',
              content: 'test'
            })
          });
          
          ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'fileCreated') {
              receivedNotification = true;
              ws.close();
              resolve(true);
            }
          };
        };
        
        ws.onerror = () => {
          resolve(false);
        };
        
        setTimeout(() => {
          ws.close();
          resolve(receivedNotification);
        }, 10000);
      });
    }, { baseURL, testFile: testFileName });
    
    expect(fileCreated).toBe(true);
  });

  test('[P1] should handle WebSocket reconnection', async ({ page }) => {
    await page.goto('/');
    
    const reconnected = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let connectionCount = 0;
        let ws: WebSocket;
        
        const connect = () => {
          ws = new WebSocket(`${window.location.origin.replace('http', 'ws')}/api/v1/ws`);
          
          ws.onopen = () => {
            connectionCount++;
            if (connectionCount === 2) {
              ws.close();
              resolve(true);
            } else {
              setTimeout(() => {
                ws.close();
                connect();
              }, 1000);
            }
          };
          
          ws.onerror = () => {
            if (connectionCount < 2) {
              setTimeout(connect, 1000);
            } else {
              resolve(false);
            }
          };
        };
        
        connect();
        
        setTimeout(() => {
          resolve(false);
        }, 15000);
      });
    });
    
    expect(reconnected).toBe(true);
  });

  test('[P1] should handle WebSocket message types', async ({ page }) => {
    await page.goto('/');
    
    const messageTypes = await page.evaluate(() => {
      return new Promise<string[]>((resolve) => {
        const ws = new WebSocket(`${window.location.origin.replace('http', 'ws')}/api/v1/ws`);
        const receivedTypes: string[] = [];
        
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'subscribe', channel: 'files' }));
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type && !receivedTypes.includes(message.type)) {
            receivedTypes.push(message.type);
          }
        };
        
        setTimeout(() => {
          ws.close();
          resolve(receivedTypes);
        }, 3000);
      });
    });
    
    expect(messageTypes.length).toBeGreaterThan(0);
  });

  test('[P2] should handle large WebSocket messages', async ({ page }) => {
    await page.goto('/');
    
    const handledLargeMessage = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const ws = new WebSocket(`${window.location.origin.replace('http', 'ws')}/api/v1/ws`);
        
        ws.onopen = () => {
          const largeMessage = {
            type: 'test',
            data: 'x'.repeat(1024 * 100) // 100KB
          };
          ws.send(JSON.stringify(largeMessage));
          
          ws.onmessage = () => {
            ws.close();
            resolve(true);
          };
        };
        
        ws.onerror = () => {
          resolve(false);
        };
        
        setTimeout(() => {
          ws.close();
          resolve(false);
        }, 10000);
      });
    });
    
    expect(handledLargeMessage).toBe(true);
  });

  test('[P2] should handle WebSocket connection timeout', async ({ page }) => {
    await page.goto('/');
    
    const handledTimeout = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const ws = new WebSocket(`${window.location.origin.replace('http', 'ws')}/api/v1/ws`);
        let timeoutFired = false;
        
        ws.onclose = (event) => {
          if (event.code === 1006) {
            timeoutFired = true;
          }
          resolve(timeoutFired);
        };
        
        setTimeout(() => {
          ws.close();
          resolve(timeoutFired);
        }, 30000);
      });
    });
    
    expect(handledTimeout).toBe(false);
  });
});