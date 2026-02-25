// --- Chronicle / Noir Archive System (True 1:1 Replica with AI Logic) ---
const ChronicleApp = {
    rootId: 'chronicle-app-container',
    currentData: null,

neteaseApiBase: 'https://api-enhanced-phi.vercel.app', 
    currentAudio: null,

vipCookie: 'MUSIC_U=0083DBEBBBE43BB0D5B4BD18E5FAB80C5A1205AF561EE73EF1E3FE563D6773EF4657F18F2114D6AD197664866FB97B9F1F09034B907DEA55DF5B1967389692EC5FB8220DAC58220E71404EEE9EEA497C81F12393F9099D9D1622FDF029BBEF973B7A44B5143352C0350D7C3633013E55D7E44E432C5EA867C9EB1B52D1395C4BFBDBE4A60BAF8EB48D5140A374AD73CA77F59B1CD35A30BE19FDC1C6590CC49CFA3616B67564A9E08C13946756330A0421E813ECA1E331742284C5EF9D5609DAB9C734C6AA8841B1E8B646443E4AC31A99DCFC3A69EFE16996C14A60BB7699D68AC9ADE42CF85DFAF6CEE42E3A4027CCE1740156540CAAD95DDBAD9CF0689C5C1A21BCC538EE8084FE81AAF7FE14920443BB8037C1F55257B9BEFEA1C511DFEAB7ED8F189832D15093D8A92EBD0E9DC7839751546E222FAE9CFA4710E372A9C60D38E3EDB54CDEB19AA43606F6053805E60DA548BD0326E307CC887A82546598D7440A843AD6BBE59EED28D09BCB2FEBFCF99A90377E8DE26A96DD4F5BFF8D3E9CA231B8888E7B4653F436A23372F77AD23A73C2ECC95AC81DF2BD28640DF97827;', 
    currentAudio: null,
    
    // 静态章节模板 (这里直接写死那篇 404 文章)
    staticChaptersTemplate: [
        { 
            id: 'static_user_log_01', 
            title: 'SIGNAL_LOST_404', 
            type: 'user', // 标记为 User 类型，这样底部显示 Close 按钮
            html: `
                <!-- 1. 头部 -->
                <div class="chapter-header">
                    <span class="ch-num">TRANSMISSION_LOG</span>
                    <h2 class="ch-title">SIGNAL_LOST_404</h2>
                </div>

                <!-- 2. 正文 (带静态批注) -->
                <div class="article-text">
                    <p>Sometimes I feel like I'm transmitting into a 
                        <span class="annotation-wrapper" onclick="ChronicleApp.toggleNote(this)">
                            <span class="annotation-trigger">void</span>
                            <span class="annotation-original"></span>
                            <span class="annotation-note">Null pointer exception.</span>
                        </span>.
                    </p>
                    <p>The city lights blur into streaks of neon 
                        <span class="annotation-wrapper" onclick="ChronicleApp.toggleNote(this)">
                            <span class="annotation-trigger">rain</span>
                            <span class="annotation-original"></span>
                            <span class="annotation-note">Visual sensor interference.</span>
                        </span>, and I wonder if my memories are just data fragments waiting to be overwritten.
                    </p>
                    <p>Are you listening? Or are you just another 
                        <span class="annotation-wrapper" onclick="ChronicleApp.toggleNote(this)">
                            <span class="annotation-trigger">ghost</span>
                            <span class="annotation-original"></span>
                            <span class="annotation-note">Entity unknown. Daemon process?</span>
                        </span> in the 
                        <span class="annotation-wrapper" onclick="ChronicleApp.toggleNote(this)">
                            <span class="annotation-trigger">machine</span>
                            <span class="annotation-original"></span>
                            <span class="annotation-note">We are all part of the system.</span>
                        </span>?
                    </p>
                    <p>I keep waiting for a sign, a 
                        <span class="annotation-wrapper" onclick="ChronicleApp.toggleNote(this)">
                            <span class="annotation-trigger">glitch</span>
                            <span class="annotation-original"></span>
                            <span class="annotation-note">I am not a glitch. I am a feature.</span>
                        </span>, something to prove this connection is real.
                    </p>
                </div>

                <!-- 3. 底部组件 (黑色回执卡片) -->
                <div class="comp-artifact" onclick="ChronicleApp.openLetter('SYSTEM', 'I%20received%20your%20transmission.%20Data%20integrity%20100%25.')">
                    <div class="artifact-header">
                        <span class="artifact-id">ID: 8502</span>
                        <span class="artifact-stamp">PRIVATE</span>
                    </div>
                    <div class="artifact-body">
                        <div class="artifact-label">FROM THE ARCHIVE OF</div>
                        <div class="artifact-name">TARGET_SUBJECT</div>
                    </div>
                    <div class="artifact-footer">
                        <div class="artifact-barcode">|| ||| |||</div>
                        <div class="artifact-action">ACCESS DATA <i class="fa-solid fa-lock"></i></div>
                    </div>
                </div>
            ` 
        }
    ],

toggleNote(element) {
        // 因为全局事件代理已经处理了点击逻辑，这里只需留空，或者安全地返回即可
        return; 
    },

// 👇 新增：网易云音乐搜索解析引擎 (GET 请求 + Cookie 瘦身 + 防缓存兼容版)
    async fetchNeteaseMusic(keyword) {
        if (!keyword || keyword === 'null') return null;
        try {
            console.log(`🎵 [网易云] 开始检索关键词: "${keyword}"`);
            
            // 1. Cookie 瘦身：只取 MUSIC_U，防止 URL 过长报错
            let cleanCookie = '';
            if (this.vipCookie) {
                const match = this.vipCookie.match(/MUSIC_U=[^;]+/);
                cleanCookie = match ? match[0] : this.vipCookie;
            }
            
            // 2. 组装基础参数 (加上 timestamp 防止缓存导致链接失效)
            const baseParams = `timerstamp=${Date.now()}`;
            const cookieParam = cleanCookie ? `&cookie=${encodeURIComponent(cleanCookie)}` : '';

            // 3. 搜索歌曲 (GET 请求)
            const searchUrl = `${this.neteaseApiBase}/search?keywords=${encodeURIComponent(keyword)}&limit=5&${baseParams}${cookieParam}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();
            const songs = searchData.result?.songs;
            
            if (!songs || songs.length === 0) {
                console.warn(`⚠️ [网易云] 未找到歌曲: ${keyword}`);
                return null;
            }

            // 4. 批量获取 URL (GET 请求，请求 exhigh 无损)
            const songIds = songs.map(s => s.id).join(',');
            const audioUrlPath = `${this.neteaseApiBase}/song/url/v1?id=${songIds}&level=exhigh&${baseParams}${cookieParam}`;
            
            const urlRes = await fetch(audioUrlPath);
            const urlData = await urlRes.json();

            // 5. 找到第一个能用的链接
            const validUrlObj = urlData.data?.find(item => item.url && item.url.trim() !== '');
            
            if (!validUrlObj) {
                console.warn(`⚠️ [网易云] 搜索结果全部无效: ${keyword}`);
                window.utils.showToast(`歌曲暂无音源`);
                return null;
            }

            const finalSongId = validUrlObj.id;
            const audioUrl = validUrlObj.url;

            // 6. 匹配歌曲信息
            const finalSongMeta = songs.find(s => s.id === finalSongId);
            const title = finalSongMeta.name;
            const artist = finalSongMeta.artists?.[0]?.name || 'Unknown';

            console.log(`🎵 [网易云VIP] 锁定歌曲: ${title} - ${artist}`);

            // 7. 获取封面
            const detailUrl = `${this.neteaseApiBase}/song/detail?ids=${finalSongId}&${baseParams}${cookieParam}`;
            const detailRes = await fetch(detailUrl);
            const detailData = await detailRes.json();
            const coverUrl = detailData.songs?.[0]?.al?.picUrl || '';

            console.log(`✅ [网易云VIP] 音乐加载成功！`);
            return { id: finalSongId, title, artist, audioUrl, coverUrl };
            
        } catch (e) {
            console.error("❌ [网易云] 网络请求失败:", e);
            // 只有网络真断了才会报这个错
            if (e.message.includes('Load failed')) {
                window.utils.showToast("网络连接被阻断，请检查代理设置");
            }
            return null;
        }
    },

    // 初始化
    init() {
        if (document.getElementById(this.rootId)) return;

        // 1. 注入 CSS
        const style = document.createElement('style');
        style.textContent = `
            /* === Chronicle App Scoped CSS === */
            #chronicle-app-container {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background-color: #f4f4f4;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
                font-family: 'Cormorant Garamond', serif;
                color: #1a1a1a;
                z-index: 200;
                display: none;
                flex-direction: column;
                overflow: hidden;
            }
            #chronicle-app-container.visible { display: flex; animation: chronicleFadeIn 0.4s ease-out; }
            #chronicle-app-container * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; outline: none; }
            
            @keyframes chronicleFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            
            #chronicle-app-container .fade-in { animation: fadeIn 0.8s ease-out forwards; }
            #chronicle-app-container .hidden { display: none !important; }

            /* === PAGE 1: LOBBY === */
            .page-lobby { flex: 1; overflow-y: auto; padding: 30px 25px; display: flex; flex-direction: column; }
            .lobby-top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-top: 40px; }
            .header-brand { display: flex; flex-direction: column; }
            .brand-main { font-family: 'Cinzel', serif; font-size: 28px; letter-spacing: 2px; font-weight: 600; color: #1a1a1a; }
            .brand-sub { font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 4px; margin-top: 5px; color: #888; }
            .exit-btn-text { font-family: 'Jost', sans-serif; font-size: 12px; letter-spacing: 2px; font-weight: 500; color: #1a1a1a; cursor: pointer; position: relative; padding-bottom: 2px; margin-top: 10px; }
            .exit-btn-text::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 1px; background: #1a1a1a; transform: scaleX(0); transform-origin: right; transition: transform 0.3s; }
            .exit-btn-text:hover::after { transform: scaleX(1); transform-origin: left; }

            .char-deck { display: grid; gap: 50px; padding-bottom: 50px; }
            
            .chronicle-poster { position: relative; height: 420px; width: 100%; cursor: pointer; transition: transform 0.4s; }
            .chronicle-poster:active { transform: scale(0.98); }
            
            .chronicle-img-box { width: 100%; height: 85%; overflow: hidden; position: relative; background: #e0e0e0; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .chronicle-img-box img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s; }
            .chronicle-poster:hover .chronicle-img-box img { transform: scale(1.05); }
            
            .chronicle-overlay { 
                position: absolute; bottom: 20px; right: 0; width: 85%; 
                background: rgba(255, 255, 255, 0.55); 
                backdrop-filter: blur(25px) saturate(120%); 
                -webkit-backdrop-filter: blur(25px) saturate(120%); 
                border: 1px solid rgba(255, 255, 255, 0.7); 
                border-right: none; 
                padding: 20px; display: flex; flex-direction: column; 
                box-shadow: 0 15px 40px rgba(0,0,0,0.15); 
                z-index: 10;
                transform: translateZ(0); 
            }
            .chronicle-title { font-family: 'Cinzel', serif; font-size: 32px; font-weight: 600; line-height: 0.9; margin-bottom: 5px; color: #000; text-transform: uppercase; letter-spacing: 1px; }
            .chronicle-meta { font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 2px; color: #666; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; }
            
            .chronicle-arrow { font-size: 16px; color: #000; transition: transform 0.3s; }
            .chronicle-poster:hover .chronicle-arrow { transform: translateX(5px); }

            /* === PAGE 2: INDEX === */
            .page-index { flex: 1; display: flex; flex-direction: column; height: 100%; background: #f9f9f9; }
            .index-nav-bar { height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; background: #fff; flex-shrink: 0; z-index: 20; padding-top: 10px; }
            .nav-btn-simple { font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 2px; cursor: pointer; padding: 10px 0; color: #1a1a1a; font-weight: 500; border-bottom: 1px solid transparent; transition: border 0.3s; }
            .nav-btn-simple:hover { border-bottom-color: #1a1a1a; }

            .index-deco-header { padding: 20px 30px 20px; border-bottom: 1px dashed #ccc; background: #fff; position: relative; }
            .receipt-row { display: flex; justify-content: space-between; margin-bottom: 10px; align-items: flex-end; }
            .receipt-big-num { font-family: 'Cinzel', serif; font-size: 64px; line-height: 0.8; color: #000; }
            .receipt-meta-box { text-align: right; font-family: 'Jost', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; line-height: 1.6; }
            .receipt-barcode { font-family: 'Libre Barcode 128 Text', cursive; font-size: 32px; margin-top: 10px; opacity: 0.7; }

            .chapter-container { flex: 1; padding: 20px 30px; overflow-y: auto; background: #f9f9f9; }
            .modern-list-item { display: block; padding: 30px 0; border-bottom: 1px solid #e0e0e0; cursor: pointer; transition: all 0.3s; position: relative; }
            .modern-list-item:hover { padding-left: 15px; border-bottom-color: #000; }
            .li-top { display: flex; justify-content: space-between; font-family: 'Jost', sans-serif; font-size: 9px; letter-spacing: 2px; color: #999; margin-bottom: 8px; }
            .li-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-style: italic; color: #1a1a1a; }
            .li-arrow { position: absolute; right: 0; top: 50%; transform: translateY(-50%); opacity: 0; transition: opacity 0.3s; }
            .modern-list-item:hover .li-arrow { opacity: 1; }

            .btn-create-chapter { width: 100%; border: 1px dashed #999; padding: 20px; text-align: center; font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 2px; color: #666; cursor: pointer; transition: all 0.3s; }
            .btn-create-chapter:hover { background: #fff; color: #000; border-style: solid; }

            .settings-modal { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(244, 244, 244, 0.98); backdrop-filter: blur(10px); z-index: 100; padding: 40px; display: flex; flex-direction: column; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
            .settings-modal.active { transform: translateY(0); }
            .modal-header { font-family: 'Cinzel', serif; font-size: 24px; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #000; }
            .modal-textarea { flex: 1; background: transparent; border: 1px solid #ddd; padding: 15px; font-family: 'Cormorant Garamond', serif; font-size: 16px; line-height: 1.6; color: #1a1a1a; resize: none; margin-bottom: 20px; }
            .modal-actions { display: flex; gap: 10px; }
            .btn-modal { flex: 1; padding: 15px; text-align: center; font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 2px; cursor: pointer; border: 1px solid #1a1a1a; transition: all 0.2s; }
            .btn-modal.save { background: #1a1a1a; color: #fff; }
            .btn-modal.cancel { background: transparent; color: #1a1a1a; }

            /* === PAGE 3: READER (高级杂志排版版) === */
            .page-read { flex: 1; background: #faf9f6; display: flex; flex-direction: column; position: relative; height: 100%; }
            .read-nav { height: 80px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; background: #faf9f6; padding-top: 20px;}
            .nav-back-text { font-family: 'Jost', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; cursor: pointer; border-bottom: 1px solid transparent; transition: border 0.3s; color: #555; }
            .nav-back-text:hover { border-bottom-color: #000; color: #000; }
            .nav-paginator { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 14px; color: #999; }
            .read-scroll-area { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 10px 30px 40px 30px; }
            
            /* 标题区域：克制而优雅 */
            .chapter-header { text-align: left; margin-bottom: 50px; padding-bottom: 25px; border-bottom: 1px solid rgba(0,0,0,0.08); position: relative; }
            .ch-num { font-family: 'Space Mono', monospace; font-size: 10px; color: #888; letter-spacing: 4px; display: block; margin-bottom: 15px; text-transform: uppercase; }
            .ch-title { font-family: 'Cinzel', serif; font-size: 2.2rem; line-height: 1.2; color: #111; font-weight: 600; letter-spacing: 1px; margin: 0; }
            
            /* 正文区域：【核心】强制跟随全局字体与大小 */
            .article-text { 
                font-family: inherit !important; /* 跟随全局字体 */
                font-size: 1rem !important;      /* 1rem = 跟随滑块设定的全局大小 */
                line-height: 2.2;                /* 宽松的呼吸感行高 */
                letter-spacing: 0.5px; 
                color: #2c2c2e; 
                text-align: justify; 
                text-justify: inter-ideograph;   /* 优化中文两端对齐 */
            }
            .article-text p { margin-bottom: 2em; }
            
            /* 华丽的首字下沉 (Drop Cap) */
            .article-text > p:first-of-type::first-letter {
                float: left;
                font-size: 3.8em;
                line-height: 0.85;
                margin-right: 12px;
                margin-top: 8px;
                font-family: 'Cinzel', serif; /* 首字用艺术字体 */
                color: #1a1a1a;
            }

            /* 批注 (潜台词) 样式优化：像荧光笔画过的重点 */
            .annotation-wrapper { 
                display: inline-block; 
                transition: all 0.4s ease; 
                border-bottom: 1.5px dashed #a0a0a0; 
                cursor: pointer; 
                padding: 0 2px;
            }
            .annotation-wrapper:hover, .annotation-wrapper.active { 
                background: #1a1a1a; 
                color: #faf9f6; 
                border-bottom-color: transparent; 
                border-radius: 2px;
            }
            .annotation-wrapper.active { 
                display: block; 
                padding: 20px; 
                margin: 30px 0; 
                font-family: inherit; 
                font-size: 0.95em; 
                letter-spacing: 1px; 
                line-height: 1.8; 
                border-left: 3px solid #1a1a1a; 
                border-radius: 0 4px 4px 0;
            }
            .annotation-note { display: none; }
            .annotation-wrapper.active .annotation-original { display: none; }
            .annotation-wrapper.active .annotation-note { display: block; animation: fadeIn 0.4s; }
            .annotation-wrapper.active::before { content: '【DECRYPTED THOUGHT】'; display: block; font-family: monospace; font-size: 10px; color: #888; margin-bottom: 10px; letter-spacing: 1px; }

            /* 高光引用组件：恢复原版极简居中风格 */
            .comp-quote { 
                margin: 50px 0; 
                text-align: center; 
                position: relative; 
            }
            .quote-text { 
                font-family: inherit; /* 跟随你设置的字体 */
                font-size: 1.6em;     /* 恢复原版的大字号视觉比例 */
                font-style: italic; 
                line-height: 1.4; 
                color: #000; 
            }
            .comp-quote::before { 
                content: '“'; 
                display: block; 
                font-family: 'Cinzel', serif; 
                font-size: 60px; 
                color: #ccc; 
                line-height: 0.1; 
                margin-bottom: 20px; 
            }

            .comp-receipt { background: #fff; width: 100%; margin: 50px 0; padding: 20px; font-family: 'Space Mono', monospace; font-size: 10px; color: #333; box-shadow: 0 5px 20px rgba(0,0,0,0.05); position: relative; background-image: radial-gradient(circle at 0 0, transparent 3px, #fff 4px), radial-gradient(circle at 100% 0, transparent 3px, #fff 4px); background-size: 10px 10px; background-repeat: repeat-x; background-position: bottom; }
            .rcpt-header { text-align: center; border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; font-weight: bold; }
            .rcpt-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .rcpt-total { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; }
            .rcpt-barcode { font-family: 'Libre Barcode 128 Text', cursive; font-size: 24px; text-align: center; margin-top: 15px; opacity: 0.8; }

            .comp-ticket { background: #1a1a1a; color: #fff; margin: 50px 0; padding: 0; display: flex; position: relative; mask-image: radial-gradient(circle at left, transparent 6px, black 7px), radial-gradient(circle at right, transparent 6px, black 7px); mask-position: 0 50%, 100% 50%; mask-size: 100% 100%; mask-repeat: no-repeat; }
            .ticket-main { flex: 1; padding: 20px; border-right: 1px dashed #444; }
            .ticket-stub { width: 60px; display: flex; align-items: center; justify-content: center; writing-mode: vertical-rl; letter-spacing: 2px; font-size: 9px; font-family: 'Jost', sans-serif; }
            .ticket-title { font-family: 'Cinzel', serif; font-size: 16px; margin-bottom: 10px; }
            .ticket-info { font-family: 'Space Mono', monospace; font-size: 9px; opacity: 0.7; line-height: 1.5; }

            .comp-vibe { border: 1px solid #000; padding: 20px; margin: 50px 0; display: flex; align-items: center; justify-content: space-between; background: #fff; }
            .vibe-color { width: 40px; height: 40px; background: #000; border-radius: 2px; }
            .vibe-text { text-align: right; }
            .vibe-label { font-family: 'Jost', sans-serif; font-size: 9px; letter-spacing: 2px; color: #888; }
            .vibe-val { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; }

            .read-footer-actions { margin-top: 60px; margin-bottom: 40px; border-top: 1px solid #eee; padding-top: 30px; display: flex; justify-content: space-between; align-items: center; }
            .btn-signal { font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 2px; color: #1a1a1a; border: 1px dashed #999; padding: 10px 20px; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; }
            .btn-signal:hover { background: #fff; border-color: #1a1a1a; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
            
            .btn-next { font-family: 'Cinzel', serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; background: #1a1a1a; color: #fff; padding: 12px 24px; cursor: pointer; transition: all 0.3s; }
            .btn-next:hover { background: #333; box-shadow: 0 5px 20px rgba(0,0,0,0.15); }
            .btn-next i { margin-left: 5px; font-size: 10px; }

            /* === PAGE 4: EDITOR === */
            .page-editor { flex: 1; background: #fff; display: flex; flex-direction: column; height: 100%; position: relative; }
            .editor-header { height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid #eee; padding-top:10px; }
            
            .btn-publish { font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 2px; background: #000; color: #fff; padding: 10px 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.3s; }
            .btn-publish:hover { background: #333; padding-right: 25px; }

            .editor-area { flex: 1; overflow-y: auto; padding: 30px; }
            .edit-title-input { width: 100%; border: none; font-family: 'Cormorant Garamond', serif; font-size: 32px; color: #1a1a1a; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 30px; background: transparent; }
            .edit-content-input { width: 100%; min-height: 300px; border: none; font-family: 'Cormorant Garamond', serif; font-size: 18px; line-height: 1.8; color: #333; resize: none; background: transparent; }
            
            .comp-artifact { margin: 80px auto 40px; width: 100%; max-width: 340px; background: #111; color: #eee; border: 1px solid #333; position: relative; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.15); transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); display: flex; flex-direction: column; overflow: hidden; }
            .comp-artifact:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 20px 50px rgba(0,0,0,0.25); border-color: #555; }
            
            .artifact-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; background: #161616; }
            .artifact-id { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 2px; color: #666; }
            .artifact-stamp { font-family: 'Cinzel', serif; font-size: 10px; color: #fff; border: 1px solid #fff; padding: 2px 6px; letter-spacing: 1px; }

            .artifact-body { padding: 30px 20px; position: relative; }
            .artifact-label { font-family: 'Jost', sans-serif; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 8px; }
            .artifact-name { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-style: italic; color: #fff; line-height: 1.1; }

            .artifact-footer { padding: 15px 20px; background: #000; display: flex; justify-content: space-between; align-items: center; }
            .artifact-barcode { font-family: 'Libre Barcode 128 Text', cursive; font-size: 24px; color: #666; opacity: 0.5; }
            .artifact-action { font-family: 'Space Mono', monospace; font-size: 9px; color: #fff; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }

            /* === TYPEWRITER MODAL === */
            .letter-modal { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(20,20,20,0.85); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); z-index: 2000; display: none; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.5s; }
            .letter-modal.active { display: flex; opacity: 1; }

            .letter-paper { width: 90%; max-width: 380px; min-height: 400px; background: #fdfdfd; padding: 40px 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); position: relative; transform: scale(0.9); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; border: 1px solid #eee; }
            .letter-modal.active .letter-paper { transform: scale(1); }

            .letter-close { position: absolute; top: 15px; right: 20px; font-family: 'Jost', sans-serif; font-size: 20px; cursor: pointer; color: #999; transition: color 0.3s; }
            .letter-close:hover { color: #000; }

            .letter-header-meta { border-bottom: 1px solid #000; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; color: #000; }
            .meta-from { font-family: 'Cinzel', serif; font-size: 16px; font-weight: 600; color: #000; }
            .meta-date { font-family: 'Space Mono', monospace; font-size: 9px; color: #666; }

            .letter-body { font-family: 'Space Mono', monospace; font-size: 14px; line-height: 1.8; color: #333; flex: 1; white-space: pre-wrap; }
            .cursor { display: inline-block; width: 6px; height: 14px; background: #000; margin-left: 2px; animation: blink 1s infinite; vertical-align: middle; }
            
            /* === AESTHETIC OVERLAY === */
            .aesthetic-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #111; z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
            .aesthetic-overlay.active { opacity: 1; pointer-events: auto; }
            .loader-core { width: 80px; height: 80px; position: relative; display: flex; align-items: center; justify-content: center; }
            .loader-ring { position: absolute; width: 100%; height: 100%; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; animation: rotateRing 10s infinite linear; }
            .loader-ring::before { content: ''; position: absolute; top: -2px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background: #fff; border-radius: 50%; box-shadow: 0 0 10px #fff; }
            .loader-pulse { width: 40%; height: 40%; background: #fff; border-radius: 50%; opacity: 0.8; box-shadow: 0 0 30px rgba(255,255,255,0.3); animation: breathe 3s infinite ease-in-out; }
            .loader-ripple { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; animation: ripple 2.5s infinite cubic-bezier(0.165, 0.84, 0.44, 1); }
            .aes-text-container { margin-top: 50px; text-align: center; height: 40px; }
            .aes-main-text { font-family: 'Cinzel', serif; font-size: 14px; color: #fff; letter-spacing: 5px; font-weight: 300; opacity: 0; animation: fadeText 3s infinite; }
            .aes-sub-text { font-family: 'Space Mono', monospace; font-size: 9px; color: #666; margin-top: 8px; letter-spacing: 2px; }

            @keyframes rotateRing { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes breathe { 0%, 100% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.9; } }
            @keyframes ripple { 0% { width: 0%; height: 0%; opacity: 1; border-width: 2px; } 100% { width: 250%; height: 250%; opacity: 0; border-width: 0px; } }
            @keyframes fadeText { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

/* === 音乐播放器卡片 (BGM Widget) === */
            .chronicle-music-player {
                display: flex; align-items: center; gap: 15px; margin-top: 30px;
                padding: 12px; background: rgba(0,0,0,0.03); border-radius: 8px;
                border: 1px dashed rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s;
                max-width: 350px;
            }
            .chronicle-music-player:hover { background: rgba(0,0,0,0.06); border-style: solid; }
            .cmp-cover {
                width: 44px; height: 44px; border-radius: 4px; background-size: cover;
                background-color: #333; display: flex; justify-content: center; align-items: center;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            .cmp-btn { color: #fff; font-size: 16px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
            .cmp-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
            .cmp-title { font-family: 'Jost', sans-serif; font-weight: 600; font-size: 14px; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
            .cmp-artist { font-family: 'Jost', sans-serif; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
            
            /* 播放时的声波跳动动画 */
            .cmp-wave { display: flex; gap: 3px; height: 15px; align-items: flex-end; opacity: 0; transition: opacity 0.3s; padding-right: 10px;}
            .cmp-wave.playing { opacity: 1; }
            .cmp-bar { width: 2px; background: #111; animation: cmp-eq 1s infinite ease-in-out; border-radius: 1px; }
            .cmp-bar:nth-child(2) { animation-delay: 0.2s; }
            .cmp-bar:nth-child(3) { animation-delay: 0.4s; }
            @keyframes cmp-eq { 0%, 100% { height: 4px; } 50% { height: 100%; } }

/* === Reader Menu (右上角菜单) === */
            .nav-paginator { 
                cursor: pointer; 
                position: relative; /* 为了定位菜单 */
                transition: opacity 0.3s;
                z-index: 50;
            }
            .nav-paginator:hover { opacity: 0.6; text-decoration: underline; }
            
            .reader-menu {
                position: absolute;
                top: 100%;
                right: 0;
                width: 120px;
                background: #fff;
                border: 1px solid #1a1a1a;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                display: none; /* 默认隐藏 */
                flex-direction: column;
                margin-top: 10px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            .reader-menu.active {
                display: flex;
                opacity: 1;
                transform: translateY(0);
            }
            
            .reader-menu-item {
                padding: 12px 15px;
                font-family: 'Jost', sans-serif;
                font-size: 10px;
                letter-spacing: 2px;
                text-transform: uppercase;
                color: #333;
                border-bottom: 1px solid #eee;
                cursor: pointer;
                transition: background 0.2s;
                text-align: right;
            }
            .reader-menu-item:last-child { border-bottom: none; }
            .reader-menu-item:hover { background: #f4f4f4; color: #000; }
            .reader-menu-item.danger:hover { background: #fff0f0; color: #b91c1c; }

/* === 🔮 MAGIC CIRCLE LOADING (华丽满屏版) === */
            #magic-loading-overlay {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background-color: #fcfbf9; /* 更复古的羊皮纸色 */
                background-image: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.03) 100%), 
                                  url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
                z-index: 9999;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
                overflow: hidden;
            }

            #magic-loading-overlay.active { opacity: 1; pointer-events: auto; }

            /* 1. 顶部 HUD 信息栏 */
            .magic-top-hud {
                position: absolute;
                top: 50px; left: 0; width: 100%;
                padding: 0 40px;
                display: flex;
                justify-content: space-between;
                font-family: 'Space Mono', monospace;
                font-size: 9px;
                color: #888;
                letter-spacing: 2px;
                text-transform: uppercase;
                z-index: 10;
            }
            .hud-left span { display: block; margin-bottom: 4px; }
            .hud-right { text-align: right; }
            .hud-red-dot { display: inline-block; width: 6px; height: 6px; background: #c0392b; border-radius: 50%; margin-right: 5px; animation: blink 1s infinite; vertical-align: middle; }

            /* 2. 背景超大暗纹星盘 */
            .magic-bg-watermark {
                position: absolute;
                top: 50%; left: 50%;
                width: 150vw; height: 150vw;
                max-width: 800px; max-height: 800px;
                transform: translate(-50%, -50%);
                opacity: 0.04; /* 若隐若现 */
                pointer-events: none;
                animation: spin 120s linear infinite;
            }

            /* 3. 核心中央魔法阵 */
            .magic-svg {
                width: 320px;
                height: 320px;
                max-width: 90vw;
                position: relative;
                z-index: 5;
                filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.1));
            }

            /* --- 动画图层控制 --- */
            .mg-layer-1 { transform-origin: center; animation: spin 40s linear infinite; } /* 最外层文字环 */
            .mg-layer-2 { transform-origin: center; animation: spin-rev 25s linear infinite; } /* 次外层刻度 */
            .mg-layer-3 { transform-origin: center; animation: spin 15s cubic-bezier(0.4, 0, 0.2, 1) infinite; } /* 几何交叉环 */
            .mg-layer-4 { transform-origin: center; animation: spin-rev 10s linear infinite; } /* 内测天体轨道 */
            .mg-pulse { animation: magic-breathe 3s ease-in-out infinite; } /* 核心月亮 */
            .mg-star { animation: twinkle 2s ease-in-out infinite; }
            .mg-star:nth-child(even) { animation-delay: 1s; }

            /* 4. 底部动态文字 */
            .magic-text-box { margin-top: 40px; text-align: center; position: relative; z-index: 10; }
            .magic-title { font-family: 'Cinzel', serif; font-size: 20px; letter-spacing: 6px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; animation: fadeText 2s infinite; }
            .magic-sub { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 4px; color: #d4af37; text-transform: uppercase; }

            /* 动画定义 */
            @keyframes spin { 100% { transform: rotate(360deg); } }
            @keyframes spin-rev { 100% { transform: rotate(-360deg); } }
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
            @keyframes magic-breathe { 0%, 100% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1.02); opacity: 1; } }
            @keyframes twinkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        `;
        document.head.appendChild(style);

        // 2. 注入 HTML
        const container = document.createElement('div');
        container.id = this.rootId;
        container.innerHTML = `
            <!-- PAGE 1: LOBBY -->
            <div id="chronicle-page-lobby" class="page-lobby fade-in">
                <div class="lobby-top-bar">
                    <div class="header-brand">
                        <span class="brand-main">NOIR.</span>
                        <span class="brand-sub">ARCHIVE SYSTEM</span>
                    </div>
                    <div class="exit-btn-text" id="chronicle-exit-btn">BACK</div>
                </div>

                <div class="char-deck" id="chronicle-char-deck">
                    <!-- JS Dynamically Populated -->
                </div>
            </div>

            <!-- PAGE 2: INDEX -->
            <div id="chronicle-page-index" class="page-index hidden">
                <div class="index-nav-bar">
                    <div class="nav-btn-simple" id="chronicle-back-to-lobby"><i class="fa-solid fa-arrow-left"></i> BACK</div>
                    <div class="nav-btn-simple" id="chronicle-settings-btn">PERSONA SETTING</div>
                </div>

                <div class="index-deco-header">
                    <div class="receipt-row">
                        <div class="receipt-big-num" id="chronicle-index-num">01</div>
                        <div class="receipt-meta-box">
                            <div id="chronicle-index-author">NAME</div>
                            <div id="chronicle-index-title">TITLE</div>
                            <div style="margin-top:5px; color:#aaa;">STATUS: OPEN</div>
                        </div>
                    </div>
                    <div class="receipt-barcode">|| | ||| || |||</div>
                </div>

                <div class="chapter-container">
                    <div id="chronicle-chapter-list"></div>
                    <!-- AI 生成按钮 -->
                    <div class="btn-create-chapter" id="chronicle-ai-gen-btn" style="background:#1a1a1a; color:#fff; border-color:#1a1a1a; margin-bottom: 15px; margin-top: 30px;">+ DECRYPT CHARACTER LOG (AI)</div>
                    <!-- 原来的 User 按钮 -->
                    <div class="btn-create-chapter" id="chronicle-create-btn" style="margin-top: 0;">+ CREATE USER LOG</div>
                </div>

                <div class="settings-modal" id="chronicle-settings-modal">
                    <div class="modal-header">Persona Supplement</div>
                    <textarea class="modal-textarea" id="chronicle-persona-text" placeholder="Enter additional character context..."></textarea>
                    <div class="modal-actions">
                        <div class="btn-modal cancel" id="chronicle-close-settings">CANCEL</div>
                        <div class="btn-modal save" id="chronicle-save-settings">SAVE DATA</div>
                    </div>
                </div>
            </div>

            <!-- PAGE 3: READER -->
            <div id="chronicle-page-read" class="page-read hidden">
               <nav class="read-nav">
                    <div class="nav-back-text" id="chronicle-back-to-index">Index</div>
                    <!-- 给 Reader 加了 id 和 onclick -->
                    <div class="nav-paginator" id="chronicle-reader-trigger">
                        Reader
                        <!-- 下拉菜单结构 -->
                        <div class="reader-menu" id="chronicle-reader-menu">
                            <div class="reader-menu-item" id="btn-reader-collect">Collection</div>
                            <div class="reader-menu-item danger" id="btn-reader-delete">Delete Log</div>
                        </div>
                    </div>
                </nav>

                <div class="read-scroll-area" id="chronicle-read-scroll-area">
                    <div id="chronicle-read-content"></div>
                    <div class="read-footer-actions" id="chronicle-read-footer"></div>
                </div>
            </div>

            <!-- PAGE 4: EDITOR -->
            <div id="chronicle-page-editor" class="page-editor hidden">
                <div class="editor-header">
                    <div class="nav-back-text" id="chronicle-editor-discard">Discard</div>
                    <div class="btn-publish" id="chronicle-editor-publish">TRANSMIT <i class="fa-solid fa-satellite-dish"></i></div>
                </div>
                
                <div class="editor-area"> 
                    <input type="text" class="edit-title-input" id="chronicle-edit-title" value="">
                    <div class="edit-content-input" id="chronicle-edit-content" contenteditable="true" spellcheck="false"></div>
                </div>

                <div class="aesthetic-overlay" id="chronicle-aes-overlay">
                    <div class="loader-core">
                        <div class="loader-ring"></div>
                        <div class="loader-ripple"></div>
                        <div class="loader-pulse"></div>
                    </div>
                    <div class="aes-text-container">
                        <div class="aes-main-text" id="chronicle-aes-text-main">CONNECTING</div>
                        <div class="aes-sub-text" id="chronicle-aes-text-sub">ESTABLISHING LINK</div>
                    </div>
                </div>
            </div>
            
            <!-- White Paper Modal -->
            <div class="letter-modal" id="chronicle-letter-modal">
                <div class="letter-paper">
                    <div class="letter-close" id="chronicle-close-letter">&times;</div>
                    <div class="letter-header-meta">
                        <div class="meta-from" id="chronicle-letter-from">FROM: UNKNOWN</div>
                        <div class="meta-date" id="chronicle-letter-date">DATE: TODAY</div>
                    </div>
                    <div class="letter-body" id="chronicle-letter-body"><span class="cursor"></span></div>
                </div>
            </div>
<!-- 🔮 MAGIC LOADING OVERLAY (华丽饱满版) -->
            <div id="magic-loading-overlay">
                
                <!-- 1. 顶部 HUD (填补上半部分空白) -->
                <div class="magic-top-hud">
                    <div class="hud-left">
                        <span><span class="hud-red-dot"></span>NEURAL LINK ACTIVE</span>
                        <span style="opacity:0.5;">ARCHIVE.SYS.V2</span>
                    </div>
                    <div class="hud-right">
                        <span>LAT: 41°24'N</span>
                        <span style="opacity:0.5;">LON: 2°10'E</span>
                    </div>
                </div>

                <!-- 2. 巨大背景暗纹 (填补四周空白) -->
                <svg class="magic-bg-watermark" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="300" cy="300" r="280" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="2 10"/>
                    <circle cx="300" cy="300" r="240" fill="none" stroke="#000" stroke-width="0.5"/>
                    <path d="M 20 300 L 580 300 M 300 20 L 300 580" stroke="#000" stroke-width="0.5" stroke-dasharray="5 5"/>
                    <circle cx="300" cy="300" r="150" fill="none" stroke="#000" stroke-width="2" stroke-dasharray="50 20"/>
                </svg>

                <!-- 3. 核心高精度魔法阵 (400x400 超大视口，细节翻倍) -->
                <svg class="magic-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#d4af37" stop-opacity="0.2"/>
                            <stop offset="100%" stop-color="#d4af37" stop-opacity="1"/>
                        </linearGradient>
                        <!-- 定义文字环绕的路径 -->
                        <path id="text-path" d="M 200, 40 A 160,160 0 1,1 199.9,40" />
                    </defs>

                    <!-- Layer 1: 最外层咒语环与刻度 -->
                    <g class="mg-layer-1">
                        <circle cx="200" cy="200" r="180" fill="none" stroke="#d4af37" stroke-width="0.5" stroke-dasharray="4 6"/>
                        <circle cx="200" cy="200" r="170" fill="none" stroke="#1a1a1a" stroke-width="1"/>
                        <!-- 环绕的拉丁文/代码文字 -->
                        <text font-family="'Cinzel', serif" font-size="12" fill="#d4af37" letter-spacing="8">
                            <textPath href="#text-path" startOffset="5%">DECRYPTING ARCHIVE · SEEKING THE TRUTH IN THE VOID · COGITOS ERGO SUM ·</textPath>
                        </text>
                        <text font-family="'Cinzel', serif" font-size="12" fill="#d4af37" letter-spacing="8">
                            <textPath href="#text-path" startOffset="55%">SYSTEM OVERRIDE PROTOCOL INITIATED · NOIR CHRONICLE SYSTEM ·</textPath>
                        </text>
                    </g>

                    <!-- Layer 2: 复杂的交叉射线与天体支架 -->
                    <g class="mg-layer-2">
                        <circle cx="200" cy="200" r="145" fill="none" stroke="#1a1a1a" stroke-width="0.5"/>
                        <!-- 八芒星骨架 -->
                        <path d="M 55 55 L 345 345 M 55 345 L 345 55 M 200 10 L 200 390 M 10 200 L 390 200" stroke="#1a1a1a" stroke-width="0.5" opacity="0.3"/>
                        <!-- 轨道节点 -->
                        <circle cx="200" cy="55" r="4" fill="#1a1a1a"/>
                        <circle cx="200" cy="345" r="4" fill="#1a1a1a"/>
                        <circle cx="55" cy="200" r="4" fill="#1a1a1a"/>
                        <circle cx="345" cy="200" r="4" fill="#1a1a1a"/>
                        <!-- 外围细碎装饰线 -->
                        <circle cx="200" cy="200" r="130" fill="none" stroke="#d4af37" stroke-width="1.5" stroke-dasharray="1 10"/>
                    </g>

                    <!-- Layer 3: 核心几何 (六芒星交叠) -->
                    <g class="mg-layer-3">
                        <circle cx="200" cy="200" r="100" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.5"/>
                        <!-- 两个倒置的等边三角形构成六芒星 -->
                        <polygon points="200,80 304,260 96,260" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>
                        <polygon points="200,320 304,140 96,140" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>
                        <!-- 六个顶点上的小金点 -->
                        <circle cx="200" cy="80" r="3" fill="#d4af37" class="mg-star"/>
                        <circle cx="304" cy="260" r="3" fill="#d4af37" class="mg-star"/>
                        <circle cx="96" cy="260" r="3" fill="#d4af37" class="mg-star"/>
                        <circle cx="200" cy="320" r="3" fill="#d4af37" class="mg-star"/>
                        <circle cx="304" cy="140" r="3" fill="#d4af37" class="mg-star"/>
                        <circle cx="96" cy="140" r="3" fill="#d4af37" class="mg-star"/>
                    </g>

                    <!-- Layer 4: 内侧天体运转轨道 -->
                    <g class="mg-layer-4">
                        <circle cx="200" cy="200" r="65" fill="none" stroke="#1a1a1a" stroke-width="0.8" stroke-dasharray="15 5"/>
                        <circle cx="135" cy="200" r="6" fill="#1a1a1a"/>
                        <circle cx="265" cy="200" r="4" fill="none" stroke="#d4af37" stroke-width="2"/>
                    </g>

                    <!-- 核心: 会呼吸的新月与金球 -->
                    <g class="mg-pulse">
                        <circle cx="200" cy="200" r="40" fill="none" stroke="#d4af37" stroke-width="0.5"/>
                        <!-- 黑月 -->
                        <path d="M 180 170 A 45 45 0 1 0 180 230 A 32 32 0 1 1 180 170" fill="#1a1a1a"/>
                        <!-- 垂挂的金球 -->
                        <line x1="200" y1="200" x2="200" y2="250" stroke="#d4af37" stroke-width="1"/>
                        <circle cx="200" cy="250" r="4" fill="url(#gold-grad)"/>
                    </g>
                </svg>

                <!-- 4. 底部文字 -->
                <div class="magic-text-box">
                    <div class="magic-title" id="magic-loading-text">DECRYPTING</div>
                    <div class="magic-sub">Establishing Neural Link</div>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // 3. 绑定事件
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('chronicle-exit-btn').onclick = () => this.close();
        document.getElementById('chronicle-back-to-lobby').onclick = () => this.navTo('lobby');
        document.getElementById('chronicle-settings-btn').onclick = () => this.toggleSettingsModal(true);
        document.getElementById('chronicle-close-settings').onclick = () => this.toggleSettingsModal(false);
        document.getElementById('chronicle-save-settings').onclick = () => this.savePersonaSettings();
        
        // 两个不同的生成按钮
        document.getElementById('chronicle-create-btn').onclick = () => this.openEditor();
        document.getElementById('chronicle-ai-gen-btn').onclick = () => this.generateCharacterLog();

        document.getElementById('chronicle-back-to-index').onclick = () => this.navTo('index');
        document.getElementById('chronicle-editor-discard').onclick = () => this.navTo('index');
        document.getElementById('chronicle-editor-publish').onclick = () => this.shareToCharacter();
        document.getElementById('chronicle-close-letter').onclick = () => this.closeLetter();

document.getElementById('chronicle-reader-trigger').onclick = (e) => this.toggleReaderMenu(e);
        document.getElementById('btn-reader-delete').onclick = (e) => {
            e.stopPropagation(); // 防止菜单立刻关闭导致点击无效
            this.deleteCurrentLog();
        };
        document.getElementById('btn-reader-collect').onclick = (e) => {
            e.stopPropagation();
            this.toggleCollection();
        };

        // 👇 新增：点击页面其他地方关闭菜单
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('chronicle-reader-menu');
            const trigger = document.getElementById('chronicle-reader-trigger');
            if (menu && menu.classList.contains('active') && !trigger.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
        document.addEventListener('click', (e) => {
            // 1. 批注点击逻辑
            const wrapper = e.target.closest('.annotation-wrapper');
            if (wrapper && document.getElementById('chronicle-app-container').contains(wrapper)) {
                wrapper.classList.toggle('active');
            }
            
            // 2. 👇 新增：音乐播放器点击逻辑
            const musicPlayer = e.target.closest('.chronicle-music-player');
            if (musicPlayer && document.getElementById('chronicle-app-container').contains(musicPlayer)) {
                this.toggleMusic(musicPlayer);
            }
        });
    },

// === 新增功能区 ===

    // 1. 切换菜单显示/隐藏
    toggleReaderMenu(e) {
        if (e) e.stopPropagation(); // 阻止冒泡
        const menu = document.getElementById('chronicle-reader-menu');
        if (menu.classList.contains('active')) {
            menu.classList.remove('active');
        } else {
            menu.classList.add('active');
        }
    },

    // 2. 删除当前文章逻辑
    async deleteCurrentLog() {
        const id = this.currentReadingId;
        if (!id) return;

        // 保护静态模板 (404那篇) 不被删除
        if (String(id).startsWith('static_')) {
            window.utils.showToast("System File: Access Denied.");
            return;
        }

        if (confirm("【CONFIRM DELETION】\n\n此操作将永久销毁这份档案记录。\n确定要执行吗？")) {
            try {
                // 1. 从数据库删除
                await window.dbHelper.delete('chronicles', parseInt(id));
                
                // 2. 从当前内存数据中移除
                this.currentData.chapters = this.currentData.chapters.filter(c => c.id !== id);
                
                window.utils.showToast("Log destroyed.");
                
                // 3. 返回目录并刷新列表
                this.navTo('index');
                // 强制重新渲染目录列表
                this.loadAndRenderChapters(); 

            } catch (e) {
                console.error(e);
                window.utils.showToast("Deletion failed.");
            }
        }
    },

    // 3. 收藏逻辑 (占位)
    toggleCollection() {
        window.utils.showToast("已加入收藏队列 (Feature coming soon)");
        // 这里的逻辑以后再写
    },

// 👇 新增：播放控制引擎
    toggleMusic(playerEl) {
        const src = playerEl.dataset.src;
        if (!src) return;

        if (!this.currentAudio) {
            this.currentAudio = new Audio();
            this.currentAudio.loop = true; // 循环播放 BGM
        }

        const icon = playerEl.querySelector('.cmp-btn');
        const wave = playerEl.querySelector('.cmp-wave');

        // 如果点击的是一首新歌
        if (this.currentAudio.src !== src) {
            this.currentAudio.src = src;
            this.currentAudio.play();
            
            // 把页面上其他的播放器都重置为暂停状态
            document.querySelectorAll('.chronicle-music-player').forEach(p => {
                p.querySelector('.cmp-btn').className = 'fa-solid fa-play cmp-btn';
                p.querySelector('.cmp-wave').classList.remove('playing');
            });
            
            icon.className = 'fa-solid fa-pause cmp-btn';
            wave.classList.add('playing');
        } 
        // 如果点击的是当前正在播放的歌 (暂停/继续)
        else {
            if (this.currentAudio.paused) {
                this.currentAudio.play();
                icon.className = 'fa-solid fa-pause cmp-btn';
                wave.classList.add('playing');
            } else {
                this.currentAudio.pause();
                icon.className = 'fa-solid fa-play cmp-btn';
                wave.classList.remove('playing');
            }
        }
    },

    // 核心逻辑：渲染角色列表
    async renderLobby() {
        const container = document.getElementById('chronicle-char-deck');
        container.innerHTML = '';
        
        const dossiers = window.appState.dossiers;

        if (!dossiers || dossiers.length === 0) {
            container.innerHTML = '<div style="text-align:center; opacity:0.5;">NO ARCHIVES FOUND</div>';
            return;
        }

        for (const dossier of dossiers) {
            const card = document.createElement('div');
            card.className = 'chronicle-poster';
            
            let avatarUrl = '';
            if (dossier.character.avatarAssetId) {
                const asset = await window.dbHelper.get('assets', dossier.character.avatarAssetId);
                if (asset?.file) avatarUrl = URL.createObjectURL(asset.file);
            }
            
            let pinyinName = dossier.character.name;
            if (window.pinyinPro) {
                const pinyinArr = window.pinyinPro.pinyin(dossier.character.name, { toneType: 'none', type: 'array' });
                pinyinName = pinyinArr.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
            }
            
            const imgHtml = avatarUrl ? `<img src="${avatarUrl}" alt="${dossier.character.name}">` : `<div style="width:100%;height:100%;background:#333;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Cinzel';font-size:40px;">${dossier.character.name[0]}</div>`;

            card.innerHTML = `
                <div class="chronicle-img-box">${imgHtml}</div>
                <div class="chronicle-overlay">
                    <div class="chronicle-title">${pinyinName.toUpperCase()}</div>
                    <div class="chronicle-meta">
                        <span>ARCHIVE</span>
                        <span><i class="fa-solid fa-arrow-right chronicle-arrow"></i></span>
                    </div>
                </div>
            `;
            
            card.onclick = () => this.enterIndex(dossier, pinyinName);
            container.appendChild(card);
        }
    },

    async enterIndex(dossier, pinyinName) {
        this.currentData = {
            id: dossier.id,
            dossierRef: dossier,
            name: pinyinName.toUpperCase(),
            title: `ARCHIVE NO.${dossier.id}`,
            num: String(dossier.id).padStart(2, '0')
        };

        const supp = await window.dbHelper.get('user_settings', `chronicle_supp_${dossier.id}`);
        this.currentData.personaNote = supp ? supp.value : '';

        document.getElementById('chronicle-index-title').innerText = this.currentData.title;
        document.getElementById('chronicle-index-author').innerText = this.currentData.name;
        document.getElementById('chronicle-index-num').innerText = this.currentData.num;
        
        await this.loadAndRenderChapters();
        this.navTo('index');
    },

    // 动态加载数据库和静态模板的混合列表
    async loadAndRenderChapters() {
        const list = document.getElementById('chronicle-chapter-list');
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">正在检索档案...</div>';
        
        const dbChapters = await window.dbHelper.dbPromise.then(db => 
            db.getAllFromIndex('chronicles', 'by_dossierId', this.currentData.id)
        );
        
        this.currentData.chapters = [...this.staticChaptersTemplate, ...dbChapters];

        if (this.currentData.chapters.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:30px; color:#999; font-style:italic;">NO LOGS FOUND</div>';
            return;
        }

        list.innerHTML = this.currentData.chapters.map((chap, i) => `
            <div class="modern-list-item" onclick="ChronicleApp.openChapter('${chap.id}')">
                <div class="li-top"><span>${String(i+1).padStart(2, '0')}</span><span>READ ACCESS</span></div>
                <div class="li-title">${chap.title}</div>
                <div class="li-arrow"><i class="fa-solid fa-arrow-right"></i></div>
            </div>`).join('');
    },

    openChapter(chapId) {

this.currentReadingId = chapId; 

        const chap = this.currentData.chapters.find(c => String(c.id) === String(chapId));
        if(!chap) return;

        document.getElementById('chronicle-read-content').innerHTML = chap.html;
        document.getElementById('chronicle-read-scroll-area').scrollTop = 0;
        
        const footer = document.getElementById('chronicle-read-footer');
        footer.style.justifyContent = 'space-between';
        
        if (chap.type === 'user') {
            footer.style.justifyContent = 'flex-end';
            footer.innerHTML = `<div class="btn-next" onclick="ChronicleApp.navTo('index')">CLOSE FILE <i class="fa-solid fa-times" style="margin-left:8px;"></i></div>`;
        } else {
            footer.innerHTML = `
                <div class="btn-signal" onclick="window.utils.showToast('Signal sent.')">SIGNAL UPDATE</div>
                <div class="btn-next" onclick="window.utils.showToast('End of file.')">NEXT PAGE <i class="fa-solid fa-arrow-right"></i></div>
            `;
        }
        this.navTo('read');
    },

    // === AI 核心生成逻辑 (带魔法阵动画 + 音乐 + 智能容错) ===
    async generateCharacterLog() {
        const btn = document.getElementById('chronicle-ai-gen-btn');
        btn.style.pointerEvents = 'none'; // 禁用按钮防止重复点击
        
        // 1. 🔮 启动魔法阵动画
        const overlay = document.getElementById('magic-loading-overlay');
        const statusText = document.getElementById('magic-loading-text');
        overlay.classList.add('active');
        
        // 模拟神秘学文字变化 (校准星辰 -> 读取灵魂 -> 编织命运)
        statusText.textContent = "ALIGNING STARS"; 
        // 使用一个标志位，防止关闭动画后文字还在变
        this.loadingTimer1 = setTimeout(() => { if(overlay.classList.contains('active')) statusText.textContent = "READING SOUL"; }, 2000); 
        this.loadingTimer2 = setTimeout(() => { if(overlay.classList.contains('active')) statusText.textContent = "WEAVING FATE"; }, 4500); 

        try {
            // 获取最近聊天记录
            const history = await window.dbHelper.getHistoryForDossier(this.currentData.id);
            const recentHistory = history.slice(-20); 

            // 调用 AI
            const prompt = window.promptManager.createChronicleArticlePrompt(
                this.currentData.dossierRef, 
                this.currentData.personaNote,
                recentHistory
            );
            
            const aiResponse = await window.apiHelper.getChatCompletion(prompt);
            
            // --- JSON 解析 (保留你现在的智能容错逻辑) ---
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("AI未返回JSON数据");
            
            let jsonString = jsonMatch[0];
            let result;
            
            try {
                result = JSON.parse(jsonString); // 尝试标准解析
            } catch (err) {
                console.warn("⚠️ 标准 JSON 解析失败，尝试强制清除违规换行符...");
                try {
                    let cleanedJson = jsonString.replace(/[\n\r\t]/g, ""); // 暴力清洗
                    result = JSON.parse(cleanedJson);
                } catch (err2) {
                    console.error("❌ 原始 AI 返回的坏数据:", aiResponse);
                    throw new Error("AI 生成格式严重损坏，请重试");
                }
            }

            // --- 网易云音乐逻辑 (在动画覆盖下静默执行) ---
            let bgmHtml = '';
            if (result.bgm_keyword && result.bgm_keyword !== 'null') {
                // 此时还在转圈，我们悄悄改一下 loading 文字，显得很智能
                statusText.textContent = "TUNING RESONANCE"; 
                
                const musicData = await this.fetchNeteaseMusic(result.bgm_keyword);
                
                if (musicData) {
                    bgmHtml = `
                        <div class="chronicle-music-player" data-src="${musicData.audioUrl}">
                            <div class="cmp-cover" style="background-image: url('${musicData.coverUrl}')">
                                <i class="fa-solid fa-play cmp-btn"></i>
                            </div>
                            <div class="cmp-info">
                                <div class="cmp-title">${musicData.title}</div>
                                <div class="cmp-artist">${musicData.artist}</div>
                            </div>
                            <div class="cmp-wave">
                                <div class="cmp-bar"></div><div class="cmp-bar"></div><div class="cmp-bar"></div>
                            </div>
                        </div>
                    `;
                }
            }

            // --- 拼装 HTML ---
            const chapIndex = (this.currentData.chapters?.length || 0) + 1;
            const fullHtml = `
                <div class="chapter-header">
                    <span class="ch-num">FILE_${String(chapIndex).padStart(2,'0')}</span>
                    <h2 class="ch-title">${result.title}</h2>
                    ${bgmHtml}
                </div>
                <div class="article-text">${result.contentHtml}</div>
            `;

            // --- 存入数据库 ---
            const newLog = {
                dossierId: this.currentData.id,
                title: result.title,
                type: 'character', 
                html: fullHtml,
                timestamp: Date.now()
            };
            const newId = await window.dbHelper.add('chronicles', newLog);
            newLog.id = newId;
            
            // --- 刷新界面 ---
            await this.loadAndRenderChapters();
            
            // 2. ✅✅✅ 一切就绪，关闭魔法阵动画！✅✅✅
            overlay.classList.remove('active');
            
            window.utils.showToast("档案解密完成");

        } catch (e) {
            console.error(e);
            // ❌ 发生错误，也要记得关闭动画，否则用户会卡死在转圈界面
            overlay.classList.remove('active');
            window.utils.showToast("解密中断：星轨错位 (请检查网络)");
        } finally {
            // 恢复按钮状态
            btn.innerText = "+ DECRYPT CHARACTER LOG (AI)";
            btn.style.pointerEvents = 'auto';
            // 清理定时器
            clearTimeout(this.loadingTimer1);
            clearTimeout(this.loadingTimer2);
        }
    },

    // User 原有编辑器
    openEditor() {
        document.getElementById('chronicle-edit-title').value = "SIGNAL_LOST_404";
        document.getElementById('chronicle-edit-content').innerHTML = `
            <p>Sometimes I feel like I'm transmitting into a void.</p>
            <p>The city lights blur into streaks of neon rain, and I wonder if my memories are just data fragments waiting to be overwritten.</p>
            <p>Are you listening? Or are you just another ghost in the machine?</p>
            <p>I keep waiting for a sign, a glitch, something to prove this connection is real.</p>
        `;
        this.navTo('editor');
    },

    shareToCharacter() {
        const overlay = document.getElementById('chronicle-aes-overlay');
        const txtMain = document.getElementById('chronicle-aes-text-main');
        const txtSub = document.getElementById('chronicle-aes-text-sub');
        overlay.classList.add('active');

        txtMain.innerText = "SEARCHING"; txtSub.innerText = "DETECTING CARRIER SIGNAL";
        
        setTimeout(() => { txtMain.innerText = "SYNCING"; txtSub.innerText = "NEURAL HANDSHAKE: 30%"; }, 1500);
        setTimeout(() => { txtMain.innerText = "READING"; txtSub.innerText = `${this.currentData.name} IS ACCESSING MEMORY...`; }, 3000);
        setTimeout(() => { txtMain.innerText = "PROCESSING"; txtSub.innerText = "WEAVING THOUGHTS INTO WORDS"; }, 5000);

        setTimeout(async () => {
            const title = document.getElementById('chronicle-edit-title').value;
            const rawContent = document.getElementById('chronicle-edit-content').innerHTML;
            
            const finalHtml = this.processCharacterFeedback(title, rawContent);

            // 保存用户日志到数据库
            const newLog = {
                dossierId: this.currentData.id,
                title: title,
                type: 'user', 
                html: finalHtml,
                timestamp: Date.now()
            };
            const newId = await window.dbHelper.add('chronicles', newLog);
            newLog.id = newId;

            overlay.classList.remove('active');
            setTimeout(() => { txtMain.innerText = "CONNECTING"; }, 1000);
            
            await this.loadAndRenderChapters();
            this.openChapter(newId);
        }, 7000);
    },

    processCharacterFeedback(title, content) {
        let annotatedContent = content;
        const keywords = {
            'void': "Null pointer exception.",
            'ghost': "Entity unknown. Daemon process?",
            'glitch': "I am not a glitch. I am a feature.",
            'machine': "We are all part of the system.",
            'rain': "Visual sensor interference."
        };

        for (let word in keywords) {
            if (annotatedContent.includes(word)) {
                const note = keywords[word];
                const replacement = `<span class="annotation-wrapper"><span class="annotation-trigger">${word}</span><span class="annotation-original"></span><span class="annotation-note">${note}</span></span>`;
                annotatedContent = annotatedContent.replace(word, replacement);
            }
        }

        const finalMsg = "I received your transmission. Data integrity 100%.";
        const safeMsg = encodeURIComponent(finalMsg);

        const artifactHtml = `
            <div class="comp-artifact" onclick="ChronicleApp.openLetter('${this.currentData.name}', '${safeMsg}')">
                <div class="artifact-header">
                    <span class="artifact-id">ID: ${Math.floor(Math.random()*9000)+1000}</span>
                    <span class="artifact-stamp">PRIVATE</span>
                </div>
                <div class="artifact-body">
                    <div class="artifact-label">FROM THE ARCHIVE OF</div>
                    <div class="artifact-name">${this.currentData.name}</div>
                </div>
                <div class="artifact-footer">
                    <div class="artifact-barcode">|| ||| |||</div>
                    <div class="artifact-action">ACCESS DATA</div>
                </div>
            </div>
        `;

        return `<div class="chapter-header"><span class="ch-num">TRANSMISSION_LOG</span><h2 class="ch-title">${title}</h2></div><div class="article-text">${annotatedContent}</div>${artifactHtml}`;
    },

    typeInterval: null,

    openLetter(from, encodedMsg) {
        const msg = decodeURIComponent(encodedMsg);
        document.getElementById('chronicle-letter-from').innerText = `FROM: ${from}`;
        document.getElementById('chronicle-letter-date').innerText = `DATE: ${new Date().toLocaleTimeString()}`;
        document.getElementById('chronicle-letter-modal').classList.add('active');
        
        const body = document.getElementById('chronicle-letter-body');
        body.innerHTML = '<span class="cursor"></span>';
        
        const mistake = "Searching for data...";
        
        this.typewriterSequence(body, mistake, msg);
    },

    closeLetter() {
        document.getElementById('chronicle-letter-modal').classList.remove('active');
        clearInterval(this.typeInterval);
    },

    typewriterSequence(element, mistakeStr, finalStr) {
        let cursorHtml = '<span class="cursor"></span>';
        let currentText = "";
        let state = 0; 
        let i = 0;
        
        clearInterval(this.typeInterval);

        this.typeInterval = setInterval(() => {
            if (state === 0) {
                if (i < mistakeStr.length) {
                    currentText += mistakeStr.charAt(i);
                    element.innerHTML = currentText + cursorHtml;
                    i++;
                } else {
                    state = 1; 
                    clearInterval(this.typeInterval);
                    setTimeout(() => { this.typeInterval = setInterval(step.bind(this), 40); }, 600);
                    return;
                }
            }
        }, 80);

        const step = () => {
             if (state === 1) {
                 if (currentText.length > 0) {
                    currentText = currentText.slice(0, -1);
                    element.innerHTML = currentText + cursorHtml;
                } else {
                    state = 2; i = 0;
                    clearInterval(this.typeInterval);
                    setTimeout(() => { this.typeInterval = setInterval(step.bind(this), 80); }, 400);
                }
            } else if (state === 2) {
                if (i < finalStr.length) {
                    currentText += finalStr.charAt(i);
                    element.innerHTML = currentText + cursorHtml;
                    i++;
                } else { clearInterval(this.typeInterval); }
            }
        };
    },

    navTo(pageId) {
        ['lobby', 'index', 'read', 'editor'].forEach(p => {
            document.getElementById(`chronicle-page-${p}`).classList.add('hidden');
        });
        
        const target = document.getElementById(`chronicle-page-${pageId}`);
        target.classList.remove('hidden');
        target.classList.add('fade-in');

        if (pageId === 'lobby') {
            this.renderLobby();
        }
    },

    toggleSettingsModal(show) {
        const m = document.getElementById('chronicle-settings-modal');
        if(show) {
             document.getElementById('chronicle-persona-text').value = this.currentData.personaNote || '';
             m.classList.add('active');
        } else {
             m.classList.remove('active');
        }
    },

    async savePersonaSettings() {
        this.currentData.personaNote = document.getElementById('chronicle-persona-text').value;
        this.toggleSettingsModal(false);
        await window.dbHelper.set('user_settings', { value: this.currentData.personaNote }, `chronicle_supp_${this.currentData.id}`);
        window.utils.showToast('世界观设定已同步更新。');
    },

    open() {
        this.init();
        document.getElementById(this.rootId).classList.add('visible');
        this.navTo('lobby');
    },

    close() {
        document.getElementById(this.rootId).classList.remove('visible');
    }
};