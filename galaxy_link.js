/**
 * 🌌 Galaxy Link (星际链路) - 终极融合版
 * UI: 1:1 还原用户提供的 TXT 设计 (修复顶部缝隙)
 * Logic: 真实 Supabase 联机
 */

const Galaxy = {
    rootId: 'galaxy-app-root',
    supabase: null,
    timerInterval: null,

    // Supabase 配置
    config: {
        url: 'https://binpgjynlrolkxwwzbse.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbnBnanlubHJvbGt4d3d6YnNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDQxMDgsImV4cCI6MjA4NjU4MDEwOH0.MsCnFerOwUXHoi7kZdYf0XybvlSWq7DPwENgL-efraU'
    },

    state: {
        user: null,
        friends: [],
        activeRoom: '8802',
        timerInterval: null,
        activeLocalChars: new Set(),
        currentSubscription: null, // <--- 用于存当前的监听通道
        replyDebounceTimer: null, // <--- 角色回复的防抖计时器
        lastPrivateRoom: null, // <--- 记录最近一次的私密房间ID，用于重新进入时恢复状态
        roomMessageCache: {},  // <--- 各房间的消息缓存 { roomId: [msg, msg, ...] }
        typingDebounceTimer: null, // <--- 真人输入防抖
        friendTypingEl: null,      // <--- 好友"正在输入"的 DOM 元素引用
        charTypingMsgId: null      // <--- 角色输入广播消息的 ID（用于删除）
    },

    // ▼▼▼ 【新增】外部挂钩 (用于接收主文件的角色数据和AI能力) ▼▼▼
    hooks: {
        getLocalCharacters: () => [], // 获取本地角色列表的函数 (默认为空)
        onAiGeneration: null          
    },
    // ▲▲▲ 新增结束 ▲▲▲

// --- 【修正】供主程序调用的配置接口 ---
    setup(config) {
        // 1. 挂载数据获取接口
        if (config.getLocalCharacters) {
            this.hooks.getLocalCharacters = config.getLocalCharacters;
            console.log("🌌 Galaxy Link: 本地角色数据接口已挂载");
        }
        
        // 2. 【核心修复】挂载 AI 生成接口
        if (config.onAiGeneration) {
            this.hooks.onAiGeneration = config.onAiGeneration;
            console.log("🌌 Galaxy Link: AI 生成接口已挂载 (大脑已连接)");
        }
    },

    // --- 初始化 ---
    async init() {
        if (document.getElementById(this.rootId)) return;

        console.log("🌌 Galaxy Link: System Booting...");
        this.injectDependencies();
        this.injectStyles();
        this.injectHTML();

        // 绑定基础UI事件
        this.bindUIEvents();

        // 启动网络连接
        await this.waitForSupabase();
        this.initSupabaseClient();
       await this.authenticateUser();
        
        // 绑定事件与监听 (默认监听公共大厅)
        this.subscribeToRealtime('8802'); // <--- 这里显式传入默认房间号
        
        console.log("🌌 Galaxy Link: Online.");
    },

    // --- 1. 注入依赖 ---
    injectDependencies() {
       
    },

    // --- 2. 注入样式 (UI 还原核心) ---
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* === 宿主容器：全屏最高层级，背景不透明 === */
            #galaxy-app-root {
                position: fixed;
                top: 0; left: 0;
                width: 100vw; height: 100vh;
                
                /* 【修复1】z-index 99999 (MAX Priority) 覆盖所有层级 */
                z-index: 99999; 
                
                /* 【修复2】背景色设为底色，防止透明露出下面 */
                background-color: #f0f2f5; 
                
                /* 【修复3】保留 padding-top 避让刘海，但因为有背景色，不会显得空 */
                padding-top: 0px;
                box-sizing: border-box;

                display: none; 
                flex-direction: column;
                
                /* 进场动画 */
                opacity: 0;
                transform: scale(0.98);
                transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
            }

            #galaxy-app-root.active {
                display: flex;
                opacity: 1;
                transform: scale(1);
            }

            /* --- 样式变量 (来自你的 TXT) --- */
            #galaxy-app-root {
                --bg-main: #ffffff;
                --bg-secondary: #fafafa;
                --text-primary: #222222;
                --text-secondary: #888888;
                --border-light: #eeeeee;
                --accent-black: #111111;
                --radius-md: 16px;
                --radius-full: 999px;
                --shadow-sm: 0 2px 8px rgba(0,0,0,0.05);
                --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                --font-serif: 'Times New Roman', Times, serif;
                font-family: var(--font-main);
                color: var(--text-primary);
            }
            
            #galaxy-app-root * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

            /* --- 页面容器 --- */
            #galaxy-app-root .app-container {
                position: relative;
                width: 100%; height: 100%;
                background-color: var(--bg-main);
                display: flex; flex-direction: column;
                overflow: hidden;
            }

            /* --- 页面通用 --- */
            #galaxy-app-root .g-page {
                flex: 1; display: none; flex-direction: column; 
                width: 100%; height: 100%; overflow-y: auto;
            }

            /* --- 按钮组件 --- */
            #galaxy-app-root .btn { border: none; background: var(--accent-black); color: #fff; padding: 14px 24px; font-size: 15px; font-weight: 600; cursor: pointer; border-radius: var(--radius-full); width: 100%; transition: 0.2s; }
            #galaxy-app-root .btn:active { transform: scale(0.98); }
            #galaxy-app-root .btn.disabled { background: #ccc; pointer-events: none; }
            #galaxy-app-root .btn.outline { background: transparent; border: 1px solid var(--border-light); color: var(--text-primary); }
            #galaxy-app-root .btn.danger { background: #fff; border: 1px solid #ff4d4f; color: #ff4d4f; }
            
            #galaxy-app-root .g-icon-btn { 
                width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
                font-size: 22px; color: var(--text-primary); border-radius: 50%; cursor: pointer; 
            }
            #galaxy-app-root .g-icon-btn:active { background: var(--bg-secondary); }

            /* --- 1. 免责声明页 --- */
            #g-disclaimer { justify-content: center; align-items: center; padding: 40px 32px; display: none; }
            #galaxy-app-root .disclaimer-content { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; }
            #galaxy-app-root .disclaimer-icon { font-size: 48px; opacity: 0.5; margin-bottom: 24px; }
            #galaxy-app-root .disclaimer-title { font-size: 22px; font-weight: 700; margin-bottom: 32px; }
            #galaxy-app-root .disclaimer-text { font-size: 14px; line-height: 1.8; text-align: center; color: var(--text-secondary); margin-bottom: 40px; }
            #galaxy-app-root .g-timer { font-size: 56px; font-weight: 300; margin-bottom: 40px; font-variant-numeric: tabular-nums; }

            /* --- 2. 大厅主页 --- */
            #g-lobby-page { display: none; background: var(--bg-main); overflow-y: auto; }
            
            #galaxy-app-root .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: transparent; flex-shrink: 0; }
            #galaxy-app-root .header-title { font-weight: 600; font-size: 17px; text-transform: uppercase; }

            #galaxy-app-root .profile-section { padding: 20px 24px 30px; display: flex; flex-direction: column; align-items: center; }
            #galaxy-app-root .date-widget { font-family: var(--font-serif); font-style: italic; color: var(--text-secondary); font-size: 14px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            
            #galaxy-app-root .avatar-wrapper { position: relative; margin-bottom: 16px; }
            #galaxy-app-root .avatar-container { width: 100px; height: 100px; border-radius: 50%; overflow: hidden; background: var(--bg-secondary); border: 4px solid #fff; box-shadow: var(--shadow-sm); position: relative; z-index: 2; }
            #galaxy-app-root .avatar-img { width: 100%; height: 100%; object-fit: cover; }
            
            #galaxy-app-root .visualizer-ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px; border: 1px solid rgba(0,0,0,0.05); border-radius: 50%; animation: pulse 3s infinite ease-in-out; z-index: 1; }
            #galaxy-app-root .visualizer-ring:nth-child(2) { width: 160px; height: 160px; animation-delay: 0.5s; border: 1px solid rgba(0,0,0,0.03); }
            @keyframes pulse { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; } }

            #galaxy-app-root .user-name { font-size: 22px; font-weight: 700; margin-bottom: 10px; color: var(--accent-black); z-index: 2; }
            
            #galaxy-app-root .status-badge { padding: 6px 16px; background: #fff; border: 1px solid var(--border-light); font-size: 12px; border-radius: 99px; display: flex; align-items: center; gap: 8px; color: var(--text-secondary); cursor: pointer; box-shadow: var(--shadow-sm); z-index: 2; }
            #galaxy-app-root .status-dot { width: 6px; height: 6px; background-color: #ddd; border-radius: 50%; }
            #galaxy-app-root .status-dot.online { background-color: #4CAF50; }

            /* --- 列表组件 (修复版) --- */
#galaxy-app-root .g-friends-widget {
    width: 100%;
    margin-top: 24px;
    background: #fff;
    border: 1px solid var(--border-light);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
}

/* 列表头部 (点击区域) */
#galaxy-app-root .g-friends-header {
    padding: 12px 16px;
    background: #fafafa;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
}

#galaxy-app-root .g-friends-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
}

#galaxy-app-root .g-friends-count {
    background: var(--accent-black);
    color: #fff;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 10px;
    margin-left: 8px;
}

#galaxy-app-root .g-friends-arrow {
    font-size: 14px;
    color: var(--text-secondary);
    transition: transform 0.3s ease;
}

/* 列表内容区 (默认折叠) */
#galaxy-app-root .g-friends-list {
    padding: 0;
    background: #fff;
    max-height: 0; /* 默认隐藏 */
    overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 展开状态 */
#galaxy-app-root .g-friends-list.expanded {
    max-height: 240px;
    overflow-y: auto;
    border-top: 1px solid var(--border-light);
}

/* 单个好友项 */
#galaxy-app-root .g-friend-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f5f5f5;
    transition: background 0.2s;
}

#galaxy-app-root .g-friend-item:last-child {
    border-bottom: none;
}

#galaxy-app-root .g-friend-item:active {
    background-color: #f9f9f9;
}

/* 头像约束 (解决头像过大问题) */
#galaxy-app-root .g-friend-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    margin-right: 12px;
    background: #eee;
    object-fit: cover;
    border: 1px solid #eee;
    flex-shrink: 0; /* 禁止压缩 */
}

#galaxy-app-root .g-friend-info {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
}

