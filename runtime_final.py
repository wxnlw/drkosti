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
    def taps_board(n):
        for _ in range(n): page.locator('.board-item').click(); wait(85)
        wait(200)
    def hold_board(ms=1250):
        b=page.locator('.board-item').bounding_box(); page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2); page.mouse.down(); wait(ms); page.mouse.up(); wait(520)
    def swipes_board(n):
        for i in range(n):
            page.evaluate("(idx) => { const el=document.querySelector('.board-item'); el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:20,clientY:20,pointerId:1})); el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:70+idx*6,clientY:30,pointerId:1})); el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:70+idx*6,clientY:30,pointerId:1})); }", i)
            wait(160)
        wait(250)
    def taps_stove(n):
        for _ in range(n): page.locator('#stove').click(); wait(90)
        wait(180)
    def board_to_pot(): page.locator('.board-item').click(); wait(720)
    def tool(sel): page.locator(sel).click(); wait(720)
    def hold_kazan(ms=1650):
        b=page.locator('#kazan').bounding_box(); page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2); page.mouse.down(); wait(ms); page.mouse.up(); wait(520)
    def taps_kazan(n):
        for _ in range(n): page.locator('#kazan').click(); wait(100)
        wait(180)

    print('start', flush=True)
    page.locator('#startButton').click(); wait(250)
    pick('Рис'); taps_board(6); hold_board()
    open_chest(); labels=page.locator('.inventory-item__label').all_text_contents(); print('prepared labels after rice:', labels, flush=True); assert any('Замоченный рис' in x for x in labels); page.locator('#inventoryClose').click(); wait(80)
    pick('Морковь'); swipes_board(3); taps_board(5)
    pick('Лук'); swipes_board(2); taps_board(4)
    pick('Чеснок'); taps_board(3)
    taps_stove(4)
    pick('Масло'); board_to_pot()
    pick('Мясо'); board_to_pot()
    pick('Нарезанный лук')
    pick('Нарезанная морковь')
    pick('Специи'); board_to_pot()
    pick('Вода'); board_to_pot()
    pick('Замоченный рис')
    pick('Очищенный чеснок')
    open_chest(); empty=page.locator('#inventoryGrid').text_content(); print('chest:', empty, flush=True); assert 'Сундук пуст' in empty; page.locator('#inventoryClose').click(); wait(80)
    tool('#lidTool'); hold_kazan(); taps_kazan(8); tool('#ladleTool'); page.locator('#plate').click(); wait(520)
    st=state(); print('final state:', st, flush=True); assert st.get('completed') is True
    plate=page.locator('#plate').bounding_box(); food=page.locator('#plateFood').bounding_box(); dx=abs((plate['x']+plate['width']/2)-(food['x']+food['width']/2)); dy=abs((plate['y']+plate['height']/2)-(food['y']+food['height']/2)); print('center delta:', dx, dy, flush=True); assert dx <= 8 and dy <= 12
    print('runtime check: ok', flush=True)
    os._exit(0)
