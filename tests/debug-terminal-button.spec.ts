import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3333' });

test.describe('Terminal Button Debug', () => {
  test('Debug terminal button click issue', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
      } else if (msg.type() === 'warning') {
        warnings.push(text);
      }
      console.log(`[Browser ${msg.type()}]`, text);
    });
    
    page.on('pageerror', (err) => {
      errors.push(`Page error: ${err.message}`);
      console.error('[Page Error]', err.message);
    });
    
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    console.log('\n=== Debug Report ===');
    
    const rootContent = await page.evaluate(() => {
      const root = document.querySelector('#root');
      return root ? root.innerHTML.substring(0, 500) : 'NOT FOUND';
    });
    console.log('1. #root content:', rootContent);
    
    const button = page.getByTestId('terminal-button');
    const buttonExists = await button.count() > 0;
    console.log('2. Terminal button exists:', buttonExists);
    
    if (buttonExists) {
      const isVisible = await button.isVisible();
      console.log('3. Terminal button is visible:', isVisible);
      
      const isEnabled = await button.isEnabled();
      console.log('4. Terminal button is enabled:', isEnabled);
      
      const boundingBox = await button.boundingBox();
      console.log('5. Terminal button bounding box:', boundingBox);
      
      if (boundingBox) {
        const centerX = boundingBox.x + boundingBox.width / 2;
        const centerY = boundingBox.y + boundingBox.height / 2;
        
        const elementAtPosition = await page.evaluate((x, y) => {
          const elements = document.elementsFromPoint(x, y);
          return elements.map(el => {
            const tag = el.tagName.toLowerCase();
            const id = el.id || 'no-id';
            const className = el.className || 'no-class';
            const dataTestid = (el as HTMLElement).dataset.testid || 'no-testid';
            return `${tag}#${id}.${className} [data-testid=${dataTestid}]`;
          }).slice(0, 10);
        }, centerX, centerY);
        
        console.log('6. Elements at button center:', elementAtPosition);
        
        const overlayElements = await page.evaluate(() => {
          const overlays = [];
          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const position = style.position;
            const zIndex = style.zIndex;
            if ((position === 'fixed' || position === 'absolute') && zIndex !== 'auto') {
              const rect = el.getBoundingClientRect();
              if (rect.width > 100 && rect.height > 100) {
                overlays.push({
                  tag: el.tagName.toLowerCase(),
                  id: el.id,
                  className: el.className,
                  zIndex: zIndex,
                  position: position,
                  rect: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                  }
                });
              }
            }
          });
          return overlays;
        });
        
        console.log('7. Potential overlay elements:', JSON.stringify(overlayElements, null, 2));
        
        await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
        console.log('8. Screenshot saved to debug-screenshot.png');
        
        await button.click();
        console.log('9. Button clicked');
        
        await page.waitForTimeout(2000);
        
        const terminalPanel = page.getByTestId('terminal-panel');
        const panelVisible = await terminalPanel.isVisible();
        console.log('10. Terminal panel visible after click:', panelVisible);
        
        const showTerminalState = await page.evaluate(() => {
          const panel = document.querySelector('[data-testid="terminal-panel"]');
          return panel ? !panel.classList.contains('hidden') : 'NOT FOUND';
        });
        console.log('11. Terminal panel hidden class:', showTerminalState);
        
        const showTerminalLog = await page.evaluate(() => {
          const logs = (window as any).__terminalDebugLogs || [];
          return logs;
        });
        console.log('12. Terminal debug logs:', showTerminalLog);
      }
    }
    
    console.log('\n=== Console Errors ===');
    errors.forEach((err, i) => console.log(`${i + 1}.`, err));
    
    console.log('\n=== Console Warnings ===');
    warnings.forEach((warn, i) => console.log(`${i + 1}.`, warn));
  });
});