#galaxy-app-root .g-friend-code {
    font-size: 10px;
    color: var(--text-secondary);
    margin-top: 2px;
}

            #galaxy-app-root .action-area { padding: 30px 24px; flex: 1; background: var(--bg-main); border-top: 1px solid var(--border-light); }
            #galaxy-app-root .section-label { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; display: block; }
            
            #galaxy-app-root .input-group-rounded { display: flex; background: var(--bg-secondary); border-radius: 99px; padding: 4px; border: 1px solid var(--border-light); margin-bottom: 30px; }
            #galaxy-app-root input { flex: 1; border: none; background: transparent; padding-left: 20px; outline: none; font-size: 14px; }
            #galaxy-app-root .btn-invite-round { width: 48px; height: 48px; border-radius: 50%; background: var(--accent-black); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; }

            #galaxy-app-root .message-card-btn { background: var(--bg-secondary); color: var(--text-primary); height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; border-radius: var(--radius-md); border: 1px solid var(--border-light); font-weight: 600; cursor: pointer; width: 100%; }

            /* --- 3. 聊天页 (完整修复版) --- */
            #galaxy-app-root #g-chat-page { background: #f9f9f9; display: none; }
            
            #galaxy-app-root .chat-header { 
                background: #fff; 
                border-bottom: 1px solid var(--border-light); 
                padding: 12px 16px; 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                flex-shrink: 0; 
            }
            
            #galaxy-app-root .chat-content { 
                flex: 1; 
                padding: 20px 16px; 
                overflow-y: auto; 
                display: flex; 
                flex-direction: column; 
                gap: 20px; /* [修改] 增加消息间距 */
                background: #f9f9f9; 
            }

            /* [修改] 系统消息：强制居中，灰色胶囊样式 */
            #galaxy-app-root .system-msg { 
                text-align: center; 
                font-size: 11px; 
                color: #b0b0b0; 
                background: rgba(0,0,0,0.05); 
                padding: 4px 12px; 
                border-radius: 12px; 
                align-self: center; /* 关键：自身居中 */
                margin: 5px 0; 
                max-width: 80%;
            }
            
            /* [修改] 消息行：基础布局 */
            #galaxy-app-root .msg-row { 
                display: flex; 
                align-items: flex-start; /* 顶部对齐 */
                gap: 8px; 
                width: 100%; 
            }

            /* [修改] 自己发的消息：反转排列 (头像在右，气泡在左) */
            #galaxy-app-root .msg-row.self { 
                flex-direction: row-reverse; 
            }

            /* [新增] 消息包裹层 (用于垂直排列 昵称 和 气泡) */
            #galaxy-app-root .msg-wrapper { 
                display: flex; 
                flex-direction: column; 
                max-width: 70%; 
            }
            /* [新增] 别人的消息靠左，自己的消息靠右 */
            #galaxy-app-root .msg-row.other .msg-wrapper { align-items: flex-start; }
            #galaxy-app-root .msg-row.self .msg-wrapper { align-items: flex-end; }

            /* [新增] 昵称样式 */
            #galaxy-app-root .msg-name { 
                font-size: 10px; 
                color: #999; 
                margin-bottom: 2px; 
                margin-left: 4px; /* 稍微缩进对齐气泡 */
            }
            #galaxy-app-root .msg-row.self .msg-name { 
                margin-right: 4px; /* 自己的昵称右缩进 */
            }

            /* 头像 */
            #galaxy-app-root .msg-avatar { 
                width: 36px; 
                height: 36px; 
                border-radius: 50%; 
                background: #ddd; 
                object-fit: cover; 
                border: 1px solid #fff; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
                flex-shrink: 0; /* 防止被压缩 */
            }

            /* 气泡本体 */
            #galaxy-app-root .msg-bubble { 
                padding: 10px 14px; 
                font-size: 14px; 
                line-height: 1.5; 
                position: relative; 
                border-radius: 12px; 
                word-wrap: break-word; 
                box-shadow: 0 1px 2px rgba(0,0,0,0.05); 
            }
            
            /* [修改] 气泡颜色与圆角细节 */
            #galaxy-app-root .msg-row.self .msg-bubble { 
                background: #1a1a1a; 
                color: #ffffff; 
                border-top-right-radius: 2px; /* 右上角尖角 */
            }
            #galaxy-app-root .msg-row.other .msg-bubble { 
                background: #fff; 
                color: #222; 
                border: 1px solid #eee; 
                border-top-left-radius: 2px; /* 左上角尖角 */
            }

            /* 底部输入栏 */
            #galaxy-app-root .chat-footer { 
                background: #fff; 
                padding: 12px 16px; 
                border-top: 1px solid var(--border-light); 
                display: flex; 
                align-items: center; 
                gap: 10px; 
                flex-shrink: 0; 
                padding-bottom: max(12px, env(safe-area-inset-bottom)); 
            }
            #galaxy-app-root .chat-input { 
                flex: 1; 
                border: none; 
                background: #f2f2f2; 
                padding: 12px 16px; 
                border-radius: 20px; 
                font-size: 14px; 
                outline: none; 
            }
            #galaxy-app-root .chat-btn-send { 
                width: 40px; 
                height: 40px; 
                border-radius: 50%; 
                background: #000; 
                color: #fff; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 18px; 
                border: none; 
                cursor: pointer; 
                transition: transform 0.2s; 
            }
            #galaxy-app-root .chat-btn-send:active { transform: scale(0.9); }
            
            /* 底部左侧邀请按钮 */
            #galaxy-app-root .chat-btn-invite { 
                width: 40px; 
                height: 40px; 
                border-radius: 50%; 
                background: transparent; 
                border: 1px solid var(--border-light); 
                color: var(--text-primary); 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 20px; 
                cursor: pointer; 
                transition: all 0.2s; 
            }
            #galaxy-app-root .chat-btn-invite:active { background: #f5f5f5; }

            /* 弹窗通用 */
            #galaxy-app-root .modal-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 500; display: none; align-items: center; justify-content: center; backdrop-filter: blur(5px); opacity: 1 !important; }
            #galaxy-app-root .modal-card { width: 82%; background: #fff; border-radius: 16px; padding: 32px 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); text-align: center; }
            #galaxy-app-root .modal-title { font-size: 18px; font-weight: 700; margin-bottom: 24px; }
            #galaxy-app-root .modal-actions { display: flex; gap: 12px; margin-top: 32px; }
            #galaxy-app-root .setting-input-group { text-align: left; margin-bottom: 24px; }
            
            /* 邀请列表 */
            #galaxy-app-root .invite-section-title { text-align: left; font-size: 12px; font-weight: bold; color: #999; margin: 16px 0 8px 0; }
            #galaxy-app-root .invite-list { list-style: none; text-align: left; }
            #galaxy-app-root .invite-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f9f9f9; }
            #galaxy-app-root .invite-item input { margin-right: 12px; width: 18px; height: 18px; accent-color: #000; flex: 0; }
            #galaxy-app-root .invite-item-avatar { width: 36px; height: 36px; border-radius: 50%; margin-right: 10px; }
            /* --- 正在输入动画 --- */
            .g-typing-row { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 15px; width: 100%; }
            
            .g-typing-bubble {
                background: #fff;
                border: 1px solid #eee;
                padding: 12px 16px;
                border-radius: 12px;
                border-bottom-left-radius: 2px; /* 左下角尖角 */
                display: flex;
                align-items: center;
                gap: 4px;
                width: fit-content;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }

            .g-typing-dot {
                width: 6px; height: 6px; 
                background: #b0b0b0; 
                border-radius: 50%;
                animation: g-typing-bounce 1.4s infinite ease-in-out both;
            }

            .g-typing-dot:nth-child(1) { animation-delay: -0.32s; }
            .g-typing-dot:nth-child(2) { animation-delay: -0.16s; }
            
            @keyframes g-typing-bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            /* --- 捏脸面板 --- */
            #galaxy-app-root .avatar-option-row {
                display: flex; align-items: center; justify-content: space-between;
                padding: 10px 0; border-bottom: 1px solid #f5f5f5;
            }
            #galaxy-app-root .avatar-option-row:last-of-type { border-bottom: none; }
            #galaxy-app-root .avatar-option-label {
                font-size: 13px; color: #555; font-weight: 500; flex-shrink: 0; width: 48px;
            }
            #galaxy-app-root .avatar-select {
                flex: 1; margin-left: 12px; padding: 8px 12px;
                border: 1px solid #eee; border-radius: 10px;
                background: #fafafa; font-size: 13px; color: #222;
                appearance: none; -webkit-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
                background-repeat: no-repeat; background-position: right 12px center;
                padding-right: 32px; outline: none;
            }
            #galaxy-app-root .avatar-tab { transition: all 0.2s; }

            /* --- + 号菜单 --- */
            #galaxy-app-root .chat-header { position: relative; }
            #galaxy-app-root .g-plus-menu-item {
                display: flex; align-items: center; gap: 10px;
                padding: 14px 18px; font-size: 14px; font-weight: 500;
                cursor: pointer; transition: background 0.15s;
                color: var(--text-primary);
            }
            #galaxy-app-root .g-plus-menu-item:active { background: #f5f5f5; }
            #galaxy-app-root .g-plus-menu-item.danger { color: #ff4d4f; }
            #galaxy-app-root .g-plus-menu-item i { font-size: 18px; }
        `;
        document.head.appendChild(style);
    },

    // 3. 注入 HTML (结构 1:1 还原)
    injectHTML() {
        const div = document.createElement('div');
        div.id = this.rootId;
        div.innerHTML = `
            <div class="app-container">
                <!-- 1. 免责声明页 -->
                <div id="g-disclaimer" class="g-page">
                    <div class="disclaimer-content">
                        <i class="ph-light ph-shield-warning disclaimer-icon"></i>
                        <h1 class="disclaimer-title">服务协议与免责声明</h1>
                        <p class="disclaimer-text">
                            欢迎使用联机大厅服务。<br>
                            在进入前，请知悉本系统仅用于模拟测试。<br>
                            所有数据均为虚拟，请保持友好的交流环境。
                        </p>
                        <div class="g-timer" id="g-countdown">15</div>
                    </div>
                    <button id="g-btn-agree" class="btn disabled">请稍读 (Wait)</button>
                </div>

                <!-- 2. 大厅主页 -->
                <div id="g-lobby-page" class="g-page">
                    <div class="header">
                        <!-- 退出按钮 -->
                        <div class="btn-icon" id="g-btn-exit"><i class="ph-light ph-caret-left"></i></div>
                        <div class="header-title">THE LOBBY</div>
                        <div class="btn-icon" id="g-btn-settings"><i class="ph-light ph-gear-six"></i></div>
                    </div>

                    <div class="profile-section">
                        <div class="date-widget" id="g-date">LOADING...</div>
                        <div class="avatar-wrapper">
                            <div class="visualizer-ring"></div>
                            <div class="visualizer-ring"></div>
                            <div class="avatar-container">
                                <img src="" class="avatar-img" id="g-my-avatar">
                            </div>
                        </div>
                        <div class="user-name" id="g-my-name">Guest</div>
                        <div class="status-badge">
                            <div class="status-dot" id="g-status-dot"></div>
                            <span id="g-status-text">初始化中...</span>
                        </div>

                        <!-- 好友列表组件 (结构修复) -->
<div class="g-friends-widget" id="g-friends-widget">
    <!-- 头部：点击折叠 -->
    <div class="g-friends-header" id="g-toggle-friends">
        <div style="display:flex; align-items:center;">
            <span class="g-friends-title">在线好友</span>
            <span class="g-friends-count" id="g-friend-count">0</span>
        </div>
        <i class="ph-light ph-caret-down g-friends-arrow" id="g-friends-arrow"></i>
    </div>
    
    <!-- 列表容器 -->
    <div class="g-friends-list" id="g-friend-list-container">
        <!-- JS 将在这里插入 .g-friend-item -->
        <div style="padding:15px; text-align:center; color:#999; font-size:12px;">暂无好友</div>
    </div>
