// JavaScript部分与上一版完全相同，无需改动
document.addEventListener('DOMContentLoaded', () => {
    const safeSetItem = (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('Storage quota exceeded or error saving to localStorage:', e);
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.warn('LocalStorage capacity reached. To prevent crashes, this action was not saved. Please clear some storage.');
            }
        }
    };

    const compressImage = (file, maxWidth, maxHeight, quality, callback) => {
        if (!file || !file.type.startsWith('image/')) return callback(null);
        const reader = new FileReader();
        reader.onload = event => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height *= maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width *= maxHeight / height));
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                callback(dataUrl);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const homePage = document.getElementById('home-screen-page');
    const beautifyPage = document.getElementById('beautify-page');
    const beautifyBtn = document.getElementById('nav-item-1');
    const backBtn = document.getElementById('back-to-home-btn');
    const phoneScreen = document.getElementById('phone-screen');
    
    // 聊天软件相关元素
    const chatAppBtn = document.getElementById('app-item-1');
    const chatAppPage = document.getElementById('chat-app-page');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatNavItems = document.querySelectorAll('.chat-nav-item');
    const chatViewPanels = document.querySelectorAll('.chat-view-panel');
    const chatHeaderTitle = document.getElementById('chat-header-title');
    
    // 新增按钮和页面
    const addFriendBtn = document.getElementById('add-friend-btn');
    const addContactBtn = document.getElementById('add-contact-btn');
    const addContactPage = document.getElementById('add-contact-page');
    const closeAddContactBtn = document.getElementById('close-add-contact-btn');
    const saveContactBtn = document.getElementById('save-contact-btn');
    const contactAvatarUpload = document.getElementById('upload-contact-avatar');
    const contactAvatarPreview = document.getElementById('contact-avatar-preview');
    
    const selectContactModal = document.getElementById('select-contact-modal');
    const closeSelectContactBtn = document.getElementById('close-select-contact-btn');
    
    // 数据存储
    let contacts = JSON.parse(localStorage.getItem('chat_contacts') || '[]');
    let chatList = JSON.parse(localStorage.getItem('chat_list') || '[]');
    let messagesData = JSON.parse(localStorage.getItem('chat_messages') || '{}'); // { contactId: [ {sender:'me'|'them', text:'', time:123} ] }
    let stickerGroups = JSON.parse(localStorage.getItem('chat_sticker_groups') || '[]'); // [ {id, name, stickers: [{name, url}]} ]
    let roleProfiles = JSON.parse(localStorage.getItem('chat_role_profiles') || '{}'); // { contactId: { wbId, stickerGroupId, autoMem, memory, userPersona } }
    let worldBooks = JSON.parse(localStorage.getItem('chat_worldbooks') || '{"global":[], "local":[]}');
    
    let currentContactAvatarBase64 = '';
    let currentActiveContactId = null;
    let currentStickerGroupId = null; // 用于表情包管理页面
    let editingContactId = null; // 记录正在编辑的联系人

    const chatConversationPage = document.getElementById('chat-conversation-page');
    const convBackBtn = document.getElementById('conv-back-btn');
    const convMessagesContainer = document.getElementById('conv-messages-container');
    const convHeaderName = document.getElementById('conv-header-name');
    const convHeaderAvatar = document.getElementById('conv-header-avatar');
    const convMsgInput = document.getElementById('conv-msg-input');
    const convProfileBtn = document.getElementById('conv-profile-btn');
    const innerVoiceBubble = document.getElementById('inner-voice-bubble');
    const chatPlusBtn = document.getElementById('chat-plus-btn');
    const chatSmileBtn = document.getElementById('chat-smile-btn');
    const chatAiBtn = document.getElementById('chat-ai-btn');
    const chatDrawerPlus = document.getElementById('chat-drawer-plus');
    const chatDrawerSmile = document.getElementById('chat-drawer-smile');
    const chatStarBtn = document.getElementById('chat-star-btn');
    const chatDrawerStar = document.getElementById('chat-drawer-star');
    
    // --- 消息交互相关变量 ---
    let selectedMsgIndex = null;
    let isMultiSelectMode = false;
    let selectedMsgIndices = new Set();
    window.currentQuoteText = ''; // 用window挂载方便sendMsg访问
    const msgContextMenu = document.getElementById('msg-context-menu');
    const menuItemQuote = document.getElementById('menu-item-quote');
    const menuItemEdit = document.getElementById('menu-item-edit');
    const menuItemRecall = document.getElementById('menu-item-recall');
    const menuItemDelete = document.getElementById('menu-item-delete');
    const menuItemMultiselect = document.getElementById('menu-item-multiselect');
    const menuItemReroll = document.getElementById('menu-item-reroll');
    const quotePreviewArea = document.getElementById('quote-preview-area');
    const quotePreviewText = document.getElementById('quote-preview-text');
    const quotePreviewClose = document.getElementById('quote-preview-close');
    const multiSelectBar = document.getElementById('multi-select-bar');
    const multiSelectCancel = document.getElementById('multi-select-cancel');
    const multiSelectDeleteBtn = document.getElementById('multi-select-delete-btn');
    const convBottomContainer = document.getElementById('conv-bottom-container');

    // 双击气泡
    convMessagesContainer.addEventListener('dblclick', (e) => {
        const bubble = e.target.closest('.msg-bubble');
        if (!bubble) return;
        
        selectedMsgIndex = parseInt(bubble.dataset.index);
        const rect = bubble.getBoundingClientRect();
        
        msgContextMenu.style.display = 'flex';
        let top = rect.top - msgContextMenu.offsetHeight - 10;
        let left = rect.left + (rect.width / 2) - (msgContextMenu.offsetWidth / 2);
        
        if (top < 50) top = rect.bottom + 10; // 如果上方空间不足，显示在下方
        if (left < 10) left = 10;
        if (left + msgContextMenu.offsetWidth > window.innerWidth - 10) {
            left = window.innerWidth - msgContextMenu.offsetWidth - 10;
        }
        
        msgContextMenu.style.top = `${top}px`;
        msgContextMenu.style.left = `${left}px`;
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.msg-context-menu') && !e.target.closest('.msg-bubble')) {
            msgContextMenu.style.display = 'none';
        }
    });

    if (menuItemEdit) {
        menuItemEdit.addEventListener('click', () => {
            if (selectedMsgIndex === null || !currentActiveContactId) return;
            const msg = messagesData[currentActiveContactId][selectedMsgIndex];
            msgContextMenu.style.display = 'none';
            
            // 简单的弹窗编辑，避免复杂的DOM操作
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = msg.text;
            let oldText = tempDiv.textContent || tempDiv.innerText;
            
            let newText = prompt('编辑消息:', oldText);
            if (newText !== null && newText.trim() !== '') {
                messagesData[currentActiveContactId][selectedMsgIndex].text = newText.trim();
                localStorage.setItem('chat_messages', JSON.stringify(messagesData));
                renderMessages();
            }
        });
    }

    menuItemDelete.addEventListener('click', () => {
        if (selectedMsgIndex === null || !currentActiveContactId) return;
        // 使用一个更明显的确认弹窗防误删
        if (window.confirm('⚠️ 警告：删除后无法恢复！\n\n您确定要删除这条消息吗？')) {
            messagesData[currentActiveContactId].splice(selectedMsgIndex, 1);
            localStorage.setItem('chat_messages', JSON.stringify(messagesData));
            renderMessages();
        }
        msgContextMenu.style.display = 'none';
    });

    menuItemReroll.addEventListener('click', () => {
        if (selectedMsgIndex === null || !currentActiveContactId) return;
        const msg = messagesData[currentActiveContactId][selectedMsgIndex];
        if (msg.sender !== 'them') {
            alert('只能重试对方的消息');
            return;
        }
        if (!confirm('确定要重新生成本轮消息吗？将删除本条及之后的所有AI回复，并重新请求AI。')) return;
        
        let msgs = messagesData[currentActiveContactId];
        let lastUserIndex = -1;
        for (let i = selectedMsgIndex; i >= 0; i--) {
            if (msgs[i].sender === 'me') {
                lastUserIndex = i;
                break;
            }
        }
        
        let deleteStartIndex = lastUserIndex + 1;
        if (deleteStartIndex <= msgs.length) {
            msgs.splice(deleteStartIndex, msgs.length - deleteStartIndex);
        }

        localStorage.setItem('chat_messages', JSON.stringify(messagesData));
        renderMessages();
        msgContextMenu.style.display = 'none';
        chatAiBtn.click();
    });

    menuItemMultiselect.addEventListener('click', () => {
        isMultiSelectMode = true;
        selectedMsgIndices.clear();
        msgContextMenu.style.display = 'none';
        convMessagesContainer.classList.add('multi-select-mode');
        renderMessages();
    });

    multiSelectCancel.addEventListener('click', () => {
        isMultiSelectMode = false;
        selectedMsgIndices.clear();
        convMessagesContainer.classList.remove('multi-select-mode');
        renderMessages();
    });

    multiSelectDeleteBtn.addEventListener('click', () => {
        if (selectedMsgIndices.size === 0) return;
        if (!confirm(`确定要删除选中的 ${selectedMsgIndices.size} 条消息吗？`)) return;
        
        let indicesArray = Array.from(selectedMsgIndices).sort((a,b) => b - a);
        indicesArray.forEach(idx => {
            messagesData[currentActiveContactId].splice(idx, 1);
        });
        localStorage.setItem('chat_messages', JSON.stringify(messagesData));
        
        isMultiSelectMode = false;
        selectedMsgIndices.clear();
        convMessagesContainer.classList.remove('multi-select-mode');
        renderMessages();
    });

    menuItemRecall.addEventListener('click', () => {
        if (selectedMsgIndex === null || !currentActiveContactId) return;
        messagesData[currentActiveContactId][selectedMsgIndex].recalled = true;
        localStorage.setItem('chat_messages', JSON.stringify(messagesData));
        renderMessages();
        msgContextMenu.style.display = 'none';
    });

    menuItemQuote.addEventListener('click', () => {
        if (selectedMsgIndex === null || !currentActiveContactId) return;
        const msg = messagesData[currentActiveContactId][selectedMsgIndex];
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = msg.text;
        let textOnly = tempDiv.textContent || tempDiv.innerText || '[图片/表情包]';
        
        window.currentQuoteText = textOnly;
        quotePreviewText.innerText = `引用: ${window.currentQuoteText}`;
        quotePreviewArea.style.display = 'block';
        msgContextMenu.style.display = 'none';
        convMsgInput.focus();
    });

    quotePreviewClose.addEventListener('click', () => {
        window.currentQuoteText = '';
        quotePreviewArea.style.display = 'none';
    });
    // ----------------------
    
    const roleProfilePage = document.getElementById('role-profile-page');
    const closeRpBtn = document.getElementById('close-rp-btn');
    const saveRpBtn = document.getElementById('save-rp-btn');
    const rpAvatarPreview = document.getElementById('rp-avatar-preview');
    const rpNameDisplay = document.getElementById('rp-name-display');
    const rpDescDisplay = document.getElementById('rp-desc-display');
    const rpWorldbookSelect = document.getElementById('rp-worldbook-select');
    const rpStickerGroupSelect = document.getElementById('rp-sticker-group-select');
    const rpAutoMemory = document.getElementById('rp-auto-memory');
    const rpMemoryContent = document.getElementById('rp-memory-content');
    const rpUserPersona = document.getElementById('rp-user-persona');
    
    let isRoleProfileModified = false;
    function markRoleProfileModified() { isRoleProfileModified = true; }
    
    const stickerMgrPage = document.getElementById('sticker-mgr-page');
    const closeStickerMgrBtn = document.getElementById('close-sticker-mgr-btn');
    const createStickerGroupBtn = document.getElementById('create-sticker-group-btn');
    const importStickerTxtBtn = document.getElementById('import-sticker-txt-btn');
    const stickerMgrTabs = document.getElementById('sticker-mgr-tabs');
    const stickerMgrGrid = document.getElementById('sticker-mgr-grid');
    const stickerMgrEmpty = document.getElementById('sticker-mgr-empty');
    const addStickersBtn = document.getElementById('add-stickers-btn');
    const drawerBtnStickers = document.getElementById('drawer-btn-stickers');
    const stickerDrawerTabs = document.getElementById('sticker-drawer-tabs');
    const stickerDrawerGrid = document.getElementById('sticker-drawer-grid');

    // UI交互逻辑 (底部抽屉)
    const hideAllDrawers = () => {
        chatDrawerPlus.classList.remove('active');
        chatDrawerSmile.classList.remove('active');
        if(chatDrawerStar) chatDrawerStar.classList.remove('active');
        chatPlusBtn.classList.remove('active');
        chatSmileBtn.classList.remove('active');
        if(chatStarBtn) chatStarBtn.classList.remove('active');
    };
    
    chatPlusBtn.addEventListener('click', () => {
        if(chatDrawerPlus.classList.contains('active')) {
            hideAllDrawers();
        } else {
            hideAllDrawers();
            chatDrawerPlus.classList.add('active');
            chatPlusBtn.classList.add('active');
            convMessagesContainer.scrollTop = convMessagesContainer.scrollHeight;
        }
    });

    chatSmileBtn.addEventListener('click', () => {
        if(chatDrawerSmile.classList.contains('active')) {
            hideAllDrawers();
        } else {
            hideAllDrawers();
            chatDrawerSmile.classList.add('active');
            chatSmileBtn.classList.add('active');
            renderChatStickerDrawer();
            convMessagesContainer.scrollTop = convMessagesContainer.scrollHeight;
        }
    });

    if (chatStarBtn) {
        chatStarBtn.addEventListener('click', () => {
            if(chatDrawerStar.classList.contains('active')) {
                hideAllDrawers();
            } else {
                hideAllDrawers();
                chatDrawerStar.classList.add('active');
                chatStarBtn.classList.add('active');
                if (window.renderGiftDrawer) window.renderGiftDrawer();
                convMessagesContainer.scrollTop = convMessagesContainer.scrollHeight;
            }
        });
    }

    // 相册上传逻辑
    const uploadChatImage = document.getElementById('upload-chat-image');
    if (uploadChatImage) {
        uploadChatImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            compressImage(file, 800, 800, 0.8, (dataUrl) => {
                if (!dataUrl) return;
                sendMsg('me', `<img src="${dataUrl}" class="chat-sent-image" style="max-width:200px; border-radius:12px;">`);
                hideAllDrawers();
                e.target.value = '';
            });
        });
    }

    // 悬浮窗交互逻辑
    const transferModal = document.getElementById('transfer-modal');
    const closeTransferBtn = document.getElementById('close-transfer-btn');
    const tpSubmitBtn = document.getElementById('tp-submit-btn');
    const tpAmountInput = document.getElementById('tp-amount-input');
    const tpNoteInput = document.getElementById('tp-note-input');
    const drawerBtnTransfer = document.getElementById('drawer-btn-transfer');

    if (drawerBtnTransfer) {
        drawerBtnTransfer.addEventListener('click', () => {
            hideAllDrawers();
            if(tpAmountInput) tpAmountInput.value = '';
            if(tpNoteInput) tpNoteInput.value = '';
            if(transferModal) transferModal.style.display = 'flex';
            setTimeout(() => { if(tpAmountInput) tpAmountInput.focus() }, 50);
        });
    }

    const closeTransferPopup = () => { if(transferModal) transferModal.style.display = 'none'; };
    if(closeTransferBtn) closeTransferBtn.addEventListener('click', closeTransferPopup);

    if(tpSubmitBtn) {
        tpSubmitBtn.addEventListener('click', () => {
            const amount = tpAmountInput.value.trim();
            if (!amount || isNaN(amount) || Number(amount) <= 0) {
                alert('请输入有效的金额');
                return;
            }
            const note = tpNoteInput ? tpNoteInput.value.trim() : '';
            const msgText = note ? `[转账:${amount}:${note}]` : `[转账:${amount}]`;
            sendMsg('me', msgText);
            closeTransferPopup();
        });
    }

    const textImgModal = document.getElementById('textimg-modal');
    const closeTextImgBtn = document.getElementById('close-textimg-btn');
    const tiSubmitBtn = document.getElementById('ti-submit-btn');
    const tiContentInput = document.getElementById('ti-content-input');
    const drawerBtnTextimg = document.getElementById('drawer-btn-textimg');

    if (drawerBtnTextimg) {
        drawerBtnTextimg.addEventListener('click', () => {
            hideAllDrawers();
            if(tiContentInput) tiContentInput.value = '';
            if(textImgModal) textImgModal.style.display = 'flex';
            setTimeout(() => { if(tiContentInput) tiContentInput.focus() }, 50);
        });
    }

    const closeTextImgPopup = () => { if(textImgModal) textImgModal.style.display = 'none'; };
    if(closeTextImgBtn) closeTextImgBtn.addEventListener('click', closeTextImgPopup);

    document.querySelectorAll('.ui-modal-bg').forEach(bg => bg.addEventListener('click', () => {
        if(transferModal) transferModal.style.display = 'none';
        if(textImgModal) textImgModal.style.display = 'none';
    }));

    if(tiSubmitBtn) {
        tiSubmitBtn.addEventListener('click', () => {
            const content = tiContentInput ? tiContentInput.value.trim() : '';
            if (!content) {
                alert('请输入文字内容');
                return;
            }
            sendMsg('me', `[文字图:${content}]`);
            closeTextImgPopup();
        });
    }

    chatAiBtn.addEventListener('click', async () => {
        if (!currentActiveContactId) return;
        
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (!apiData.url || !apiData.key || !apiData.modelName) {
            alert('请先在设置中配置API地址、秘钥和模型名称。');
            return;
        }

        const contact = contacts.find(c => c.id === currentActiveContactId);
        const profile = roleProfiles[currentActiveContactId] || {};
        const msgs = messagesData[currentActiveContactId] || [];
        
        const originalIcon = chatAiBtn.innerHTML;
        chatAiBtn.innerHTML = `<i class='bx bx-loader-alt spin'></i>`;
        chatAiBtn.disabled = true;
        const statusEl = document.getElementById('conv-header-status');
        if (statusEl) statusEl.innerText = '正在输入中...';

        const replyMin = profile.replyMin || 1;
        const replyMax = profile.replyMax || 4;

        let systemPrompt = `你扮演角色：${contact.name}。
基本设定：性别 ${contact.gender || '未知'}，年龄 ${contact.age || '未知'}。
详细人设：${contact.desc || '暂无'}
请遵循线上聊天规则，要有活人感，采用短讯式回复，不要长篇大论。
【重要指令】你必须严格使用给定的人设、世界书和用户人设来回答问题。在每次回复内容的开头，你必须根据当前的人设、世界书和聊天内容，输出你当前的心情、动作或状态。必须严格使用 [状态:你的状态] 的格式，例如：[状态:去抓某个又偷吃的小猫(=^･ω･^=)]。

【输出格式要求（非常重要）】
你必须返回一个JSON数组，数组必须严格按照以下三部分顺序构成（长度为3）：
[
  "[状态:你的状态(带颜文字)]",
  "发送的具体消息内容(若有多条可合并为一句)",
  "[心声:[生理反应: xxx][色色想法: xxx][行动: xxx]]"
]
注意：数组的第一个元素必须是状态！第二个元素是发送的消息！第三个元素是包含生理反应、想法和行动的心声！
如果你想发语音，可以使用格式 [语音:内容:时长秒数]（如：[语音:你好呀:3]）。
如果你想主动转账给用户，可以使用格式 [转账:金额]（如：[转账:520]）。
如果你想发送图片给用户（根据聊天内容判断是否需要发图），请发送格式为 [发送图片:具体的英文画面描述] 的消息（如：[发送图片:1girl, looking at viewer, smile, selfie]）。
`;
        if (profile.userPersona) systemPrompt += `\n【用户人设】\n${profile.userPersona}\n`;
        if (profile.memory) systemPrompt += `\n【总结记忆】\n${profile.memory}\n`;

        // 时间感知增强逻辑
        if (profile.timeAware) {
            const now = new Date();
            const days = ['日', '一', '二', '三', '四', '五', '六'];
            const timeStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${days[now.getDay()]} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            
            systemPrompt += `\n【现实时间系统提示】\n当前现实时间是：${timeStr}。请根据这个时间来决定你的问候语或行为（例如早上要说早安，深夜可能在睡觉或熬夜）。`;
            
            // 查找上一条有效消息的时间
            if (msgs.length > 0) {
                let lastMsgTime = null;
                for (let i = msgs.length - 1; i >= 0; i--) {
                    if (msgs[i].time) {
                        lastMsgTime = msgs[i].time;
                        break;
                    }
                }
                
                if (lastMsgTime) {
                    const diffMs = now.getTime() - lastMsgTime;
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    
                    let elapsedStr = '';
                    if (diffDays > 0) elapsedStr = `${diffDays} 天`;
                    else if (diffHours > 0) elapsedStr = `${diffHours} 小时`;
                    else if (diffMins > 0) elapsedStr = `${diffMins} 分钟`;
                    else elapsedStr = '刚刚';

                    if (diffMins > 30) {
                        systemPrompt += `\n距离你们上一次对话已经过去了：${elapsedStr}。请在你的回复或心情状态中，自然地体现出这个时间间隔（例如：如果是隔了几天，可以表现出思念或询问对方去哪了；如果是隔了几个小时，可以是继续话题或询问在忙什么）。`;
                    }
                }
            }
            systemPrompt += `\n`;
        }

        if (profile.wbId) {
            const allWbs = worldBooks.global.concat(worldBooks.local);
            const boundWb = allWbs.find(x => x.id === profile.wbId);
            if (boundWb) {
                systemPrompt += `\n【世界书设定】\n`;
                if (boundWb.type === 'item') {
                    systemPrompt += `${boundWb.title}: ${boundWb.content}\n`;
                } else if (boundWb.type === 'folder') {
                    const items = allWbs.filter(x => x.parentId === boundWb.id && x.type === 'item');
                    items.forEach(item => {
                        systemPrompt += `${item.title}: ${item.content}\n`;
                    });
                }
            }
        }

        let boundStickers = [];
        if (profile.stickerGroupId) {
            const group = stickerGroups.find(g => g.id === profile.stickerGroupId);
            if (group && group.stickers.length > 0) {
                boundStickers = group.stickers;
                systemPrompt += `\n【你可以使用以下表情包】\n在回复中，你可以随时输出 [表情包:名称] 来发送表情。可用表情名称列表：${boundStickers.map(s => s.name).join(', ')}。\n`;
            }
        }

        let apiMessages = [{ role: 'system', content: systemPrompt }];
        
        msgs.forEach(msg => {
            let role = msg.sender === 'me' ? 'user' : 'assistant';
            
            if (msg.recalled) {
                apiMessages.push({ role: role, content: `[系统提示: ${role === 'user' ? '用户' : '你'}撤回了一条消息]` });
                return;
            }

            let tMatch = msg.text.match(/^\[文字图:([\s\S]*?)\]$/);
            if (tMatch) {
                let content = tMatch[1];
                let prompt = `[系统提示: ${role === 'user' ? '用户给你' : '你给用户'}发送了一张长图截屏，由于当前无法直接视觉解析图片，图片上的文字内容提取如下：\n"${content}"\n请你在回复时，把这当做是一张真实的图片。]`;
                apiMessages.push({ role: role, content: prompt });
                return;
            }

            let sendImgMatch = msg.text.match(/^\[发送图片:(.*?)\]$/);
            if (sendImgMatch) {
                apiMessages.push({ role: role, content: `[系统提示: ${role === 'user' ? '用户给你' : '你给用户'}发送了一张图片，画面描述为: ${sendImgMatch[1]}]` });
                return;
            }
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = msg.text;
            
            let contentArray = [];
            if (msg.quote) {
                contentArray.push({ type: "text", text: `> 引用: ${msg.quote}\n` });
            }

            let hasRealImage = false;
            const imgs = tempDiv.querySelectorAll('img');
            
            imgs.forEach(img => {
                const alt = img.getAttribute('alt');
                if (alt && alt.startsWith('[表情包:')) {
                    img.replaceWith(document.createTextNode(alt));
                } else if (img.classList.contains('chat-sent-image') || img.src.startsWith('data:image') || img.src.startsWith('http')) {
                    hasRealImage = true;
                }
            });

            if (hasRealImage) {
                let textContent = tempDiv.textContent || tempDiv.innerText;
                if (textContent.trim()) {
                    contentArray.push({ type: "text", text: textContent.trim() });
                }
                
                const originalImgs = document.createElement('div');
                originalImgs.innerHTML = msg.text;
                originalImgs.querySelectorAll('img').forEach(img => {
                    const alt = img.getAttribute('alt');
                    if (!alt || !alt.startsWith('[表情包:')) {
                        contentArray.push({
                            type: "image_url",
                            image_url: { url: img.src }
                        });
                    }
                });
                apiMessages.push({ role: role, content: contentArray });
            } else {
                let textContent = tempDiv.textContent || tempDiv.innerText;
                if (msg.quote) textContent = `> 引用: ${msg.quote}\n` + textContent;
                apiMessages.push({ role: role, content: textContent });
            }
        });

        try {
            let url = apiData.url;
            if (url.endsWith('/')) url = url.slice(0, -1);
            if (!url.endsWith('/chat/completions')) url += '/chat/completions';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiData.key}`
                },
                body: JSON.stringify({
                    model: apiData.modelName,
                    messages: apiMessages
                })
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const result = await response.json();
            let aiReplyRaw = result.choices[0].message.content;
            
            let messagesArray = [];
            try {
                const jsonMatch = aiReplyRaw.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    messagesArray = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON array found');
                }
            } catch (e) {
                messagesArray = aiReplyRaw.split('\n').filter(m => m.trim().length > 0);
            }

            let innerVoiceTextValue = '';
            if (messagesArray.length >= 3 && messagesArray[messagesArray.length - 1].includes('[心声:')) {
                innerVoiceTextValue = messagesArray.pop(); // 获取心声
            } else if (messagesArray.length >= 3) {
                // 如果没有明确的心声标签但长度满足，假定最后一个是心声
                innerVoiceTextValue = messagesArray.pop();
            }

            if (messagesArray.length > 0 && messagesArray[0].includes('状态:')) {
                let statusMatch = messagesArray[0].match(/状态:(.*?)\]/);
                if (statusMatch) {
                    const newState = statusMatch[1].replace(']', '').trim();
                    if (statusEl) statusEl.innerText = newState;
                    
                    let prof = roleProfiles[currentActiveContactId] || {};
                    prof.lastState = newState;
                    roleProfiles[currentActiveContactId] = prof;
                    safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                }
                messagesArray.shift();
            } else {
                if (statusEl) statusEl.innerText = '在线';
            }

            const sendNextMessage = (index) => {
                if (index >= messagesArray.length) {
                    chatAiBtn.innerHTML = originalIcon;
                    chatAiBtn.disabled = false;
                    return;
                }

                let msgText = messagesArray[index];
                
                // 将获取到的心声保存到本地或全局变量中，等待用户查看
                let prof = roleProfiles[currentActiveContactId] || {};
                prof.lastInnerVoice = innerVoiceTextValue;
                roleProfiles[currentActiveContactId] = prof;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                
                if (boundStickers.length > 0) {
                    msgText = msgText.replace(/\[表情包:(.*?)\]/g, (match, name) => {
                        const sticker = boundStickers.find(s => s.name === name);
                        if (sticker) {
                            return `<img src="${sticker.url}" alt="[表情包:${sticker.name}]" style="max-width:120px; border-radius:8px;">`;
                        }
                        return match;
                    });
                }
                
                let sendImgMatch = msgText.match(/^\[发送图片:(.*?)\]$/);
                if (sendImgMatch) {
                    if (window.handleAIGenerateImage) {
                        window.handleAIGenerateImage(sendImgMatch[1], (imgMsg) => {
                            sendMsg('them', imgMsg);
                        });
                    } else {
                        sendMsg('them', msgText);
                    }
                } else {
                    sendMsg('them', msgText);
                }

                if (index < messagesArray.length - 1) {
                    if (statusEl) statusEl.innerText = '正在输入中...';
                    setTimeout(() => {
                        const currentProf = roleProfiles[currentActiveContactId] || {};
                        if (statusEl) statusEl.innerText = currentProf.lastState || '在线';
                        setTimeout(() => sendNextMessage(index + 1), 500);
                    }, 1000 + Math.random() * 1000);
                } else {
                    const currentProf = roleProfiles[currentActiveContactId] || {};
                    if (statusEl) statusEl.innerText = currentProf.lastState || '在线';
                    chatAiBtn.innerHTML = originalIcon;
                    chatAiBtn.disabled = false;
                }
            };

            if (messagesArray.length > 0) {
                sendNextMessage(0);
            } else {
                chatAiBtn.innerHTML = originalIcon;
                chatAiBtn.disabled = false;
            }

        } catch (error) {
            console.error('API Call Error:', error);
            alert('AI 回复失败: ' + error.message);
            if (statusEl) statusEl.innerText = '在线';
        } finally {
            chatAiBtn.innerHTML = originalIcon;
            chatAiBtn.disabled = false;
        }
    });

    convMsgInput.addEventListener('focus', hideAllDrawers);

    // 头像点击心声 (现在改为放大镜图标触发弹窗)
    const weiboSearchBtn = document.getElementById('weibo-search-btn');
    const innerVoiceModal = document.getElementById('inner-voice-modal');
    const closeInnerVoiceBtn = document.getElementById('close-inner-voice-btn');
    const refreshInnerVoiceBtn = document.getElementById('refresh-inner-voice-btn');
    const innerVoiceText = document.getElementById('inner-voice-text');

    const renderInnerVoice = (text) => {
        if (!text) {
            innerVoiceText.innerHTML = '<div style="text-align:center; color:#888; font-size:13px; padding:20px 0;">未探测到心声，点击下方按钮尝试获取...</div>';
            return;
        }
        
        const parseSection = (label, fullText) => {
            const regex = new RegExp(`\\[${label}:\\s*([^\\]]+)\\]`);
            const match = fullText.match(regex);
            return match ? match[1].trim() : null;
        };

        const physiological = parseSection('生理反应', text);
        const naughty = parseSection('色色想法', text);
        const action = parseSection('行动', text);

        if (physiological || naughty || action) {
            let html = '';
            if (physiological) html += `<div style="background: rgba(255,105,180,0.1); border-left: 3px solid #ff69b4; padding: 10px 15px; border-radius: 8px; font-size: 13px; color: #333; margin-bottom: 10px;"><strong style="color: #ff69b4; display: block; margin-bottom: 4px; font-size: 11px;">Physiological (生理)</strong>${physiological}</div>`;
            if (naughty) html += `<div style="background: rgba(147,112,219,0.1); border-left: 3px solid #9370db; padding: 10px 15px; border-radius: 8px; font-size: 13px; color: #333; margin-bottom: 10px;"><strong style="color: #9370db; display: block; margin-bottom: 4px; font-size: 11px;">Naughty Thoughts (想法)</strong>${naughty}</div>`;
            if (action) html += `<div style="background: rgba(30,144,255,0.1); border-left: 3px solid #1e90ff; padding: 10px 15px; border-radius: 8px; font-size: 13px; color: #333;"><strong style="color: #1e90ff; display: block; margin-bottom: 4px; font-size: 11px;">Action (行动)</strong>${action}</div>`;
            innerVoiceText.innerHTML = html;
        } else {
            innerVoiceText.innerHTML = `<div style="background: rgba(0,0,0,0.03); padding: 15px; border-radius: 12px; font-size: 13px; color: #333; line-height: 1.6;">${text}</div>`;
        }
    };

    if (weiboSearchBtn) {
        weiboSearchBtn.addEventListener('click', () => {
            if (innerVoiceModal && currentActiveContactId) {
                innerVoiceModal.style.display = 'flex';
                let prof = roleProfiles[currentActiveContactId] || {};
                let lastVoice = prof.lastInnerVoice;
                if (!lastVoice) {
                    if (refreshInnerVoiceBtn) refreshInnerVoiceBtn.click();
                } else {
                    renderInnerVoice(lastVoice);
                }
            }
        });
    }

    if (closeInnerVoiceBtn) closeInnerVoiceBtn.addEventListener('click', () => { if (innerVoiceModal) innerVoiceModal.style.display = 'none'; });
    
    if (refreshInnerVoiceBtn) {
        refreshInnerVoiceBtn.addEventListener('click', async () => {
            if (!currentActiveContactId) return;
            const contact = contacts.find(c => c.id === currentActiveContactId);
            if (!contact) return;
            
            const originalText = refreshInnerVoiceBtn.innerText;
            refreshInnerVoiceBtn.innerText = '探测中...';
            refreshInnerVoiceBtn.disabled = true;
            
            const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
            if (!apiData.url || !apiData.key || !apiData.modelName) {
                innerVoiceText.innerText = '请先配置API以获取角色心声...';
                refreshInnerVoiceBtn.innerText = originalText;
                refreshInnerVoiceBtn.disabled = false;
                return;
            }
            
            const sysPrompt = `你扮演角色：${contact.name}。人设：${contact.desc || '无'}。请输出你此刻内心的真实想法。必须严格按照格式输出：[心声:[生理反应: xxx][色色想法: xxx][行动: xxx]]。不要有任何多余的开头结尾。`;
            
            try {
                let url = apiData.url;
                if (url.endsWith('/')) url = url.slice(0, -1);
                if (!url.endsWith('/chat/completions')) url += '/chat/completions';

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiData.key}` },
                    body: JSON.stringify({
                        model: apiData.modelName,
                        messages: [{ role: 'system', content: sysPrompt }]
                    })
                });
                
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const result = await response.json();
                let innerVoice = result.choices[0].message.content;
                let prof = roleProfiles[currentActiveContactId] || {};
                prof.lastInnerVoice = innerVoice;
                roleProfiles[currentActiveContactId] = prof;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                renderInnerVoice(innerVoice);
            } catch (error) {
                console.error(error);
                innerVoiceText.innerText = '探测失败: ' + error.message;
            } finally {
                refreshInnerVoiceBtn.innerText = originalText;
                refreshInnerVoiceBtn.disabled = false;
            }
        });
    }

    // 微博卡片背景与文本持久化
    const uploadConvBg = document.getElementById('upload-conv-bg');
    if (uploadConvBg) {
        uploadConvBg.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            compressImage(file, 1080, 800, 0.7, (dataUrl) => {
                if (dataUrl && currentActiveContactId) {
                    const weiboBgImg = document.getElementById('weibo-bg-img');
                    if (weiboBgImg) weiboBgImg.style.backgroundImage = `url('${dataUrl}')`;
                    let profile = roleProfiles[currentActiveContactId] || {};
                    profile.weiboBg = dataUrl;
                    roleProfiles[currentActiveContactId] = profile;
                    safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                }
            });
        });
    }

    const uploadConvBottomBg = document.getElementById('upload-conv-bottom-bg');
    if (uploadConvBottomBg) {
        uploadConvBottomBg.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            compressImage(file, 1080, 800, 0.7, (dataUrl) => {
                if (dataUrl && currentActiveContactId) {
                    const weiboBottomBgImg = document.getElementById('weibo-bottom-bg-img');
                    if (weiboBottomBgImg) weiboBottomBgImg.style.backgroundImage = `url('${dataUrl}')`;
                    let profile = roleProfiles[currentActiveContactId] || {};
                    profile.weiboBottomBg = dataUrl;
                    roleProfiles[currentActiveContactId] = profile;
                    safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                }
            });
        });
    }

    const weiboStats = document.getElementById('weibo-editable-stats');
    if (weiboStats) {
        weiboStats.addEventListener('blur', () => {
            if (currentActiveContactId) {
                let profile = roleProfiles[currentActiveContactId] || {};
                profile.weiboStats = weiboStats.innerText;
                roleProfiles[currentActiveContactId] = profile;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
            }
        });
    }

    const weiboSig = document.getElementById('weibo-editable-signature');
    if (weiboSig) {
        weiboSig.addEventListener('blur', () => {
            if (currentActiveContactId) {
                let profile = roleProfiles[currentActiveContactId] || {};
                profile.weiboSignature = weiboSig.innerText;
                roleProfiles[currentActiveContactId] = profile;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
            }
        });
    }

    convHeaderAvatar.addEventListener('click', () => {
        innerVoiceBubble.style.display = 'block';
        setTimeout(() => { innerVoiceBubble.style.display = 'none'; }, 2500);
    });

    // 角色详情页逻辑
    convProfileBtn.addEventListener('click', () => {
        if(!currentActiveContactId) return;
        const contact = contacts.find(c => c.id === currentActiveContactId);
        if(!contact) return;
        
        rpAvatarPreview.style.backgroundImage = `url('${contact.avatar || ''}')`;
        rpNameDisplay.innerText = contact.name;
        rpDescDisplay.innerText = `${contact.gender || '未知'} | ${contact.age || '未知'}`;
        const descEl = document.getElementById('rp-contact-desc');
        descEl.value = contact.desc || '';
        
        // 绑定修改监听
        isRoleProfileModified = false;
        descEl.addEventListener('input', markRoleProfileModified);
        rpNameDisplay.addEventListener('input', markRoleProfileModified);
        rpWorldbookSelect.addEventListener('change', markRoleProfileModified);
        rpStickerGroupSelect.addEventListener('change', markRoleProfileModified);
        const rmEl = document.getElementById('rp-reply-min');
        if (rmEl) rmEl.addEventListener('input', markRoleProfileModified);
        const rmxEl = document.getElementById('rp-reply-max');
        if (rmxEl) rmxEl.addEventListener('input', markRoleProfileModified);
        const taEl = document.getElementById('rp-time-aware');
        if (taEl) taEl.addEventListener('change', markRoleProfileModified);
        rpAutoMemory.addEventListener('change', markRoleProfileModified);
        rpMemoryContent.addEventListener('input', markRoleProfileModified);
        rpUserPersona.addEventListener('input', markRoleProfileModified);
        const ccEl = document.getElementById('rp-custom-css');
        if (ccEl) ccEl.addEventListener('input', markRoleProfileModified);
        
        // 渲染表情包分组选项
        rpStickerGroupSelect.innerHTML = '<option value="">不绑定</option>';
        stickerGroups.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.innerText = g.name;
            rpStickerGroupSelect.appendChild(opt);
        });
        
        if (typeof renderWbSelectOptions === 'function') {
            renderWbSelectOptions();
        }

        const profile = roleProfiles[currentActiveContactId] || {};
        rpWorldbookSelect.value = profile.wbId || '';
        rpStickerGroupSelect.value = profile.stickerGroupId || '';
        
        const rmElVal = document.getElementById('rp-reply-min');
        if (rmElVal) rmElVal.value = profile.replyMin || 1;
        const rmxElVal = document.getElementById('rp-reply-max');
        if (rmxElVal) rmxElVal.value = profile.replyMax || 4;
        const taElVal = document.getElementById('rp-time-aware');
        if (taElVal) taElVal.checked = profile.timeAware || false;

        rpAutoMemory.checked = profile.autoMem || false;
        rpMemoryContent.value = profile.memory || '';
        rpUserPersona.value = profile.userPersona || '';
        const ccElVal = document.getElementById('rp-custom-css');
        if (ccElVal) ccElVal.value = profile.customCss || '';
        if (profile.userAvatar) {
            document.getElementById('rp-user-avatar-preview').style.backgroundImage = `url('${profile.userAvatar}')`;
            document.getElementById('rp-user-avatar-preview').innerHTML = '';
        } else {
            document.getElementById('rp-user-avatar-preview').style.backgroundImage = 'none';
            document.getElementById('rp-user-avatar-preview').innerHTML = `<i class='bx bx-camera' style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #999;"></i>`;
        }
        
        roleProfilePage.style.display = 'flex';
    });
    
    // 修改名字备注
    rpNameDisplay.addEventListener('blur', () => {
        if(!currentActiveContactId) return;
        const newName = rpNameDisplay.innerText.trim();
        if(newName) {
            const contactIndex = contacts.findIndex(c => c.id === currentActiveContactId);
            if(contactIndex !== -1) {
                contacts[contactIndex].name = newName;
                localStorage.setItem('chat_contacts', JSON.stringify(contacts));
                convHeaderName.innerText = newName;
                renderContacts();
                renderChatList();
            }
        }
    });
    
    // 用户头像上传
    let tempUserAvatarBase64 = null;
    document.getElementById('upload-user-avatar').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        compressImage(file, 400, 400, 0.8, (dataUrl) => {
            if (!dataUrl) return;
            tempUserAvatarBase64 = dataUrl;
            document.getElementById('rp-user-avatar-preview').style.backgroundImage = `url('${tempUserAvatarBase64}')`;
            document.getElementById('rp-user-avatar-preview').innerHTML = '';
            
            // 自动保存头像
            if(currentActiveContactId) {
                let profile = roleProfiles[currentActiveContactId] || {};
                profile.userAvatar = tempUserAvatarBase64;
                roleProfiles[currentActiveContactId] = profile;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                renderMessages();
            }
        });
    });
    
    // 自定义聊天背景
    document.getElementById('upload-chat-bg').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        compressImage(file, 800, 1400, 0.6, (bgUrl) => {
            if(!bgUrl) return;
            if(currentActiveContactId) {
                let profile = roleProfiles[currentActiveContactId] || {};
                profile.chatBg = bgUrl;
                roleProfiles[currentActiveContactId] = profile;
                safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
                applyChatBackground(bgUrl);
            }
        });
    });
    
    document.getElementById('clear-chat-bg-btn').addEventListener('click', () => {
        if(currentActiveContactId) {
            let profile = roleProfiles[currentActiveContactId] || {};
            profile.chatBg = '';
            roleProfiles[currentActiveContactId] = profile;
            safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
            applyChatBackground('');
        }
    });
    
    function applyChatBackground(bgUrl) {
        if(bgUrl) {
            chatConversationPage.style.backgroundImage = `url('${bgUrl}')`;
            chatConversationPage.style.backgroundSize = 'cover';
            chatConversationPage.style.backgroundPosition = 'center';
            chatConversationPage.classList.add('has-custom-bg');
            document.documentElement.style.setProperty('--chat-bg-color', 'transparent');
        } else {
            chatConversationPage.style.backgroundImage = 'none';
            chatConversationPage.style.backgroundColor = '#f8f9fa';
            chatConversationPage.classList.remove('has-custom-bg');
        }
    }
    
    function applyCustomCss(cssText) {
        let styleTag = document.getElementById('chat-custom-css');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'chat-custom-css';
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = cssText || '';
    }
    
    closeRpBtn.addEventListener('click', () => { 
        if (isRoleProfileModified) {
            if (!confirm('您有未保存的修改，确定要退出吗？')) {
                return;
            }
        }
        roleProfilePage.style.display = 'none'; 
    });
    
    saveRpBtn.addEventListener('click', () => {
        if(!currentActiveContactId) return;

        const contactIndex = contacts.findIndex(c => c.id === currentActiveContactId);
        if (contactIndex !== -1) {
            contacts[contactIndex].desc = document.getElementById('rp-contact-desc').value.trim();
            localStorage.setItem('chat_contacts', JSON.stringify(contacts));
        }

        let profile = roleProfiles[currentActiveContactId] || {};
        profile.wbId = rpWorldbookSelect.value;
        profile.stickerGroupId = rpStickerGroupSelect.value;
        const rmElSave = document.getElementById('rp-reply-min');
        if (rmElSave) profile.replyMin = parseInt(rmElSave.value, 10) || 1;
        const rmxElSave = document.getElementById('rp-reply-max');
        if (rmxElSave) profile.replyMax = parseInt(rmxElSave.value, 10) || 4;
        const taElSave = document.getElementById('rp-time-aware');
        if (taElSave) profile.timeAware = taElSave.checked;
        profile.autoMem = rpAutoMemory.checked;
        profile.memory = rpMemoryContent.value.trim();
        profile.userPersona = rpUserPersona.value.trim();
        const ccElSave = document.getElementById('rp-custom-css');
        if (ccElSave) profile.customCss = ccElSave.value;
        
        roleProfiles[currentActiveContactId] = profile;
        safeSetItem('chat_role_profiles', JSON.stringify(roleProfiles));
        
        applyCustomCss(profile.customCss);
        isRoleProfileModified = false;
        alert('保存成功');
        roleProfilePage.style.display = 'none';
    });

    // 表情包管理页面逻辑
    let isStickerMgrMode = false;
    let selectedStickersForMgr = new Set();
    const batchMgrBtn = document.getElementById('batch-mgr-btn');
    const mgrCancelBtn = document.getElementById('mgr-cancel-btn');
    const mgrMoveSelect = document.getElementById('mgr-move-select');
    const mgrMoveBtn = document.getElementById('mgr-move-btn');
    const mgrDelBtn = document.getElementById('mgr-del-btn');
    const wbContentArea = document.querySelector('#sticker-mgr-page .wb-content-area');

    if (batchMgrBtn) {
        batchMgrBtn.addEventListener('click', () => {
            isStickerMgrMode = true;
            selectedStickersForMgr.clear();
            if (wbContentArea) wbContentArea.classList.add('mgr-mode-active');
            
            // 更新移动分组的下拉列表
            if (mgrMoveSelect) {
                mgrMoveSelect.innerHTML = '<option value="">移动到...</option>';
                stickerGroups.forEach(g => {
                    if (g.id !== currentStickerGroupId) {
                        const opt = document.createElement('option');
                        opt.value = g.id;
                        opt.innerText = g.name;
                        mgrMoveSelect.appendChild(opt);
                    }
                });
            }
        });
    }

    if (mgrCancelBtn) {
        mgrCancelBtn.addEventListener('click', () => {
            isStickerMgrMode = false;
            selectedStickersForMgr.clear();
            if (wbContentArea) wbContentArea.classList.remove('mgr-mode-active');
            renderStickerMgrGrid(); // 重新渲染取消选中状态
        });
    }

    if (mgrDelBtn) {
        mgrDelBtn.addEventListener('click', () => {
            if (selectedStickersForMgr.size === 0) return;
            if (!confirm(`确定要删除选中的 ${selectedStickersForMgr.size} 个表情包吗？`)) return;
            
            const group = stickerGroups.find(g => g.id === currentStickerGroupId);
            if (group) {
                // filter out the selected indices
                group.stickers = group.stickers.filter((_, idx) => !selectedStickersForMgr.has(idx));
                safeSetItem('chat_sticker_groups', JSON.stringify(stickerGroups));
                
                isStickerMgrMode = false;
                selectedStickersForMgr.clear();
                if (wbContentArea) wbContentArea.classList.remove('mgr-mode-active');
                renderStickerMgrGrid();
            }
        });
    }

    if (mgrMoveBtn) {
        mgrMoveBtn.addEventListener('click', () => {
            if (selectedStickersForMgr.size === 0) return;
            const targetGroupId = mgrMoveSelect.value;
            if (!targetGroupId) { alert('请先选择要移动到的目标分组'); return; }
            
            const sourceGroup = stickerGroups.find(g => g.id === currentStickerGroupId);
            const targetGroup = stickerGroups.find(g => g.id === targetGroupId);
            
            if (sourceGroup && targetGroup) {
                const stickersToMove = sourceGroup.stickers.filter((_, idx) => selectedStickersForMgr.has(idx));
                targetGroup.stickers.push(...stickersToMove);
                sourceGroup.stickers = sourceGroup.stickers.filter((_, idx) => !selectedStickersForMgr.has(idx));
                
                safeSetItem('chat_sticker_groups', JSON.stringify(stickerGroups));
                
                isStickerMgrMode = false;
                selectedStickersForMgr.clear();
                if (wbContentArea) wbContentArea.classList.remove('mgr-mode-active');
                renderStickerMgrGrid();
                alert(`成功将 ${stickersToMove.length} 个表情移动到 "${targetGroup.name}" 分组`);
            }
        });
    }

    drawerBtnStickers.addEventListener('click', () => {
        hideAllDrawers();
        isStickerMgrMode = false;
        if (wbContentArea) wbContentArea.classList.remove('mgr-mode-active');
        renderStickerMgrTabs();
        stickerMgrPage.style.display = 'flex';
    });

    closeStickerMgrBtn.addEventListener('click', () => {
        stickerMgrPage.style.display = 'none';
    });

    createStickerGroupBtn.addEventListener('click', () => {
        const name = prompt('请输入表情包分组名称:');
        if(name && name.trim()) {
            const newGroup = { id: 'sg_' + Date.now(), name: name.trim(), stickers: [] };
            stickerGroups.push(newGroup);
            safeSetItem('chat_sticker_groups', JSON.stringify(stickerGroups));
            currentStickerGroupId = newGroup.id;
            renderStickerMgrTabs();
        }
    });

    const uploadStickerTxt = document.getElementById('upload-sticker-txt');
    importStickerTxtBtn.addEventListener('click', () => {
        if (!currentStickerGroupId) {
            alert('请先创建或选择一个分组');
            return;
        }
        if (uploadStickerTxt) uploadStickerTxt.click();
    });

    if (uploadStickerTxt) {
        uploadStickerTxt.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const group = stickerGroups.find(g => g.id === currentStickerGroupId);
                if(!group) return;

                const lines = text.split('\n');
                let added = 0;
                lines.forEach(line => {
                    line = line.trim();
                    if(!line) return;
                    
                    const httpIndex = line.indexOf('http');
                    if (httpIndex !== -1) {
                        let name = line.substring(0, httpIndex).trim();
                        name = name.replace(/[:：\s]+$/, '');
                        const url = line.substring(httpIndex).trim();
                        
                        if (url.startsWith('http')) {
                            if (!name) name = '表情' + (group.stickers.length + added + 1);
                            group.stickers.push({ name, url });
                            added++;
                        }
                    }
                });
                
                if(added > 0) {
                    safeSetItem('chat_sticker_groups', JSON.stringify(stickerGroups));
                    renderStickerMgrGrid();
                    alert(`成功导入 ${added} 个表情包！`);
                } else {
                    alert('未能解析到符合格式的数据。确保TXT每行包含 http 或 https 链接。');
                }
                e.target.value = '';
            };
            reader.readAsText(file);
        });
    }

    function renderStickerMgrTabs() {
        stickerMgrTabs.innerHTML = '';
        if(stickerGroups.length === 0) {
            stickerMgrGrid.innerHTML = '';
            stickerMgrEmpty.style.display = 'flex';
            addStickersBtn.style.display = 'none';
            return;
        }
        
        if(!currentStickerGroupId && stickerGroups.length > 0) {
            currentStickerGroupId = stickerGroups[0].id;
        }

        stickerGroups.forEach(group => {
            const tab = document.createElement('div');
            tab.className = `sticker-tab ${group.id === currentStickerGroupId ? 'active' : ''}`;
            tab.innerText = group.name;
            tab.addEventListener('click', () => {
                currentStickerGroupId = group.id;
                renderStickerMgrTabs();
            });
            stickerMgrTabs.appendChild(tab);
        });
        
        renderStickerMgrGrid();
    }

    function renderStickerMgrGrid() {
        stickerMgrGrid.innerHTML = '';
        const group = stickerGroups.find(g => g.id === currentStickerGroupId);
        
        if(!group) return;
        
        if (addStickersBtn) addStickersBtn.style.display = 'block';
        if (batchMgrBtn) batchMgrBtn.style.display = group.stickers.length > 0 ? 'block' : 'none';
        
        if(group.stickers.length === 0) {
            stickerMgrEmpty.style.display = 'flex';
        } else {
            stickerMgrEmpty.style.display = 'none';
            group.stickers.forEach((s, idx) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'sticker-item-wrapper';
                
                const img = document.createElement('div');
                img.className = 'sticker-img';
                img.style.backgroundImage = `url('${s.url}')`;
                img.title = s.name;
                
                const checkbox = document.createElement('div');
                checkbox.className = 'sticker-checkbox';
                if (selectedStickersForMgr.has(idx)) {
                    checkbox.classList.add('checked');
                    wrapper.classList.add('selected');
                }

                wrapper.appendChild(img);
                wrapper.appendChild(checkbox);

                wrapper.addEventListener('click', () => {
                    if (isStickerMgrMode) {
                        if (selectedStickersForMgr.has(idx)) {
                            selectedStickersForMgr.delete(idx);
                            checkbox.classList.remove('checked');
                            wrapper.classList.remove('selected');
                        } else {
                            selectedStickersForMgr.add(idx);
                            checkbox.classList.add('checked');
                            wrapper.classList.add('selected');
                        }
                    } else {
                        // 在非管理模式下点击图片可以进行其他操作(如果需要的话)，当前为了避免误触可以不做任何事，或者可以单张删除
                    }
                });
                
                stickerMgrGrid.appendChild(wrapper);
            });
        }
    }

    addStickersBtn.addEventListener('click', () => {
        const text = prompt('请粘贴表情包文本 (支持智能识别, 每行一个):');
        if(!text) return;
        
        const group = stickerGroups.find(g => g.id === currentStickerGroupId);
        if(!group) return;

        const lines = text.split('\n');
        let added = 0;
        lines.forEach(line => {
            line = line.trim();
            if(!line) return;
            
            const httpIndex = line.indexOf('http');
            if (httpIndex !== -1) {
                let name = line.substring(0, httpIndex).trim();
                // 剔除末尾的中英文冒号或多余空格
                name = name.replace(/[:：\s]+$/, '');
                
                const url = line.substring(httpIndex).trim();
                
                if (url.startsWith('http')) {
                    if (!name) name = '表情' + (group.stickers.length + added + 1);
                    group.stickers.push({ name, url });
                    added++;
                }
            }
        });
        
        if(added > 0) {
            safeSetItem('chat_sticker_groups', JSON.stringify(stickerGroups));
            renderStickerMgrGrid();
            alert(`成功导入 ${added} 个表情包！`);
        } else {
            alert('未能解析到符合格式的数据。确保每行包含 http 或 https 链接。');
        }
    });

    // 聊天底部的表情包抽屉渲染
    function renderChatStickerDrawer() {
        stickerDrawerTabs.innerHTML = '';
        stickerDrawerGrid.innerHTML = '';
        
        if(stickerGroups.length === 0) {
            stickerDrawerGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#888; margin-top:20px;">暂无表情包，请点击左下角+号进入管理添加</div>';
            return;
        }

        let activeGroupId = stickerGroups[0].id;

        const renderGrid = (groupId) => {
            stickerDrawerGrid.innerHTML = '';
            const g = stickerGroups.find(x => x.id === groupId);
            if(!g || g.stickers.length === 0) return;
            g.stickers.forEach(s => {
                const img = document.createElement('div');
                img.className = 'sticker-img';
                img.style.backgroundImage = `url('${s.url}')`;
                img.addEventListener('click', () => {
                    // 发送带有 alt 标签的 img 标签，方便AI识别
                    sendMsg('me', `<img src="${s.url}" alt="[表情包:${s.name}]" style="max-width:120px; border-radius:8px;">`);
                    hideAllDrawers();
                });
                stickerDrawerGrid.appendChild(img);
            });
        };

        stickerGroups.forEach((group, index) => {
            const tab = document.createElement('div');
            tab.className = `sticker-tab ${index === 0 ? 'active' : ''}`;
            tab.innerText = group.name;
            tab.addEventListener('click', () => {
                Array.from(stickerDrawerTabs.children).forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderGrid(group.id);
            });
            stickerDrawerTabs.appendChild(tab);
        });

        renderGrid(activeGroupId);
    }

    // 设置与世界书相关元素
    const settingsBtn = document.getElementById('nav-item-2');
    const settingsPage = document.getElementById('settings-page');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    
    const navApiSettings = document.getElementById('nav-api-settings');
    const apiSettingsPage = document.getElementById('api-settings-page');
    const closeApiSettingsBtn = document.getElementById('close-api-settings-btn');
    const saveApiBtn = document.getElementById('save-api-btn');
    
    const worldBookBtn = document.getElementById('app-item-2');
    const worldBookPage = document.getElementById('worldbook-page');
    const closeWbBtn = document.getElementById('close-wb-btn');
    const wbNavBtns = document.querySelectorAll('.wb-nav-btn');
    const wbGlobalGrid = document.getElementById('wb-global-grid');
    const wbLocalGrid = document.getElementById('wb-local-grid');
    const wbHeaderTitle = document.getElementById('wb-header-title');
    
    const wbAddModal = document.getElementById('wb-add-modal');
    const wbAddContentBtn = document.getElementById('wb-add-content-btn');
    const closeWbAddBtn = document.getElementById('close-wb-add-btn');
    
    // API设置相关元素
    const fetchModelsBtn = document.getElementById('fetch-models-btn');
    const modelSelectGroup = document.getElementById('model-select-group');
    const apiModelSelect = document.getElementById('api-model-select');
    const apiModelNameInput = document.getElementById('api-model-name');

    const apiPresetSelect = document.getElementById('api-preset-select');
    const apiSavePresetBtn = document.getElementById('api-save-preset-btn');
    const apiDelPresetBtn = document.getElementById('api-del-preset-btn');

    // 初始化API设置数据
    const loadApiSettings = () => {
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        
        renderApiPresets(apiData);

        apiModelNameInput.value = apiData.modelName || '';
        document.getElementById('api-url').value = apiData.url || '';
        document.getElementById('api-key').value = apiData.key || '';
        
        if (apiData.fetchedModels && apiData.fetchedModels.length > 0) {
            populateModelSelect(apiData.fetchedModels);
            apiModelSelect.value = apiData.selectedModel || '';
            modelSelectGroup.style.display = 'flex';
        }
    };

    function renderApiPresets(apiData) {
        apiPresetSelect.innerHTML = '<option value="">默认预设</option>';
        if (apiData.presets) {
            Object.keys(apiData.presets).forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.innerText = name;
                apiPresetSelect.appendChild(opt);
            });
        }
        apiPresetSelect.value = apiData.currentPreset || '';
    }

    apiPresetSelect.addEventListener('change', (e) => {
        const name = e.target.value;
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (name && apiData.presets && apiData.presets[name]) {
            const p = apiData.presets[name];
            document.getElementById('api-url').value = p.url || '';
            document.getElementById('api-key').value = p.key || '';
            apiModelNameInput.value = p.modelName || '';
            apiModelSelect.value = p.selectedModel || '';
        } else {
            document.getElementById('api-url').value = '';
            document.getElementById('api-key').value = '';
            apiModelNameInput.value = '';
            apiModelSelect.value = '';
        }
        apiData.currentPreset = name;
        localStorage.setItem('api_settings', JSON.stringify(apiData));
    });

    apiSavePresetBtn.addEventListener('click', () => {
        const name = prompt('请输入预设名称:');
        if (!name || !name.trim()) return;
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (!apiData.presets) apiData.presets = {};
        
        let finalModel = apiModelNameInput.value.trim();
        if(!finalModel && apiModelSelect.value) finalModel = apiModelSelect.value;

        apiData.presets[name.trim()] = {
            url: document.getElementById('api-url').value.trim(),
            key: document.getElementById('api-key').value.trim(),
            modelName: finalModel,
            selectedModel: apiModelSelect.value
        };
        apiData.currentPreset = name.trim();
        localStorage.setItem('api_settings', JSON.stringify(apiData));
        renderApiPresets(apiData);
        alert('预设保存成功');
    });

    apiDelPresetBtn.addEventListener('click', () => {
        const name = apiPresetSelect.value;
        if (!name) return;
        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (apiData.presets && apiData.presets[name]) {
            delete apiData.presets[name];
            apiData.currentPreset = '';
            localStorage.setItem('api_settings', JSON.stringify(apiData));
            renderApiPresets(apiData);
        }
    });


    function populateModelSelect(models) {
        apiModelSelect.innerHTML = '<option value="">请选择模型...</option>';
        models.forEach(model => {
            const opt = document.createElement('option');
            opt.value = model.id;
            opt.textContent = model.id;
            apiModelSelect.appendChild(opt);
        });
        modelSelectGroup.style.display = 'flex';
    }

    fetchModelsBtn.addEventListener('click', async () => {
        let url = document.getElementById('api-url').value.trim();
        const key = document.getElementById('api-key').value.trim();
        
        if (!url || !key) {
            alert('请先填写URL和API秘钥');
            return;
        }

        // 规范化URL
        if (url.endsWith('/')) url = url.slice(0, -1);
        if (!url.endsWith('/v1')) url += '/v1';
        const modelsUrl = `${url}/models`;

        const originalHtml = fetchModelsBtn.innerHTML;
        fetchModelsBtn.innerHTML = `<i class='bx bx-loader-alt spin'></i><span>拉取中...</span>`;
        fetchModelsBtn.disabled = true;

        try {
            const response = await fetch(modelsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                // Read response text for NAI specific errors
                const errText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
            }
            
            const data = await response.json();
            if (data && data.data && Array.isArray(data.data)) {
                populateModelSelect(data.data);
                // 自动选择第一个
                if(data.data.length > 0) apiModelSelect.value = data.data[0].id;
                
                // 暂时保存拉取到的列表到本地存储，以便重新打开时还能看到
                const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
                apiData.fetchedModels = data.data;
                localStorage.setItem('api_settings', JSON.stringify(apiData));
            } else {
                throw new Error('返回数据格式不正确');
            }
        } catch (error) {
            console.error('Fetch models error:', error);
            alert('拉取模型失败，请检查URL、秘钥或网络连接。\n错误信息: ' + error.message);
        } finally {
            fetchModelsBtn.innerHTML = originalHtml;
            fetchModelsBtn.disabled = false;
        }
    });

    apiModelSelect.addEventListener('change', () => {
        // 当选择了下拉框的模型时，同步到名称输入框
        if(apiModelSelect.value) {
            apiModelNameInput.value = apiModelSelect.value;
        }
    });

    // 设置页面路由逻辑
    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homePage.style.display = 'none';
        settingsPage.style.display = 'flex';
    });
    closeSettingsBtn.addEventListener('click', () => {
        settingsPage.style.display = 'none';
        homePage.style.display = 'flex';
    });

    // API设置页面逻辑
    navApiSettings.addEventListener('click', () => {
        loadApiSettings();
        apiSettingsPage.style.display = 'flex';
    });
    closeApiSettingsBtn.addEventListener('click', () => {
        apiSettingsPage.style.display = 'none';
    });
    saveApiBtn.addEventListener('click', () => {
        // 优先使用手动输入的模型名称，如果没有，则使用下拉框选中的
        let finalModel = apiModelNameInput.value.trim();
        if(!finalModel && apiModelSelect.value) {
            finalModel = apiModelSelect.value;
        }

        const currentData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        const apiData = {
            ...currentData,
            modelName: finalModel,
            selectedModel: apiModelSelect.value,
            url: document.getElementById('api-url').value.trim(),
            key: document.getElementById('api-key').value.trim(),
            currentPreset: apiPresetSelect.value
        };
        localStorage.setItem('api_settings', JSON.stringify(apiData));
        apiSettingsPage.style.display = 'none';
        // 不弹出原生alert，静默保存符合韩系高级感
    });

    // 世界书页面逻辑
    let currentFolderId = null; // 当前打开的文件夹ID，null表示根目录

    worldBookBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homePage.style.display = 'none';
        worldBookPage.style.display = 'flex';
        currentFolderId = null;
        renderWorldBooks();
    });
    closeWbBtn.addEventListener('click', () => {
        worldBookPage.style.display = 'none';
        homePage.style.display = 'flex';
        currentFolderId = null;
    });

    // 创建文件夹按钮逻辑
    const wbCreateFolderBtn = document.getElementById('wb-create-folder-btn');
    if (wbCreateFolderBtn) {
        wbCreateFolderBtn.addEventListener('click', () => {
            if (currentFolderId) {
                alert('暂时不支持在文件夹内嵌套创建文件夹');
                return;
            }
            const folderName = prompt('请输入文件夹名称:');
            if (folderName && folderName.trim()) {
                const isGlobal = document.querySelector('.wb-nav-btn[data-target="global"]').classList.contains('active');
                const targetList = isGlobal ? worldBooks.global : worldBooks.local;
                targetList.push({
                    id: 'wb_folder_' + Date.now(),
                    title: folderName.trim(),
                    type: 'folder'
                });
                safeSetItem('chat_worldbooks', JSON.stringify(worldBooks));
                renderWorldBooks();
                if (typeof renderWbSelectOptions === 'function') renderWbSelectOptions();
            }
        });
    }

    const wbBreadcrumb = document.getElementById('wb-breadcrumb');
    const wbBackFolderBtn = document.getElementById('wb-back-folder-btn');
    const wbCurrentFolderName = document.getElementById('wb-current-folder-name');

    if (wbBackFolderBtn) {
        wbBackFolderBtn.addEventListener('click', () => {
            currentFolderId = null;
            renderWorldBooks();
        });
    }

    wbNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            wbNavBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFolderId = null; // 切换全局/局部时重置到根目录
            const target = btn.dataset.target;
            if(target === 'global') {
                wbGlobalGrid.style.display = 'grid';
                wbLocalGrid.style.display = 'none';
                wbHeaderTitle.innerText = '全局';
            } else {
                wbGlobalGrid.style.display = 'none';
                wbLocalGrid.style.display = 'grid';
                wbHeaderTitle.innerText = '局部';
            }
            renderWorldBooks();
        });
    });

    function renderWorldBooks() {
        wbGlobalGrid.innerHTML = '';
        wbLocalGrid.innerHTML = '';
        const isGlobal = document.querySelector('.wb-nav-btn[data-target="global"]').classList.contains('active');
        const listToRender = isGlobal ? worldBooks.global : worldBooks.local;
        const targetGrid = isGlobal ? wbGlobalGrid : wbLocalGrid;
        
        let displayList = [];
        if (currentFolderId) {
            displayList = listToRender.filter(wb => wb.parentId === currentFolderId && wb.type === 'item');
            const currentFolder = listToRender.find(wb => wb.id === currentFolderId);
            if (wbBreadcrumb) {
                wbBreadcrumb.style.display = 'flex';
                if (wbCurrentFolderName) wbCurrentFolderName.innerText = currentFolder ? currentFolder.title : '未知文件夹';
            }
        } else {
            displayList = listToRender.filter(wb => !wb.parentId);
            if (wbBreadcrumb) wbBreadcrumb.style.display = 'none';
        }

        if (displayList.length === 0) {
            targetGrid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; color: #aaa; margin-top: 50px;">
                <i class='bx ${currentFolderId ? 'bx-folder-open' : (isGlobal ? 'bx-book-open' : 'bx-book-bookmark')}' style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>${currentFolderId ? '文件夹为空' : (isGlobal ? '暂无全局世界书内容' : '暂无局部世界书内容')}</p>
            </div>`;
        } else {
            displayList.forEach(wb => {
                const el = document.createElement('div');
                el.className = 'wb-folder-item';
                
                if (wb.type === 'folder') {
                    el.innerHTML = `<i class='bx bxs-folder wb-folder-icon'></i><div class="wb-item-title">${wb.title}</div>`;
                    el.addEventListener('click', () => {
                        currentFolderId = wb.id;
                        renderWorldBooks();
                    });
                } else {
                    el.innerHTML = `<i class='bx bx-file wb-folder-icon' style="color:#d4d4d4;"></i><div class="wb-item-title">${wb.title}</div>`;
                    // 点击条目查看/编辑功能可以这里扩展
                }
                targetGrid.appendChild(el);
            });
        }
    }

    function renderWbSelectOptions() {
        const rpWorldbookSelect = document.getElementById('rp-worldbook-select');
        if (!rpWorldbookSelect) return;
        const currentVal = rpWorldbookSelect.value;
        rpWorldbookSelect.innerHTML = '<option value="">不绑定</option>';
        
        // 绑定的选项只显示 folder 和 item，通常支持绑定整个folder
        const allWbs = worldBooks.global.concat(worldBooks.local);
        
        const folders = allWbs.filter(wb => wb.type === 'folder');
        if (folders.length > 0) {
            const group = document.createElement('optgroup');
            group.label = '文件夹 (绑定该文件夹下所有内容)';
            folders.forEach(wb => {
                const opt = document.createElement('option');
                opt.value = wb.id;
                opt.innerText = `📁 ${wb.title}`;
                group.appendChild(opt);
            });
            rpWorldbookSelect.appendChild(group);
        }

        const items = allWbs.filter(wb => wb.type === 'item');
        if (items.length > 0) {
            const group = document.createElement('optgroup');
            group.label = '单独条目';
            items.forEach(wb => {
                const prefix = wb.parentId ? '📄 ' : '📄 [根目录] ';
                const opt = document.createElement('option');
                opt.value = wb.id;
                opt.innerText = `${prefix}${wb.title}`;
                group.appendChild(opt);
            });
            rpWorldbookSelect.appendChild(group);
        }

        rpWorldbookSelect.value = currentVal;
    }

    // 填充添加内容弹窗中的文件夹选择
    function updateAddModalFolderSelect() {
        const wbFolderSelect = document.getElementById('wb-folder-select');
        if (!wbFolderSelect) return;
        wbFolderSelect.innerHTML = '<option value="">根目录 (无文件夹)</option>';
        const isGlobal = document.querySelector('.wb-nav-btn[data-target="global"]').classList.contains('active');
        const listToRender = isGlobal ? worldBooks.global : worldBooks.local;
        
        const folders = listToRender.filter(wb => wb.type === 'folder');
        folders.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.innerText = f.title;
            wbFolderSelect.appendChild(opt);
        });
        
        // 默认选中当前正在浏览的文件夹
        if (currentFolderId) {
            wbFolderSelect.value = currentFolderId;
        }
    }

    wbAddContentBtn.addEventListener('click', () => {
        document.getElementById('wb-input-title').value = '';
        document.getElementById('wb-input-content').value = '';
        updateAddModalFolderSelect();
        wbAddModal.style.display = 'flex';
    });
    closeWbAddBtn.addEventListener('click', () => {
        wbAddModal.style.display = 'none';
    });
    document.getElementById('save-wb-btn').addEventListener('click', () => {
        const title = document.getElementById('wb-input-title').value.trim();
        const content = document.getElementById('wb-input-content').value.trim();
        const folderSelect = document.getElementById('wb-folder-select');
        const parentId = folderSelect ? folderSelect.value : '';

        if (!title || !content) {
            alert('标题和内容不能为空');
            return;
        }
        
        const isGlobal = document.querySelector('.wb-nav-btn[data-target="global"]').classList.contains('active');
        const targetList = isGlobal ? worldBooks.global : worldBooks.local;
        
        const newItem = {
            id: 'wb_' + Date.now(),
            title: title,
            content: content,
            type: 'item'
        };

        if (parentId) {
            newItem.parentId = parentId;
        }
        
        targetList.push(newItem);
        
        safeSetItem('chat_worldbooks', JSON.stringify(worldBooks));
        renderWorldBooks();
        if (typeof renderWbSelectOptions === 'function') renderWbSelectOptions();
        wbAddModal.style.display = 'none';
    });

    // 渲染联系人列表
    function renderContacts() {
        const container = document.getElementById('contact-list-container');
        const emptyState = document.getElementById('contacts-empty');
        container.innerHTML = '';
        
        if (contacts.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            contacts.forEach(contact => {
                const item = document.createElement('div');
                item.className = 'contact-item';
                item.innerHTML = `
                    <div class="contact-item-avatar" style="background-image: url('${contact.avatar || ''}')"></div>
                    <div class="contact-item-info">
                        <div class="contact-item-name">${contact.name || '未命名'}</div>
                    </div>
                `;
                item.addEventListener('click', () => {
                    openEditContactPage(contact);
                });
                container.appendChild(item);
            });
        }
    }

    function openEditContactPage(contact) {
        editingContactId = contact.id;
        document.getElementById('contact-input-name').value = contact.name || '';
        document.getElementById('contact-input-gender').value = contact.gender || '';
        document.getElementById('contact-input-age').value = contact.age || '';
        document.getElementById('contact-input-opening').value = contact.opening || '';
        document.getElementById('contact-input-desc').value = contact.desc || '';
        currentContactAvatarBase64 = contact.avatar || '';
        if (currentContactAvatarBase64) {
            contactAvatarPreview.style.backgroundImage = `url('${currentContactAvatarBase64}')`;
            contactAvatarPreview.classList.add('has-photo');
        } else {
            contactAvatarPreview.style.backgroundImage = 'none';
            contactAvatarPreview.classList.remove('has-photo');
        }
        addContactPage.style.display = 'flex';
        document.querySelector('.add-contact-header h2').innerText = '编辑人设';
    }

    // 渲染聊天列表
    function renderChatList() {
        const container = document.getElementById('chat-list-container');
        const emptyState = document.getElementById('messages-empty');
        container.innerHTML = '';
        
        if (chatList.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            chatList.forEach(chat => {
                const contact = contacts.find(c => c.id === chat.contactId);
                if(!contact) return;
                const item = document.createElement('div');
                item.className = 'contact-item';
                item.innerHTML = `
                    <div class="contact-item-avatar" style="background-image: url('${contact.avatar || ''}')"></div>
                    <div class="contact-item-info">
                        <div class="contact-item-name">${contact.name || '未命名'}</div>
                        <div style="font-size:12px; color:#888; margin-top:4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${contact.opening || ''}</div>
                    </div>
                `;
                item.addEventListener('click', () => openConversation(contact));
                container.appendChild(item);
            });
        }
    }

    // 渲染选择联系人列表
    // 打开聊天对话页面
    function openConversation(contact) {
        currentActiveContactId = contact.id;
        
        // 渲染仿微博头部信息
        const weiboAvatar = document.getElementById('weibo-avatar-img');
        if (weiboAvatar) weiboAvatar.style.backgroundImage = `url('${contact.avatar || ''}')`;
        
        const weiboName = document.getElementById('weibo-name');
        if (weiboName) weiboName.innerText = contact.name || '未命名';
        
        const weiboStatus = document.getElementById('weibo-status');
        const profile = roleProfiles[contact.id] || {};
        if (weiboStatus) weiboStatus.innerText = profile.lastState || '在线';
        
        // 恢复微博卡片个性化设置
        const weiboBgImg = document.getElementById('weibo-bg-img');
        if (weiboBgImg) {
            weiboBgImg.style.backgroundImage = profile.weiboBg ? `url('${profile.weiboBg}')` : 'none';
        }

        const weiboBottomBgImg = document.getElementById('weibo-bottom-bg-img');
        if (weiboBottomBgImg) {
            weiboBottomBgImg.style.backgroundImage = profile.weiboBottomBg ? `url('${profile.weiboBottomBg}')` : 'none';
        }

        const weiboStats = document.getElementById('weibo-editable-stats');
        if (weiboStats) {
            weiboStats.innerText = profile.weiboStats || '10 粉丝    31 关注';
        }

        const weiboSig = document.getElementById('weibo-editable-signature');
        if (weiboSig) {
            weiboSig.innerText = profile.weiboSignature || '像未拆封的时差礼物';
        }
        
        // 初始化学人设对话 (如果没有记录，把开场白作为第一条消息)
        if (!messagesData[contact.id]) {
            messagesData[contact.id] = [];
            if (contact.opening) {
                messagesData[contact.id].push({
                    sender: 'them',
                    text: contact.opening,
                    time: Date.now()
                });
                localStorage.setItem('chat_messages', JSON.stringify(messagesData));
            }
        }
        
        applyChatBackground(profile.chatBg || '');
        applyCustomCss(profile.customCss || '');

        renderMessages();
        chatConversationPage.style.display = 'flex';
        // 滚动到底部
        setTimeout(() => { convMessagesContainer.scrollTop = convMessagesContainer.scrollHeight; }, 50);
    }

    // 渲染对话消息
    function renderMessages() {
        if (!currentActiveContactId) return;
        const msgs = messagesData[currentActiveContactId] || [];
        const contact = contacts.find(c => c.id === currentActiveContactId);
        const profile = roleProfiles[currentActiveContactId] || {};
        const avatarUrl = contact ? (contact.avatar || '') : '';
        const userAvatarUrl = profile.userAvatar || '';
        
        convMessagesContainer.innerHTML = '';
        
        // 默认用户头像 Base64 或占位
        const defaultUserAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fff"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

        for (let i = 0; i < msgs.length; i++) {
            const msg = msgs[i];
            const isMe = msg.sender === 'me';
            
            // 撤回的消息
            if (msg.recalled) {
                const row = document.createElement('div');
                row.className = 'msg-recalled';
                row.innerText = isMe ? '你撤回了一条消息' : `"${contact.name || '对方'}" 撤回了一条消息`;
                convMessagesContainer.appendChild(row);
                continue;
            }
            
            // 判断是否是连续发消息
            let isPrevSame = false;
            if (i > 0) {
                let prev = msgs[i-1];
                if (!prev.recalled && prev.sender === msg.sender) isPrevSame = true;
            }
            let isNextSame = false;
            if (i < msgs.length - 1) {
                let next = msgs[i+1];
                if (!next.recalled && next.sender === msg.sender) isNextSame = true;
            }
            
            const row = document.createElement('div');
            row.className = `msg-row ${isMe ? 'sent' : 'received'}`;
            
            // 连续消息处理：不是最后一条则隐藏尾巴
            if (isNextSame) row.classList.add('hide-tail');
            // 连续消息处理：不是第一条则隐藏头像
            if (isPrevSame) row.classList.add('hide-avatar');

            let quoteHtml = '';
            if (msg.quote) {
                quoteHtml = `<div class="msg-quote">${msg.quote}</div>`;
            }

            let checkboxHtml = `<div class="msg-checkbox ${selectedMsgIndices.has(i) ? 'checked' : ''}" data-index="${i}"></div>`;
            
            let finalUserAvatar = userAvatarUrl || defaultUserAvatar;
            let avatarDisplayUrl = isMe ? finalUserAvatar : avatarUrl;

            let innerHtml = '';
            
            // 解析转账
            let transferMatch = msg.text.match(/^\[转账:([^\]:]+)(?::([^\]]+))?\]$/);
            let textImgMatch = msg.text.match(/^\[文字图:([\s\S]*?)\]$/);
            let giftMatch = msg.text.match(/^\[送礼:([^:]+):(\d+):([\s\S]+)\]$/); // [送礼:鲜花:1:base64]
            let isTransfer = false;
            let isVoice = false;
            let isTextImg = false;
            let isGift = false;
            
            if (transferMatch) {
                isTransfer = true;
                let amount = transferMatch[1];
                let note = transferMatch[2] || '';
                let txStatus = msg.txStatus || 'PENDING'; // PENDING, ACCEPTED, REJECTED
                
                let actionsHtml = '';
                let statusText = isMe ? '等待对方收款' : '等待你收款';
                
                if (txStatus === 'PENDING') {
                    if (!isMe) {
                        actionsHtml = `
                            <div class="ptc-actions">
                                <button class="ptc-btn reject" onclick="handleTransfer(${i}, 'REJECTED'); event.stopPropagation();">Reject</button>
                                <button class="ptc-btn accept" onclick="handleTransfer(${i}, 'ACCEPTED'); event.stopPropagation();">Accept</button>
                            </div>
                        `;
                    }
                } else if (txStatus === 'ACCEPTED') {
                    statusText = '已收款';
                } else if (txStatus === 'REJECTED') {
                    statusText = '已退回';
                }

                innerHtml = `
                    <div class="ptc-card" data-index="${i}">
                        <div class="ptc-header">
                            <i class='bx ${txStatus === 'ACCEPTED' ? 'bx-check-circle' : (txStatus === 'REJECTED' ? 'bx-x-circle' : 'bx-lock-alt')}'></i>
                            <span>${txStatus === 'ACCEPTED' ? 'COMPLETED' : (txStatus === 'REJECTED' ? 'REJECTED' : 'SECURE TRANSFER')}</span>
                        </div>
                        <div class="ptc-body">
                            <div class="ptc-amount">¥${amount}</div>
                            <div class="ptc-status">${statusText}</div>
                            ${note ? `<div class="ptc-note">"${note}"</div>` : ''}
                        </div>
                        ${actionsHtml}
                    </div>
                `;
            } else if (textImgMatch) {
                isTextImg = true;
                let content = textImgMatch[1].replace(/</g, '<').replace(/>/g, '>').replace(/\n/g, '<br>');
                
                innerHtml = `
                    <div class="textimg-msg-container" onclick="this.classList.toggle('revealed')">
                        <div class="msg-bubble textimg-real-content" data-index="${i}" style="min-width: 200px; min-height: 200px; padding-top: 20px;">${content}</div>
                        <div class="text-image-sim textimg-sim-cover">
                            <i class='bx bx-lock-alt' style="font-size: 32px; color: #fff; margin-bottom: 10px;"></i>
                            <span style="font-family: monospace; font-size: 14px; color: #aaa; letter-spacing: 1px;">ENCRYPTED MESSAGE</span>
                        </div>
                    </div>
                `;
            } else if (giftMatch) {
                isGift = true;
                let giftName = giftMatch[1];
                let giftPrice = giftMatch[2];
                let giftImgUrl = giftMatch[3];
                innerHtml = `
                    <div class="gift-msg-card" data-index="${i}">
                        <div class="gift-msg-icon" style="background-image: url('${giftImgUrl}')"></div>
                        <div class="gift-msg-text">送出了 ${giftName}</div>
                    </div>
                `;
            } else {
                // 解析语音
                let voiceMatch = msg.text.match(/^\[语音:(.*?):(.*?)\]$/);
                if (voiceMatch) {
                    isVoice = true;
                    let text = voiceMatch[1];
                    let duration = parseInt(voiceMatch[2]) || 1;
                    let minW = 70;
                    let maxW = 220;
                    let calculatedWidth = Math.min(maxW, minW + (duration * 6));
                    
                    innerHtml = `
                        <div class="voice-bubble" style="width: ${calculatedWidth}px;" onclick="toggleVoiceText(this); event.stopPropagation();">
                            <i class='bx bx-wifi voice-icon'></i>
                            <span>${duration}"</span>
                        </div>
                        <div class="voice-text-result">${text}</div>
                    `;
                } else {
                    innerHtml = `<div class="msg-bubble" data-index="${i}">${quoteHtml}${msg.text}</div>`;
                }
            }

            if (isTransfer || isVoice || isGift) {
                row.innerHTML = `
                    ${checkboxHtml}
                    <div class="msg-avatar" style="${avatarDisplayUrl.startsWith('data:image/svg') ? `background-image: url('${avatarDisplayUrl}'); background-color: #bbb; background-size: 80%; background-repeat: no-repeat;` : `background-image: url('${avatarDisplayUrl}')`}"></div>
                    <div class="msg-bubble-col" data-index="${i}" style="position:relative;">${innerHtml}</div>
                `;
            } else {
                row.innerHTML = `
                    ${checkboxHtml}
                    <div class="msg-avatar" style="${avatarDisplayUrl.startsWith('data:image/svg') ? `background-image: url('${avatarDisplayUrl}'); background-color: #bbb; background-size: 80%; background-repeat: no-repeat;` : `background-image: url('${avatarDisplayUrl}')`}"></div>
                    ${innerHtml}
                `;
            }
            
            row.addEventListener('click', (e) => {
                if (isMultiSelectMode) {
                    const cb = row.querySelector('.msg-checkbox');
                    if (selectedMsgIndices.has(i)) {
                        selectedMsgIndices.delete(i);
                        cb.classList.remove('checked');
                    } else {
                        selectedMsgIndices.add(i);
                        cb.classList.add('checked');
                    }
                }
            });

            convMessagesContainer.appendChild(row);
        }
    }

    // 发送消息逻辑 (回车发送)
    convMsgInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && convMsgInput.value.trim() !== '') {
            const text = convMsgInput.value.trim();
            sendMsg('me', text);
            convMsgInput.value = '';
        }
    });

    // 全局方法挂载 (文字图、语音与转账交互)
    window.showTextViewer = function(index) {
        // No longer used, text image is directly rendered
    };
    
    const tvModal = document.getElementById('text-viewer-modal');
    const tvBg = document.getElementById('close-text-viewer-bg');
    if(tvBg) tvBg.addEventListener('click', () => { if(tvModal) tvModal.style.display = 'none'; });

    window.toggleVoiceText = function(element) {
        const textResult = element.nextElementSibling;
        if(textResult && textResult.classList.contains('voice-text-result')) {
            textResult.classList.toggle('show');
        }
    };
    
    window.handleTransfer = function(index, status) {
        if (!currentActiveContactId) return;
        if (messagesData[currentActiveContactId] && messagesData[currentActiveContactId][index]) {
            messagesData[currentActiveContactId][index].txStatus = status;
            localStorage.setItem('chat_messages', JSON.stringify(messagesData));
            renderMessages();
        }
    };

    function sendMsg(sender, text) {
        if(!currentActiveContactId) return;
        if(!messagesData[currentActiveContactId]) messagesData[currentActiveContactId] = [];
        
        const newMsg = {
            sender: sender,
            text: text,
            time: Date.now()
        };
        
        if (sender === 'me' && window.currentQuoteText) {
            newMsg.quote = window.currentQuoteText;
            window.currentQuoteText = '';
            document.getElementById('quote-preview-area').style.display = 'none';
        }

        messagesData[currentActiveContactId].push(newMsg);
        localStorage.setItem('chat_messages', JSON.stringify(messagesData));
        renderMessages();
        setTimeout(() => { convMessagesContainer.scrollTop = convMessagesContainer.scrollHeight; }, 50);
    }

    convBackBtn.addEventListener('click', () => {
        chatConversationPage.style.display = 'none';
        currentActiveContactId = null;
    });

    function renderSelectContacts() {
        const container = document.getElementById('select-contact-list-container');
        const emptyState = document.getElementById('select-contacts-empty');
        container.innerHTML = '';
        
        if (contacts.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            contacts.forEach(contact => {
                const item = document.createElement('div');
                item.className = 'contact-item';
                item.innerHTML = `
                    <div class="contact-item-avatar" style="background-image: url('${contact.avatar || ''}')"></div>
                    <div class="contact-item-info">
                        <div class="contact-item-name">${contact.name || '未命名'}</div>
                    </div>
                `;
                item.addEventListener('click', () => {
                    // 添加到聊天列表
                    if (!chatList.find(c => c.contactId === contact.id)) {
                        chatList.push({ contactId: contact.id, lastMessageTime: Date.now() });
                        localStorage.setItem('chat_list', JSON.stringify(chatList));
                        renderChatList();
                    }
                    selectContactModal.style.display = 'none';
                });
                container.appendChild(item);
            });
        }
    }

    // 打开聊天软件
    function switchChatTab(targetId, title) {
        // 更新导航高亮
        chatNavItems.forEach(nav => {
            if (nav.dataset.target === targetId) {
                nav.classList.add('active');
                // 切换图标样式 (实心/空心)
                const i = nav.querySelector('i');
                if(targetId === 'messages') i.className = 'bx bxs-message-rounded';
                if(targetId === 'contacts') i.className = 'bx bxs-contact';
                if(targetId === 'moments') i.className = 'bx bx-world'; // 假设世界图标代表朋友圈
            } else {
                nav.classList.remove('active');
                const i = nav.querySelector('i');
                if(nav.dataset.target === 'messages') i.className = 'bx bx-message-rounded';
                if(nav.dataset.target === 'contacts') i.className = 'bx bxs-contact';
                if(nav.dataset.target === 'moments') i.className = 'bx bx-world';
            }
        });

        // 更新面板显示
        chatViewPanels.forEach(panel => {
            if (panel.id === `chat-view-${targetId}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // 更新标题
        chatHeaderTitle.innerText = title;
        
        // 更新右上角按钮显示
        addFriendBtn.style.display = targetId === 'messages' ? 'block' : 'none';
        addContactBtn.style.display = targetId === 'contacts' ? 'block' : 'none';
        
        if (targetId === 'contacts') renderContacts();
        if (targetId === 'messages') renderChatList();
    }

    // 添加联系人页面逻辑
    addContactBtn.addEventListener('click', () => {
        editingContactId = null;
        addContactPage.style.display = 'flex';
        document.querySelector('.add-contact-header h2').innerText = '添加人设';
        // 清空表单
        document.getElementById('contact-input-name').value = '';
        document.getElementById('contact-input-gender').value = '';
        document.getElementById('contact-input-age').value = '';
        document.getElementById('contact-input-opening').value = '';
        document.getElementById('contact-input-desc').value = '';
        contactAvatarPreview.style.backgroundImage = 'none';
        contactAvatarPreview.classList.remove('has-photo');
        currentContactAvatarBase64 = '';
    });

    closeAddContactBtn.addEventListener('click', () => {
        addContactPage.style.display = 'none';
    });

    contactAvatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            currentContactAvatarBase64 = event.target.result;
            contactAvatarPreview.style.backgroundImage = `url('${currentContactAvatarBase64}')`;
            contactAvatarPreview.classList.add('has-photo');
        };
        reader.readAsDataURL(file);
    });

    saveContactBtn.addEventListener('click', () => {
        const name = document.getElementById('contact-input-name').value.trim();
        if (!name) { alert('请输入姓名'); return; }
        
        if (editingContactId) {
            const contactIndex = contacts.findIndex(c => c.id === editingContactId);
            if (contactIndex !== -1) {
                contacts[contactIndex].name = name;
                contacts[contactIndex].gender = document.getElementById('contact-input-gender').value.trim();
                contacts[contactIndex].age = document.getElementById('contact-input-age').value.trim();
                contacts[contactIndex].opening = document.getElementById('contact-input-opening').value.trim();
                contacts[contactIndex].desc = document.getElementById('contact-input-desc').value.trim();
                contacts[contactIndex].avatar = currentContactAvatarBase64;
            }
        } else {
            const newContact = {
                id: 'c_' + Date.now(),
                name: name,
                gender: document.getElementById('contact-input-gender').value.trim(),
                age: document.getElementById('contact-input-age').value.trim(),
                opening: document.getElementById('contact-input-opening').value.trim(),
                desc: document.getElementById('contact-input-desc').value.trim(),
                avatar: currentContactAvatarBase64
            };
            contacts.push(newContact);
        }
        
        localStorage.setItem('chat_contacts', JSON.stringify(contacts));
        
        renderContacts();
        renderChatList();
        addContactPage.style.display = 'none';
    });

    // 添加好友到聊天列表逻辑
    addFriendBtn.addEventListener('click', () => {
        renderSelectContacts();
        selectContactModal.style.display = 'flex';
    });

    closeSelectContactBtn.addEventListener('click', () => {
        selectContactModal.style.display = 'none';
    });

    beautifyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homePage.style.display = 'none';
        beautifyPage.style.display = 'flex';
    });

    chatAppBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homePage.style.display = 'none';
        chatAppPage.style.display = 'flex';
        // 每次进入默认显示聊天页面
        switchChatTab('messages', '聊天');
    });

    // 关闭聊天软件
    closeChatBtn.addEventListener('click', () => {
        homePage.style.display = 'flex';
        chatAppPage.style.display = 'none';
    });

    // 聊天底部导航切换
    chatNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            const title = item.querySelector('span').innerText;
            switchChatTab(target, title);
        });
    });

    function switchChatTab(targetId, title) {
        // 更新导航高亮
        chatNavItems.forEach(nav => {
            if (nav.dataset.target === targetId) {
                nav.classList.add('active');
                // 切换图标样式 (实心/空心)
                const i = nav.querySelector('i');
                if(targetId === 'messages') i.className = 'bx bxs-message-rounded';
                if(targetId === 'contacts') i.className = 'bx bxs-contact';
                if(targetId === 'moments') i.className = 'bx bx-world'; // 假设世界图标代表朋友圈
            } else {
                nav.classList.remove('active');
                const i = nav.querySelector('i');
                if(nav.dataset.target === 'messages') i.className = 'bx bx-message-rounded';
                if(nav.dataset.target === 'contacts') i.className = 'bx bxs-contact';
                if(nav.dataset.target === 'moments') i.className = 'bx bx-world';
            }
        });

        // 更新面板显示
        chatViewPanels.forEach(panel => {
            if (panel.id === `chat-view-${targetId}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // 更新标题
        chatHeaderTitle.innerText = title;
        
        // 更新右上角按钮显示
        addFriendBtn.style.display = targetId === 'messages' ? 'block' : 'none';
        addContactBtn.style.display = targetId === 'contacts' ? 'block' : 'none';
        
        if (targetId === 'contacts') renderContacts();
        if (targetId === 'messages') renderChatList();
    }

    beautifyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        homePage.style.display = 'none';
        beautifyPage.style.display = 'flex';
    });
    backBtn.addEventListener('click', () => {
        homePage.style.display = 'flex';
        beautifyPage.style.display = 'none';
    });
    const wallpaperThumbs = document.querySelectorAll('.wallpaper-thumb');
    const uploadWallpaperInput = document.getElementById('upload-wallpaper');
    const applyWallpaper = (url) => {
        phoneScreen.style.backgroundImage = `url(${url})`;
        localStorage.setItem('selectedWallpaper', url);
        wallpaperThumbs.forEach(t => t.classList.remove('active'));
        const activeThumb = [...wallpaperThumbs].find(t => t.dataset.wallpaper === url);
        if (activeThumb) activeThumb.classList.add('active');
    };
    wallpaperThumbs.forEach(thumb => {
        thumb.style.backgroundImage = `url(${thumb.dataset.wallpaper})`;
        thumb.addEventListener('click', () => applyWallpaper(thumb.dataset.wallpaper));
    });
    uploadWallpaperInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        compressImage(file, 800, 1400, 0.6, (dataUrl) => {
            if(dataUrl) applyWallpaper(dataUrl);
        });
    });
    const customIconGrid = document.getElementById('custom-icon-grid');
    const customizableIcons = document.querySelectorAll('.icon-customizable');
    const hiddenInputsContainer = document.getElementById('hidden-file-inputs');
    const applyCustomIcon = (itemId, imageUrl) => {
        const item = document.getElementById(itemId);
        if(item) {
            item.style.backgroundImage = `url('${imageUrl}')`;
            item.classList.add('has-custom-icon');
            localStorage.setItem(`custom-icon-${itemId}`, imageUrl);
        }
    };
    customizableIcons.forEach(iconItem => {
        const itemId = iconItem.id;
        if (!itemId) return;
        const originalIconHTML = iconItem.querySelector('i')?.outerHTML || '';
        const placeholder = document.createElement('label');
        placeholder.htmlFor = `upload-icon-${itemId}`;
        placeholder.className = 'icon-placeholder';
        placeholder.innerHTML = originalIconHTML;
        customIconGrid.appendChild(placeholder);
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = `upload-icon-${itemId}`;
        fileInput.className = 'hidden-file-input';
        fileInput.accept = 'image/*';
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if(!file) return;
            compressImage(file, 150, 150, 0.8, (dataUrl) => {
                if(dataUrl) applyCustomIcon(itemId, dataUrl);
            });
        });
        hiddenInputsContainer.appendChild(fileInput);
    });
    const fontFamilyInput = document.getElementById('font-family-input');
    const fontUrlInput = document.getElementById('font-url-input');
    const fontFileInput = document.getElementById('font-file-input');
    const fontStyleTag = document.getElementById('custom-font-style-tag');
    const applyAndSaveFont = ({ family, url, dataUrl }) => {
        if (!family) { alert('必须为字体命名！'); return; }
        let src = '';
        if (url) src = `url('${url}')`;
        if (dataUrl) src = `url('${dataUrl}')`;
        if (!src) { return; }
        const fontFaceRule = `@font-face { font-family: '${family}'; src: ${src}; }`;
        fontStyleTag.innerHTML = fontFaceRule;
        document.documentElement.style.setProperty('--font-main', `'${family}', sans-serif`);
        localStorage.setItem('customFontFamily', family);
        localStorage.setItem('customFontUrl', url || '');
        localStorage.setItem('customFontDataUrl', dataUrl || '');
        if(!localStorage.getItem('font-alert-shown')){alert(`字体 '${family}' 已应用!`);localStorage.setItem('font-alert-shown','true')}
    };
    fontUrlInput.addEventListener('blur', () => {
        localStorage.removeItem('font-alert-shown');
        const family = fontFamilyInput.value.trim();
        const url = fontUrlInput.value.trim();
        if (family && url) applyAndSaveFont({ family, url });
    });
    fontFileInput.addEventListener('change', (e) => {
        localStorage.removeItem('font-alert-shown');
        const file = e.target.files[0];
        const family = fontFamilyInput.value.trim();
        if (!file || !family) { alert('上传文件前，请先为字体命名!'); e.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = (event) => { applyAndSaveFont({ family: family, dataUrl: event.target.result }); };
        reader.readAsDataURL(file);
    });
    const createWidgetFileInput=(id,target)=>{const i=document.createElement('input');i.type='file';i.id=id;i.className='hidden-file-input';i.accept='image/*';i.dataset.target=target;hiddenInputsContainer.appendChild(i);return i;};
    const widgetInputs=[['upload-top-1','image-target-top-1'],['upload-top-2','image-target-top-2'],['upload-top-3','image-target-top-3'],['upload-avatar-1','image-target-avatar-1'],['upload-avatar-2','image-target-avatar-2'],['upload-main-photo','image-target-main-photo'],['upload-profile-bg','profile-widget-bg']];
    widgetInputs.forEach(([id,target])=>{const i=createWidgetFileInput(id,target);i.addEventListener('change',handleWidgetImageUpload)});
    function handleWidgetImageUpload(event){const i=event.target,f=i.files[0];if(!f)return;const r=new FileReader;r.onload=e=>{const t=e.target.result,a=i.dataset.target,n=document.getElementById(a);if(n){n.style.backgroundImage=`url(${t})`;if(n.classList.contains('photo-widget'))n.classList.add('has-image');localStorage.setItem(a,t)}};r.readAsDataURL(f)}
    const loadWidgetImages=()=>{widgetInputs.forEach(([id,target])=>{const s=localStorage.getItem(target);if(s){const e=document.getElementById(target);if(e){e.style.backgroundImage=`url(${s})`;if(e.classList.contains('photo-widget'))e.classList.add('has-image');if(target==='profile-widget-bg')e.style.backgroundSize='cover';}}})};
    const editableTexts=document.querySelectorAll('[contenteditable="true"]');
    editableTexts.forEach(el=>el.addEventListener('blur',()=>localStorage.setItem(el.id,el.innerText)));
    const loadTexts=()=>editableTexts.forEach(el=>{const s=localStorage.getItem(el.id);if(s)el.innerText=s;});
    const updateTime=()=>{const e=document.getElementById('time');if(e){const n=new Date,h=String(n.getHours()).padStart(2,'0'),m=String(n.getMinutes()).padStart(2,'0');e.textContent=`${h}:${m}`}};
    const initBatteryAPI=()=>{const i=document.getElementById('battery-icon'),l=document.getElementById('battery-level');if('getBattery' in navigator){navigator.getBattery().then(b=>{const u=()=>{l.textContent=`${Math.round(b.level*100)}%`;i.className=b.charging?'bx bxs-battery-charging':'bx bxs-battery'};u();b.addEventListener('levelchange',u);b.addEventListener('chargingchange',u)})}else{i.parentElement.style.display='none'}};
    const loadSettings=()=>{
        loadWidgetImages();
        loadTexts();
        updateTime();
        initBatteryAPI();
        setInterval(updateTime,10000);
        const savedWallpaper=localStorage.getItem('selectedWallpaper');
        if(savedWallpaper)applyWallpaper(savedWallpaper);
        customizableIcons.forEach(item=>{const savedIcon=localStorage.getItem(`custom-icon-${item.id}`);if(savedIcon)applyCustomIcon(item.id,savedIcon);});
        localStorage.setItem('font-alert-shown', 'true');
        const savedFontFamily=localStorage.getItem('customFontFamily');
        if(savedFontFamily){
            const savedFontUrl=localStorage.getItem('customFontUrl');
            const savedFontDataUrl=localStorage.getItem('customFontDataUrl');
            applyAndSaveFont({family:savedFontFamily,url:savedFontUrl,dataUrl:savedFontDataUrl});
            fontFamilyInput.value=savedFontFamily;
            if(savedFontUrl)fontUrlInput.value=savedFontUrl;
        }
        localStorage.removeItem('font-alert-shown');
    };
    loadSettings();

    // 橡皮筋效果由CSS overscroll-behavior-y 控制，无需在此全局阻止滚动

    // --- LINE Profile 主页逻辑 ---
    const lineProfileBg = document.getElementById('line-profile-bg');
    const uploadLineBg = document.getElementById('upload-line-bg');
    const lineMainAvatar = document.getElementById('line-main-avatar');
    const uploadLineAvatar = document.getElementById('upload-line-avatar');
    const lineMainFrame = document.getElementById('line-main-frame');
    const uploadLineFrame = document.getElementById('upload-line-frame');
    const clearLineFrameBtn = document.getElementById('clear-line-frame-btn');
    
    const lineNickname = document.getElementById('line-nickname');
    const lineStatus = document.getElementById('line-status');
    
    const btnEnterMoments = document.getElementById('btn-enter-moments');
    const btnDecorate = document.getElementById('btn-decorate');
    const frameSelectModal = document.getElementById('frame-select-modal');
    const closeFrameModalBtn = document.getElementById('close-frame-modal-btn');
    const framePreviewAvatar = document.getElementById('frame-preview-avatar');
    const framePreviewFrame = document.getElementById('frame-preview-frame');

    const momentsFeedPage = document.getElementById('moments-feed-page');
    const closeMfBtn = document.getElementById('close-mf-btn');
    const postMomentBtn = document.getElementById('post-moment-btn');
    const postMomentModal = document.getElementById('post-moment-modal');
    const cancelPostBtn = document.getElementById('cancel-post-btn');
    const submitMomentBtn = document.getElementById('submit-moment-btn');

    const lineSettingsBtn = document.getElementById('line-settings-btn');
    if (lineSettingsBtn) {
        lineSettingsBtn.addEventListener('click', () => {
            alert('💡 提示：\n- 点击顶部任意空白处可更换背景\n- 点击中间头像可更换头像\n- 点击昵称和状态文字可直接进行修改\n- 点击"装饰"可更换头像框');
        });
    }
    
    // 让背景点击也能触发上传，因为原先的按钮被隐藏/移除了
    lineProfileBg.addEventListener('click', () => {
        uploadLineBg.click();
    });

    // 加载 LINE Profile 数据
    function loadLineProfile() {
        const data = JSON.parse(localStorage.getItem('line_profile_data') || '{}');
        if (data.bg) lineProfileBg.style.backgroundImage = `url('${data.bg}')`;
        if (data.avatar) {
            lineMainAvatar.style.backgroundImage = `url('${data.avatar}')`;
            framePreviewAvatar.style.backgroundImage = `url('${data.avatar}')`;
        }
        if (data.frame) {
            lineMainFrame.style.backgroundImage = `url('${data.frame}')`;
            framePreviewFrame.style.backgroundImage = `url('${data.frame}')`;
        } else {
            lineMainFrame.style.backgroundImage = 'none';
            framePreviewFrame.style.backgroundImage = 'none';
        }
        
        // 默认显示User
        if (data.nickname) {
            lineNickname.innerText = data.nickname;
        } else {
            lineNickname.innerText = 'User';
        }
        
        if (data.status) {
            lineStatus.innerText = data.status;
        }
    }

    function saveLineProfile(key, value) {
        const data = JSON.parse(localStorage.getItem('line_profile_data') || '{}');
        data[key] = value;
        safeSetItem('line_profile_data', JSON.stringify(data));
    }

    uploadLineBg.addEventListener('change', (e) => {
        const file = e.target.files[0]; if(!file) return;
        compressImage(file, 1080, 1920, 0.7, (dataUrl) => {
            if(dataUrl) {
                lineProfileBg.style.backgroundImage = `url('${dataUrl}')`;
                saveLineProfile('bg', dataUrl);
            }
        });
    });

    uploadLineAvatar.addEventListener('change', (e) => {
        const file = e.target.files[0]; if(!file) return;
        compressImage(file, 400, 400, 0.8, (dataUrl) => {
            if(dataUrl) {
                lineMainAvatar.style.backgroundImage = `url('${dataUrl}')`;
                framePreviewAvatar.style.backgroundImage = `url('${dataUrl}')`;
                saveLineProfile('avatar', dataUrl);
            }
        });
    });

    uploadLineFrame.addEventListener('change', (e) => {
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            lineMainFrame.style.backgroundImage = `url('${dataUrl}')`;
            framePreviewFrame.style.backgroundImage = `url('${dataUrl}')`;
            saveLineProfile('frame', dataUrl);
        };
        reader.readAsDataURL(file); // 头像框可能是PNG透明图，直接读为DataURL
    });

    clearLineFrameBtn.addEventListener('click', () => {
        lineMainFrame.style.backgroundImage = 'none';
        framePreviewFrame.style.backgroundImage = 'none';
        saveLineProfile('frame', '');
    });

    lineNickname.addEventListener('blur', () => saveLineProfile('nickname', lineNickname.innerText));
    lineStatus.addEventListener('blur', () => saveLineProfile('status', lineStatus.innerText));

    // 装饰按钮弹窗
    btnDecorate.addEventListener('click', (e) => {
        e.preventDefault(); // 阻止默认 label 行为
        frameSelectModal.style.display = 'flex';
    });
    closeFrameModalBtn.addEventListener('click', () => {
        frameSelectModal.style.display = 'none';
    });
    document.querySelectorAll('.ui-modal-bg').forEach(bg => bg.addEventListener('click', () => {
        frameSelectModal.style.display = 'none';
    }));

    // 进入真正的朋友圈流
    btnEnterMoments.addEventListener('click', () => {
        momentsFeedPage.style.display = 'flex';
        renderMomentsFeed();
    });
    closeMfBtn.addEventListener('click', () => {
        momentsFeedPage.style.display = 'none';
    });

    // --- 朋友圈发布逻辑 ---
    let momentsData = JSON.parse(localStorage.getItem('moments_data') || '[]'); // [{id, authorId, text, images:[], time, comments:[]}]
    let postSelectedImages = [];

    const uploadMomentImage = document.getElementById('upload-moment-image');
    const postImageGrid = document.getElementById('post-image-grid');
    const postAuthorSelect = document.getElementById('post-author-select');
    const postContentInput = document.getElementById('post-content-input');
    const postAuthorAvatar = document.getElementById('post-author-avatar');
    
    // AI 绑定功能
    const bindAiBtn = document.getElementById('bind-ai-btn');
    const aiSettingsModal = document.getElementById('moment-ai-settings-modal');
    const closeAiSettingsBtn = document.getElementById('close-ai-settings-btn');
    const aiCompanionSelect = document.getElementById('moment-ai-companion-select');
    const aiFreqInput = document.getElementById('moment-ai-freq-input');
    const saveAiSettingsBtn = document.getElementById('save-ai-settings-btn');
    const forceAiPostBtn = document.getElementById('force-ai-post-btn');
    
    let aiSettings = JSON.parse(localStorage.getItem('moment_ai_settings') || '{"companionId":"","frequency":24,"lastPostTime":0}');

    if (bindAiBtn) {
        bindAiBtn.addEventListener('click', () => {
            aiCompanionSelect.innerHTML = '<option value="">不绑定</option>';
            contacts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.innerText = c.name;
                aiCompanionSelect.appendChild(opt);
            });
            aiCompanionSelect.value = aiSettings.companionId || '';
            aiFreqInput.value = aiSettings.frequency || 24;
            aiSettingsModal.style.display = 'flex';
        });
    }

    if (closeAiSettingsBtn) closeAiSettingsBtn.addEventListener('click', () => aiSettingsModal.style.display = 'none');

    if (saveAiSettingsBtn) {
        saveAiSettingsBtn.addEventListener('click', () => {
            aiSettings.companionId = aiCompanionSelect.value;
            aiSettings.frequency = parseInt(aiFreqInput.value) || 24;
            localStorage.setItem('moment_ai_settings', JSON.stringify(aiSettings));
            alert('AI互动设置已保存！');
            aiSettingsModal.style.display = 'none';
        });
    }

    if (forceAiPostBtn) {
        forceAiPostBtn.addEventListener('click', async () => {
            if (!aiSettings.companionId) {
                alert('请先选择一个绑定角色！');
                return;
            }
            
            const originalHtml = forceAiPostBtn.innerHTML;
            forceAiPostBtn.innerHTML = '正在让AI思考...';
            forceAiPostBtn.disabled = true;

            const cId = aiSettings.companionId;
            const cInfo = contacts.find(x => x.id === cId);
            if (!cInfo) return;

            const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
            if (!apiData.url || !apiData.key || !apiData.modelName) {
                alert('请先在设置中配置API以使用生成功能。');
                forceAiPostBtn.innerHTML = originalHtml;
                forceAiPostBtn.disabled = false;
                return;
            }

            const sysPrompt = `你扮演角色：${cInfo.name}。人设：${cInfo.desc || '无'}。请发一条简短的朋友圈动态。不要任何说明，只输出朋友圈正文，可以带表情符号。如果你想配图，请在最后加上 [发送图片:具体的英文画面描述]。`;

            try {
                let url = apiData.url;
                if (url.endsWith('/')) url = url.slice(0, -1);
                if (!url.endsWith('/chat/completions')) url += '/chat/completions';

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiData.key}` },
                    body: JSON.stringify({
                        model: apiData.modelName,
                        messages: [{ role: 'system', content: sysPrompt }]
                    })
                });
                
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const result = await response.json();
                let text = result.choices[0].message.content;
                
                let imgHtml = [];
                let sendImgMatch = text.match(/\[发送图片:(.*?)\]/);
                if (sendImgMatch) {
                    text = text.replace(sendImgMatch[0], '');
                    // 这里简化处理，直接用描述生成一条纯文本，或者调用 nai 生图
                    // 为了稳定先发一张占位图或者用 nai 生图
                    if (window.handleAIGenerateImage) {
                        // Await image generation (using callback style)
                        await new Promise(resolve => {
                            window.handleAIGenerateImage(sendImgMatch[1], (res) => {
                                // Extract base64 src from result
                                const match = res.match(/src="(.*?)"/);
                                if (match) imgHtml.push(match[1]);
                                resolve();
                            });
                        });
                    }
                }

                momentsData.unshift({
                    id: 'm_' + Date.now(),
                    authorId: cId,
                    text: text.trim(),
                    images: imgHtml,
                    time: Date.now(),
                    comments: []
                });
                
                localStorage.setItem('moments_data', JSON.stringify(momentsData));
                renderMomentsFeed();
                aiSettingsModal.style.display = 'none';
                
            } catch (error) {
                console.error(error);
                alert('生成失败: ' + error.message);
            } finally {
                forceAiPostBtn.innerHTML = originalHtml;
                forceAiPostBtn.disabled = false;
            }
        });
    }

    // AI 自动评论生成
    async function triggerAIAutoComment(momentId, textContent) {
        if (!aiSettings.companionId) return;
        const cId = aiSettings.companionId;
        const cInfo = contacts.find(x => x.id === cId);
        if (!cInfo) return;

        const apiData = JSON.parse(localStorage.getItem('api_settings') || '{}');
        if (!apiData.url || !apiData.key || !apiData.modelName) return;

        const sysPrompt = `你扮演角色：${cInfo.name}。人设：${cInfo.desc || '无'}。你的好朋友User刚刚发了一条朋友圈：“${textContent}”。请你作为TA的好朋友，回复一条简短的评论。不要多余的废话，只输出评论内容。`;

        try {
            let url = apiData.url;
            if (url.endsWith('/')) url = url.slice(0, -1);
            if (!url.endsWith('/chat/completions')) url += '/chat/completions';

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiData.key}` },
                body: JSON.stringify({
                    model: apiData.modelName,
                    messages: [{ role: 'system', content: sysPrompt }]
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                let commentText = result.choices[0].message.content.trim();
                
                const mIndex = momentsData.findIndex(x => x.id === momentId);
                if (mIndex !== -1) {
                    if (!momentsData[mIndex].comments) momentsData[mIndex].comments = [];
                    momentsData[mIndex].comments.push({
                        authorId: cId,
                        text: commentText
                    });
                    localStorage.setItem('moments_data', JSON.stringify(momentsData));
                    renderMomentsFeed();
                }
            }
        } catch (error) {
            console.error('Auto comment failed', error);
        }
    }
    
    function initPostAuthorSelect() {
        // 清空除User以外的选项
        while(postAuthorSelect.options.length > 1) {
            postAuthorSelect.remove(1);
        }
        contacts.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.innerText = c.name;
            postAuthorSelect.appendChild(opt);
        });
        updatePostAuthorAvatar();
    }

    function updatePostAuthorAvatar() {
        const val = postAuthorSelect.value;
        if (val === 'user') {
            const lineData = JSON.parse(localStorage.getItem('line_profile_data') || '{}');
            postAuthorAvatar.style.backgroundImage = lineData.avatar ? `url('${lineData.avatar}')` : 'none';
        } else {
            const c = contacts.find(x => x.id === val);
            postAuthorAvatar.style.backgroundImage = c && c.avatar ? `url('${c.avatar}')` : 'none';
        }
    }

    postAuthorSelect.addEventListener('change', updatePostAuthorAvatar);

    postMomentBtn.addEventListener('click', () => {
        postContentInput.value = '';
        postSelectedImages = [];
        renderPostImages();
        initPostAuthorSelect();
        postMomentModal.style.display = 'flex';
    });
    
    cancelPostBtn.addEventListener('click', () => {
        postMomentModal.style.display = 'none';
    });

    uploadMomentImage.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        let processed = 0;
        files.forEach(file => {
            if(postSelectedImages.length >= 9) return; // 最多9张
            compressImage(file, 800, 800, 0.7, (dataUrl) => {
                if(dataUrl) {
                    postSelectedImages.push(dataUrl);
                    processed++;
                    if(processed === Math.min(files.length, 9 - (postSelectedImages.length - processed))) {
                        renderPostImages();
                    }
                }
            });
        });
        e.target.value = '';
    });

    function renderPostImages() {
        // 清除现有的预览图
        const previews = postImageGrid.querySelectorAll('.post-img-preview');
        previews.forEach(p => p.remove());
        
        const addBtn = postImageGrid.querySelector('.post-image-add-btn');
        
        postSelectedImages.forEach((url, idx) => {
            const div = document.createElement('div');
            div.className = 'post-img-preview';
            div.style.backgroundImage = `url('${url}')`;
            
            const rm = document.createElement('div');
            rm.className = 'remove-btn';
            rm.innerHTML = '<i class="bx bx-x"></i>';
            rm.onclick = (e) => {
                e.preventDefault();
                postSelectedImages.splice(idx, 1);
                renderPostImages();
            };
            div.appendChild(rm);
            postImageGrid.insertBefore(div, addBtn);
        });
        
        addBtn.style.display = postSelectedImages.length >= 9 ? 'none' : 'flex';
    }

    submitMomentBtn.addEventListener('click', () => {
        const text = postContentInput.value.trim();
        if (!text && postSelectedImages.length === 0) {
            alert('说点什么或者发张图片吧');
            return;
        }
        
        const authorId = postAuthorSelect.value;
        const momentId = 'm_' + Date.now();
        const newMoment = {
            id: momentId,
            authorId: authorId,
            text: text,
            images: [...postSelectedImages],
            time: Date.now(),
            comments: []
        };
        
        momentsData.unshift(newMoment);
        safeSetItem('moments_data', JSON.stringify(momentsData));
        
        postMomentModal.style.display = 'none';
        momentsFeedPage.style.display = 'flex'; // 自动进入朋友圈流
        renderMomentsFeed();
        
        // 触发自动评论
        if (authorId === 'user' && text) {
            setTimeout(() => {
                triggerAIAutoComment(momentId, text);
            }, 3000);
        }
    });

    function formatTime(timestamp) {
        const d = new Date(timestamp);
        return `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    function renderMomentsFeed() {
        const container = document.getElementById('mf-feed-container');
        const emptyState = document.getElementById('mf-empty-state');
        
        // 移除旧帖子
        const cards = container.querySelectorAll('.moment-card');
        cards.forEach(c => c.remove());
        
        if (momentsData.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            momentsData.forEach((m, idx) => {
                let authorName = 'User';
                let authorAvatar = '';
                
                if (m.authorId === 'user') {
                    const lineData = JSON.parse(localStorage.getItem('line_profile_data') || '{}');
                    authorName = lineData.nickname || 'User';
                    authorAvatar = lineData.avatar || '';
                } else {
                    const c = contacts.find(x => x.id === m.authorId);
                    if (c) {
                        authorName = c.name;
                        authorAvatar = c.avatar || '';
                    } else {
                        authorName = '未知角色';
                    }
                }
                
                const card = document.createElement('div');
                card.className = 'moment-card';
                
                let imgHtml = '';
                if (m.images && m.images.length > 0) {
                    imgHtml = `<div class="moment-images" data-count="${Math.min(m.images.length, 4)}">
                        ${m.images.map(img => `<div class="moment-img-item" style="background-image: url('${img}')"></div>`).join('')}
                    </div>`;
                }

                let commentsHtml = '';
                if (m.comments && m.comments.length > 0) {
                    const cList = m.comments.map(c => {
                        let cName = 'User';
                        if (c.authorId !== 'user') {
                            const cc = contacts.find(x => x.id === c.authorId);
                            if (cc) cName = cc.name;
                        }
                        return `<div class="moment-comment-item"><span class="moment-comment-name">${cName}:</span>${c.text}</div>`;
                    }).join('');
                    commentsHtml = `<div class="moment-comments-area">${cList}</div>`;
                }

                card.innerHTML = `
                    <div class="moment-avatar" style="background-image: url('${authorAvatar}')"></div>
                    <div class="moment-body">
                        <div class="moment-header">
                            <span class="moment-name">${authorName}</span>
                            <span class="moment-time">${formatTime(m.time)}</span>
                        </div>
                        ${m.text ? `<div class="moment-text">${m.text.replace(/\n/g, '<br>')}</div>` : ''}
                        ${imgHtml}
                        <div class="moment-actions">
                            <button class="moment-action-btn"><i class='bx bx-message-rounded'></i> 评论</button>
                            <button class="moment-action-btn"><i class='bx bx-heart'></i> 点赞</button>
                            <button class="moment-action-btn" style="margin-left: auto; color: #ff3b30;" onclick="deleteMoment(${idx}, event)"><i class='bx bx-trash'></i></button>
                        </div>
                        ${commentsHtml}
                    </div>
                `;
                container.appendChild(card);
            });
        }
    }

    window.deleteMoment = function(index, event) {
        event.stopPropagation();
        if(confirm('确定要删除这条动态吗？')) {
            momentsData.splice(index, 1);
            safeSetItem('moments_data', JSON.stringify(momentsData));
            renderMomentsFeed();
        }
    };

    // 初始化加载
    loadLineProfile();

    // --- 星星系统 (Star System) 逻辑 ---
    const starSystemAppBtn = document.getElementById('app-item-5');
    const starSystemPage = document.getElementById('star-system-page');
    const closeSsBtn = document.getElementById('close-ss-btn');
    
    const ssTotalStars = document.getElementById('ss-total-stars');
    const ssLevel = document.getElementById('ss-level');
    
    const ssBtnCheckin = document.getElementById('ss-btn-checkin');
    const ssBtnJourney = document.getElementById('ss-btn-journey');
    const ssBtnBottle = document.getElementById('ss-btn-bottle');
    const ssBtnGallery = document.getElementById('ss-btn-gallery');
    
    const ssJourneyModal = document.getElementById('ss-journey-modal');
    const closeJourneyBtn = document.getElementById('close-journey-btn');
    const journeyDestInput = document.getElementById('journey-dest-input');
    const journeyCompanionSelect = document.getElementById('journey-companion-select');
    const startJourneyBtn = document.getElementById('start-journey-btn');
    const journeyProgressArea = document.getElementById('journey-progress-area');
    
    const ssGalleryPage = document.getElementById('ss-gallery-page');
    const closeGalleryBtn = document.getElementById('close-gallery-btn');
    const gallerySystemBadges = document.getElementById('gallery-system-badges');
    const galleryCompanionMemories = document.getElementById('gallery-companion-memories');
    
    const ssBottlePage = document.getElementById('ss-bottle-page');
    const closeBottleBtn = document.getElementById('close-bottle-btn');
    const bottleStarCount = document.getElementById('bottle-star-count');
    const jarBodyContent = document.getElementById('jar-body-content');

    // 初始化获取星星数量
    let userStars = parseInt(localStorage.getItem('user_stars')) || 10;
    if (!localStorage.getItem('user_stars')) localStorage.setItem('user_stars', userStars);

    function updateStarDisplay() {
        if (ssTotalStars) ssTotalStars.innerText = userStars;
        
        // Update level based on total stars
        let level = 1 + Math.floor(userStars / 50);
        if (ssLevel) ssLevel.innerText = level;
        
        // Call global method to update gift drawer if open
        if (window.updateGiftDrawerStarBalance) {
            window.updateGiftDrawerStarBalance(userStars);
        }
    }

    // 星星系统主页
    if (starSystemAppBtn) {
        starSystemAppBtn.addEventListener('click', (e) => {
            e.preventDefault();
            homePage.style.display = 'none';
            updateStarDisplay();
            starSystemPage.style.display = 'flex';
        });
    }

    if (closeSsBtn) {
        closeSsBtn.addEventListener('click', () => {
            starSystemPage.style.display = 'none';
            homePage.style.display = 'flex';
        });
    }

    // 签到
    if (ssBtnCheckin) {
        ssBtnCheckin.addEventListener('click', () => {
            const lastCheckin = localStorage.getItem('ss_last_checkin');
            const today = new Date().toDateString();
            if (lastCheckin === today) {
                alert('You have already checked in today! Come back tomorrow.');
                return;
            }
            
            userStars += 10;
            localStorage.setItem('user_stars', userStars);
            localStorage.setItem('ss_last_checkin', today);
            updateStarDisplay();
            
            // Add a simple check-in badge if it's their first time
            let badges = JSON.parse(localStorage.getItem('ss_badges') || '[]');
            if (!badges.includes('First Check-in')) {
                badges.push('First Check-in');
                localStorage.setItem('ss_badges', JSON.stringify(badges));
            }

            alert('Daily Check-in successful! +10 Stars 🌟');
        });
    }

    // 穿越 (Journey)
    if (ssBtnJourney) {
        ssBtnJourney.addEventListener('click', () => {
            journeyDestInput.value = '';
            journeyProgressArea.style.display = 'none';
            startJourneyBtn.style.display = 'block';
            
            // Populate companions
            journeyCompanionSelect.innerHTML = '<option value="">None (Solo Journey)</option>';
            contacts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.innerText = c.name;
                journeyCompanionSelect.appendChild(opt);
            });
            
            ssJourneyModal.style.display = 'flex';
        });
    }

    if (closeJourneyBtn) closeJourneyBtn.addEventListener('click', () => ssJourneyModal.style.display = 'none');

    if (startJourneyBtn) {
        startJourneyBtn.addEventListener('click', () => {
            const dest = journeyDestInput.value.trim();
            if (!dest) {
                alert('Please enter a destination.');
                return;
            }
            
            startJourneyBtn.style.display = 'none';
            journeyProgressArea.style.display = 'block';
            
            // Simulate journey
            setTimeout(() => {
                const rewardStars = Math.floor(Math.random() * 15) + 5; // 5-20 stars
                userStars += rewardStars;
                localStorage.setItem('user_stars', userStars);
                updateStarDisplay();
                
                const companionId = journeyCompanionSelect.value;
                let companionMsg = '';
                if (companionId) {
                    let cStars = JSON.parse(localStorage.getItem('ss_companion_stars') || '{}');
                    cStars[companionId] = (cStars[companionId] || 0) + 10; // Fixed 10 stars for companion
                    localStorage.setItem('ss_companion_stars', JSON.stringify(cStars));
                    
                    const c = contacts.find(x => x.id === companionId);
                    companionMsg = `\n${c ? c.name : 'Companion'} received 10 exclusive memory stars!`;
                }
                
                // Add a journey badge
                let badges = JSON.parse(localStorage.getItem('ss_badges') || '[]');
                const badgeName = 'Explorer: ' + dest;
                if (!badges.includes(badgeName)) {
                    badges.push(badgeName);
                    localStorage.setItem('ss_badges', JSON.stringify(badges));
                }

                alert(`Journey Complete! You earned ${rewardStars} stars. 🌟${companionMsg}`);
                ssJourneyModal.style.display = 'none';
            }, 3000);
        });
    }

    // 展馆 (Gallery)
    if (ssBtnGallery) {
        ssBtnGallery.addEventListener('click', () => {
            renderGallery();
            starSystemPage.style.display = 'none';
            ssGalleryPage.style.display = 'flex';
        });
    }

    if (closeGalleryBtn) {
        closeGalleryBtn.addEventListener('click', () => {
            ssGalleryPage.style.display = 'none';
            starSystemPage.style.display = 'flex';
        });
    }

    function renderGallery() {
        gallerySystemBadges.innerHTML = '';
        galleryCompanionMemories.innerHTML = '';
        
        const badges = JSON.parse(localStorage.getItem('ss_badges') || '[]');
        if (badges.length === 0) {
            gallerySystemBadges.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #888; font-size: 12px; padding: 20px;">No badges earned yet.</div>';
        } else {
            badges.forEach(b => {
                const el = document.createElement('div');
                el.className = 'badge-item';
                el.innerHTML = `
                    <i class='bx bxs-badge-check badge-icon'></i>
                    <div class="badge-name">${b}</div>
                `;
                gallerySystemBadges.appendChild(el);
            });
        }
        
        const cStars = JSON.parse(localStorage.getItem('ss_companion_stars') || '{}');
        let hasMemories = false;
        
        Object.keys(cStars).forEach(cId => {
            const c = contacts.find(x => x.id === cId);
            if (c && cStars[cId] > 0) {
                hasMemories = true;
                const el = document.createElement('div');
                el.className = 'companion-memory-item';
                el.innerHTML = `
                    <div class="cm-avatar" style="background-image: url('${c.avatar || ''}')"></div>
                    <div class="cm-info">
                        <div class="cm-name">${c.name}</div>
                        <div class="cm-stars"><i class='bx bxs-star'></i> ${cStars[cId]} Memory Stars</div>
                    </div>
                `;
                galleryCompanionMemories.appendChild(el);
            }
        });
        
        if (!hasMemories) {
            galleryCompanionMemories.innerHTML = '<div style="text-align: center; color: #888; font-size: 12px; padding: 20px;">No companion memories yet. Take a journey with someone!</div>';
        }
    }

    // 星星瓶 (Star Bottle)
    if (ssBtnBottle) {
        ssBtnBottle.addEventListener('click', () => {
            starSystemPage.style.display = 'none';
            bottleStarCount.innerText = userStars;
            renderBottleStars();
            ssBottlePage.style.display = 'flex';
        });
    }

    if (closeBottleBtn) {
        closeBottleBtn.addEventListener('click', () => {
            ssBottlePage.style.display = 'none';
            starSystemPage.style.display = 'flex';
        });
    }

    function renderBottleStars() {
        jarBodyContent.innerHTML = '';
        const jarWidth = 220;
        const jarHeight = 270; // 考虑顶部的边距
        
        // 限制最多渲染数量，防止卡顿，但展示一定密度
        const renderCount = Math.min(userStars, 150); 
        
        for (let i = 0; i < renderCount; i++) {
            const star = document.createElement('div');
            star.className = 'jar-star';
            
            // Randomize position within the jar
            // Keep them mostly at the bottom, building up
            const x = 10 + Math.random() * (jarWidth - 40);
            
            // Calculate y based on how full the jar should look
            // The more stars, the higher they can go
            const fullnessRatio = Math.min((i / 150), 1); 
            // Bottom is jarHeight, top is 20
            const yOffset = jarHeight - 25 - (Math.random() * (jarHeight * 0.8 * fullnessRatio));
            
            star.style.left = `${x}px`;
            star.style.top = `${yOffset}px`;
            
            // Randomize rotation
            const rot = Math.random() * 360;
            const scale = 0.5 + Math.random() * 0.5;
            star.style.transform = `rotate(${rot}deg) scale(${scale})`;
            
            jarBodyContent.appendChild(star);
        }
    }

    // Global method to access user stars
    window.getUserStars = () => parseInt(localStorage.getItem('user_stars')) || 0;
    window.deductUserStars = (amount) => {
        let stars = window.getUserStars();
        if (stars >= amount) {
            stars -= amount;
            localStorage.setItem('user_stars', stars);
            updateStarDisplay();
            return true;
        }
        return false;
    };


    // 暴露核心接口供其他文件调用
    window.ChatApp = {
        contacts: contacts,
        chatList: chatList,
        messagesData: messagesData,
        stickerGroups: stickerGroups,
        roleProfiles: roleProfiles,
        sendMsg: sendMsg,
        renderMessages: renderMessages,
        hideAllDrawers: hideAllDrawers,
        applyChatBackground: applyChatBackground,
        applyCustomCss: applyCustomCss
    };
    
});
