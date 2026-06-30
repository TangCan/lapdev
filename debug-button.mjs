import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
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
  
  await page.goto('http://localhost:3333/');
  await page.waitForTimeout(5000);
  
  console.log('\n=== Debug Report ===');
  
  const rootContent = await page.evaluate(() => {
    const root = document.querySelector('#root');
    return root ? root.innerHTML.substring(0, 1000) : 'NOT FOUND';
  });
  console.log('1. #root content:', rootContent);
  
  const buttonExists = await page.$('[data-testid="terminal-button"]') !== null;
  console.log('2. Terminal button exists:', buttonExists);
  
  if (buttonExists) {
    const isVisible = await page.isVisible('[data-testid="terminal-button"]');
    console.log('3. Terminal button is visible:', isVisible);
    
    const isEnabled = await page.isEnabled('[data-testid="terminal-button"]');
    console.log('4. Terminal button is enabled:', isEnabled);
    
    const boundingBox = await page.$eval('[data-testid="terminal-button"]', el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    console.log('5. Terminal button bounding box:', boundingBox);
    
    const center = {
      x: boundingBox.x + boundingBox.width / 2,
      y: boundingBox.y + boundingBox.height / 2
    };
    
    const elementAtPosition = await page.evaluate((pos) => {
      const elements = document.elementsFromPoint(pos.x, pos.y);
      return elements.map(el => {
        const tag = el.tagName.toLowerCase();
        const id = el.id || 'no-id';
        const className = el.className || 'no-class';
        const dataTestid = el.dataset ? el.dataset.testid || 'no-testid' : 'no-testid';
        return `${tag}#${id} [class=${className}] [data-testid=${dataTestid}]`;
      }).slice(0, 10);
    }, center);
    
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
    
    console.log('9. Clicking button...');
    await page.click('[data-testid="terminal-button"]');
    console.log('10. Button clicked');
    
    await page.waitForTimeout(2000);
    
    const panelVisible = await page.isVisible('[data-testid="terminal-panel"]');
    console.log('11. Terminal panel visible after click:', panelVisible);
    
    const showTerminalState = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="terminal-panel"]');
      return panel ? !panel.classList.contains('hidden') : 'NOT FOUND';
    });
    console.log('12. Terminal panel hidden class:', showTerminalState);
    
    const buttonClass = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="terminal-button"]');
      return btn ? btn.className : 'NOT FOUND';
    });
    console.log('13. Button className:', buttonClass);
    
    const panelContent = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="terminal-panel"]');
      return panel ? panel.innerHTML.substring(0, 500) : 'NOT FOUND';
    });
    console.log('14. Terminal panel content:', panelContent);
  }
  
  console.log('\n=== Console Errors ===');
  errors.forEach((err, i) => console.log(`${i + 1}.`, err));
  
  console.log('\n=== Console Warnings ===');
  warnings.forEach((warn, i) => console.log(`${i + 1}.`, warn));
  
  await browser.close();
})();