</div>
</div>
                    <div class="action-area">
                        <div class="invite-box">
                            <label class="section-label">建立连接</label>
                            <div class="input-group-rounded">
                                <input type="text" placeholder="输入对方信号码 (4位)..." id="g-invite-code">
                                <div class="btn-invite-round" id="g-btn-connect"><i class="ph-light ph-paper-plane-tilt"></i></div>
                            </div>
                        </div>

                        <div class="message-box">
                            <label class="section-label">功能模块</label>
                            <div class="message-card-btn" id="g-btn-enter-chat">
                                <div class="message-card-left">
                                    <i class="ph-light ph-chat-circle-dots" style="font-size: 24px;"></i>
                                    <span>公共聊天室 (Global)</span>
                                </div>
                                <i class="ph-light ph-caret-right"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. 聊天页 -->
                <div id="g-chat-page" class="g-page">
                    <header class="chat-header">
                        <div class="btn-icon" id="g-btn-back-lobby"><i class="ph-light ph-arrow-left"></i></div>
                        <div class="header-title">CHAT ROOM</div>
                         <div class="g-icon-btn" id="g-btn-plus-menu"><i class="ri-add-line"></i></div>

                        <!-- + 号小菜单 -->
                        <div id="g-plus-menu" style="
                            display:none; position:absolute; top:56px; right:12px;
                            background:#fff; border-radius:12px; overflow:hidden;
                            box-shadow:0 4px 20px rgba(0,0,0,0.12); z-index:200;
                            min-width:160px; border:1px solid #eee;
                        ">
                            <div class="g-plus-menu-item" id="g-menu-invite">
                                <i class="ri-user-add-line"></i>
                                <span>邀请好友 / 角色</span>
                            </div>
                            <div class="g-plus-menu-item danger" id="g-menu-clear">
                                <i class="ri-delete-bin-line"></i>
                                <span>清空聊天记录</span>
                            </div>
                        </div>
                    </header>

                    <div class="chat-content" id="g-chat-box">
                        <!-- 消息 -->
                    </div>

                    <div class="chat-footer">
                        <input type="text" class="chat-input" id="g-input" placeholder="输入消息..." autocomplete="off">
                        <div class="chat-btn-send" id="g-send">
                            <i class="ph-light ph-paper-plane-right"></i>
                        </div>
                    </div>
                </div>

                <!-- 弹窗：收到邀请 -->
                <div id="incoming-modal" class="modal-overlay">
                    <div class="modal-card">
                        <div class="avatar-container" style="width:72px; height:72px; margin:0 auto 16px; border:none; box-shadow:none;">
                            <img class="avatar-img incoming-avatar-img" src="">
                        </div>
                        <h3 class="modal-title">收到信号连接</h3>
                        <p style="color: #888; font-size: 14px; margin-bottom: 24px;" id="incoming-text">...</p>
                        <div class="modal-actions">
                            <button class="btn outline" id="btn-reject-invite">拒绝</button>
                            <button class="btn" id="btn-accept-invite">接受</button>
                        </div>
                    </div>
                </div>

                <!-- 弹窗：设置 -->
                <div id="settings-modal" class="modal-overlay">
                    <div class="modal-card" style="text-align:left; max-height:85vh; display:flex; flex-direction:column; padding:24px;">
                        <h3 class="modal-title" style="text-align:center; margin-bottom:16px;">身份设置</h3>

                        <!-- 昵称 -->
                        <div class="setting-input-group">
                            <label class="section-label">昵称</label>
                            <input type="text" id="setting-name">
                        </div>

                        <!-- Tab 切换 -->
                        <div style="display:flex; background:#f5f5f5; border-radius:10px; padding:3px; margin-bottom:16px; gap:3px;">
                            <div class="avatar-tab active" id="tab-builder" style="flex:1; text-align:center; padding:8px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.08);">🎨 捏脸</div>
                            <div class="avatar-tab" id="tab-url" style="flex:1; text-align:center; padding:8px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; color:#999;">🔗 网络URL</div>
                        </div>

                        <!-- 捏脸面板 -->
                        <div id="avatar-builder-panel" style="flex:1; overflow-y:auto;">
                            <!-- 预览头像 -->
                            <div style="text-align:center; margin-bottom:16px;">
                                <img id="avatar-preview" src="" style="width:90px; height:90px; border-radius:50%; border:3px solid #eee; background:#fafafa;">
                            </div>
                            <!-- 选项行 -->
                            <div class="avatar-option-row">
                                <label class="avatar-option-label">发型</label>
                                <select class="avatar-select" id="av-top">
                                    <option value="shortFlat">短发（平）</option>
                                    <option value="shortCurly">短发（卷）</option>
                                    <option value="dreads01">短发（锁）</option>
                                    <option value="straight01">直长发</option>
                                    <option value="curly">卷长发</option>
                                    <option value="bun">丸子头</option>
                                    <option value="bob">波波头</option>
                                    <option value="shortRound">短发（圆）</option>
                                    <option value="longButNotTooLong">中长发</option>
                                    <option value="bigHair">蓬松大发</option>
                                    <option value="fro">爆炸头</option>
                                    <option value="hat">帽子</option>
                                    <option value="hijab">头巾</option>
                                    <option value="turban">头巾2</option>
                                </select>
                            </div>
                            <div class="avatar-option-row">
                                <label class="avatar-option-label">发色</label>
                                <select class="avatar-select" id="av-hairColor">
                                    <option value="2c1b18">黑色</option>
                                    <option value="4a312c">深棕</option>
                                    <option value="a55728">棕色</option>
                                    <option value="d6b370">金棕</option>
                                    <option value="ecdcbf">金色</option>
                                    <option value="c93305">红色</option>
                                    <option value="f59797">粉色</option>
                                    <option value="b58143">橙棕</option>
                                    <option value="e8e1e1">银灰</option>
                                    <option value="ffffff">白金</option>
                                </select>
                            </div>
                            <div class="avatar-option-row">
                                <label class="avatar-option-label">眼睛</label>
                                <select class="avatar-select" id="av-eyes">
                                    <option value="default">默认</option>
                                    <option value="happy">开心</option>
                                    <option value="wink">眨眼</option>
                                    <option value="hearts">爱心</option>
                                    <option value="side">侧视</option>
                                    <option value="squint">眯眼</option>
                                    <option value="surprised">惊讶</option>
                                    <option value="cry">哭泣</option>
                                    <option value="closed">闭眼</option>
                                    <option value="eyeRoll">翻白眼</option>
                                    <option value="xDizzy">晕眩</option>
                                </select>
                            </div>
                            <div class="avatar-option-row">
                                <label class="avatar-option-label">嘴型</label>
                                <select class="avatar-select" id="av-mouth">
                                    <option value="smile">微笑</option>
                                    <option value="default">默认</option>
                                    <option value="twinkle">调皮</option>
                                    <option value="tongue">吐舌</option>
                                    <option value="serious">严肃</option>
                                    <option value="sad">悲伤</option>
                                    <option value="screamOpen">尖叫</option>
                                    <option value="eating">吃东西</option>
                                    <option value="disbelief">不信</option>
                                    <option value="grimace">龇牙</option>
                                    <option value="concerned">担忧</option>
                                </select>
                            </div>
                            <div class="avatar-option-row">
                                <label class="avatar-option-label">配饰</label>
                                <select class="avatar-select" id="av-accessories">
                                    <option value="">无</option>
                                    <option value="kurt">圆框眼镜</option>
                                    <option value="prescription01">方框眼镜</option>
                                    <option value="prescription02">细框眼镜</option>
                                    <option value="sunglasses">墨镜</option>
                                    <option value="round">圆墨镜</option>
                                    <option value="wayfarers">复古墨镜</option>
                                    <option value="eyepatch">眼罩</option>
                                </select>
                            </div>
                            <div class="avatar-option-row">
                                <label class="avatar-option-label">服装</label>
                                <select class="avatar-select" id="av-clothe">
                                    <option value="hoodie">连帽衫</option>
                                    <option value="blazerAndShirt">西装</option>
                                    <option value="blazerAndSweater">毛衣西装</option>
                                    <option value="collarAndSweater">高领毛衣</option>
                                    <option value="graphicShirt">印花T恤</option>
                                    <option value="shirtCrewNeck">圆领衬衫</option>
                                    <option value="shirtVNeck">V领衬衫</option>
                                    <option value="overall">工装</option>
                                    <option value="shirtScoopNeck">圆领T</option>
                                </select>
                            </div>
                            <div class="avatar-option-row">
                                <label class="avatar-option-label">肤色</label>
                                <select class="avatar-select" id="av-skin">
                                    <option value="ffdbb4">浅肤色</option>
                                    <option value="edb98a">米色</option>
                                    <option value="f8d25c">黄色</option>
                                    <option value="fd9841">小麦色</option>
                                    <option value="d08b5b">棕色</option>
                                    <option value="ae5d29">深棕</option>
                                    <option value="614335">深色</option>
                                </select>
                            </div>
                            <!-- 随机 / 重置 -->
                            <div style="display:flex; gap:8px; margin-top:16px; margin-bottom:4px;">
                                <button class="btn outline" id="av-btn-random" style="flex:1; padding:10px;">随机</button>
                                <button class="btn outline" id="av-btn-reset" style="flex:1; padding:10px;">重置</button>
                            </div>
                            <p style="font-size:11px; color:#bbb; text-align:center; margin-top:8px;">换装后会自动覆盖上方头像 URL。你也可以手动粘贴 URL，自定义任意头像。</p>
                        </div>

                        <!-- 网络URL面板 -->
                        <div id="avatar-url-panel" style="display:none; flex:1; overflow-y:auto;">
                            <div style="text-align:center; margin-bottom:16px;">
                                <img id="avatar-url-preview" src="" style="width:90px; height:90px; border-radius:50%; border:3px solid #eee; background:#fafafa; object-fit:cover;">
                            </div>
                            <div class="setting-input-group" style="margin-bottom:0;">
                                <label class="section-label">头像链接 (URL)</label>
                                <input type="text" id="setting-avatar-url" placeholder="https://...">
                            </div>
                            <p style="font-size:11px; color:#bbb; margin-top:10px;">粘贴任意图片链接，支持 jpg / png / gif / svg</p>
                        </div>

                        <div class="modal-actions" style="margin-top:16px; flex-shrink:0;">
                            <button class="btn outline" id="btn-close-settings">取消</button>
                            <button class="btn" id="btn-save-settings">保存</button>
                        </div>
                    </div>
                </div>

                <!-- 弹窗：邀请好友入群 -->
                <div id="invite-friends-modal" class="modal-overlay">
                    <div class="modal-card" style="text-align:left; max-height:70vh; display:flex; flex-direction:column;">
                        <h3 class="modal-title">邀请好友</h3>
                        <div style="flex:1; overflow-y:auto;">
                             <div class="invite-section-title">我的好友</div>
                             <ul class="invite-list" id="invite-friends-list-ul">
                                 <!-- JS 填充 -->
                             </ul>
                        </div>
                        <div class="modal-actions">
                            <button class="btn outline" id="btn-cancel-chat-invite">取消</button>
                            <button class="btn" id="btn-confirm-chat-invite">发送邀请</button>
                        </div>
                    </div>
                </div>

                <!-- 弹窗：角色捏脸 -->
                <div id="char-avatar-modal" class="modal-overlay">
                    <div class="modal-card" style="text-align:left; max-height:85vh; display:flex; flex-direction:column; padding:24px;">
                        <h3 class="modal-title" style="text-align:center; margin-bottom:16px;">角色头像</h3>
                        <div style="display:flex; background:#f5f5f5; border-radius:10px; padding:3px; margin-bottom:16px; gap:3px;">
                            <div id="char-tab-builder" style="flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.08);">🎨 捏脸</div>
                            <div id="char-tab-url" style="flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;color:#999;">🔗 网络URL</div>
                        </div>

                        <!-- 捏脸面板 -->
                        <div id="char-builder-panel" style="flex:1;overflow-y:auto;">
                            <div style="text-align:center;margin-bottom:16px;">
                                <img id="char-avatar-preview" src="" style="width:90px;height:90px;border-radius:50%;border:3px solid #eee;background:#fafafa;">
                            </div>
                            <div class="avatar-option-row"><label class="avatar-option-label">发型</label>
                                <select class="avatar-select" id="cav-top">
                                    <option value="shortFlat">短发（平）</option><option value="shortCurly">短发（卷）</option>
                                    <option value="dreads01">短发（锁）</option><option value="straight01">直长发</option>
                                    <option value="curly">卷长发</option><option value="bun">丸子头</option>
                                    <option value="bob">波波头</option><option value="shortRound">短发（圆）</option>
                                    <option value="longButNotTooLong">中长发</option><option value="bigHair">蓬松大发</option>
                                    <option value="fro">爆炸头</option><option value="hat">帽子</option>
                                    <option value="hijab">头巾</option><option value="turban">头巾2</option>
                                </select>
                            </div>
                            <div class="avatar-option-row"><label class="avatar-option-label">发色</label>
                                <select class="avatar-select" id="cav-hairColor">
                                    <option value="2c1b18">黑色</option><option value="4a312c">深棕</option>
                                    <option value="a55728">棕色</option><option value="d6b370">金棕</option>
                                    <option value="ecdcbf">金色</option><option value="c93305">红色</option>
                                    <option value="f59797">粉色</option><option value="b58143">橙棕</option>
                                    <option value="e8e1e1">银灰</option><option value="ffffff">白金</option>
                                </select>
                            </div>
                            <div class="avatar-option-row"><label class="avatar-option-label">眼睛</label>
                                <select class="avatar-select" id="cav-eyes">
                                    <option value="default">默认</option><option value="happy">开心</option><option value="wink">眨眼</option>
                                    <option value="hearts">爱心</option><option value="side">侧视</option>
                                    <option value="squint">眯眼</option><option value="surprised">惊讶</option><option value="cry">哭泣</option>
                                    <option value="closed">闭眼</option><option value="eyeRoll">翻白眼</option><option value="xDizzy">晕眩</option>
                                </select>
                            </div>
                            <div class="avatar-option-row"><label class="avatar-option-label">嘴型</label>
                                <select class="avatar-select" id="cav-mouth">
                                    <option value="smile">微笑</option><option value="default">默认</option><option value="twinkle">调皮</option>
                                    <option value="tongue">吐舌</option><option value="serious">严肃</option><option value="sad">悲伤</option>
                                    <option value="screamOpen">尖叫</option><option value="eating">吃东西</option><option value="disbelief">不信</option>
                                    <option value="grimace">龇牙</option><option value="concerned">担忧</option>
                                </select>
                            </div>
                            <div class="avatar-option-row"><label class="avatar-option-label">配饰</label>
                                <select class="avatar-select" id="cav-accessories">
                                    <option value="">无</option><option value="kurt">圆框眼镜</option><option value="prescription01">方框眼镜</option>
                                    <option value="prescription02">细框眼镜</option><option value="sunglasses">墨镜</option>
                                    <option value="round">圆墨镜</option><option value="wayfarers">复古墨镜</option><option value="eyepatch">眼罩</option>
                                </select>
                            </div>
                            <div class="avatar-option-row"><label class="avatar-option-label">服装</label>
                                <select class="avatar-select" id="cav-clothe">
                                    <option value="hoodie">连帽衫</option><option value="blazerAndShirt">西装</option><option value="blazerAndSweater">毛衣西装</option>
                                    <option value="collarAndSweater">高领毛衣</option><option value="graphicShirt">印花T恤</option>
                                    <option value="shirtCrewNeck">圆领衬衫</option><option value="shirtVNeck">V领衬衫</option><option value="overall">工装</option>
                                </select>
                            </div>
                            <div class="avatar-option-row"><label class="avatar-option-label">肤色</label>
                                <select class="avatar-select" id="cav-skin">
                                    <option value="ffdbb4">浅肤色</option><option value="edb98a">米色</option>
                                    <option value="f8d25c">黄色</option><option value="fd9841">小麦色</option>
                                    <option value="d08b5b">棕色</option><option value="ae5d29">深棕</option><option value="614335">深色</option>
                                </select>
                            </div>
                            <div style="display:flex;gap:8px;margin-top:16px;">
                                <button class="btn outline" id="cav-btn-random" style="flex:1;padding:10px;">随机</button>
                                <button class="btn outline" id="cav-btn-reset" style="flex:1;padding:10px;">重置</button>
                            </div>
                        </div>

                        <!-- URL面板 -->
                        <div id="char-url-panel" style="display:none;flex:1;overflow-y:auto;">
                            <div style="text-align:center;margin-bottom:16px;">
                                <img id="char-url-preview" src="" style="width:90px;height:90px;border-radius:50%;border:3px solid #eee;background:#fafafa;object-fit:cover;">
                            </div>
                            <div class="setting-input-group">
                                <label class="section-label">头像链接 (URL)</label>
                                <input type="text" id="char-avatar-url-input" placeholder="https://...">
                            </div>
                        </div>

                        <div class="modal-actions" style="margin-top:16px;flex-shrink:0;">
                            <button class="btn outline" id="btn-cancel-char-avatar">取消</button>
                            <button class="btn" id="btn-save-char-avatar">应用</button>
                        </div>
                    </div>
                </div>

                <!-- 弹窗：清空聊天确认 -->
                <div id="clear-chat-modal" class="modal-overlay">
                    <div class="modal-card" style="text-align:center;">
                        <div style="font-size:40px; margin-bottom:16px;">🗑️</div>
                        <h3 class="modal-title">清空聊天记录</h3>
                        <p style="color:#888; font-size:14px; margin-bottom:28px; line-height:1.6;">
                            将删除此房间的<strong>全部消息</strong><br>且无法恢复，确认继续？
                        </p>
                        <div class="modal-actions">
                            <button class="btn outline" id="btn-cancel-clear">取消</button>
                            <button class="btn danger" id="btn-confirm-clear">清空</button>
                        </div>
                    </div>
                </div>

            </div>
        `;
        document.body.appendChild(div);
    },

    // 4. 绑定逻辑
    bindUIEvents() {
        const root = document.getElementById(this.rootId);

// === [新增] 好友列表折叠逻辑 ===
        const toggleBtn = root.querySelector('#g-toggle-friends');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const list = root.querySelector('#g-friend-list-container');
                const arrow = root.querySelector('#g-friends-arrow');
                
                // 1. 切换展开/折叠类名
                list.classList.toggle('expanded');
                
                // 2. 旋转箭头图标
                if (list.classList.contains('expanded')) {
                    arrow.style.transform = 'rotate(180deg)'; // 展开时箭头向上
                } else {
                    arrow.style.transform = 'rotate(0deg)';   // 折叠时箭头向下
                }
            });
        }
        // ================================
        const btnAgree = root.querySelector('#g-btn-agree');

        // 日期
        root.querySelector('#g-date').innerText = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} / SEOUL`;

        // 倒计时逻辑 (修复：确保每次打开都运行)
        this.startCountdown = () => {
            if (this.timerInterval) clearInterval(this.timerInterval);
            let timeLeft = 15;
            const countdownEl = root.querySelector('#g-countdown');

            countdownEl.innerText = "15";
            btnAgree.classList.add('disabled');
            btnAgree.innerText = "请稍读 (Wait)";

            this.timerInterval = setInterval(() => {
                timeLeft--;
                countdownEl.innerText = timeLeft < 10 ? `0${timeLeft}` : timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(this.timerInterval);
                    btnAgree.classList.remove('disabled');
                    btnAgree.innerText = "我已知晓 / 进入";
                }
            }, 1000);
        };

        // 免责声明 -> 大厅
        btnAgree.addEventListener('click', () => {
            // 记录今日已同意（存当天日期）
            localStorage.setItem('kiki_galaxy_agreed_date', new Date().toDateString());
            root.querySelector('#g-disclaimer').style.display = 'none';
            root.querySelector('#g-lobby-page').style.display = 'flex';
        });

        // 退出
        root.querySelector('#g-btn-exit').addEventListener('click', () => this.close());

        // 页面导航
        const showPage = (id) => {
            root.querySelectorAll('.g-page').forEach(p => p.style.display = 'none');
            root.querySelector(`#${id}`).style.display = 'flex';
        };
        root.querySelector('#g-btn-enter-chat').addEventListener('click', async () => { 
            this.state.activeRoom = '8802';
            await this.subscribeToRealtime('8802');
            // 重置标题
            const titleEl = root.querySelector('#g-chat-page .header-title');
            if (titleEl) titleEl.innerText = 'CHAT ROOM';
            showPage('g-chat-page'); 
            await this.loadChatHistory(); 
        });
        // 返回大厅
        root.querySelector('#g-btn-back-lobby').addEventListener('click', async () => {
            root.querySelector('#g-chat-page').style.display = 'none';
            root.querySelector('#g-lobby-page').style.display = 'flex';
            
            const wasPrivateRoom = this.state.activeRoom !== '8802';
            if (wasPrivateRoom) {
                // 私密房间退出：记住房间ID，角色列表已持久化在 localStorage，内存也保留
                this.state.lastPrivateRoom = this.state.activeRoom;
            } else {
                // 公共大厅退出：清空角色
                this.state.activeLocalChars.clear();
                this.state.lastPrivateRoom = null;
            }
            this.state.activeRoom = '8802';
            await this.subscribeToRealtime('8802');
        });

        // 设置
        const settingsModal = root.querySelector('#settings-modal');

        // --- 捏脸逻辑 ---
        const AV_DEFAULTS = {
            top: 'shortFlat', hairColor: '4a312c',
            eyes: 'default', mouth: 'smile',
            accessories: '', clothe: 'hoodie', skin: 'ffdbb4'
        };

        const buildAvatarUrl = () => {
            const top = root.querySelector('#av-top').value;
            const hairColor = root.querySelector('#av-hairColor').value;
            const eyes = root.querySelector('#av-eyes').value;
            const mouth = root.querySelector('#av-mouth').value;
            const accessories = root.querySelector('#av-accessories').value;
            const clothing = root.querySelector('#av-clothe').value;
            const skinColor = root.querySelector('#av-skin').value;
            // v9 正确参数名：top, hairColor(hex), eyes, mouth, accessories, clothing, skinColor(hex)
            // accessories 为空时不传，避免生成随机配饰
            let url = `https://api.dicebear.com/9.x/avataaars/svg?top=${top}&hairColor=${hairColor}&eyes=${eyes}&mouth=${mouth}&clothing=${clothing}&skinColor=${skinColor}&accessoriesProbability=100`;
            if (accessories) url += `&accessories=${accessories}`;
            else url += `&accessoriesProbability=0`;
            return url;
        };

        const refreshPreview = () => {
            const url = buildAvatarUrl();
            const preview = root.querySelector('#avatar-preview');
            if (preview) preview.src = url;
            // 同步写入 URL 输入框
            const urlInput = root.querySelector('#setting-avatar-url');
            if (urlInput) urlInput.value = url;
        };

        // 每个 select 变化时刷新预览
        ['av-top','av-hairColor','av-eyes','av-mouth','av-accessories','av-clothe','av-skin'].forEach(id => {
            const el = root.querySelector(`#${id}`);
            if (el) el.addEventListener('change', refreshPreview);
        });

        // 随机按钮
        root.querySelector('#av-btn-random').addEventListener('click', () => {
            const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
            root.querySelector('#av-top').value = pick(['shortFlat','shortCurly','dreads01','straight01','curly','bun','bob','shortRound','longButNotTooLong','bigHair','fro','hat','hijab']);
            root.querySelector('#av-hairColor').value = pick(['2c1b18','4a312c','a55728','d6b370','ecdcbf','c93305','f59797','b58143','e8e1e1','ffffff']);
            root.querySelector('#av-eyes').value = pick(['default','happy','wink','hearts','side','squint','surprised','cry','closed','eyeRoll','xDizzy']);
            root.querySelector('#av-mouth').value = pick(['smile','default','twinkle','tongue','serious','sad','screamOpen','eating','disbelief','grimace','concerned']);
            root.querySelector('#av-accessories').value = pick(['','kurt','prescription01','prescription02','sunglasses','round','wayfarers','eyepatch']);
            root.querySelector('#av-clothe').value = pick(['hoodie','blazerAndShirt','blazerAndSweater','collarAndSweater','graphicShirt','shirtCrewNeck','shirtVNeck','overall']);
            root.querySelector('#av-skin').value = pick(['ffdbb4','edb98a','f8d25c','fd9841','d08b5b','ae5d29','614335']);
            refreshPreview();
        });

        // 重置按钮
        root.querySelector('#av-btn-reset').addEventListener('click', () => {
            root.querySelector('#av-top').value = 'shortFlat';
            root.querySelector('#av-hairColor').value = '4a312c';
            root.querySelector('#av-eyes').value = 'default';
            root.querySelector('#av-mouth').value = 'smile';
            root.querySelector('#av-accessories').value = '';
            root.querySelector('#av-clothe').value = 'hoodie';
            root.querySelector('#av-skin').value = 'ffdbb4';
            refreshPreview();
        });

        // URL 输入框实时预览
        root.querySelector('#setting-avatar-url').addEventListener('input', (e) => {
            const preview = root.querySelector('#avatar-url-preview');
            if (preview) preview.src = e.target.value;
        });

        // Tab 切换
        root.querySelector('#tab-builder').addEventListener('click', () => {
            root.querySelector('#tab-builder').style.cssText += 'background:#fff;color:#222;box-shadow:0 1px 4px rgba(0,0,0,0.08);';
            root.querySelector('#tab-url').style.cssText += 'background:transparent;color:#999;box-shadow:none;';
            root.querySelector('#avatar-builder-panel').style.display = 'block';
            root.querySelector('#avatar-url-panel').style.display = 'none';
        });
        root.querySelector('#tab-url').addEventListener('click', () => {
            root.querySelector('#tab-url').style.cssText += 'background:#fff;color:#222;box-shadow:0 1px 4px rgba(0,0,0,0.08);';
            root.querySelector('#tab-builder').style.cssText += 'background:transparent;color:#999;box-shadow:none;';
            root.querySelector('#avatar-url-panel').style.display = 'block';
            root.querySelector('#avatar-builder-panel').style.display = 'none';
            // 同步 URL 预览
            const urlInput = root.querySelector('#setting-avatar-url');
            const preview = root.querySelector('#avatar-url-preview');
            if (urlInput && preview) preview.src = urlInput.value;
        });

        // 打开设置时初始化预览
        root.querySelector('#g-btn-settings').addEventListener('click', () => {
            // 恢复捏脸 tab 为默认激活
            root.querySelector('#avatar-builder-panel').style.display = 'block';
            root.querySelector('#avatar-url-panel').style.display = 'none';
            root.querySelector('#tab-builder').style.cssText = 'flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.08);color:#222;';
            root.querySelector('#tab-url').style.cssText = 'flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;color:#999;';
            // 同步 URL 输入框和 URL tab 预览
            const currentAvatar = this.state.user?.avatar_url || '';
            const urlPreview = root.querySelector('#avatar-url-preview');
            const urlInput = root.querySelector('#setting-avatar-url');
            if (urlPreview) urlPreview.src = currentAvatar;
            if (urlInput) urlInput.value = currentAvatar;
            // 【修复】捏脸预览先用当前已保存头像占位，避免加载期间显示问号
            const preview = root.querySelector('#avatar-preview');
            if (preview && currentAvatar) preview.src = currentAvatar;
            // 再根据当前 select 值生成捏脸 URL（异步加载，加载完会自动替换）
            refreshPreview();
            settingsModal.style.display = 'flex';
        });
        root.querySelector('#btn-close-settings').addEventListener('click', () => settingsModal.style.display = 'none');
        root.querySelector('#btn-save-settings').addEventListener('click', () => this.saveUserProfile());

        // 连接/发送
        root.querySelector('#g-btn-connect').addEventListener('click', () => this.sendFriendRequest());
        // 按钮：发送消息 + 触发角色回复
        root.querySelector('#g-send').addEventListener('click', () => this.sendMessageAndTrigger());
        // 回车：只上屏消息，不触发角色回复
        root.querySelector('#g-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.sendMessageOnly(); });

        // 【新增】真人输入中广播（Presence）
        root.querySelector('#g-input').addEventListener('input', () => {
            // 只在私密房间广播（公共大厅人多不广播）
            if (!this.state.activeRoom || this.state.activeRoom === '8802') return;
            if (!this.state.currentSubscription) return;

            // 广播 typing 状态
            this.state.currentSubscription.track({
                user_id: this.state.user.id,
                nickname: this.state.user.nickname,
                avatar: this.state.user.avatar_url,
                typing: true
            });

            // 防抖：2秒无输入就广播停止
            clearTimeout(this.state.typingDebounceTimer);
            this.state.typingDebounceTimer = setTimeout(() => {
                if (this.state.currentSubscription) {
                    this.state.currentSubscription.track({ user_id: this.state.user.id, typing: false });
                }
            }, 2000);
        });

        // 聊天邀请
        const inviteModal = root.querySelector('#invite-friends-modal');
        const clearModal = root.querySelector('#clear-chat-modal');
        const plusMenu = root.querySelector('#g-plus-menu');

        // === + 号菜单逻辑 ===
        root.querySelector('#g-btn-plus-menu').addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = plusMenu.style.display === 'block';
            plusMenu.style.display = isVisible ? 'none' : 'block';
        });

        // 点击页面其他地方关闭菜单
        document.addEventListener('click', () => {
            if (plusMenu) plusMenu.style.display = 'none';
        });

        // 菜单项：邀请好友 / 角色
        root.querySelector('#g-menu-invite').addEventListener('click', () => {
            plusMenu.style.display = 'none';
            this.renderInviteList();
            inviteModal.style.display = 'flex';
        });

        // 菜单项：清空聊天记录
        root.querySelector('#g-menu-clear').addEventListener('click', () => {
            plusMenu.style.display = 'none';
            clearModal.style.display = 'flex';
        });

        // 清空弹窗：取消
        root.querySelector('#btn-cancel-clear').addEventListener('click', () => {
            clearModal.style.display = 'none';
        });

        // 清空弹窗：确认清空
        root.querySelector('#btn-confirm-clear').addEventListener('click', async () => {
            clearModal.style.display = 'none';
            await this.clearRoomMessages();
        });

        root.querySelector('#btn-cancel-chat-invite').addEventListener('click', () => inviteModal.style.display = 'none');
        // 确认邀请逻辑 (隔离版：禁止在公共大厅拉 AI)
        root.querySelector('#btn-confirm-chat-invite').addEventListener('click', async () => {
            const checkedBoxes = inviteModal.querySelectorAll('input[type="checkbox"]:checked');
            
            // --- 1. 安全拦截逻辑 ---
            const hasCharacter = Array.from(checkedBoxes).some(cb => cb.dataset.type === 'character');
            
            // 如果当前是公共大厅 (8802) 并且 试图邀请角色
            if (this.state.activeRoom === '8802' && hasCharacter) {
                alert("🚫 信号被拦截\n\n公共频段禁止接入 AI 意识投影。\n请与好友建立【私有连接】后再邀请角色。");
                return; // 直接终止，不关闭弹窗，让用户取消勾选
            }

            // --- 2. 正常处理逻辑 ---
            inviteModal.style.display = 'none';

            if (checkedBoxes.length === 0) return;

            // 遍历所有选中的项
            for (const cb of checkedBoxes) {
                const type = cb.dataset.type; // 'user' 或 'character'
                const id = cb.value;
                const name = cb.dataset.name;

                if (type === 'user') {
                    // A. 邀请真实好友 (发送系统通知)
                    // 注意：这里的 sendMessage 是发给自己看的，如果想通知对方，
                    // 最好是用 supabase insert 一条 type: system 的消息
                    await this.supabase.from('messages').insert({
                        room_id: this.state.activeRoom,
                        sender_id: this.state.user.id,
                        content: `邀请了 ${name} 加入频道`,
                        type: 'system'
                    });
                } 
                else if (type === 'character') {
                    // B. 邀请我的角色（每人限 1 个，新角色替换旧角色）
                    
                    // 如果已有角色在线，先移除旧角色
                    if (this.state.activeLocalChars.size > 0) {
                        const oldCharId = [...this.state.activeLocalChars][0];
                        const allChars = this.hooks.getLocalCharacters();
                        const oldDossier = allChars.find(d => String(d.id) === String(oldCharId));
                        const oldName = oldDossier ? oldDossier.character.name : '旧角色';
                        
                        this.state.activeLocalChars.clear();
                        
                        // 发送旧角色离场消息
                        await this.supabase.from('messages').insert({
                            room_id: this.state.activeRoom,
                            sender_id: this.state.user.id,
                            content: `(${oldName} 已离开频道)`,
                            type: 'system'
                        });
                    }

                    // 加入新角色
                    this.state.activeLocalChars.add(String(id));
                    this.saveRoomCharsToStorage(this.state.activeRoom);
                    
                    // 发送入场消息
                    await this.supabase.from('messages').insert({
                        room_id: this.state.activeRoom,
                        sender_id: this.state.user.id,
                        content: `(将 ${name} 拉入了频道)`,
                        type: 'system'
                    });

                    // 角色打招呼
                    setTimeout(() => {
                        this.triggerLocalCharacterReply(id, true);
                    }, 1500);
                }
            }
            
            // 清空勾选
            checkedBoxes.forEach(cb => cb.checked = false);
        });

        // 收件邀请处理
        const incomingModal = root.querySelector('#incoming-modal');
        // (事件在 showIncomingInvite 中动态绑定，这里只绑取消)

        // =============================================
        // 角色捏脸弹窗逻辑
        // =============================================
        const charAvatarModal = root.querySelector('#char-avatar-modal');
        // 当前正在编辑的角色 ID（由 renderInviteList 的编辑按钮设置）
        this._editingCharId = null;

        const buildCharAvatarUrl = () => {
            const top = root.querySelector('#cav-top').value;
            const hairColor = root.querySelector('#cav-hairColor').value;
            const eyes = root.querySelector('#cav-eyes').value;
            const mouth = root.querySelector('#cav-mouth').value;
            const accessories = root.querySelector('#cav-accessories').value;
            const clothing = root.querySelector('#cav-clothe').value;
            const skinColor = root.querySelector('#cav-skin').value;
            let url = `https://api.dicebear.com/9.x/avataaars/svg?top=${top}&hairColor=${hairColor}&eyes=${eyes}&mouth=${mouth}&clothing=${clothing}&skinColor=${skinColor}`;
            if (accessories) url += `&accessories=${accessories}&accessoriesProbability=100`;
            else url += `&accessoriesProbability=0`;
            return url;
        };

        const refreshCharPreview = () => {
            const url = buildCharAvatarUrl();
            const preview = root.querySelector('#char-avatar-preview');
            if (preview) preview.src = url;
            const urlInput = root.querySelector('#char-avatar-url-input');
            if (urlInput) urlInput.value = url;
        };

        ['cav-top','cav-hairColor','cav-eyes','cav-mouth','cav-accessories','cav-clothe','cav-skin'].forEach(id => {
            const el = root.querySelector(`#${id}`);
            if (el) el.addEventListener('change', refreshCharPreview);
        });

        root.querySelector('#cav-btn-random').addEventListener('click', () => {
            const pick = arr => arr[Math.floor(Math.random() * arr.length)];
            root.querySelector('#cav-top').value = pick(['shortFlat','shortCurly','dreads01','straight01','curly','bun','bob','shortRound','longButNotTooLong','bigHair','fro','hat','hijab']);
            root.querySelector('#cav-hairColor').value = pick(['2c1b18','4a312c','a55728','d6b370','ecdcbf','c93305','f59797','b58143','e8e1e1','ffffff']);
            root.querySelector('#cav-eyes').value = pick(['default','happy','wink','hearts','side','squint','surprised','cry','closed','eyeRoll','xDizzy']);
            root.querySelector('#cav-mouth').value = pick(['smile','default','twinkle','tongue','serious','sad','screamOpen','eating','disbelief','grimace','concerned']);
            root.querySelector('#cav-accessories').value = pick(['','kurt','prescription01','prescription02','sunglasses','round','wayfarers','eyepatch']);
            root.querySelector('#cav-clothe').value = pick(['hoodie','blazerAndShirt','blazerAndSweater','collarAndSweater','graphicShirt','shirtCrewNeck','shirtVNeck','overall']);
            root.querySelector('#cav-skin').value = pick(['ffdbb4','edb98a','f8d25c','fd9841','d08b5b','ae5d29','614335']);
            refreshCharPreview();
        });

        root.querySelector('#cav-btn-reset').addEventListener('click', () => {
            root.querySelector('#cav-top').value = 'shortFlat';
            root.querySelector('#cav-hairColor').value = '4a312c';
            root.querySelector('#cav-eyes').value = 'default';
            root.querySelector('#cav-mouth').value = 'smile';
            root.querySelector('#cav-accessories').value = '';
            root.querySelector('#cav-clothe').value = 'hoodie';
            root.querySelector('#cav-skin').value = 'ffdbb4';
            refreshCharPreview();
        });

        // URL 输入实时预览
        root.querySelector('#char-avatar-url-input').addEventListener('input', (e) => {
            const preview = root.querySelector('#char-url-preview');
            if (preview) preview.src = e.target.value;
        });

        // Tab 切换
        root.querySelector('#char-tab-builder').addEventListener('click', () => {
            root.querySelector('#char-tab-builder').style.cssText = 'flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.08);color:#222;';
            root.querySelector('#char-tab-url').style.cssText = 'flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;color:#999;';
            root.querySelector('#char-builder-panel').style.display = 'block';
            root.querySelector('#char-url-panel').style.display = 'none';
        });
        root.querySelector('#char-tab-url').addEventListener('click', () => {
            root.querySelector('#char-tab-url').style.cssText = 'flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.08);color:#222;';
            root.querySelector('#char-tab-builder').style.cssText = 'flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;color:#999;';
            root.querySelector('#char-url-panel').style.display = 'block';
            root.querySelector('#char-builder-panel').style.display = 'none';
            const urlInput = root.querySelector('#char-avatar-url-input');
            const preview = root.querySelector('#char-url-preview');
            if (urlInput && preview) preview.src = urlInput.value;
        });

        // 取消
        root.querySelector('#btn-cancel-char-avatar').addEventListener('click', () => {
            charAvatarModal.style.display = 'none';
        });

        // 应用：保存角色头像到 localStorage
        root.querySelector('#btn-save-char-avatar').addEventListener('click', () => {
            const charId = this._editingCharId;
            if (!charId) return;

            // 判断当前是哪个 tab
            const isBuilderActive = root.querySelector('#char-builder-panel').style.display !== 'none';
            const avatarUrl = isBuilderActive
                ? buildCharAvatarUrl()
                : root.querySelector('#char-avatar-url-input').value.trim();

            if (!avatarUrl) return;

            // 存到 localStorage：kiki_galaxy_char_avatars = { charId: url, ... }
            const stored = JSON.parse(localStorage.getItem('kiki_galaxy_char_avatars') || '{}');
            stored[charId] = avatarUrl;
            localStorage.setItem('kiki_galaxy_char_avatars', JSON.stringify(stored));

            console.log(`[Galaxy] ✅ 角色 ${charId} 头像已保存: ${avatarUrl}`);
            charAvatarModal.style.display = 'none';

            // 刷新邀请列表预览
            this.renderInviteList();
        });
    },

    // --- 网络逻辑 (Supabase) ---
    waitForSupabase() {
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (window.supabase) { clearInterval(check); resolve(); }
            }, 100);
        });
    },
    initSupabaseClient() {
        this.supabase = window.supabase.createClient(this.config.url, this.config.key);
    },
    async authenticateUser() {
        let deviceId = localStorage.getItem('kiki_galaxy_did');
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('kiki_galaxy_did', deviceId);
        }
        let { data: profile } = await this.supabase.from('profiles').select('*').eq('device_id', deviceId).single();
        if (!profile) {
            const code = Math.floor(1000 + Math.random() * 9000).toString();
            const { data: newProfile } = await this.supabase.from('profiles').insert({
                device_id: deviceId,
                nickname: 'Guest_' + code,
                friend_code: code,
                avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${code}`
            }).select().single();
            profile = newProfile;
        }
        this.state.user = profile;
        this.updateProfileUI();
        this.loadFriendsList();
    },

    updateProfileUI() {
        const root = document.getElementById(this.rootId);
        root.querySelector('#g-my-name').innerText = this.state.user.nickname;
        root.querySelector('#g-my-avatar').src = this.state.user.avatar_url;
        root.querySelector('#setting-name').value = this.state.user.nickname;
        root.querySelector('#setting-avatar-url').value = this.state.user.avatar_url;
        root.querySelector('#g-status-text').innerText = `信号: #${this.state.user.friend_code}`;
        root.querySelector('#g-status-text').style.color = '#4CAF50';
        root.querySelector('#g-status-dot').classList.add('online');
    },

    async loadFriendsList() {
        const myId = this.state.user.id;
        const { data: friendships } = await this.supabase
            .from('friendships')
            .select(`id, requester_id, receiver_id, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)`)
            .eq('status', 'accepted')
            .or(`requester_id.eq.${myId},receiver_id.eq.${myId}`);

        if (friendships) {
            this.state.friends = friendships.map(f => f.requester_id === myId ? f.receiver : f.requester);
            this.renderFriendsList();
        }
    },

    // 渲染好友列表 (修复版：绑定私聊点击事件)
    renderFriendsList() {
        const root = document.getElementById(this.rootId);
        const listContainer = root.querySelector('#g-friend-list-container');
        const inviteUl = root.querySelector('#invite-friends-list-ul'); 
        const countBadge = root.querySelector('#g-friend-count');

        // 1. 更新数量显示
        if (countBadge) countBadge.innerText = this.state.friends.length;

        // 2. 清空旧列表
        listContainer.innerHTML = '';
        if (inviteUl) inviteUl.innerHTML = '';

        // 3. 空状态处理
        if (this.state.friends.length === 0) {
            listContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#ccc;font-size:12px;">等待信号连接...</div>';
            if (inviteUl) inviteUl.innerHTML = '<div style="padding:10px;">暂无好友</div>';
            return;
        }

        // 4. 遍历渲染
        this.state.friends.forEach(f => {
            
            // === A. 大厅列表项 (修改点：创建 DOM 元素并绑定点击) ===
            const item = document.createElement('div');
            item.className = 'g-friend-item';
            // 加个鼠标手型，提示可点击
            item.style.cursor = 'pointer'; 
            
            item.innerHTML = `
                <img src="${f.avatar_url}" class="g-friend-avatar">
                <div class="g-friend-info">
                    <span>${f.nickname}</span>
                    <span class="g-friend-code">#${f.friend_code}</span>
                </div>
                <div class="g-dot online" style="width:8px; height:8px;"></div>
            `;
            
            // 【关键修改】绑定点击事件 -> 进入私聊
            item.addEventListener('click', () => {
                this.enterPrivateChat(f);
            });
            
            listContainer.appendChild(item);
            // ==================================================

            // B. 聊天邀请列表 (保持不变)
            if (inviteUl) {
                inviteUl.innerHTML += `
                    <li class="invite-item">
                        <input type="checkbox" id="invite-${f.id}" value="${f.id}" data-type="user" data-name="${f.nickname}">
                        <img src="${f.avatar_url}" class="invite-item-avatar">
                        <label for="invite-${f.id}" class="invite-item-info">${f.nickname}</label>
                    </li>
                `;
            }
        });
        
        // 自动展开列表
        const listWidget = root.querySelector('#g-friend-list-container');
        const arrow = root.querySelector('#g-friends-arrow');
        if (listWidget && arrow) {
            listWidget.classList.add('expanded');
            arrow.style.transform = 'rotate(180deg)';
        }
    },

// --- 【新增】渲染邀请列表 (混合：在线好友 + 本地角色) ---
    renderInviteList() {
        const root = document.getElementById(this.rootId);
        const inviteUl = root.querySelector('#invite-friends-list-ul');
        inviteUl.innerHTML = '';

        // 1. 渲染在线好友 (Supabase 好友)
        if (this.state.friends.length > 0) {
            inviteUl.innerHTML += `<div class="invite-section-title">[ONLINE] 在线好友</div>`;
            this.state.friends.forEach(f => {
                // 生成好友列表项
                inviteUl.innerHTML += `
                    <li class="invite-item">
                        <!-- data-type="user" 标记这是真人 -->
                        <input type="checkbox" value="${f.id}" data-type="user" data-name="${f.nickname}">
                        <img src="${f.avatar_url}" class="invite-item-avatar">
                        <div class="invite-item-info">${f.nickname}</div>
                    </li>
                `;
            });
        }

        // 2. 渲染本地角色 (通过钩子获取主文件的数据)
        const localChars = this.hooks.getLocalCharacters(); 
        
        if (localChars && localChars.length > 0) {
            // 判断当前房间是否已有角色（每人限一个）
            const hasActiveChar = this.state.activeLocalChars.size > 0;

            inviteUl.innerHTML += `<div class="invite-section-title" style="margin-top:15px;">[LOCAL] 我的角色</div>`;
            if (hasActiveChar) {
                inviteUl.innerHTML += `<div style="padding:4px 0 8px 2px; font-size:11px; color:#e67e22;">⚠️ 每个房间限带 1 名角色。选择新角色将替换当前角色。</div>`;
            }
            
            // 读取自定义角色头像
            const storedAvatars = JSON.parse(localStorage.getItem('kiki_galaxy_char_avatars') || '{}');

            localChars.forEach(dossier => {
                const charName = dossier.character.name;
                const charId = dossier.id;
                const isActive = this.state.activeLocalChars.has(String(charId));

                // 优先用自定义头像，否则用 DiceBear 默认
                const customAvatar = storedAvatars[String(charId)];
                const avatarSrc = customAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(charName)}`;
                const avatarEl = `<img src="${avatarSrc}" class="invite-item-avatar" style="object-fit:cover; border:1px solid #eee;">`;

                if (isActive) {
                    inviteUl.innerHTML += `
                        <li class="invite-item" style="opacity:0.7;">
                            <input type="checkbox" value="${charId}" data-type="character" data-name="${charName}" disabled>
                            ${avatarEl}
                            <div class="invite-item-info" style="flex:1;">${charName}</div>
                            <span class="char-edit-avatar-btn" data-char-id="${charId}" style="font-size:18px;cursor:pointer;padding:4px 6px;" title="编辑头像">✏️</span>
                            <span style="font-size:10px; color:#4CAF50; font-weight:bold; white-space:nowrap; margin-left:4px;">✦ 在线</span>
                        </li>
                    `;
                } else {
                    inviteUl.innerHTML += `
                        <li class="invite-item">
                            <input type="checkbox" value="${charId}" data-type="character" data-name="${charName}">
                            ${avatarEl}
                            <div class="invite-item-info" style="flex:1;">${charName}</div>
                            <span class="char-edit-avatar-btn" data-char-id="${charId}" style="font-size:18px;cursor:pointer;padding:4px 6px;" title="编辑头像">✏️</span>
                        </li>
                    `;
                }
            });

            // 绑定编辑按钮点击事件（用事件委托）
            // 先移除旧的监听，避免重复绑定
            const oldHandler = inviteUl._charEditHandler;
            if (oldHandler) inviteUl.removeEventListener('click', oldHandler);
            const charEditHandler = (e) => {
                const btn = e.target.closest('.char-edit-avatar-btn');
                if (!btn) return;
                e.stopPropagation();
                const charId = btn.dataset.charId;
                this._editingCharId = charId;

                // 读取已存头像并回填预览
                const stored = JSON.parse(localStorage.getItem('kiki_galaxy_char_avatars') || '{}');
                const existingUrl = stored[charId] || '';
                const root = document.getElementById(this.rootId);
                const preview = root.querySelector('#char-avatar-preview');
                const urlPreview = root.querySelector('#char-url-preview');
                const urlInput = root.querySelector('#char-avatar-url-input');
                if (preview) preview.src = existingUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=default`;
                if (urlPreview) urlPreview.src = existingUrl;
                if (urlInput) urlInput.value = existingUrl;

                // 重置到捏脸 tab
                root.querySelector('#char-tab-builder').style.cssText = 'flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.08);color:#222;';
                root.querySelector('#char-tab-url').style.cssText = 'flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;color:#999;';
                root.querySelector('#char-builder-panel').style.display = 'block';
                root.querySelector('#char-url-panel').style.display = 'none';

                root.querySelector('#char-avatar-modal').style.display = 'flex';
            };
            inviteUl._charEditHandler = charEditHandler;
            inviteUl.addEventListener('click', charEditHandler);
        } 
        
        // 如果啥都没有
        if (this.state.friends.length === 0 && (!localChars || localChars.length === 0)) {
            inviteUl.innerHTML = `<div style="padding:20px; color:#999; font-size:12px; text-align:center;">暂无可邀请对象</div>`;
        }
    },

// --- 【修正版】进入私聊逻辑 ---
    async enterPrivateChat(friend) {
        const myId = this.state.user.id;
        const friendId = friend.id;
        
        // 1. 计算房间号
        const ids = [myId, friendId].sort();
        const roomId = `private_${ids[0]}_${ids[1]}`;
        
        console.log(`[Galaxy] 正在进入私聊: ${roomId}`);
        
        // 2. 更新状态（先设好 activeRoom，loadChatHistory 才能查对房间）
        this.state.activeRoom = roomId;
        this.state.lastPrivateRoom = roomId;
        
        // 从 localStorage 恢复该房间的角色列表
        this.state.activeLocalChars = this.loadRoomCharsFromStorage(roomId);
        console.log(`[Galaxy] 恢复房间角色: [${[...this.state.activeLocalChars].join(', ')}]`);
        
        // 3. 更新 UI
        const root = document.getElementById(this.rootId);
        root.querySelector('#g-lobby-page').style.display = 'none';
        root.querySelector('#g-chat-page').style.display = 'flex';
        
        // 4. 更新标题
        const titleEl = root.querySelector('#g-chat-page .header-title');
        if (titleEl) titleEl.innerText = `${friend.nickname}`;

        // 5. 切换监听频道（await 确保旧频道完全关闭后再订阅新频道，避免重叠）
        await this.subscribeToRealtime(roomId);

        // 6. 加载历史消息（await 确保完成后再交互）
        await this.loadChatHistory();
    },

    async sendFriendRequest() {
        const code = document.getElementById('g-invite-code').value.trim();
        if (!code) return alert("请输入号码");
        const { data: target, error: findError } = await this.supabase.from('profiles').select('id').eq('friend_code', code).single();
        if (findError || !target) {
            console.error("🌌 Galaxy Link: Target user not found", findError);
            return alert("用户不存在");
        }

        console.log("🌌 Galaxy Link: Target found, sending request to:", target.id);
        const { error: insertError } = await this.supabase.from('friendships').insert({
            requester_id: this.state.user.id, receiver_id: target.id, status: 'pending'
        });

        if (insertError) {
            console.error("🌌 Galaxy Link: Friend request insert failed", insertError);
            return alert("请求发送失败");
        }
        console.log("🌌 Galaxy Link: Friend request inserted successfully");
        alert("请求已发送");
    },

    async saveUserProfile() {
        const root = document.getElementById(this.rootId);
        const name = root.querySelector('#setting-name').value;
        const avatar = root.querySelector('#setting-avatar-url').value;

        await this.supabase.from('profiles').update({ nickname: name, avatar_url: avatar }).eq('id', this.state.user.id);
        this.state.user.nickname = name;
        this.state.user.avatar_url = avatar;
        this.updateProfileUI();
        root.querySelector('#settings-modal').style.display = 'none';
    },

    // 核心：发送一条消息并上屏（不触发角色回复）
    async _postMessage(text) {
        if (!text) return;
        this.renderMessageBubble({ content: text, sender_id: this.state.user.id });
        const { data: sentMsg, error: sendError } = await this.supabase.from('messages').insert({
            room_id: this.state.activeRoom, sender_id: this.state.user.id, content: text
        }).select().single();
        if (sendError) {
            console.error(`[Galaxy] ❌ 用户消息写库失败:`, sendError);
        } else {
            console.log(`[Galaxy] ✅ 用户消息写库成功, id=${sentMsg?.id}, room=${this.state.activeRoom}`);
        }
    },

    // 回车调用：只上屏，不触发角色
    async sendMessageOnly() {
        const input = document.getElementById('g-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        await this._postMessage(text);
    },

    // 按钮调用：上屏 + 触发角色回复
    async sendMessageAndTrigger() {
        const input = document.getElementById('g-input');
        const text = input.value.trim();
        // 输入框有内容就先发出去
        if (text) {
            input.value = '';
            await this._postMessage(text);
        }
        // 无论输入框是否有内容，只要房间里有角色就触发回复
        if (this.state.activeLocalChars.size > 0) {
            this.state.activeLocalChars.forEach(charId => {
                this.triggerLocalCharacterReply(charId);
            });
        }
    },

    // 兼容旧调用（Realtime 触发的好友消息回复保持不变）
    async sendMessage() {
        return this.sendMessageAndTrigger();
    },

    async sendSystemMessage(text) {
        await this.supabase.from('messages').insert({
            room_id: this.state.activeRoom, sender_id: this.state.user.id, content: text, type: 'system'
        });
    },

    async loadChatHistory() {
        const roomId = this.state.activeRoom;
        const roomLabel = roomId === '8802' ? '加密频道 #8802' : `私密频道`;
        const chatBox = document.getElementById('g-chat-box');
        chatBox.innerHTML = `<div class="g-msg-sys">${roomLabel}</div>`;

        console.log(`[Galaxy] loadChatHistory 开始, room=${roomId}`);

        // 倒序取最新 200 条，再翻转成正序显示
        // 这样无论房间有多少历史，永远能看到最新消息
        const { data: rawData, error } = await this.supabase
            .from('messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: false })
            .limit(500);
        const data = rawData ? rawData.reverse() : [];

        if (error) {
            console.error(`[Galaxy] ❌ 拉取历史失败:`, error);
            chatBox.innerHTML += `<div class="g-msg-sys" style="color:red;">消息加载失败: ${error.message}</div>`;
            return;
        }

        console.log(`[Galaxy] ✅ 拉取到 ${data ? data.length : 0} 条消息`);
        if (data) {
            data.forEach(msg => {
                // 过滤掉 typing_indicator（输入状态广播，不应出现在历史记录里）
                if (msg.type === 'typing_indicator') return;
                console.log(`[Galaxy] 渲染消息: type=${msg.type}, sender=${msg.sender_id}, content=${msg.content?.substring(0,30)}`);
                this.renderMessageBubble(msg);
            });
        }
    },

    // 渲染单条消息 (完整逻辑版)
    renderMessageBubble(msg) {
        const box = document.getElementById('g-chat-box');
        if (!box) return;

        const div = document.createElement('div');

        // === 情况A：系统消息 (灰色居中) ===
        if (msg.type === 'system') {
            div.className = 'system-msg';
            div.innerText = msg.content; 
        } 
        
        // === 情况B：角色代理消息 (AI回复) ===
        // 逻辑：解析 JSON，显示为左侧消息，名字带特殊颜色
        else if (msg.type === 'character_proxy') {
            let charData = {};
            try { 
                // 尝试解析 JSON 内容 ({name, avatar, text})
                charData = JSON.parse(msg.content); 
            } catch(e) { 
                // 容错：解析失败就直接显示原始内容
                charData = { name: "Unknown", avatar: "", text: msg.content };
            }
            
            // 角色永远显示在左边 (视为独立个体)
            div.className = 'msg-row other';
            
            div.innerHTML = `
                <img src="${charData.avatar}" class="msg-avatar">
                <div class="msg-wrapper">
                    <!-- 角色名字给个暗金色，与真人区分 -->
                    <span class="msg-name" style="color: #d4af37; font-weight:bold;">${charData.name}</span>
                    <div class="msg-bubble">${charData.text}</div>
                </div>
            `;
        }
        
        // === 情况C：普通用户消息 (真人) ===
        else {
            const isMe = msg.sender_id === this.state.user.id;
            // 根据是否是自己，决定左右布局 (self=右, other=左)
            div.className = `msg-row ${isMe ? 'self' : 'other'}`;

            // 获取头像和昵称
            let avatar = "https://api.dicebear.com/9.x/avataaars/svg?seed=Unknown";
            let nickname = "Unknown";

            if (isMe) {
                // 如果是自己
                avatar = this.state.user.avatar_url;
                nickname = this.state.user.nickname || "我";
            } else {
                // 如果是别人，去好友列表里找
                const friend = this.state.friends.find(f => f.id === msg.sender_id);
                if (friend) {
                    avatar = friend.avatar_url;
                    nickname = friend.nickname;
                } else {
                    nickname = "神秘访客";
                }
            }

            div.innerHTML = `
                <img src="${avatar}" class="msg-avatar">
                <div class="msg-wrapper">
                    <span class="msg-name">${nickname}</span>
                    <div class="msg-bubble">${msg.content}</div>
                </div>
            `;
        }

        box.appendChild(div);

        // 将消息写入当前房间的内存缓存（供退出再进入时恢复）
        // 只缓存有完整数据库字段的消息（有 id 的），避免缓存乐观上屏的临时消息
        if (msg.id) {
            const roomId = this.state.activeRoom;
            if (!this.state.roomMessageCache[roomId]) {
                this.state.roomMessageCache[roomId] = [];
            }
            // 去重：如果 id 已存在就不重复添加
            const already = this.state.roomMessageCache[roomId].some(m => m.id === msg.id);
            if (!already) {
                this.state.roomMessageCache[roomId].push(msg);
            }
        }
        
        // 自动滚动到底部
        setTimeout(() => {
            box.scrollTop = box.scrollHeight;
        }, 50);
    },

    // --- 【修复版】实时订阅 (支持切换频道) ---
    async subscribeToRealtime(roomId = '8802') {
        const myId = this.state.user.id;
        console.log(`[Galaxy] 正在切换信号频道至: ${roomId}, myId=${myId}`);

        // 1. 先销毁所有旧频道，防止重叠监听
        try {
            await this.supabase.removeAllChannels();
            console.log(`[Galaxy] 旧频道已全部清除`);
        } catch(e) {
            console.warn(`[Galaxy] 清除旧频道时出错:`, e);
        }

        // 2. 短暂等待，确保旧连接完全断开
        await new Promise(resolve => setTimeout(resolve, 200));

        // 3. 建立新频道
        // 【关键修复】messages 表不加 filter，在回调里手动判断 room_id
        // 原因：Supabase Realtime filter 对含特殊字符的 room_id（如 private_xxx_yyy）
        // 有时无法正确匹配，导致消息收不到。改为收全量再客户端过滤，100% 可靠。
        const channelName = `galaxy-${Date.now()}`;
        const channel = this.supabase.channel(channelName);

        channel
            // A. 监听好友请求
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'friendships',
                filter: `receiver_id=eq.${myId}`
            }, async payload => {
                const { data: req } = await this.supabase.from('profiles').select('*').eq('id', payload.new.requester_id).single();
                if (req) this.showIncomingInvite(req, payload.new.id);
            })

            // B. 监听好友状态更新
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'friendships'
            }, payload => {
                if (payload.new.status === 'accepted' && (payload.new.requester_id === myId || payload.new.receiver_id === myId)) {
                    this.loadFriendsList();
                    if (payload.new.requester_id === myId) alert("对方接受了连接！");
                }
            })

            // C. 【核心】监听 messages 全量插入，客户端过滤 room_id
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, payload => {
                const newMsg = payload.new;

                // 客户端过滤：只处理当前房间的消息
                if (newMsg.room_id !== this.state.activeRoom) {
                    return;
                }

                console.log(`[Galaxy Realtime] 收到消息: type=${newMsg.type}, sender=${newMsg.sender_id}, isMe=${newMsg.sender_id === myId}`);

                const isMyMsg = newMsg.sender_id === myId;

                // 【新增】处理角色输入广播消息（typing_indicator）
                if (newMsg.type === 'typing_indicator') {
                    if (!isMyMsg) {
                        // 对方的角色正在输入：显示动画
                        this.showFriendCharTyping(newMsg);
                    }
                    return; // typing_indicator 不走普通渲染
                }

                // 好友发的消息全部渲染；自己发的已乐观上屏，跳过
                if (!isMyMsg) {
                    // 对方角色的输入动画此时应移除（真实消息来了）
                    this.removeFriendCharTyping();
                    this.renderMessageBubble(newMsg);
                }

                // 写入缓存
                const curRoom = this.state.activeRoom;
                if (newMsg.id) {
                    if (!this.state.roomMessageCache[curRoom]) this.state.roomMessageCache[curRoom] = [];
                    const already = this.state.roomMessageCache[curRoom].some(m => m.id === newMsg.id);
                    if (!already) this.state.roomMessageCache[curRoom].push(newMsg);
                }

                // Realtime 里不触发角色回复（由 sendMessageAndTrigger 负责）
            })

            // D. 【新增】Presence：监听真人"正在输入"状态
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                let friendIsTyping = false;
                let typingInfo = null;

                for (const key in state) {
                    for (const p of state[key]) {
                        if (p.user_id !== myId && p.typing === true) {
                            friendIsTyping = true;
                            typingInfo = p;
                            break;
                        }
                    }
                    if (friendIsTyping) break;
                }

                if (friendIsTyping && typingInfo) {
                    this.showFriendTyping(typingInfo);
                } else {
                    this.removeFriendTyping();
                }
            })

            .subscribe((status, err) => {
                console.log(`[Galaxy] 频道状态变化: ${status}`, err || '');
                if (status === 'SUBSCRIBED') {
                    console.log(`[Galaxy] ✅ 订阅成功！监听房间: ${this.state.activeRoom}`);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`[Galaxy] ❌ 频道错误:`, err);
                } else if (status === 'TIMED_OUT') {
                    console.error(`[Galaxy] ❌ 频道超时，请检查网络`);
                }
            });

        this.state.currentSubscription = channel;
        console.log(`[Galaxy] 新频道已创建: ${channelName}`);
    },

