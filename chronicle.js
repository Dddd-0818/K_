// --- Chronicle / Noir Archive System (True 1:1 Replica with AI Logic) ---
const ChronicleApp = {
    rootId: 'chronicle-app-container',
    currentData: null,
    
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
                    <div class="nav-paginator">Reader</div>
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

        document.addEventListener('click', (e) => {
            const wrapper = e.target.closest('.annotation-wrapper');
            if (wrapper && document.getElementById('chronicle-app-container').contains(wrapper)) {
                wrapper.classList.toggle('active');
            }
        });
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

    // === AI 核心生成逻辑 ===
    async generateCharacterLog() {
        const btn = document.getElementById('chronicle-ai-gen-btn');
        btn.innerText = "ACCESSING NEURAL NETWORK...";
        btn.style.pointerEvents = 'none';

        try {
            // 获取最近聊天记录 (最近20条，供AI参考)
            const history = await window.dbHelper.getHistoryForDossier(this.currentData.id);
            const recentHistory = history.slice(-20); 

            // 调用主系统里新加的究极 Prompt
            const prompt = window.promptManager.createChronicleArticlePrompt(
                this.currentData.dossierRef, 
                this.currentData.personaNote,
                recentHistory
            );
            
            const aiResponse = await window.apiHelper.getChatCompletion(prompt);
            
            // 解析 JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("档案解析失败");
            const result = JSON.parse(jsonMatch[0]);

            // 拼装完整的 HTML
            const chapIndex = (this.currentData.chapters?.length || 0) + 1;
            const fullHtml = `
                <div class="chapter-header">
                    <span class="ch-num">FILE_${String(chapIndex).padStart(2,'0')}</span>
                    <h2 class="ch-title">${result.title}</h2>
                </div>
                <div class="article-text">${result.contentHtml}</div>
            `;

            // 保存到主数据库 CHRONICLES 表
            const newLog = {
                dossierId: this.currentData.id,
                title: result.title,
                type: 'character', 
                html: fullHtml,
                timestamp: Date.now()
            };
            const newId = await window.dbHelper.add('chronicles', newLog);
            newLog.id = newId;
            
            // 刷新列表
            await this.loadAndRenderChapters();
            window.utils.showToast("角色新档案已解密");

        } catch (e) {
            console.error(e);
            window.utils.showToast("解密失败，请检查连接");
        } finally {
            btn.innerText = "+ DECRYPT CHARACTER LOG (AI)";
            btn.style.pointerEvents = 'auto';
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