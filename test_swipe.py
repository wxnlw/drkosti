from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os
root=Path('/mnt/data/gamefix')
html=(root/'index.html').read_text(); css=(root/'styles.css').read_text().replace("@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;700;800&display=swap');",""); config=(root/'app-config.js').read_text(); app=(root/'app.js').read_text()
html=html.replace('<link rel="stylesheet" href="./styles.css" />', f'<style>{css}</style>').replace('<script src="https://telegram.org/js/telegram-web-app.js" defer></script>', '')
shim="<script>Object.defineProperty(window,'localStorage',{value:{_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]},clear(){this._d={}}}, configurable:true});</script>"
html=html.replace('</head>', shim + '</head>').replace('<script src="./app-config.js" defer></script>', f'<script>{config}</script>').replace('<script src="./app.js" defer></script>', f'<script>{app}</script>')
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width':375,'height':812}, is_mobile=True)
    page.set_content(html, wait_until='load')
    def wait(ms): page.wait_for_timeout(ms)
    def state():
        raw=page.evaluate("window.localStorage._d['birthday-plov-pixel-v14-mobile']")
        return json.loads(raw) if raw else {}
    def open_chest(): page.locator('#chestButton').click(); wait(120)
    def pick(text): open_chest(); page.locator('.inventory-item', has_text=text).first.click(); wait(720)
    page.locator('#startButton').click(); wait(250)
    pick('Рис')
    for _ in range(6): page.locator('.board-item').click(); wait(85)
    b=page.locator('.board-item').bounding_box(); page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2); page.mouse.down(); wait(1250); page.mouse.up(); wait(520)
    pick('Морковь')
    for i in range(3):
        page.evaluate("(idx) => { const el=document.querySelector('.board-item'); el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:20,clientY:20,pointerId:1})); el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:60+idx*5,clientY:28,pointerId:1})); el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:60+idx*5,clientY:28,pointerId:1})); }", i)
        wait(150)
    print(state(), flush=True)
    os._exit(0)