// --- 【新增】真人"正在输入"：显示 ---
    showFriendTyping(info) {
        const box = document.getElementById('g-chat-box');
        if (!box) return;

        // 已有则更新，不重复创建
        if (this.state.friendTypingEl) return;

        const row = document.createElement('div');
        row.className = 'g-typing-row';
        row.id = 'g-friend-typing-row';
        row.innerHTML = `
            <img src="${info.avatar || ''}" class="msg-avatar">
            <div style="display:flex; flex-direction:column; gap:2px;">
                <span style="font-size:10px; color:#bbb; margin-left:4px;">${info.nickname || '对方'}</span>
                <div class="g-typing-bubble">
                    <div class="g-typing-dot"></div>
                    <div class="g-typing-dot"></div>
                    <div class="g-typing-dot"></div>
                </div>
            </div>
        `;
        box.appendChild(row);
        box.scrollTop = box.scrollHeight;
        this.state.friendTypingEl = row;
    },

// --- 【新增】真人"正在输入"：移除 ---
    removeFriendTyping() {
        if (this.state.friendTypingEl) {
            this.state.friendTypingEl.remove();
            this.state.friendTypingEl = null;
        }
    },

// --- 【新增】对方角色"正在输入"：显示（从 typing_indicator 消息解析） ---
    showFriendCharTyping(msg) {
        const box = document.getElementById('g-chat-box');
        if (!box) return;

        // 避免重复添加
        if (document.getElementById('g-friend-char-typing-row')) return;

        let charInfo = {};
        try { charInfo = JSON.parse(msg.content); } catch(e) {}

        const row = document.createElement('div');
        row.className = 'g-typing-row';
        row.id = 'g-friend-char-typing-row';
        row.innerHTML = `
            <img src="${charInfo.avatar || ''}" class="msg-avatar">
            <div style="display:flex; flex-direction:column; gap:2px;">
                <span style="font-size:10px; color:#d4af37; font-weight:bold; margin-left:4px;">${charInfo.name || '角色'}</span>
                <div class="g-typing-bubble">
                    <div class="g-typing-dot"></div>
                    <div class="g-typing-dot"></div>
                    <div class="g-typing-dot"></div>
                </div>
            </div>
        `;
        box.appendChild(row);
        box.scrollTop = box.scrollHeight;
    },

