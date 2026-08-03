const { chromium } = require('playwright');
const fs = require('fs');

// ========== 使用说明（每次执行前按需修改） ==========
// 1. IMG_DIR: 输出图片目录，命名规范 <base>_images/（如 C:/path/data260802_images/）
// 2. CARDS:  每张要生成图片的卡，prefix 用 ASCII（keyword 拼音），prompt 为步骤1生成的"图片提示词"
// 3. 运行前设置 NODE_PATH（win）: $env:NODE_PATH = "C:\Users\bruce\AppData\Roaming\npm\node_modules"
// 4. 前置：用户已在 9700 调试端口浏览器打开并登录豆包
// 5. 下载完成后必须做 MD5 去重校验（页面懒加载可能误检旧图/点错图）
// 6. 频率与会话限制（防封号/防会话超限）：
//    - 每轮提交之间延时 SUBMIT_DELAY_MS（默认 20s），切勿连续快速提交
//    - 单会话建议最多生成 MAX_PER_SESSION 张（默认 10），超出后提示切换新会话再跑
//    - 支持断点续做：CARDS 中已存在 <prefix>_1.png 的卡自动跳过
//    - 检测到限流/超限文案时立即报错终止，由执行者切换会话后重跑
// ==================================================

const IMG_DIR = 'C:/path/to/data260802_images/';
const SUBMIT_DELAY_MS = 20000;   // 每轮提交间隔，防频率限制
const MAX_PER_SESSION = 10;      // 单会话最大生成次数（保守值，超限切换新会话）
const RATE_LIMIT_HINTS = ['生成过于频繁', '操作频繁', '稍后再试', '已达上限', '超出', '次数已用完', '无法继续生成'];
const CARDS = [
  // {
  //   prefix: 'tian',  // keyword 的 ASCII 拼音/英文名，图片文件名前缀
  //   prompt: '国风儿童插画：……适合儿童闪卡横版构图，无文字'
  // },
];

function existingPrefixes() {
  if (!fs.existsSync(IMG_DIR)) return new Set();
  return new Set(fs.readdirSync(IMG_DIR)
    .filter(f => /\.(png|jpe?g)$/i.test(f))
    .map(f => f.replace(/_\d+\.[a-z]+$/i, '')));
}

function checkRateLimit(page) {
  return page.evaluate((hints) => {
    const t = document.body.innerText;
    return hints.filter(h => t.includes(h));
  }, RATE_LIMIT_HINTS);
}

async function getGenUrls(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('img')]
      .map(im => im.src)
      .filter(s => s.includes('rc_gen_image'))
      .filter((v, i, a) => a.indexOf(v) === i);
  });
}

async function waitForNewImages(page, knownUrls, prefix, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastUrls = knownUrls;
  let stableSince = 0;
  let lastCount = knownUrls.length;
  while (Date.now() < deadline) {
    const urls = await getGenUrls(page);
    const newUrls = urls.filter(u => !knownUrls.includes(u));
    if (newUrls.length > 0) {
      if (newUrls.length !== lastCount) {
        lastCount = newUrls.length;
        stableSince = Date.now();
      } else if (Date.now() - stableSince > 8000) {
        // also confirm generation finished (no "正在生成" text)
        const text = await page.evaluate(() => document.body.innerText);
        if (!text.includes('正在生成')) return newUrls;
      }
    }
    await page.waitForTimeout(3000);
  }
  throw new Error(`[${prefix}] timeout waiting for images, have ${lastCount}`);
}

async function downloadOneImage(page, url, index, prefix) {
  const key = url.split('~tplv-')[0].split('/').pop().slice(0, 40);
  const img = page.locator(`img[src*="${key}"]`).first();
  try {
    await img.click({ timeout: 8000 });
    await page.waitForTimeout(2000);
    const dlPromise = page.waitForEvent('download', { timeout: 25000 }).catch(() => null);
    const saveBtn = page.locator('text=保存').last();
    await saveBtn.click({ timeout: 8000 });
    const dl = await dlPromise;
    if (!dl) { console.log(`[${prefix}] img ${index}: no download event`); return false; }
    const ext = (dl.suggestedFilename().split('.').pop() || 'png');
    const f = `${IMG_DIR}${prefix}_${index}.${ext}`;
    await dl.saveAs(f);
    console.log(`[${prefix}] saved ${f}`);
    return true;
  } catch (e) {
    console.log(`[${prefix}] img ${index} error:`, e.message.slice(0, 100));
    return false;
  } finally {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1200);
  }
}

async function submitPrompt(page, prompt) {
  // ensure image-gen mode: click 图像生成 if present and not already in gen panel
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '图像生成');
    if (btn) { btn.click(); }
  });
  await page.waitForTimeout(1500);
  // dynamic editor selection
  let editor = page.locator('div.tiptap.ProseMirror').first();
  if (await editor.count() === 0 || !(await editor.isVisible().catch(() => false))) {
    editor = page.locator('textarea.semi-input-textarea').first();
  }
  await editor.click();
  await page.keyboard.type(prompt, { delay: 8 });
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
}

async function generateCard(page, card) {
  const { prefix, prompt } = card;
  const knownUrls = await getGenUrls(page);
  await submitPrompt(page, prompt);
  console.log(`[${prefix}] submitted at ${new Date().toISOString()}`);
  const newUrls = await waitForNewImages(page, knownUrls, prefix, 180000);
  console.log(`[${prefix}] got ${newUrls.length} new images`);
  let saved = 0;
  for (let i = 0; i < newUrls.length; i++) {
    const ok = await downloadOneImage(page, newUrls[i], i + 1, prefix);
    if (ok) saved++;
  }
  console.log(`[${prefix}] done, saved ${saved}/${newUrls.length}`);
  return saved;
}

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9700');
  const page = browser.contexts()[0].pages().find(p => p.url().includes('doubao.com'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);

  // 断点续做：跳过已生成过图片的卡
  const done = existingPrefixes();
  const todo = CARDS.filter(c => !done.has(c.prefix));
  console.log(`resume: ${todo.length}/${CARDS.length} cards to generate, skipped: ${CARDS.length - todo.length}`);

  let total = 0;
  let sessionCount = 0;
  for (const card of todo) {
    // 单会话次数上限：超限提示切换新会话
    if (sessionCount >= MAX_PER_SESSION) {
      console.log(`REACHED MAX_PER_SESSION=${MAX_PER_SESSION} in this session.`);
      console.log('ACTION NEEDED: 请切换到新的豆包会话（新建对话/新 chat 页面），然后重跑本脚本继续剩余卡片。');
      break;
    }
    // 提交前延时，控制生成频率（防封号）
    if (sessionCount > 0 || total > 0) {
      console.log(`sleeping ${SUBMIT_DELAY_MS / 1000}s before next submission...`);
      await page.waitForTimeout(SUBMIT_DELAY_MS);
    }
    // 限流/超限预检
    const hints = await checkRateLimit(page);
    if (hints.length > 0) {
      console.log('RATE LIMIT DETECTED:', hints.join(', '));
      console.log('ACTION NEEDED: 停止当前会话，切换到新会话后重跑。');
      break;
    }
    total += await generateCard(page, card);
    sessionCount++;
  }
  console.log('ALL DONE, total saved this run:', total);
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
