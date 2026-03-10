// --- Chronicle / Noir Archive System (True 1:1 Replica with AI Logic) ---
const ChronicleApp = {
    rootId: 'chronicle-app-container',
    currentData: null,

neteaseApiBase: 'https://api-enhanced-phi.vercel.app', 
    currentAudio: null,

vipCookie: 'MUSIC_U=0083DBEBBBE43BB0D5B4BD18E5FAB80C5A1205AF561EE73EF1E3FE563D6773EF4657F18F2114D6AD197664866FB97B9F1F09034B907DEA55DF5B1967389692EC5FB8220DAC58220E71404EEE9EEA497C81F12393F9099D9D1622FDF029BBEF973B7A44B5143352C0350D7C3633013E55D7E44E432C5EA867C9EB1B52D1395C4BFBDBE4A60BAF8EB48D5140A374AD73CA77F59B1CD35A30BE19FDC1C6590CC49CFA3616B67564A9E08C13946756330A0421E813ECA1E331742284C5EF9D5609DAB9C734C6AA8841B1E8B646443E4AC31A99DCFC3A69EFE16996C14A60BB7699D68AC9ADE42CF85DFAF6CEE42E3A4027CCE1740156540CAAD95DDBAD9CF0689C5C1A21BCC538EE8084FE81AAF7FE14920443BB8037C1F55257B9BEFEA1C511DFEAB7ED8F189832D15093D8A92EBD0E9DC7839751546E222FAE9CFA4710E372A9C60D38E3EDB54CDEB19AA43606F6053805E60DA548BD0326E307CC887A82546598D7440A843AD6BBE59EED28D09BCB2FEBFCF99A90377E8DE26A96DD4F5BFF8D3E9CA231B8888E7B4653F436A23372F77AD23A73C2ECC95AC81DF2BD28640DF97827;', 
    currentAudio: null,
    staticChaptersTemplate: [],

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

/* 🌟 新增：背景设定模板标签 (AU Presets) */
            .template-strip {
                display: flex; gap: 8px; margin-bottom: 15px; 
                overflow-x: auto; padding-bottom: 8px;
                -webkit-overflow-scrolling: touch;
            }
            .template-strip::-webkit-scrollbar { height: 2px; }
            .template-strip::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px;}
            
            .tpl-chip {
                background: #eee; padding: 6px 14px; 
                font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 500;
                color: #555; border-radius: 16px; white-space: nowrap; 
                cursor: pointer; display: flex; align-items: center; gap: 8px; 
                border: 1px solid transparent; transition: all 0.2s;
            }
            .tpl-chip:hover { background: #e0e0e0; color: #111; border-color: #aaa; }
            
            /* 删除小叉号 */
            .tpl-del { opacity: 0.5; transition: opacity 0.2s; }
            .tpl-del:hover { opacity: 1; color: #dc2626; }
            
            /* 新增按钮专属样式 */
            .tpl-chip.add-new { background: #1a1a1a; color: #fff; }
            .tpl-chip.add-new:hover { background: #333; border-color: #1a1a1a; }

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
            
            /* === AESTHETIC OVERLAY (Neural Core 3D 版) === */
            .aesthetic-overlay { 
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                background-color: #e2e8f0; /* 配合 3D 场景的底色 */
                z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; 
                opacity: 0; pointer-events: none; transition: opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94); 
            }
            .aesthetic-overlay.active { opacity: 1; pointer-events: auto; }
            
            /* WebGL 容器层级设置 */
            #neural-webgl-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;
            }

            /* 文字浮在 3D 动画上方 */
            .aes-text-container { 
                position: absolute; bottom: 12%; width: 100%; 
                text-align: center; z-index: 10; pointer-events: none; 
            }
            .aes-main-text { 
                font-family: 'Cinzel', serif; font-size: 16px; 
                color: #111; /* 改为深色，在浅色背景上更醒目 */
                letter-spacing: 5px; font-weight: 700; transition: opacity 0.5s; 
            }
            .aes-sub-text { 
                font-family: 'Space Mono', monospace; font-size: 10px; 
                color: #555; margin-top: 8px; letter-spacing: 2px; transition: opacity 0.5s; 
            } 

/* === 🎧 磁带音乐播放器 (透明亚克力版) === */
            .chronicle-music-player {
                display: flex; justify-content: center;
                margin: 50px 0 40px; cursor: pointer; position: relative; width: 100%;
                -webkit-tap-highlight-color: transparent;
            }
            
            /* 磁带全透明磨砂外壳 */
            .cmp-cassette {
                width: 100%; max-width: 340px; height: 215px;
                /* 背景改为极淡的半透明白，模拟透明塑料 */
                background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%);
                backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); /* 磨砂感 */
                border: 1px solid rgba(255, 255, 255, 0.5);
                border-top: 1px solid rgba(255, 255, 255, 0.8); /* 顶部高光 */
                border-radius: 12px;
                /* 增加内部阴影模拟厚度 */
                box-shadow: 
                    0 20px 40px rgba(0,0,0,0.1), 
                    inset 0 0 0 1px rgba(255,255,255,0.2),
                    inset 0 0 15px rgba(255,255,255,0.1);
                position: relative; overflow: hidden;
            }
            
            /* 内部深色磁带盘结构 (透过外壳隐约可见) */
            .cmp-cassette::before {
                content: ''; position: absolute; top: 50%; left: 15%; right: 15%; height: 80px; transform: translateY(-50%);
                background: #111; border-radius: 40px; opacity: 0.1; filter: blur(10px); pointer-events: none;
            }

            /* 螺丝钉 (保持不变) */
            .cs-screw {
                position: absolute; width: 10px; height: 10px; background: #dcdcdc; border-radius: 50%;
                box-shadow: inset 1px 1px 2px rgba(0,0,0,0.2);
            }
            .cs-screw::after {
                content: ''; position: absolute; width: 6px; height: 1px; background: #999; 
                top: 4.5px; left: 2px; transform: rotate(45deg);
            }
            .cs-screw.tl { top: 8px; left: 8px; } .cs-screw.tr { top: 8px; right: 8px; transform: rotate(20deg); }
            .cs-screw.bl { bottom: 8px; left: 8px; transform: rotate(-30deg); } .cs-screw.br { bottom: 8px; right: 8px; transform: rotate(70deg); }

            /* 贴纸区域 */
            .cs-sticker {
                position: absolute; top: 32px; bottom: 32px; left: 28px; right: 28px;
                /* 上半部分纯白，下半部分半透灰磨砂 */
                background: linear-gradient(180deg, #fdfdfd 55%, rgba(60, 65, 70, 0.15) 55%);
                border-radius: 4px; 
                /* 贴纸边缘的轻微投影 */
                box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                display: flex; overflow: hidden;
            }

            /* 贴纸左侧 */
            .cs-left { padding: 12px; width: 80px; display: flex; flex-direction: column; align-items: center; }
            .cmp-cover {
                width: 48px; height: 48px; background-size: cover; background-position: center; background-color: #222;
                border: 1px solid rgba(0,0,0,0.1); border-radius: 2px;
                display: flex; justify-content: center; align-items: center;
            }
            .cmp-btn { color: rgba(255,255,255,0.95); font-size: 18px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.8)); }
            
            .cs-side { margin-top: 25px; font-family: 'Space Mono', monospace; font-size: 10px; color: #fff; opacity: 0.8; font-weight: bold; }
            .cs-side span { font-size: 16px; border: 1px solid rgba(255,255,255,0.5); padding: 0 4px; border-radius: 2px; }

            /* 贴纸右侧 (包含歌曲信息) */
            .cs-right { flex: 1; position: relative; padding: 10px 15px 10px 0; display: flex; flex-direction: column; }
            
            /* 🎵 歌曲信息：手写/打印体风格，位于贴纸右上角 */
            .cs-song-info { 
                text-align: right; 
                height: 55%; /* 占据上半部分白色区域 */
                display: flex; flex-direction: column; justify-content: center;
            }
            .cmp-title { 
                font-family: 'Jost', sans-serif; font-weight: 600; font-size: 15px; color: #222; 
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; margin-left: auto;
            }
            .cmp-artist { 
                font-family: 'Space Mono', monospace; font-size: 9px; color: #666; letter-spacing: 1px; margin-top: 3px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; margin-left: auto;
            }

            /* 底部品牌 LOGO */
            .cs-brand {
                flex: 1; display: flex; align-items: flex-end; justify-content: flex-end;
                font-family: 'Space Mono', monospace; font-size: 9px; line-height: 1.2;
                color: rgba(255,255,255,0.6); letter-spacing: 1px; text-transform: uppercase;
            }

            /* 中间的透明视窗 */
            .cs-window {
                position: absolute; top: 58%; left: 50%; transform: translate(-50%, -50%);
                width: 160px; height: 50px;
                background: rgba(255,255,255,0.1); /* 微微透 */
                border: 1px solid rgba(255,255,255,0.3); border-radius: 25px;
                display: flex; justify-content: space-between; align-items: center;
                padding: 0 12px; 
                backdrop-filter: blur(2px);
            }

            /* 齿轮 SVG (黑白极简) */
            .cs-reel {
                width: 36px; height: 36px;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='48' fill='none' stroke='%23333' stroke-width='4'/%3E%3Cpath d='M50 0 L50 100 M0 50 L100 50 M15 15 L85 85 M15 85 L85 15' stroke='%23333' stroke-width='8'/%3E%3Ccircle cx='50' cy='50' r='15' fill='%23fff'/%3E%3C/svg%3E");
                background-size: cover; opacity: 0.8;
                animation: spin 4s linear infinite; animation-play-state: paused;
            }
            .cmp-wave.playing .cs-reel { animation-play-state: running; }

            /* 底部凹槽 */
            .cs-bottom-holes {
                position: absolute; bottom: 0; left: 15%; right: 15%; height: 18px;
                background: rgba(255,255,255,0.1); 
                border-radius: 8px 8px 0 0; display: flex; justify-content: space-evenly; align-items: flex-end; padding-bottom: 4px;
            }
            .cs-hole { width: 12px; height: 12px; background: rgba(0,0,0,0.2); border-radius: 50%; }
            .cs-hole.sm { width: 8px; height: 8px; margin-bottom: 2px; }

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
            /* 默认状态就是醒目的红色 */
            .reader-menu-item.danger { color: #dc2626; }
            .reader-menu-item.danger:hover { background: #fff0f0; color: #b91c1c; }
             
            /* 🌟 收藏按钮：冰蓝专属色 (呼应收藏馆) */
            #btn-reader-collect { 
                color: #5d7a8c; 
                font-weight: 600; /* 稍微加粗一点点，更醒目 */
            }
            #btn-reader-collect:hover {
                background: #f0f8ff; /* 悬停时也是淡淡的冰蓝底色 */
                color: #3b5f75;
            }

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

/* === 🗝️ 入口组件：黑曜石灵动胶囊 (Obsidian Capsule) === */
            .comp-char-memo {
                margin: 50px auto 30px;
                width: auto; max-width: 280px;
                height: 54px;
                /* 半透明黑曜石渐变 */
                background: linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(10,10,10,0.95) 100%);
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 50px;
                display: flex; align-items: center; justify-content: space-between;
                padding: 5px 6px 5px 25px;
                cursor: pointer;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .comp-char-memo:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 15px 35px rgba(0,0,0,0.3);
                border-color: rgba(212, 175, 55, 0.5);
            }
            .memo-left { display: flex; flex-direction: column; justify-content: center; }
            .memo-label { 
                font-family: 'Space Mono', monospace; font-size: 8px; 
                color: #666; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px;
            }
            .memo-title { 
                font-family: 'Cinzel', serif; font-size: 13px; font-weight: 600; 
                color: #eee; letter-spacing: 2px;
            }
            /* 右侧圆形密钥按钮 */
            .memo-seal {
                width: 42px; height: 42px;
                background: #1a1a1a;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                color: #d4af37; font-size: 14px;
                transition: all 0.4s;
                box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
            }
            .comp-char-memo:hover .memo-seal {
                background: #fff; color: #000; transform: rotate(45deg);
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
            }
            .comp-char-memo:hover .memo-seal i { animation: keyBreath 1s infinite alternate; }
            @keyframes keyBreath { from { opacity: 0.7; } to { opacity: 1; transform: scale(1.1); } }

            /* === 📜 模态框：高级棉麻信纸 (新布局 + 旧字体) === */
            .letter-modal { 
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.9); backdrop-filter: blur(10px); z-index: 2000; 
                display: none; align-items: center; justify-content: center; 
                opacity: 0; transition: opacity 0.6s; 
            }
            .letter-modal.active { display: flex; opacity: 1; }

            .letter-paper { 
                width: 90%; max-width: 420px; min-height: 550px; 
                background-color: #fdfbf7; 
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
                padding: 50px 40px; 
                box-shadow: 0 30px 80px rgba(0,0,0,0.5); 
                position: relative; 
                transform: translateY(20px) scale(0.95); 
                transition: transform 0.6s cubic-bezier(0.19, 1, 0.22, 1); 
                display: flex; flex-direction: column; 
            }
            .letter-modal.active .letter-paper { transform: translateY(0) scale(1); }

            .letter-close { 
                position: absolute; top: 20px; right: 20px; 
                font-family: 'Space Mono', monospace; font-size: 10px; cursor: pointer; 
                color: #999; border: 1px solid #ddd; padding: 5px 10px; border-radius: 20px;
                transition: all 0.3s;
            }
            .letter-close:hover { background: #000; color: #fff; border-color: #000; }

            /* 页眉装饰 */
            .letter-header-meta { margin-bottom: 30px; text-align: center; }
            .meta-decoration { font-size: 10px; color: #d4af37; margin-bottom: 10px; letter-spacing: 3px; font-family: 'Space Mono'; }
            .meta-from { 
                font-family: 'Cinzel', serif; font-size: 24px; font-weight: 400; 
                color: #111; letter-spacing: 3px; text-transform: uppercase;
                border-bottom: 1px solid #111; display: inline-block; padding-bottom: 5px;
            }

            /* ✅ 保留你喜欢的旧版字体和光标样式 */
            .letter-body { 
                font-family: 'Space Mono', monospace; /* 原版等宽字体 */
                font-size: 13px; /* 适合代码感的字号 */
                line-height: 1.8; 
                color: #333; 
                flex: 1; 
                white-space: pre-wrap; 
            }
            /* ✅ 保留原版块状光标 */
            .cursor { 
                display: inline-block; width: 6px; height: 14px; 
                background: #000; margin-left: 2px; 
                animation: blink 1s infinite; vertical-align: middle; 
            }

            /* 底部签名区 */
            .letter-footer { margin-top: 40px; text-align: right; }
            .letter-sig-label { font-family: 'Space Mono', monospace; font-size: 8px; color: #999; letter-spacing: 2px; text-transform: uppercase; }
            .letter-signature { 
                /* 使用 Cinzel 模拟签名，或者系统自带草书 */
                font-family: 'Cinzel', serif; 
                font-size: 18px; color: #111; margin-top: 5px; opacity: 0.8; font-style: italic;
            }

/* === 🖼️ GALLERY PAGE (冰蓝背景 + Memory Lane组件) === */
            .page-gallery {
                flex: 1; height: 100%; position: relative; overflow-y: auto; overflow-x: hidden;
                background: linear-gradient(135deg, #a3bacf 0%, #c4d8e6 50%, #e2ebf3 100%);
            }
            .page-gallery::before {
                content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
                pointer-events: none; z-index: 0;
            }
            .gallery-nav { padding: 25px; position: relative; z-index: 20; }
           /* === 🖼️ GALLERY HERO (顶部装饰区 - 冰蓝梦幻版) === */
            .gallery-hero {
                padding: 10px 30px; 
                position: relative; 
                z-index: 10; 
                margin-bottom: 30px;
                display: flex; 
                justify-content: space-between; 
                align-items: center;
            }

            /* 左侧文字 */
            .hero-en { 
                font-family: 'Cinzel', serif; 
                font-size: 32px; 
                font-weight: 600; 
                color: #fff; 
                line-height: 1.1; 
                letter-spacing: 2px;
                /* 增加一点柔光投影，让字浮起来 */
                text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
            }
            .hero-sub { 
                font-family: 'Space Mono', monospace; 
                font-size: 9px; 
                color: #5d7a8c; 
                margin-top: 8px; 
                letter-spacing: 2px; 
                opacity: 0.9;
                mix-blend-mode: color-burn; /* 让副标题更好地融入背景 */
            }

            /* 右侧：柔光磨砂印章组件 */
            .hero-widget-soft {
                position: relative;
                width: 70px; height: 70px;
                display: flex; justify-content: center; align-items: center;
            }

            /* 外部缓慢旋转的光环 */
            .soft-ring {
                position: absolute; inset: 0;
                border: 1px solid rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                /* 稍微压扁一点，更有立体感 */
                transform: rotate(-15deg);
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
                animation: softBreath 4s ease-in-out infinite;
            }

            /* 内部磨砂玻璃核心 */
            .soft-core {
                width: 55px; height: 55px;
                background: rgba(255, 255, 255, 0.25);
                backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
            }

            /* 中间的雪花/星星图标 */
            .soft-icon {
                font-size: 14px; color: #fff; 
                margin-bottom: 3px;
                filter: drop-shadow(0 0 5px rgba(255,255,255,0.8));
                animation: slowSpin 10s linear infinite; /* 极其缓慢的自转 */
            }

            /* 微小的文字 */
            .soft-text {
                font-family: 'Jost', sans-serif; font-size: 6px; 
                line-height: 1.2; text-align: center; color: #fff; 
                letter-spacing: 1px; font-weight: 600;
            }

            /* 动画定义 */
            @keyframes softBreath {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.05); opacity: 1; border-color: rgba(255,255,255,0.7); }
            }
            @keyframes slowSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* 🌟 Memory Lane Widget 组件样式 */
            .memory-lane-container {
                padding: 0 25px; display: flex; justify-content: center; position: relative; z-index: 10;
            }
            .ml-widget {
                width: 100%; max-width: 350px;
                background: rgba(255, 255, 255, 0.7); /* 半透明高级白 */
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.9);
                border-radius: 36px; /* 超大圆角 */
                padding: 25px 0 20px 0;
                box-shadow: 0 25px 50px rgba(93, 122, 140, 0.2), inset 0 2px 10px rgba(255,255,255,0.8);
                display: flex; flex-direction: column; align-items: center;
                overflow: hidden;
            }

            .ml-header { font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 500; color: #111; margin-bottom: 25px; }

            /* ✨ 隐形手势层：覆盖整个组件，负责吸收左右滑动 */
            .ml-swipe-layer {
                position: absolute; inset: 0; z-index: 50;
                overflow-x: auto; overflow-y: hidden;
                scroll-snap-type: x mandatory;
                display: flex; scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
            }
            .ml-swipe-layer::-webkit-scrollbar { display: none; }
            /* 隐形占位块，对应每一张照片 */
            .ml-snap-block { flex: 0 0 100%; height: 100%; scroll-snap-align: center; cursor: pointer; }

            /* 舞台区 (取消原来的 flex 横排，变成固定中心点) */
            .ml-content { width: 100%; height: 260px; position: relative; pointer-events: none; }

            /* 拍立得照片卡 (绝对居中堆叠) */
            .ml-card-wrapper {
                position: absolute; top: 50%; left: 50%;
                /* 核心：使用 CSS 变量接收不同卡片的倾斜角度 */
                transform: translate(-50%, -50%) rotate(var(--rot));
                opacity: 0; 
            }
            /* 垫底状态：旧照片被压在下面 */
            .ml-card-wrapper.prev { opacity: 1; z-index: 5; }
            /* 激活状态：当前照片在最上面 */
            .ml-card-wrapper.active { opacity: 1; z-index: 10; }
            
            /* 🚀 核心动效：从天而降并带有果冻回弹！ */
            .ml-card-wrapper.active.drop-anim {
                /* cubic-bezier(0.34, 1.56, 0.64, 1) 是复刻 iOS 弹簧动效的神仙曲线 */
                animation: dropFromTop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            @keyframes dropFromTop {
                0% { 
                    transform: translate(-50%, -150%) rotate(calc(var(--rot) - 15deg)) scale(1.1); 
                    opacity: 0; box-shadow: 0 40px 50px rgba(0,0,0,0.3); 
                }
                100% { 
                    transform: translate(-50%, -50%) rotate(var(--rot)) scale(1); 
                    opacity: 1; box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
                }
            }

            /* 相片本体与呼吸动画 (保留了你喜欢的生命感) */
            .ml-card { background: #fff; padding: 6px; border-radius: 12px; border: 1px solid #eee; }
            /* 🌟 User 专属：极度冰透蓝磨砂玻璃质感 (加强版) */
            .ml-card.ice-style {
                /* 加深冰蓝色，增加色彩对比度 */
                background: linear-gradient(135deg, rgba(144, 192, 235, 0.7) 0%, rgba(220, 240, 255, 0.3) 100%) !important;
                backdrop-filter: blur(16px) saturate(130%);
                -webkit-backdrop-filter: blur(16px) saturate(130%);
                /* 强化玻璃的高光边缘 */
                border: 1.5px solid rgba(255, 255, 255, 0.95) !important;
                /* 外侧幽蓝光晕 + 内层极强白色反光 */
                box-shadow: 
                    0 15px 35px rgba(20, 85, 145, 0.25), 
                    inset 0 0 25px rgba(255, 255, 255, 0.8) !important;
            }
            
            /* 文字颜色改为极深的墨蓝色，压住轻浮感 */
            .ml-card.ice-style .ml-card-title { 
                color: #082038 !important; 
                text-shadow: 0 1px 2px rgba(255,255,255,0.8);
            }
            .ml-card.ice-style .ml-card-date { 
                color: #1a4570 !important; 
                font-weight: 600;
            }
            
            /* 图片保持原色清晰 */
            .ml-card.ice-style .ml-img-box img { 
                filter: none !important; 
                opacity: 0.95; 
            }
/* 🌟 AI 档案专属：烟熏黑玻璃质感 (Smoked Obsidian) */
            .ml-card.noir-style {
                /* 深邃的半透明炭黑色 */
                background: linear-gradient(135deg, rgba(35, 40, 45, 0.8) 0%, rgba(15, 18, 20, 0.9) 100%) !important;
                backdrop-filter: blur(16px) saturate(120%);
                -webkit-backdrop-filter: blur(16px) saturate(120%);
                /* 边缘保留极细的银色反光 */
                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                border-top-color: rgba(255, 255, 255, 0.35) !important;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.05) !important;
            }
            
            /* 黑底白字，高级感拉满 */
            .ml-card.noir-style .ml-card-title { 
                color: #f4f4f4 !important; 
                text-shadow: 0 2px 5px rgba(0,0,0,0.8);
            }
            .ml-card.noir-style .ml-card-date { 
                color: #8a9ba8 !important; 
            }
            
            /* 黑玻璃里的图片稍微压暗一点，增加胶片感 */
            .ml-card.noir-style .ml-img-box img { 
                filter: grayscale(40%) contrast(1.1) !important; 
                opacity: 0.9; 
            }
            .ml-img-box { width: 160px; aspect-ratio: 1; border-radius: 8px; overflow: hidden; position: relative; }
            @keyframes livingPhoto { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
            .ml-img-box img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(20%) sepia(5%); animation: livingPhoto 20s ease-in-out infinite; }
            .ml-img-box::after { content:''; position:absolute; inset:0; background: rgba(163, 186, 207, 0.15); mix-blend-mode: overlay; }
            
            .ml-card-info { padding: 12px 5px 8px; text-align: center; }
            .ml-card-title { 
                font-family: 'Cinzel', serif; 
                font-size: 11px; 
                font-weight: 600; 
                color: #111; 
                /* 👇 核心修复：强制不换行，超出显示省略号 */
                white-space: nowrap; 
                overflow: hidden; 
                text-overflow: ellipsis; 
                max-width: 140px; /* 限制最大宽度 (卡片宽160px) */
                display: block; 
                margin: 0 auto; /* 居中 */
            }
            .ml-card-date { font-family: 'Space Mono', monospace; font-size: 8px; color: #888; margin-top: 4px; }

            /* 动态标尺轨道 */
            .ml-timeline { 
                position: relative; width: 100%; height: 30px; 
                margin-top: 25px; overflow: hidden; 
            }
            
            /* 🌟 核心修复：用背景图画出无限长的尺子，而不是生成小 div */
            .ml-tick-track {
                position: absolute; top: 0; left: -50%; width: 200%; height: 6px;
                /* 画出刻度：1px 的线，7px 的空白，每 8px 循环一次 */
                background-image: repeating-linear-gradient(to right, #ccc 0, #ccc 1.5px, transparent 1.5px, transparent 8px);
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); /* 和卡片一样的果冻回弹 */
            }

            /* 🌟 质感提升：让尺子两端产生“羽化渐隐”的视觉效果 */
            .ml-timeline::after {
                content: ''; position: absolute; inset: 0;
                background: linear-gradient(90deg, rgba(255,255,255,0.7) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.7) 100%);
                pointer-events: none;
            }

            /* 🌟 核心修复：冰透蓝磨砂胶囊底座 */
            .ml-center-mark {
                position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
                display: flex; flex-direction: column; align-items: center;
                /* 冰透蓝渐变背景 */
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(163, 186, 207, 0.25) 100%);
                /* 强力毛玻璃滤镜 */
                backdrop-filter: blur(12px) saturate(120%);
                -webkit-backdrop-filter: blur(12px) saturate(120%);
                /* 圆润的胶囊外壳与微光边框 */
                border: 1px solid rgba(255, 255, 255, 0.7);
                border-radius: 16px;
                padding: 5px 16px;
                box-shadow: 0 4px 15px rgba(93, 122, 140, 0.15), inset 0 2px 5px rgba(255, 255, 255, 0.5);
                z-index: 2;
            }

            /* 内部指针：改为深冰蓝色，更显精致 */
            .ml-tick-tall { 
                width: 1.5px; height: 6px; 
                background: #5d7a8c; 
                margin-bottom: 3px; 
                border-radius: 1px;
            }

            /* 月份文字：缩小字号，改为高级灰蓝色大写 */
            .ml-month-text { 
                font-family: 'Jost', sans-serif; 
                font-size: 10px; 
                font-weight: 600; 
                color: #3b5266; 
                letter-spacing: 1px; 
                text-transform: uppercase; 
            }

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
                    <!-- ✨ 新版双入口布局 -->
                    <div style="display: flex; gap: 10px; margin-top: 30px; margin-bottom: 15px;">
                        <div class="btn-create-chapter" id="chronicle-ai-gen-btn" style="flex: 1; background:#1a1a1a; color:#fff; border-color:#1a1a1a; margin: 0; padding: 20px 10px;">
                            <i class="fa-solid fa-microchip"></i> DECRYPT
                        </div>
                        <div class="btn-create-chapter" id="chronicle-open-gallery-btn" style="flex: 1; background:#e8f0f6; color:#5d7a8c; border-color:#b0c4de; margin: 0; padding: 20px 10px;">
                            <i class="fa-solid fa-images"></i> GALLERY
                        </div>
                    </div>
                    <!-- 原来的 User 按钮 -->
                    <div class="btn-create-chapter" id="chronicle-create-btn" style="margin-top: 0;">+ CREATE USER LOG</div>
                </div>

                <div class="settings-modal" id="chronicle-settings-modal">
                    <div class="modal-header">AU Setting / 背景设定</div>
                    
                    <!-- 🌟 新增：模板标签轨道 -->
                    <div class="template-strip" id="chronicle-template-strip">
                        <!-- JS 将会在这里动态填充你保存的模板 -->
                    </div>

                    <textarea class="modal-textarea" id="chronicle-persona-text" placeholder="在这里输入世界观背景、两人当下的关系、或者是某个特定剧情的前提提要... 不填则使用默认设定。"></textarea>
                    
                    <div class="modal-actions">
                        <div class="btn-modal cancel" id="chronicle-close-settings">CANCEL</div>
                        <div class="btn-modal save" id="chronicle-save-settings">APPLY & SAVE</div>
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
                            <div class="reader-menu-item" id="btn-reader-reroll">ROLL LOG</div>
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

                <!-- 🧠 Neural Core 3D 过场动画层 -->
                <div class="aesthetic-overlay" id="chronicle-aes-overlay">
                    <div id="neural-webgl-container"></div>
                    <div class="aes-text-container">
                        <div class="aes-main-text" id="chronicle-aes-text-main">CONNECTING</div>
                        <div class="aes-sub-text" id="chronicle-aes-text-sub">ESTABLISHING LINK</div>
                    </div>
                </div>
            </div>
            
            <!-- Fashion Letter Modal -->
            <div class="letter-modal" id="chronicle-letter-modal">
                <div class="letter-paper">
                    <div class="letter-close" id="chronicle-close-letter">CLOSE</div>
                    
                    <div class="letter-header-meta">
                        <div class="meta-decoration">✦ ENCRYPTED ✦</div>
                        <div class="meta-from" id="chronicle-letter-from">NAME</div>
                    </div>
                    
                    <div class="letter-body" id="chronicle-letter-body"><span class="cursor"></span></div>
                    
                    <div class="letter-footer">
                        <div class="letter-sig-label">Yours Truly,</div>
                        <div class="letter-signature" id="chronicle-letter-sig">Signature</div>
                    </div>
                </div>
            </div>

<!-- ✨ PAGE 5: GALLERY (冰蓝诗意 + Memory Lane 组件) -->
            <div id="chronicle-page-gallery" class="page-gallery hidden">
                <div class="gallery-nav">
                    <i class="fa-solid fa-arrow-left" id="gallery-back-btn" style="cursor:pointer; font-size: 20px; color: #fff; mix-blend-mode: difference;"></i>
                </div>
                
                <!-- 诗意标语装饰 (冰蓝梦幻版) -->
                <div class="gallery-hero">
                    <!-- 左侧：保持上一版的文案 -->
                    <div class="hero-left">
                        <div class="hero-en">FRAGMENTS<br>OF TIME</div>
                        <div class="hero-sub">THE ARCHIVE REMEMBERS EVERYTHING</div>
                    </div>

                    <!-- 右侧：柔光磨砂印章组件 -->
                    <div class="hero-widget-soft">
                        <!-- 外部光晕圈 -->
                        <div class="soft-ring"></div>
                        <!-- 内部磨砂核心 -->
                        <div class="soft-core">
                            <i class="fa-solid fa-snowflake soft-icon"></i>
                            <div class="soft-text">FROZEN<br>MOMENT</div>
                        </div>
                    </div>
                </div>               

                <!-- 🌟 核心：Memory Lane 桌面级交互组件 (堆叠掉落版) -->
                <div class="memory-lane-container">
                    <div class="ml-widget" style="position:relative;">
                        
                        <!-- ✨ 神奇的隐形滑动层：用来完美捕获你手指的原生滑动物理惯性 -->
                        <div id="ml-swipe-layer" class="ml-swipe-layer"></div>

                        <div class="ml-header">Memory Lane</div>
                        
                        <!-- 舞台区：所有卡片叠在这里，等待从天而降 -->
                        <div class="ml-content" id="ml-content-area"></div>
                        
                        <!-- 底部时间轴 (改为可移动的轨道) -->
                        <div class="ml-timeline">
                            <div class="ml-tick-track" id="ml-tick-track"></div>
                            <div class="ml-center-mark">
                                <div class="ml-tick-tall"></div>
                                <div class="ml-month-text" id="ml-current-month">...</div>
                            </div>
                        </div>
                    </div>
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
        this.initNeuralCore(); 
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

// 👇 新增：收藏馆入口和收藏馆返回按钮的点击事件
        document.getElementById('chronicle-open-gallery-btn').onclick = () => this.openFavGallery();
        document.getElementById('gallery-back-btn').onclick = () => this.navTo('index');

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

document.getElementById('btn-reader-reroll').onclick = (e) => {
            e.stopPropagation(); 
            this.rerollCurrentLog();
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

// 🌟 重新生成当前文章 (Re-roll) 引擎 [修复动画版]
    async rerollCurrentLog() {
        const id = this.currentReadingId;
        if (!id) return;

        // 保护系统文件
        if (String(id).startsWith('static_')) {
            window.utils.showToast("System File: 无法重构");
            return;
        }

        const chap = this.currentData.chapters.find(c => String(c.id) === String(id));
        if (!chap || chap.type === 'user') {
            window.utils.showToast("此档案类型不支持重构");
            return;
        }

        if (!confirm("【CONFIRM RE-ROLL】\n\n此操作将销毁当前档案内容并重新解密。\n确定要执行吗？")) {
            return;
        }

        // 1. 关闭右上角菜单
        const menu = document.getElementById('chronicle-reader-menu');
        if (menu) menu.classList.remove('active');

        // 2. 🔮 强制启动魔法阵动画 (确保层级最高)
        const overlay = document.getElementById('magic-loading-overlay');
        const statusText = document.getElementById('magic-loading-text');
        
        if (overlay) {
            overlay.style.zIndex = "10000"; // 强制置顶，防止被阅读器遮挡
            overlay.classList.add('active');
            statusText.textContent = "REWINDING TIME";
            
            // 启动文字变换定时器
            this.loadingTimer1 = setTimeout(() => { if(overlay.classList.contains('active')) statusText.textContent = "READING SOUL"; }, 2000); 
            this.loadingTimer2 = setTimeout(() => { if(overlay.classList.contains('active')) statusText.textContent = "WEAVING FATE"; }, 4500); 
        } else {
            console.error("找不到魔法阵动画元素！请检查 HTML 结构。");
        }

        try {
            // 获取已有标题
            const existingTitles = this.currentData.chapters
                .filter(c => String(c.id) !== String(id))
                .map(c => c.title);
            
            // 获取已有歌曲
            const existingSongs =[];
            this.currentData.chapters.filter(c => String(c.id) !== String(id)).forEach(c => {
                const match = c.html.match(/<div class="cmp-title">([\s\S]*?)<\/div>/);
                if (match && match[1]) existingSongs.push(match[1].trim());
            });

            // 🌟 如果是重 Roll，我们就提取它“前一章”的内容给它作为接力棒
            const currentIndex = this.currentData.chapters.findIndex(c => String(c.id) === String(id));
            let previousContent = null;
            if (currentIndex > 0) {
                previousContent = this.currentData.chapters[currentIndex - 1].html.replace(/<[^>]+>/g, ' ');
            }

            // 呼叫 AI
            
            let prompt;
            if (previousContent) {
                // 如果重构的不是第一章，按续写逻辑重构
                prompt = window.promptManager.createChronicleContinuationPrompt(
                    this.currentData.dossierRef, 
                    this.currentData.personaNote,
                    existingTitles,
                    existingSongs,
                    previousContent 
                );
            } else {
                // 如果重构的是第一章，按开篇逻辑重构
                prompt = window.promptManager.createChronicleArticlePrompt(
                    this.currentData.dossierRef, 
                    this.currentData.personaNote,
                    existingTitles,
                    existingSongs
                );
            }
            
            const aiResponse = await window.apiHelper.getChatCompletion(prompt);
            
            // 解析 JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("AI未返回JSON数据");
            
            let jsonString = jsonMatch[0];
            let result;
            try {
                result = JSON.parse(jsonString); 
            } catch (err) {
                try {
                    result = JSON.parse(jsonString.replace(/[\n\r\t]/g, "")); 
                } catch (err2) {
                    throw new Error("AI 生成格式严重损坏");
                }
            }

            // 获取音乐
            let bgmHtml = '';
            if (result.bgm_keyword && result.bgm_keyword !== 'null') {
                if (statusText) statusText.textContent = "TUNING RESONANCE"; 
                const musicData = await this.fetchNeteaseMusic(result.bgm_keyword);
                if (musicData) {
                    bgmHtml = `
                        <div class="chronicle-music-player" data-id="${musicData.id}" data-src="${musicData.audioUrl}">
                            <div class="cmp-cassette cmp-wave">
                                <div class="cs-screw tl"></div><div class="cs-screw tr"></div>
                                <div class="cs-screw bl"></div><div class="cs-screw br"></div>
                                <div class="cs-sticker">
                                    <div class="cs-left">
                                        <div class="cmp-cover" style="background-image: url('${musicData.coverUrl}')">
                                            <i class="fa-solid fa-play cmp-btn"></i>
                                        </div>
                                        <div class="cs-side"><span>A</span></div>
                                    </div>
                                    <div class="cs-window">
                                        <div class="cs-reel"></div><div class="cs-gauge"></div><div class="cs-reel"></div>
                                    </div>
                                    <div class="cs-right">
                                        <div class="cs-song-info">
                                            <div class="cmp-title">${musicData.title}</div>
                                            <div class="cmp-artist">${musicData.artist}</div>
                                        </div>
                                        <div class="cs-brand">NOIR<br>ARCHIVE</div>
                                    </div>
                                </div>
                                <div class="cs-bottom-holes">
                                    <div class="cs-hole sm"></div><div class="cs-hole"></div>
                                    <div class="cs-hole"></div><div class="cs-hole sm"></div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            // 获取留言
            let memoHtml = '';
            if (result.secret_message) {
                const safeMsg = encodeURIComponent(result.secret_message);
                const safeDeletedMsg = encodeURIComponent(result.secret_message_deleted || 'I... nevermind.');
                memoHtml = `
                    <div class="comp-char-memo" onclick="ChronicleApp.openLetter('${this.currentData.name}', '${safeMsg}', '${safeDeletedMsg}')">
                        <div class="memo-info">
                            <span class="memo-label">ATTACHMENT // CLASSIFIED</span>
                            <span class="memo-title">READ ENCRYPTED NOTE</span>
                        </div>
                        <div class="memo-icon"><i class="fa-solid fa-feather-pointed"></i></div>
                    </div>
                `;
            }

            // 拼装 HTML
            const chapIndex = this.currentData.chapters.indexOf(chap) + 1;
            const fullHtml = `
                <div class="chapter-header">
                    <span class="ch-num">FILE_${String(chapIndex).padStart(2,'0')}</span>
                    <h2 class="ch-title">${result.title}</h2>
                    ${bgmHtml}
                </div>
                <div class="article-text">${result.contentHtml}</div>
                ${memoHtml}
            `;

            // 更新数据
            chap.title = result.title;
            chap.html = fullHtml;
            await window.dbHelper.dbPromise.then(db => db.put('chronicles', chap));
            
            // 刷新并展示
            await this.loadAndRenderChapters();
            this.openChapter(chap.id);
            
            if (overlay) overlay.classList.remove('active');
            window.utils.showToast("档案重构完成");

        } catch (e) {
            console.error(e);
            if (overlay) overlay.classList.remove('active');
            window.utils.showToast("重构中断，请检查网络");
        } finally {
            clearTimeout(this.loadingTimer1);
            clearTimeout(this.loadingTimer2);
        }
    },
    
   // 3. 收藏逻辑 (深拷贝入库，原件销毁不受影响)
    async toggleCollection() {
        const id = this.currentReadingId;
        if (!id) return;
        
        // 保护静态文件
        if (String(id).startsWith('static_')) {
            window.utils.showToast("System File: 无法收藏。");
            return;
        }

        const chap = this.currentData.chapters.find(c => String(c.id) === String(id));
        if (!chap) return;

        try {
            // 检查是否已经收藏过了（靠原ID识别）
            const existingFavs = await window.dbHelper.dbPromise.then(db => 
                db.getAllFromIndex('chronicle_favs', 'by_dossierId', this.currentData.id)
            );
            if (existingFavs.some(f => f.originalId === id)) {
                window.utils.showToast("已存在于 Memory Lane 中");
                document.getElementById('chronicle-reader-menu').classList.remove('active');
                return;
            }

            // 构造独立副本
            const favData = {
                dossierId: this.currentData.id,
                originalId: id, // 记录身世
                title: chap.title,
                type: chap.type,
                html: chap.html,
                timestamp: Date.now()
            };
            
            await window.dbHelper.add('chronicle_favs', favData);
            window.utils.showToast("已存入 Memory Lane (永久典藏)");
            
            // 关闭右上角菜单
            document.getElementById('chronicle-reader-menu').classList.remove('active');

        } catch (e) {
            console.error("收藏失败", e);
            window.utils.showToast("收藏失败");
        }
    },

// 渲染 Memory Lane (终极复刻 Apple Widget：隐形轨道 + 弹簧掉落堆叠)
    async openFavGallery() {
        const contentArea = document.getElementById('ml-content-area');
        const swipeLayer = document.getElementById('ml-swipe-layer');
        const track = document.getElementById('ml-tick-track');
        const monthLabel = document.getElementById('ml-current-month');
        
        this.navTo('gallery');

        try {
            const favs = await window.dbHelper.dbPromise.then(db => db.getAllFromIndex('chronicle_favs', 'by_dossierId', this.currentData.id));
            
            let avatarUrl = 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=600&auto=format&fit=crop';
            if (this.currentData.dossierRef?.character?.avatarAssetId) {
                const asset = await window.dbHelper.get('assets', this.currentData.dossierRef.character.avatarAssetId);
                if (asset?.file) avatarUrl = URL.createObjectURL(asset.file);
            }

            // 你的专属图库保持不变
            const memoryCovers =[
                'https://i.postimg.cc/0y1sf8MY/IMG_7337.jpg', 

'https://i.postimg.cc/KjjgHtqz/IMG_9877.jpg',
                'https://i.postimg.cc/2yyBKnc5/IMG_9878.jpg', 

'https://i.postimg.cc/Y0PmKjZB/IMG_9879.jpg',

'https://i.postimg.cc/rsstP5hb/IMG_9880.jpg',

'https://i.postimg.cc/brr2B16K/IMG_9881.jpg',
                
'https://i.postimg.cc/mkkF57dn/IMG_9882.jpg', 

'https://i.postimg.cc/prrn6K06/IMG_9883.jpg',

'https://i.postimg.cc/0jjJB7tc/IMG_9884.jpg', 

'https://i.postimg.cc/PJJ8R16M/IMG_9887.jpg',

'https://i.postimg.cc/900qnyxp/IMG_9888.jpg', 

'https://i.postimg.cc/RFXHdgTy/IMG_9889.jpg',

'https://i.postimg.cc/gJNZsgKM/IMG_9890.jpg', 

'https://i.postimg.cc/pTqFCsBC/IMG_9891.jpg',

'https://i.postimg.cc/0QcwnVCZ/IMG_9892.jpg', 

'https://i.postimg.cc/bJ3tgmRT/IMG_9893.jpg',

'https://i.postimg.cc/qRj3w1GK/IMG_9894.jpg',

'https://i.postimg.cc/Sxbhry2r/IMG_6675.jpg',

'https://i.postimg.cc/yNbVybJd/IMG-9967.jpg',

'https://i.postimg.cc/XJBnHkF7/IMG-9968.jpg',

'https://i.postimg.cc/V60zGWMs/IMG-9969.jpg',

'https://i.postimg.cc/j5nRg4Nt/IMG-9970.jpg',

'https://i.postimg.cc/V60zGWMN/IMG-9971.jpg',

'https://i.postimg.cc/HLhp9hJT/IMG-9972.jpg',

'https://i.postimg.cc/hG5S15JS/IMG-9973.jpg',

'https://i.postimg.cc/yNbVybJ1/IMG-9975.jpg',

'https://i.postimg.cc/d0xqjx7Q/IMG-9976.jpg',

'https://i.postimg.cc/6Qm9fm78/IMG-9977.jpg',

'https://i.postimg.cc/XvzVkzZY/IMG-9978.jpg',

'https://i.postimg.cc/7LWxnWC4/IMG-9979.jpg',

'https://i.postimg.cc/1zj9rjgQ/IMG-9980.jpg',

'https://i.postimg.cc/q75kx5td/IMG-9981.jpg',

'https://i.postimg.cc/hG5S15JR/IMG-9982.jpg',

'https://i.postimg.cc/W43Nrv1x/IMG-9983.jpg',

'https://i.postimg.cc/Gp2LYCmZ/IMG-9984.jpg',

'https://i.postimg.cc/q7RJnTvj/IMG-9985.jpg',

'https://i.postimg.cc/MTfzPmRH/IMG-9986.jpg',

'https://i.postimg.cc/C1nwPsD1/IMG-9987.jpg',

'https://i.postimg.cc/q7RJnTvD/IMG-9988.jpg',

'https://i.postimg.cc/W43Nrv1B/IMG-9989.jpg',

'https://i.postimg.cc/Jh2152s6/IMG-9990.jpg',

'https://i.postimg.cc/0NB80Bzt/IMG-9991.jpg',

'https://i.postimg.cc/yNbVybJ4/IMG-9992.jpg',

'https://i.postimg.cc/yNbVybD5/IMG-9993.jpg',

'https://i.postimg.cc/SKvyfvnP/IMG-9994.jpg'

            ];

            const monthNames =["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            
            // 🌟 步骤 A: 生成一个“固定乱序”的图片索引表
            
            let seed = parseInt(this.currentData.id) || 12345;
            const seededRandom = () => {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            };

            // 创建索引数组 [0, 1, 2, ... 16]
            const shuffledIndices = Array.from({length: memoryCovers.length}, (_, i) => i);
            // 执行洗牌算法 (Fisher-Yates)
            for (let i = shuffledIndices.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom() * (i + 1));
                [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
            }
            
            // 🌟 步骤 B: 先按“时间正序 (Old -> New)”给文章分配图片
            
            favs.sort((a, b) => a.timestamp - b.timestamp);
            
            favs.forEach((fav, index) => {
                
                const imgIndex = shuffledIndices[index % shuffledIndices.length];
                fav.assignedCover = memoryCovers[imgIndex]; // 把图存进临时变量
            });

            // 🌟 步骤 C: 重新按“时间倒序 (New -> Old)”排序，准备展示
            favs.sort((a, b) => b.timestamp - a.timestamp); 

            // 1. 组装所有数据源
            const slidesData =[
                { isChar: true, title: this.currentData.name, sub: "TARGET SUBJECT", img: avatarUrl, month: monthNames[new Date().getMonth()] }
            ];
            
            favs.forEach((fav) => {
                const fd = new Date(fav.timestamp);
                slidesData.push({
                    isChar: false, 
                    isUser: fav.type === 'user',
                    title: fav.title, 
                    sub: fd.toLocaleDateString('en-GB', { day:'2-digit', month:'short' }).toUpperCase(),
                    img: fav.assignedCover, // 👈 直接使用刚才分配好的固定图片
                    month: monthNames[fd.getMonth()], 
                    originalData: fav
                });
            });

            contentArea.innerHTML = ''; swipeLayer.innerHTML = ''; track.innerHTML = '';

            const cardsDOM =[]; // 保存卡片DOM以便随时调用

            // 2. 生成所有 DOM 元素
            slidesData.forEach((item, index) => {
                const rot = index % 2 === 0 ? 3 : -2; // 交替倾斜

               // --- A. 生成舞台中央的隐形卡片 ---
                const wrapper = document.createElement('div');
                wrapper.className = 'ml-card-wrapper';
                wrapper.style.setProperty('--rot', `${rot}deg`); // 传入CSS变量
                
                // 🌟 动态分配样式：三分天下 (头像白卡 vs User蓝冰 vs AI黑曜石)
                let cardClass = 'ml-card';
                let inlineStyle = '';
                let titlePrefix = '';
                let imgFilter = '';
                
                if (item.isChar) {
                    // 1. 角色本人头像卡：绝对原封不动，纯白底+暗金边
                    inlineStyle = 'border-color: rgba(212,175,55,0.4);'; 
                    imgFilter = 'filter:none;'; 
                } else if (item.isUser) {
                    // 2. User 写的日记：冰透蓝磨砂
                    cardClass = 'ml-card ice-style'; 
                    titlePrefix = '<i class="fa-solid fa-user-pen" style="margin-right:4px;"></i>'; 
                } else {
                    // 3. AI 生成的档案：烟熏黑曜石磨砂！
                    cardClass = 'ml-card noir-style';
                    titlePrefix = '<i class="fa-solid fa-folder-closed" style="margin-right:4px; opacity:0.7;"></i>'; // 加个档案夹图标
                }

                wrapper.innerHTML = `
                    <div class="${cardClass}" style="${inlineStyle}">
                        <div class="ml-img-box"><img src="${item.img}" style="${imgFilter}"></div>
                        <div class="ml-card-info">
                            <div class="ml-card-title">${titlePrefix}${item.title}</div>
                            <div class="ml-card-date">${item.sub}</div>
                        </div>
                    </div>
                `;
                contentArea.appendChild(wrapper);
                cardsDOM.push(wrapper);

                // --- B. 生成隐形滑动层的交互块 ---
                const snapBlock = document.createElement('div');
                snapBlock.className = 'ml-snap-block';
                snapBlock.onclick = () => {
                    if (item.isChar) window.utils.showToast("请左右滑动卡片查阅收藏");
                    else this.readFavArticle(item.originalData);
                };
                swipeLayer.appendChild(snapBlock);

            });

            // ==========================================
            // 🚀 核心状态机：监听隐形层滑动，触发掉落
            // ==========================================
            let currentIndex = -1;
            
            const updateState = () => {
                // 计算当前滑到了第几个块
                const newIndex = Math.round(swipeLayer.scrollLeft / swipeLayer.offsetWidth);
                
                if (newIndex !== currentIndex && newIndex >= 0 && newIndex < slidesData.length) {
                    
                    // a. 处理旧卡片 (降级为 prev 被压在下面)
                    if (currentIndex !== -1) {
                        cardsDOM[currentIndex].classList.remove('active', 'drop-anim');
                        cardsDOM[currentIndex].classList.add('prev'); 
                    }

                    // b. 处理新卡片 (激活并从天而降！)
                    cardsDOM[newIndex].classList.remove('prev');
                    cardsDOM[newIndex].classList.add('active');
                    
                    // 神奇的技巧：强制重绘，确保每次切回来都能重新触发掉落动画
                    void cardsDOM[newIndex].offsetWidth; 
                    cardsDOM[newIndex].classList.add('drop-anim');

                    // c. 清理其他无关卡片 (保持DOM干净)
                    cardsDOM.forEach((c, i) => {
                        if (i !== newIndex && i !== currentIndex) c.classList.remove('prev', 'active', 'drop-anim');
                    });

                    // d. 更新底部时间轴轨道位移 (每滑一张卡，尺子往左移动 8px)
                    track.style.transform = `translateX(${-newIndex * 8}px)`;
                    
                    // e. 更新月份文字
                    if (monthLabel.innerText !== slidesData[newIndex].month) {
                        monthLabel.style.opacity = '0';
                        setTimeout(() => { monthLabel.innerText = slidesData[newIndex].month; monthLabel.style.opacity = '1'; }, 150);
                    }

                    currentIndex = newIndex;
                }
            };

            // 绑定滚动事件
            swipeLayer.addEventListener('scroll', updateState);
            
            // 初始化第一张卡片
            setTimeout(updateState, 50);

        } catch (e) {
            console.error(e);
        }
    },
    

// 阅读被收藏的文章 (独立视图，没有删除原件的按钮)
    readFavArticle(favItem) {
        document.getElementById('chronicle-read-content').innerHTML = favItem.html;
        document.getElementById('chronicle-read-scroll-area').scrollTop = 0;
        
        const footer = document.getElementById('chronicle-read-footer');
        // 在画廊阅读模式下，底部只提供一个“离开”按钮
        footer.style.justifyContent = 'center';
        footer.innerHTML = `
            <div class="btn-next" onclick="ChronicleApp.navTo('gallery')">
                <i class="fa-solid fa-arrow-left"></i> RETURN TO GALLERY
            </div>
        `;
        
        // 隐藏右上角的 Reader 菜单 (防止在收藏里重复收藏或误删)
        document.getElementById('chronicle-reader-trigger').style.display = 'none';

        // 覆盖返回按钮逻辑，让它回到画廊而不是目录
        const backBtn = document.getElementById('chronicle-back-to-index');
        const oldOnclick = backBtn.onclick;
        backBtn.onclick = () => {
            this.navTo('gallery');
            // 恢复原有逻辑和菜单
            backBtn.onclick = oldOnclick;
            document.getElementById('chronicle-reader-trigger').style.display = 'block';
        };

        this.navTo('read');
    },

// 👇 新增：支持动态刷新防盗链的播放控制引擎
    async toggleMusic(playerEl) {
        const songId = playerEl.dataset.id;
        let src = playerEl.dataset.src;

        if (!songId && !src) return;

        if (!this.currentAudio) {
            this.currentAudio = new Audio();
            this.currentAudio.loop = true; // 循环播放
        }

        const icon = playerEl.querySelector('.cmp-btn');
        const wave = playerEl.querySelector('.cmp-wave');

        // 1. 如果点击的是正在播放的同一首歌 (控制暂停/继续)
        if (this.currentAudio.dataset.songId === songId || this.currentAudio.src === src) {
            if (this.currentAudio.paused) {
                this.currentAudio.play();
                icon.className = 'fa-solid fa-pause cmp-btn';
                wave.classList.add('playing');
            } else {
                this.currentAudio.pause();
                icon.className = 'fa-solid fa-play cmp-btn';
                wave.classList.remove('playing');
            }
            return;
        }

        // 2. 如果点击的是一首新歌，且带有 ID，先去“进货”获取最新链接！
        if (songId) {
            // 变成小菊花加载状态
            icon.className = 'fa-solid fa-spinner fa-spin cmp-btn';
            try {
                // 提取瘦身版 Cookie
                let cleanCookie = '';
                if (this.vipCookie) {
                    const match = this.vipCookie.match(/MUSIC_U=[^;]+/);
                    cleanCookie = match ? match[0] : this.vipCookie;
                }
                const baseParams = `timerstamp=${Date.now()}`;
                const cookieParam = cleanCookie ? `&cookie=${encodeURIComponent(cleanCookie)}` : '';
                
                // 实时发起请求，换取最新的有效 URL
                const urlRes = await fetch(`${this.neteaseApiBase}/song/url/v1?id=${songId}&level=exhigh&${baseParams}${cookieParam}`);
                const urlData = await urlRes.json();
                const validUrlObj = urlData.data?.find(item => item.url && item.url.trim() !== '');
                
                if (validUrlObj) {
                    src = validUrlObj.url; // 拿到最新链接
                    playerEl.dataset.src = src; // 更新 DOM 缓存
                } else {
                    window.utils.showToast("歌曲因版权受限，无法获取最新音源");
                    icon.className = 'fa-solid fa-play cmp-btn';
                    return;
                }
            } catch (e) {
                console.error("获取新链接失败:", e);
                window.utils.showToast("网络异常，尝试使用历史链接...");
            }
        }

        // 3. 把页面上其他的播放器都重置为暂停 UI
        document.querySelectorAll('.chronicle-music-player').forEach(p => {
            p.querySelector('.cmp-btn').className = 'fa-solid fa-play cmp-btn';
            p.querySelector('.cmp-wave').classList.remove('playing');
        });

        // 4. 播放！
        this.currentAudio.src = src;
        this.currentAudio.dataset.songId = songId; // 记住当前播放的 ID
        
        try {
            await this.currentAudio.play();
            icon.className = 'fa-solid fa-pause cmp-btn';
            wave.classList.add('playing');
        } catch(e) {
            console.error(e);
            window.utils.showToast("播放失败：链接已过期且无法刷新");
            icon.className = 'fa-solid fa-play cmp-btn';
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

        // 1. 找到当前文章和它的索引
        const currentIndex = this.currentData.chapters.findIndex(c => String(c.id) === String(chapId));
        if (currentIndex === -1) return;
        
        const chap = this.currentData.chapters[currentIndex];

        document.getElementById('chronicle-read-content').innerHTML = chap.html;
        document.getElementById('chronicle-read-scroll-area').scrollTop = 0;
        
        const footer = document.getElementById('chronicle-read-footer');
        footer.style.justifyContent = 'space-between';
        
        if (chap.type === 'user') {
            // User 自己写的日记，底部只留一个关闭按钮
            footer.style.justifyContent = 'flex-end';
            footer.innerHTML = `<div class="btn-next" onclick="ChronicleApp.navTo('index')">CLOSE FILE <i class="fa-solid fa-times" style="margin-left:8px;"></i></div>`;
        } else {
            // 🌟 动态翻页逻辑
            const prevChap = currentIndex > 0 ? this.currentData.chapters[currentIndex - 1] : null;
            const nextChap = currentIndex < this.currentData.chapters.length - 1 ? this.currentData.chapters[currentIndex + 1] : null;

            let footerHtml = '';

            // 【上一篇】按钮
            if (prevChap) {
                footerHtml += `<div class="nav-back-text" onclick="ChronicleApp.openChapter('${prevChap.id}')"><i class="fa-solid fa-arrow-left"></i> PREV FILE</div>`;
            } else {
                footerHtml += `<div></div>`; // 占位符，保持排版靠右
            }

            // 【下一篇】或【催更】按钮
            if (nextChap) {
                footerHtml += `<div class="btn-next" onclick="ChronicleApp.openChapter('${nextChap.id}')">NEXT CHAPTER <i class="fa-solid fa-arrow-right"></i></div>`;
            } else {
                // 🌟 改装为连载催更按钮！注意 onclick 传了 true
                footerHtml += `
                    <div class="btn-next" style="background:#d4af37; color:#111; box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);" 
                         onclick="ChronicleApp.generateCharacterLog(true)">
                        催更下一章 (CONTINUE STORY) <i class="fa-solid fa-pen-nib"></i>
                    </div>
                `;
            }

            footer.innerHTML = footerHtml;
        }
        
        this.navTo('read');
    },

    // === AI 核心生成逻辑 (带魔法阵动画 + 音乐 + 智能容错) ===
    async generateCharacterLog(isContinuation = false) {
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
            // 1. 提取已有标题和已用过的歌曲名 (防重复)
            const existingTitles = (this.currentData.chapters ||[]).map(c => c.title);
            const existingSongs =[];
            if (this.currentData.chapters) {
                const songTitleRegex = /<div class="cmp-title">([\s\S]*?)<\/div>/;
                this.currentData.chapters.forEach(c => {
                    if (c.html) {
                        const match = c.html.match(songTitleRegex);
                        if (match && match[1]) existingSongs.push(match[1].trim());
                    }
                });
            }

            // 🌟 2. 新增：连载催更逻辑！提取上一章的内容
            let previousContent = null;
            if (isContinuation && this.currentData.chapters && this.currentData.chapters.length > 0) {
                const lastChap = this.currentData.chapters[this.currentData.chapters.length - 1];
                // 粗略去除 HTML 标签，只把纯文字喂给 AI 参考
                previousContent = lastChap.html.replace(/<[^>]+>/g, ' '); 
            }

            // 3. 调用全新的同人提示词 

            let prompt;
            if (isContinuation && previousContent) {
                // 如果是催更，调用续写专属提示词
                prompt = window.promptManager.createChronicleContinuationPrompt(
                    this.currentData.dossierRef, 
                    this.currentData.personaNote,
                    existingTitles,
                    existingSongs,
                    previousContent
                );
            } else {
                // 如果是第一章，调用开篇专属提示词
                prompt = window.promptManager.createChronicleArticlePrompt(
                    this.currentData.dossierRef, 
                    this.currentData.personaNote,
                    existingTitles,
                    existingSongs
                );
            }
            
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
                        <!-- 专属 BGM 磁带播放器 -->
                        <div class="chronicle-music-player" data-id="${musicData.id}" data-src="${musicData.audioUrl}">
                            
                            <!-- 磁带本体 (复用 cmp-wave 接收播放状态) -->
                            <div class="cmp-cassette cmp-wave">
                                <!-- 玻璃外壳的4个螺丝 -->
                                <div class="cs-screw tl"></div>
                                <div class="cs-screw tr"></div>
                                <div class="cs-screw bl"></div>
                                <div class="cs-screw br"></div>

                                <!-- 贴纸层 -->
                                <div class="cs-sticker">
                                    <div class="cs-left">
                                        <div class="cmp-cover" style="background-image: url('${musicData.coverUrl}')">
                                            <i class="fa-solid fa-play cmp-btn"></i>
                                        </div>
                                        <div class="cs-side"><span>A</span></div>
                                    </div>
                                    
                                    <!-- 中间磁条视窗与转轮 -->
                                    <div class="cs-window">
                                        <div class="cs-reel"></div>
                                        <div class="cs-gauge"></div> <!-- 刻度简略，增加通透感 -->
                                        <div class="cs-reel"></div>
                                    </div>

                                    <div class="cs-right">
                                        <!-- 👇 核心修改：歌曲信息现在位于贴纸右上角 -->
                                        <div class="cs-song-info">
                                            <div class="cmp-title">${musicData.title}</div>
                                            <div class="cmp-artist">${musicData.artist}</div>
                                        </div>
                                        <!-- 👇 核心修改：文案改为 NOIR ARCHIVE -->
                                        <div class="cs-brand">NOIR<br>ARCHIVE</div>
                                    </div>
                                </div>

                                <!-- 磁带底部凹槽 -->
                                <div class="cs-bottom-holes">
                                    <div class="cs-hole sm"></div>
                                    <div class="cs-hole"></div>
                                    <div class="cs-hole"></div>
                                    <div class="cs-hole sm"></div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            // --- 提取并生成加密信签组件 ---
            let memoHtml = '';
            if (result.secret_message) {
                const safeMsg = encodeURIComponent(result.secret_message);
                const safeDeletedMsg = encodeURIComponent(result.secret_message_deleted || 'I... nevermind.');
                
                memoHtml = `
                    <div class="comp-char-memo" onclick="ChronicleApp.openLetter('${this.currentData.name}', '${safeMsg}', '${safeDeletedMsg}')">
                        <div class="memo-left">
                            <span class="memo-label">ENCRYPTED MEMO</span>
                            <span class="memo-title">UNLOCK NOTE</span>
                        </div>
                        <div class="memo-seal"><i class="fa-solid fa-key"></i></div>
                    </div>
                `;
            }

            // 👇 这里千万不能删，它是计算当前文章序号的！
            const chapIndex = (this.currentData.chapters?.length || 0) + 1;
            
            // 👇 拼装完整的 HTML (把背景音乐和底部留言卡片都塞进去)
            const fullHtml = `
                <div class="chapter-header">
                    <span class="ch-num">FILE_${String(chapIndex).padStart(2,'0')}</span>
                    <h2 class="ch-title">${result.title}</h2>
                    ${bgmHtml}
                </div>
                <div class="article-text">${result.contentHtml}</div>
                ${memoHtml} <!-- 插入信签组件 -->
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
            
            // 🌟 新增：生成完毕后，直接“翻页”到这篇新文章！沉浸式阅读！
            this.openChapter(newId);

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
        document.getElementById('chronicle-edit-title').value = "";
        document.getElementById('chronicle-edit-content').innerHTML = "";
        
        this.navTo('editor');
    },

    // User 发布文章 -> AI 批阅 (真实接入 + 犹豫留言版)
    async shareToCharacter() {
        const title = document.getElementById('chronicle-edit-title').value.trim();
        const rawContentDiv = document.getElementById('chronicle-edit-content');
        let rawText = rawContentDiv.innerText; 
        
        if (!title || rawText.length < 5) {
            window.utils.showToast("档案内容过少，无法传输");
            return;
        }

        // 简单的段落化处理，保证发给 AI 的是清晰的文本
        const formattedUserText = rawText.split('\n').filter(line => line.trim() !== '').map(line => `<p>${line}</p>`).join('');

        // 1. 启动黑色连接动画
        const overlay = document.getElementById('chronicle-aes-overlay');
        const txtMain = document.getElementById('chronicle-aes-text-main');
        const txtSub = document.getElementById('chronicle-aes-text-sub');
overlay.classList.add('active');
        
        // 👇 新增：通知 3D 引擎开始运行崩坏倒计时！
        if (this.triggerNeuralCore) this.triggerNeuralCore();

        // 模拟连接步骤 (保留一点仪式感)
        txtMain.innerText = "UPLOADING"; txtSub.innerText = "ENCRYPTING DATA PACKETS";
        
        try {
            // 2. 呼叫 AI 进行批阅 (不再读取聊天记录)
            setTimeout(() => { txtMain.innerText = "SYNCING"; txtSub.innerText = `${this.currentData.name} IS READING...`; }, 1500);

            const prompt = window.promptManager.createUserLogReviewPrompt(
                this.currentData.dossierRef,
                title,
                rawText
            );

            const aiResponse = await window.apiHelper.getChatCompletion(prompt);

            // 3. 解析结果
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("AI未返回JSON数据");
            
            let result;
            try {
                result = JSON.parse(jsonMatch[0]);
            } catch (err) {
                // 容错清洗
                result = JSON.parse(jsonMatch[0].replace(/[\n\r\t]/g, ""));
            }

             // 4. 组装最终 HTML
            const safeReceipt = encodeURIComponent(result.receiptComment);
            const safeDeleted = encodeURIComponent(result.receiptCommentDeleted || "...");
            
            // 👇 唯一的改动是 onclick 里多传了一个 safeDeleted 参数
            const artifactHtml = `
                <div class="comp-artifact" onclick="ChronicleApp.openLetter('${this.currentData.name}', '${safeReceipt}', '${safeDeleted}')">
                    <div class="artifact-header">
                        <span class="artifact-id">ID: ${Math.floor(Math.random()*9000)+1000}</span>
                        <span class="artifact-stamp">REVIEWED</span>
                    </div>
                    <div class="artifact-body">
                        <div class="artifact-label">FROM THE ARCHIVE OF</div>
                        <div class="artifact-name">${this.currentData.name}</div>
                    </div>
                    <div class="artifact-footer">
                        <div class="artifact-barcode">|| ||| |||</div>
                        <div class="artifact-action">ACCESS DATA <i class="fa-solid fa-lock"></i></div>
                    </div>
                </div>
            `;

            // 组合
            const finalHtml = `
                <div class="chapter-header">
                    <span class="ch-num">USER_STORY</span>
                    <h2 class="ch-title">${title}</h2>
                </div>
                <div class="article-text">${result.annotatedContentHtml}</div>
                ${artifactHtml}
            `;

            // 5. 存入数据库
            const newLog = {
                dossierId: this.currentData.id,
                title: title,
                type: 'user', 
                html: finalHtml,
                timestamp: Date.now()
            };
            const newId = await window.dbHelper.add('chronicles', newLog);
            newLog.id = newId;

            // 6. 完成跳转
            txtMain.innerText = "COMPLETE";
            setTimeout(async () => {
                overlay.classList.remove('active');
                // 清空编辑器
                document.getElementById('chronicle-edit-title').value = '';
                document.getElementById('chronicle-edit-content').innerHTML = '';
                
                await this.loadAndRenderChapters();
                this.openChapter(newId);
                window.utils.showToast("剧情已送达，对方已回应");
            }, 1000);

        } catch (e) {
            console.error(e);
            overlay.classList.remove('active');
            window.utils.showToast("传输失败：信号丢失");
        }
    },

    typeInterval: null,

    // 👇 接收第三个参数 encodedDeletedMsg
    openLetter(from, encodedMsg, encodedDeletedMsg) {
        const msg = decodeURIComponent(encodedMsg);
        const deletedMsg = encodedDeletedMsg ? decodeURIComponent(encodedDeletedMsg) : "Searching for data...";
        
        // 填入标题名字
        document.getElementById('chronicle-letter-from').innerText = from;
        // 填入底部签名
        document.getElementById('chronicle-letter-sig').innerText = from;
        
        document.getElementById('chronicle-letter-modal').classList.add('active');
        
        const body = document.getElementById('chronicle-letter-body');
        body.innerHTML = '<span class="cursor"></span>';
        
        // 调用打字机 (字体和光标已在 CSS 中还原)
        this.typewriterSequence(body, deletedMsg, msg);
    },

    closeLetter() {
        document.getElementById('chronicle-letter-modal').classList.remove('active');
        clearInterval(this.typeInterval);
    },

    // 👇 情绪化打字机引擎 (降频优雅版：打字/删除均 3字响1次，节奏感更拟真)
    typewriterSequence(element, mistakeStr, finalStr) {
        let cursorHtml = '<span class="cursor"></span>';
        let currentText = "";
        let state = 0; 
        let i = 0;
        let deleteCounter = 0; 
        let typeCounter = 0; // 🌟 新增：专门用来控制打字发声频率的计数器
        
        // 🎹 高级定制：静音红轴/实木敲击声
        const playKeystroke = (isDelete = false) => {
            try {
                if (!window.chronicleAudioCtx) window.chronicleAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const ctx = window.chronicleAudioCtx;
                if (ctx.state === 'suspended') ctx.resume(); 

                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                const pitch = isDelete ? 150 : 350 + Math.random() * 100;
                osc.type = 'sine'; 
                osc.frequency.setValueAtTime(pitch, now);
                osc.frequency.exponentialRampToValueAtTime(pitch * 0.1, now + 0.03); 

                const vol = isDelete ? 0.04 : 0.08;
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(vol, now + 0.002); 
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04); 

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
            } catch(e) {}
        };

        clearInterval(this.typeInterval);

        // State 0: 缓缓打出内心犹豫的话
        this.typeInterval = setInterval(() => {
            if (state === 0) {
                if (i < mistakeStr.length) {
                    const char = mistakeStr.charAt(i);
                    currentText += char;
                    element.innerHTML = currentText + cursorHtml;
                    
                    // 🌟 降频：遇到非空格字符时，每 3 个字响 1 次
                    // (余数设为 1 保证敲第一下就响，反馈最跟手)
                    if (char !== ' ') {
                        typeCounter++;
                        if (typeCounter % 3 === 1) playKeystroke(false); 
                    }
                    
                    i++;
                } else {
                    state = 1; 
                    clearInterval(this.typeInterval);
                    setTimeout(() => { 
                        this.typeInterval = setInterval(step.bind(this), 35); 
                    }, 1200); 
                    return;
                }
            }
        }, 90); 

        const step = () => {
             if (state === 1) { 
                 // === 删除阶段 ===
                 if (currentText.length > 0) {
                    currentText = currentText.slice(0, -1);
                    element.innerHTML = currentText + cursorHtml;
                    
                    // 🌟 同样：每删 3 个字符响 1 次，且第一下必响
                    deleteCounter++;
                    if (deleteCounter % 3 === 1) playKeystroke(true); 

                } else {
                    state = 2; 
                    i = 0; 
                    typeCounter = 0; // 🌟 重新打字前，重置计数器
                    clearInterval(this.typeInterval);
                    setTimeout(() => { 
                        this.typeInterval = setInterval(step.bind(this), 80); 
                    }, 800);
                }
            } else if (state === 2) {
                // === 重新输入真心话阶段 ===
                if (i < finalStr.length) {
                    const char = finalStr.charAt(i);
                    currentText += char;
                    element.innerHTML = currentText + cursorHtml;
                    
                    // 🌟 降频打字
                    if (char !== ' ') {
                        typeCounter++;
                        if (typeCounter % 3 === 1) playKeystroke(false); 
                    }
                    
                    i++;
                } else { 
                    clearInterval(this.typeInterval); 
                }
            }
        };
    },

    navTo(pageId) {
        // 👇 修改：数组里多加一个 'gallery'，并且加上 if(el) 判断防止找不到元素报错
        ['lobby', 'index', 'read', 'editor', 'gallery'].forEach(p => {
            const el = document.getElementById(`chronicle-page-${p}`);
            if (el) el.classList.add('hidden');
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
          // 🌟 每次打开弹窗时，加载所有的预设模板
          this.loadAuTemplates(); 
          m.classList.add('active');
     } else {
          m.classList.remove('active');
     }
 },

// 🌟 背景设定预设库 (AU Templates) 核心逻辑  // 
    
    // 1. 加载并渲染模板标签
    async loadAuTemplates() {
        const strip = document.getElementById('chronicle-template-strip');
        if (!strip) return;

        // 从全局 user_settings 数据库中读取模板（跨角色通用）
        let templates = await window.dbHelper.get('user_settings', 'chronicle_au_presets');
        templates = templates ? templates.value :[];
        
        // 默认保留一个“保存当前为模板”的黑色按钮
        let html = `<div class="tpl-chip add-new" onclick="ChronicleApp.saveCurrentAsTemplate()"><i class="fa-solid fa-plus"></i> 保存当前设定</div>`;
        
        // 渲染已保存的模板标签
        templates.forEach((tpl, i) => {
            const safeContent = encodeURIComponent(tpl.content);
            html += `
                <div class="tpl-chip" onclick="ChronicleApp.applyTemplate('${safeContent}')">
                    ${tpl.name}
                    <i class="fa-solid fa-times tpl-del" onclick="event.stopPropagation(); ChronicleApp.deleteTemplate(${i})"></i>
                </div>
            `;
        });
        strip.innerHTML = html;
    },

    // 2. 将当前输入框里的文字存为新模板
    async saveCurrentAsTemplate() {
        const content = document.getElementById('chronicle-persona-text').value.trim();
        if (!content) {
            window.utils.showToast('设定内容为空，请先输入背景故事');
            return;
        }
        
        // 弹出系统输入框，让用户给这个 AU 起个名字
        const name = prompt('给这个背景设定起个名字 (例如：黑手党AU, 末日废土)：');
        if (!name) return; // 如果点取消或没填，则中止
        
        // 读取现有列表，追加新模板，并重新存入数据库
        let templates = await window.dbHelper.get('user_settings', 'chronicle_au_presets');
        templates = templates ? templates.value :[];
        
        templates.push({ name: name.trim(), content: content });
        await window.dbHelper.set('user_settings', { value: templates }, 'chronicle_au_presets');
        
        window.utils.showToast(`模板 [${name}] 保存成功！`);
        // 保存完后立刻刷新上方的标签列表
        this.loadAuTemplates();
    },

    // 3. 点击标签，应用模板文字到输入框
    applyTemplate(encodedContent) {
        const content = decodeURIComponent(encodedContent);
        const textarea = document.getElementById('chronicle-persona-text');
        
        // 直接替换输入框里的内容
        textarea.value = content;
        
        // 添加一个轻微的闪烁动画，给用户“已应用”的视觉反馈
        textarea.style.backgroundColor = 'rgba(212, 175, 55, 0.1)'; 
        setTimeout(() => {
            textarea.style.backgroundColor = 'transparent';
        }, 300);
        
        window.utils.showToast("背景设定已套用");
    },

    // 4. 删除不需要的模板
    async deleteTemplate(index) {
        if (!confirm("确定要删除这个背景模板吗？")) return;

        let templates = await window.dbHelper.get('user_settings', 'chronicle_au_presets');
        if (templates && templates.value) {
            // 根据索引从数组中移除
            templates.value.splice(index, 1);
            // 重新写回数据库
            await window.dbHelper.set('user_settings', { value: templates.value }, 'chronicle_au_presets');
            
            // 刷新列表
            this.loadAuTemplates();
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
    },
// 🧠 高级 3D 神经元渲染引擎 (动态按需加载 Three.js)
    async initNeuralCore() {
        if (this.neuralCoreInitialized) return;
        this.neuralCoreInitialized = true;
        
        const container = document.getElementById('neural-webgl-container');
        if (!container) return;

        try {
            // 🌟 核心修改：现在直接使用 map 里定义好的名字，浏览器就能自动找到了！
            const THREE = await import('three');
            const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
            const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
            const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
            const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0; 
            container.appendChild(renderer.domElement);

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, 0, 28); 

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true; controls.enableZoom = false;
            controls.autoRotate = true; controls.autoRotateSpeed = 0.5;

            // 背景渐变
            const bgCanvas = document.createElement('canvas');
            bgCanvas.width = 512; bgCanvas.height = 512;
            const bgCtx = bgCanvas.getContext('2d');
            const bgGradient = bgCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
            bgGradient.addColorStop(0, '#e2e8f0'); bgGradient.addColorStop(1, '#94a3b8'); 
            bgCtx.fillStyle = bgGradient; bgCtx.fillRect(0, 0, 512, 512);
            const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bgCanvas), depthWrite: false }));
            bgMesh.position.z = -60; 
            camera.add(bgMesh);
            scene.add(camera);

            // 粒子生成
            const particleCount = 450; const maxRadius = 7.5;
            const particlesData =[]; const positions = new Float32Array(particleCount * 3); const colors = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
                const r = maxRadius * Math.cbrt(Math.random()); 
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos(2 * Math.random() - 1);
                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);
                particlesData.push({ origX: x, origY: y, origZ: z, currX: x, currY: y, currZ: z, vx: 0, vy: 0, vz: 0, isDetached: false, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() });
            }
            
            const dotCanvas = document.createElement('canvas');
            dotCanvas.width = 32; dotCanvas.height = 32;
            const dCtx = dotCanvas.getContext('2d');
            dCtx.beginPath(); dCtx.arc(16, 16, 14, 0, Math.PI*2); dCtx.fillStyle = '#ffffff'; dCtx.fill();
            
            const particlesGeometry = new THREE.BufferGeometry();
            const particlesMaterial = new THREE.PointsMaterial({ size: 0.22, map: new THREE.CanvasTexture(dotCanvas), transparent: true, depthWrite: false, vertexColors: true, blending: THREE.NormalBlending });
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
            scene.add(particleSystem);

            // 连线生成
            const maxLines = particleCount * particleCount / 2;
            const linePositions = new Float32Array(maxLines * 6);
            const lineColors = new Float32Array(maxLines * 6);
            const linesGeometry = new THREE.BufferGeometry();
            linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
            linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
            const linesMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.65, blending: THREE.NormalBlending });
            const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
            scene.add(linesMesh);

            // 泛光处理
            const renderScene = new RenderPass(scene, camera);
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.4, 2.0);
            const composer = new EffectComposer(renderer);
            composer.addPass(renderScene); composer.addPass(bloomPass);

            // 状态机
            let state = 'STABLE'; let stateTimer = 0;
            const clock = new THREE.Clock(); let fractureCenters =[]; let currentConnectDist = 2.4; 

            // 暴露触发器：每次上传文章，强制把进度条拨到“即将崩坏”的临界点！
            this.triggerNeuralCore = () => {
                state = 'STABLE';
                stateTimer = 4.0; // 一进去马上就要引发崩坏
            };

            const animate = () => {
                requestAnimationFrame(animate);
                
                // 性能优化：只有在遮罩层开启时，才进行 3D 渲染运算！
                const overlay = document.getElementById('chronicle-aes-overlay');
                if (!overlay || !overlay.classList.contains('active')) return;

                const delta = Math.min(clock.getDelta(), 0.1);
                const time = clock.getElapsedTime();
                controls.update();
                stateTimer += delta;

                let targetConnectDist = 2.4; 

                // 物理状态切换 (去掉了干扰你的文字逻辑)
                if (state === 'STABLE' && stateTimer > 5.0) {
                    state = 'PARTIAL'; stateTimer = 0;
                    fractureCenters =[];
                    for(let k=0; k<3; k++){
                        const dir = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
                        fractureCenters.push(dir.multiplyScalar(maxRadius * 0.9));
                    }
                    particlesData.forEach(p => {
                        let nearFracture = false;
                        fractureCenters.forEach(fc => { if (fc.distanceTo(new THREE.Vector3(p.origX, p.origY, p.origZ)) < 3.5) nearFracture = true; });
                        if (nearFracture && Math.random() > 0.1) { 
                            p.isDetached = true;
                            p.vx = (p.origX * 0.015) + (Math.random()-0.5)*0.04;
                            p.vy = (p.origY * 0.015) + (Math.random()-0.5)*0.04; 
                            p.vz = (p.origZ * 0.015) + (Math.random()-0.5)*0.04;
                        }
                    });
                } 
                else if (state === 'PARTIAL') {
                    targetConnectDist = 4.0; 
                    if (stateTimer > 4.0) {
                        state = 'COLLAPSE'; stateTimer = 0;
                        controls.autoRotateSpeed = 4.0;
                        particlesData.forEach(p => {
                            if (!p.isDetached) {
                                p.isDetached = true;
                                p.vx = (p.origX * 0.03) + (Math.random()-0.5)*0.08;
                                p.vy = (p.origY * 0.03) + (Math.random()-0.5)*0.08; p.vz = (p.origZ * 0.03) + (Math.random()-0.5)*0.08;
                            }
                        });
                    }
                }
                else if (state === 'COLLAPSE') {
                    targetConnectDist = 7.0; 
                    if (stateTimer > 4.5) { state = 'RECOMBINE'; stateTimer = 0; controls.autoRotateSpeed = 0.5; }
                }
                else if (state === 'RECOMBINE') {
                    targetConnectDist = 5.0; 
                    if (stateTimer > 5.5) { state = 'STABLE'; stateTimer = 0; }
                }

                currentConnectDist += (targetConnectDist - currentConnectDist) * 0.04;
                let waveRadius = (time * 3.0) % 15.0; 
                let vertexPos = 0, colorPos = 0, numConnected = 0;

                for (let i = 0; i < particleCount; i++) {
                    const p = particlesData[i];
                    if (p.isDetached) {
                        if (state !== 'RECOMBINE') {
                            p.vx *= 0.975; p.vy *= 0.975; p.vz *= 0.975; 
                            p.vx += Math.sin(time * 2 + p.phase) * 0.006; p.vy += Math.cos(time * 1.5 + p.phase) * 0.006; p.vz += Math.cos(time * 2.5 + p.phase) * 0.006;
                            const dist = Math.sqrt(p.currX**2 + p.currY**2 + p.currZ**2);
                            if (dist > 18.0) { p.vx -= (p.currX / dist)*0.01; p.vy -= (p.currY / dist)*0.01; p.vz -= (p.currZ / dist)*0.01; }
                            p.currX += p.vx; p.currY += p.vy; p.currZ += p.vz;
                        } else {
                            const pull = Math.min(0.06, stateTimer * 0.015); 
                            p.vx += (p.origX - p.currX) * pull; p.vy += (p.origY - p.currY) * pull; p.vz += (p.origZ - p.currZ) * pull;
                            p.vx *= 0.86; p.vy *= 0.86; p.vz *= 0.86; 
                            p.currX += p.vx; p.currY += p.vy; p.currZ += p.vz;
                            if (Math.sqrt((p.origX-p.currX)**2 + (p.origY-p.currY)**2 + (p.origZ-p.currZ)**2) < 0.2) p.isDetached = false;
                        }
                    } else {
                        p.currX += (p.origX + Math.sin(time * p.speed + p.phase) * 0.3 - p.currX) * 0.1;
                        p.currY += (p.origY + Math.cos(time * p.speed + p.phase) * 0.3 - p.currY) * 0.1;
                        p.currZ += (p.origZ + Math.sin(time * p.speed * 0.8 + p.phase) * 0.3 - p.currZ) * 0.1;
                    }
                    positions[i*3] = p.currX; positions[i*3+1] = p.currY; positions[i*3+2] = p.currZ;

                    let r, g, b;
                    if (p.isDetached) {
                        r = 0.62; g = 0.165; b = 0.133;
                    } else {
                        r = 0.06; g = 0.06; b = 0.08; 
                        const heat = Math.max(0, 1.0 - Math.abs(Math.sqrt(p.origX**2 + p.origY**2 + p.origZ**2) - waveRadius) * 0.6); 
                        r += heat * 4.0; g += heat * 1.5; b += heat * 0.2; 
                    }
                    colors[i*3] = r; colors[i*3+1] = g; colors[i*3+2] = b;
                }

                particlesGeometry.attributes.position.needsUpdate = true;
                particlesGeometry.attributes.color.needsUpdate = true;

                const connectDistSq = currentConnectDist * currentConnectDist;
                for (let i = 0; i < particleCount; i++) {
                    for (let j = i + 1; j < particleCount; j++) {
                        const dx = positions[i*3] - positions[j*3]; const dy = positions[i*3+1] - positions[j*3+1]; const dz = positions[i*3+2] - positions[j*3+2];
                        const distSq = dx*dx + dy*dy + dz*dz;
                        if (distSq < connectDistSq) {
                            let tension = Math.pow(distSq > 5.76 ? Math.min(1.0, (Math.sqrt(distSq) - 2.4) / (currentConnectDist - 2.4)) : 0, 1.5); 
                            let lr1 = colors[i*3], lg1 = colors[i*3+1], lb1 = colors[i*3+2];
                            let lr2 = colors[j*3], lg2 = colors[j*3+1], lb2 = colors[j*3+2];
                            if (tension > 0) {
                                lr1 = lr1 * (1 - tension) + 2.8 * tension; lg1 = lg1 * (1 - tension) + 0.15 * tension; lb1 = lb1 * (1 - tension) + 0.2 * tension;
                                lr2 = lr2 * (1 - tension) + 2.8 * tension; lg2 = lg2 * (1 - tension) + 0.15 * tension; lb2 = lb2 * (1 - tension) + 0.2 * tension;
                            }
                            linePositions[vertexPos++] = positions[i*3]; linePositions[vertexPos++] = positions[i*3+1]; linePositions[vertexPos++] = positions[i*3+2];
                            linePositions[vertexPos++] = positions[j*3]; linePositions[vertexPos++] = positions[j*3+1]; linePositions[vertexPos++] = positions[j*3+2];
                            lineColors[colorPos++] = lr1; lineColors[colorPos++] = lg1; lineColors[colorPos++] = lb1;
                            lineColors[colorPos++] = lr2; lineColors[colorPos++] = lg2; lineColors[colorPos++] = lb2;
                            numConnected++;
                        }
                    }
                }
                linesGeometry.setDrawRange(0, numConnected * 2);
                linesGeometry.attributes.position.needsUpdate = true;
                linesGeometry.attributes.color.needsUpdate = true;

                composer.render();
            };

            animate();

            // 监听窗口缩放
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                composer.setSize(window.innerWidth, window.innerHeight);
            });

        } catch (e) {
            console.error("Neural Core 渲染引擎加载失败:", e);
        }
    }
};