// --- 【新增】对方角色"正在输入"：移除 ---
    removeFriendCharTyping() {
        const el = document.getElementById('g-friend-char-typing-row');
        if (el) el.remove();
    },

// --- 辅助：显示正在输入 ---
    showTypingIndicator(charId) {
        // 1. 获取角色信息以显示头像
        const allChars = this.hooks.getLocalCharacters();
        const charDossier = allChars.find(d => d.id == charId);
        let avatarUrl = "https://api.dicebear.com/9.x/avataaars/svg?seed=Unknown";
        
        if (charDossier) {
            // 这里简化处理，和发送消息时一样用 DiceBear 生成稳定头像
            // 如果你有传真实头像的逻辑，可以在这里替换
            const _ta = JSON.parse(localStorage.getItem('kiki_galaxy_char_avatars') || '{}');
            avatarUrl = _ta[String(charId)] || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(charDossier.character.name)}`;
        }

        const box = document.getElementById('g-chat-box');
        
        // 2. 创建 DOM
        const row = document.createElement('div');
        row.className = 'g-typing-row';
        row.innerHTML = `
            <img src="${avatarUrl}" class="msg-avatar">
            <div class="g-typing-bubble">
                <div class="g-typing-dot"></div>
                <div class="g-typing-dot"></div>
                <div class="g-typing-dot"></div>
            </div>
        `;
        
        box.appendChild(row);
        box.scrollTop = box.scrollHeight; // 滚到底部
        
        return row; // 返回元素引用，以便稍后删除
    },

// --- 核心：驱动本地角色回复 ---
    async triggerLocalCharacterReply(charId, isGreeting = false) {
        // 1. 获取角色档案 (为了名字)
        const allChars = this.hooks.getLocalCharacters();
        // 注意：ID类型转换，确保匹配
        const charDossier = allChars.find(d => d.id == charId);
        
        if (!charDossier) {
            console.error(`[Galaxy AI] 找不到 ID 为 ${charId} 的本地角色档案`);
            return;
        }

        // 2. 抓取聊天上下文 (Context)
        const chatBox = document.getElementById('g-chat-box');
        // 改这一行，把选择器对齐实际渲染的 class 名
const msgs = chatBox.querySelectorAll('.msg-row, .system-msg, .g-msg-sys');
        let contextText = "";
        
        // 只取最近 15 条，防止 Token 溢出
        const recentMsgs = Array.from(msgs).slice(-15);
        
        recentMsgs.forEach(el => {
            // 如果是系统消息
            if (el.classList.contains('system-msg') || el.classList.contains('g-msg-sys')) {
                contextText += `[System]: ${el.innerText}\n`;
            } else {
                // 如果是对话消息
                const isMe = el.classList.contains('self');
                
                // 尝试获取名字 (如果是自己，就叫 ME)
                let name = "Stranger";
                if (isMe) {
                    name = "ME (User)";
                } else {
                    const nameEl = el.querySelector('.msg-name');
                    if (nameEl) name = nameEl.innerText;
                }
                
                // 获取内容
                const bubbleEl = el.querySelector('.msg-bubble');
                if (bubbleEl) {
                    contextText += `${name}: ${bubbleEl.innerText}\n`;
                }
            }
        });

        // 如果是入场打招呼，强制加一条上下文引导
        if (isGreeting) {
            contextText += `[System]: (你刚刚被你的主人 "ME" 邀请加入了这个群聊。请简短地跟大家打个招呼。)\n`;
        }

        console.log(`[Galaxy AI] 正在请求主程序生成 [${charDossier.character.name}] 的回复...`);

        // ▼▼▼ 显示"正在输入"动画（自己本地） ▼▼▼
        const typingEl = this.showTypingIndicator(charId);

        // ▼▼▼ 【新增】广播角色输入状态到数据库，让对方也能看到 ▼▼▼
        let typingMsgId = null;
        try {
            const _storedAvatarsEarly = JSON.parse(localStorage.getItem('kiki_galaxy_char_avatars') || '{}');
            const charAvatarEarly = _storedAvatarsEarly[String(charId)] || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(charDossier.character.name)}`;
            const { data: typingMsg } = await this.supabase.from('messages').insert({
                room_id: this.state.activeRoom,
                sender_id: this.state.user.id,
                content: JSON.stringify({ name: charDossier.character.name, avatar: charAvatarEarly }),
                type: 'typing_indicator'
            }).select('id').single();
            if (typingMsg) typingMsgId = typingMsg.id;
        } catch(e) {
            console.warn('[Galaxy AI] typing_indicator 写库失败:', e);
        }
        // ▲▲▲ 新增结束 ▲▲▲

        // 辅助：把 AI 返回的长文本拆成多条气泡
        // 规则：按句号/问号/感叹号/换行分割，过滤空字符串，最多拆 5 条
        const splitIntoMessages = (text) => {
            const parts = text
                .split(/(?<=[。！？!?\n])\s*/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
            // 如果拆出来只有 1 条或内容很短，就直接整条发
            if (parts.length <= 1) return [text.trim()];
            // 最多 5 条，超出的合并到最后一条
            if (parts.length > 5) {
                return [...parts.slice(0, 4), parts.slice(4).join('')];
            }
            return parts;
        };

        // 辅助：发送单条角色消息（本地渲染 + 写库）
        const sendCharMessage = async (text, charDossier, charAvatar) => {
            const payload = JSON.stringify({
                isChar: true,
                charId: charId,
                name: charDossier.character.name,
                avatar: charAvatar,
                text: text
            });
            this.renderMessageBubble({
                type: 'character_proxy',
                content: payload,
                sender_id: this.state.user.id
            });
            const { error: insertError } = await this.supabase.from('messages').insert({
                room_id: this.state.activeRoom,
                sender_id: this.state.user.id,
                content: payload,
                type: 'character_proxy'
            });
            if (insertError) console.error(`[Galaxy AI] ❌ 写库失败:`, insertError);
        };

        // 3. 呼叫主文件生成 AI 回复 (Hook)
        if (this.hooks.onAiGeneration) {
            try {
                const responseText = await this.hooks.onAiGeneration(charId, contextText);
                if (typingEl) typingEl.remove();

                // 【新增】删除数据库里的 typing_indicator 广播消息
                if (typingMsgId) {
                    try { await this.supabase.from('messages').delete().eq('id', typingMsgId); } catch(e) {}
                    typingMsgId = null;
                }
            
                if (responseText) {
                    const allChars = this.hooks.getLocalCharacters();
                    const charDossier = allChars.find(d => d.id == charId);
                    // 优先用自定义捏脸头像，否则用 DiceBear 默认
                    const _storedAvatars = JSON.parse(localStorage.getItem('kiki_galaxy_char_avatars') || '{}');
                    const charAvatar = _storedAvatars[String(charId)] || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(charDossier.character.name)}`;
                    
                    // 拆成多条
                    const messages = splitIntoMessages(responseText);
                    console.log(`[Galaxy AI] 拆成 ${messages.length} 条消息:`, messages);

                    // 逐条发送，每条之间模拟"正在输入"间隔
                    for (let i = 0; i < messages.length; i++) {
                        if (i > 0) {
                            // 后续每条：先显示输入动画，再发出
                            const delay = 600 + messages[i].length * 40; // 根据字数算等待时间
                            await new Promise(resolve => setTimeout(resolve, 400));
                            const nextTyping = this.showTypingIndicator(charId);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            nextTyping.remove();
                        }
                        await sendCharMessage(messages[i], charDossier, charAvatar);
                    }
                }
            } catch (e) {
                if (typingEl) typingEl.remove();
                if (typingMsgId) try { await this.supabase.from('messages').delete().eq('id', typingMsgId); } catch(e) {}
                console.error("AI 生成出错:", e);
            }
        } else {
            if (typingEl) typingEl.remove();
            if (typingMsgId) try { await this.supabase.from('messages').delete().eq('id', typingMsgId); } catch(e) {}
        }
    },

    // --- 清空当前房间所有消息 ---
    async clearRoomMessages() {
        const roomId = this.state.activeRoom;
        const chatBox = document.getElementById('g-chat-box');

        // 1. 显示清空中状态
        chatBox.innerHTML = '<div class="system-msg">正在清空...</div>';

        // 2. 删除数据库里该房间的所有消息
        const { error } = await this.supabase
            .from('messages')
            .delete()
            .eq('room_id', roomId);

        if (error) {
            console.error('[Galaxy] ❌ 清空消息失败:', error);
            chatBox.innerHTML = '<div class="system-msg" style="color:red;">清空失败，请重试</div>';
            return;
        }

        // 3. 清空本地内存缓存
        this.state.roomMessageCache[roomId] = [];

        // 4. 刷新聊天框
        const roomLabel = roomId === '8802' ? '加密频道 #8802' : '私密频道';
        chatBox.innerHTML = `<div class="system-msg">${roomLabel}</div><div class="system-msg">聊天记录已清空</div>`;

        console.log(`[Galaxy] ✅ 房间 ${roomId} 消息已全部清空`);
    },

    // --- localStorage 持久化：角色与房间的绑定关系 ---
    // 存储结构: kiki_galaxy_room_chars = { "private_xxx_yyy": ["charId1","charId2"], ... }

    saveRoomCharsToStorage(roomId) {
        try {
            const all = JSON.parse(localStorage.getItem('kiki_galaxy_room_chars') || '{}');
            all[roomId] = [...this.state.activeLocalChars];
            localStorage.setItem('kiki_galaxy_room_chars', JSON.stringify(all));
            console.log(`[Galaxy] 已持久化房间 ${roomId} 的角色:`, all[roomId]);
        } catch(e) {
            console.error('[Galaxy] 角色持久化失败:', e);
        }
    },

    loadRoomCharsFromStorage(roomId) {
        try {
            const all = JSON.parse(localStorage.getItem('kiki_galaxy_room_chars') || '{}');
            const ids = all[roomId] || [];
            console.log(`[Galaxy] 从 localStorage 读取房间 ${roomId} 的角色:`, ids);
            return new Set(ids);
        } catch(e) {
            console.error('[Galaxy] 角色读取失败:', e);
            return new Set();
        }
    },

    showIncomingInvite(req, id) {
        const root = document.getElementById(this.rootId);

        // Force the root container to be visible if it was hidden
        if (getComputedStyle(root).display === 'none') {
            console.log("🌌 Galaxy Link: Waking up UI for incoming invite...");
            root.style.display = 'flex';
            root.offsetHeight; // Force reflow
            root.classList.add('active');
        }

        // Debug visibility
        const r = root.getBoundingClientRect();
        console.log(`🌌 Galaxy Link: UI woke up? Size: ${r.width}x${r.height}, Top: ${r.top}, Z: ${getComputedStyle(root).zIndex}`);

        const modal = root.querySelector('#incoming-modal');
        modal.querySelector('.incoming-avatar-img').src = req.avatar_url;
        modal.querySelector('#incoming-text').innerText = `用户 ${req.nickname} (#${req.friend_code}) 请求连接`;

        modal.querySelector('#btn-reject-invite').onclick = async () => {
            modal.style.display = 'none';
            await this.supabase.from('friendships').update({ status: 'rejected' }).eq('id', id);
        };
        modal.querySelector('#btn-accept-invite').onclick = async () => {
            modal.style.display = 'none';
            await this.supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
            this.loadFriendsList();
        };
        modal.style.display = 'flex';
        // Debug modal visibility
        const mr = modal.getBoundingClientRect();
        console.log(`🌌 Galaxy Link: Modal rect: ${mr.width}x${mr.height}, display: ${getComputedStyle(modal).display}, opacity: ${getComputedStyle(modal).opacity}`);
        console.log(`🌌 Galaxy Link: Modal z-index: ${getComputedStyle(modal).zIndex}, position: ${getComputedStyle(modal).position}`);
    },

    // --- 公开控制 ---
    open() {
        const root = document.getElementById(this.rootId);
        // 重置状态
        root.style.display = 'flex';
        root.offsetHeight;
        root.classList.add('active');

        root.querySelectorAll('.g-page').forEach(p => p.style.display = 'none');

        // 今日已同意过则直接进大厅，跳过免责声明
        const agreedDate = localStorage.getItem('kiki_galaxy_agreed_date');
        if (agreedDate === new Date().toDateString()) {
            root.querySelector('#g-lobby-page').style.display = 'flex';
        } else {
            root.querySelector('#g-disclaimer').style.display = 'flex';
            this.startCountdown();
        }
    },

    close() {
        const root = document.getElementById(this.rootId);
        root.classList.remove('active');
        if (this.timerInterval) clearInterval(this.timerInterval);
        setTimeout(() => root.style.display = 'none', 300);
    }
};