// features.js
// 这是一个专门为你准备的功能扩展文件！

document.addEventListener('DOMContentLoaded', () => {
    console.log("扩展功能模块已成功加载！当前消息数据:", window.ChatApp.messagesData);

    // ==========================================
    // 1. 数据导出与导入功能
    // ==========================================
    const backupBtn = document.getElementById('nav-backup-data');
    const importBtn = document.getElementById('nav-import-data');
    const importInput = document.getElementById('upload-import-data');

    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            const keysToBackup = [
                'chat_contacts', 'chat_list', 'chat_messages', 'chat_sticker_groups', 'chat_role_profiles', 'chat_worldbooks',
                'api_settings', 'nai_settings', 'selectedWallpaper', 'customFontFamily', 'customFontUrl', 'customFontDataUrl',
                'image-target-avatar-1', 'image-target-avatar-2', 'image-target-top-1', 'image-target-top-2', 'image-target-top-3',
                'image-target-main-photo', 'profile-widget-bg', 'editable-text-1', 'editable-text-2'
            ];
            
            // Add custom icons
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('custom-icon-')) {
                    keysToBackup.push(key);
                }
            }

            const backupData = {};
            keysToBackup.forEach(key => {
                const val = localStorage.getItem(key);
                if (val !== null) {
                    backupData[key] = val;
                }
            });

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "ai_home_screen_backup_" + new Date().getTime() + ".json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    }

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            importInput.click();
        });

        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (confirm('导入将覆盖当前所有数据，是否继续？')) {
                        // Clear existing data? Or just overwrite? We'll overwrite and clear missing keys to be clean
                        localStorage.clear();
                        Object.keys(importedData).forEach(key => {
                            try {
                                localStorage.setItem(key, importedData[key]);
                            } catch(err) {
                                console.error('Error setting item', key, err);
                            }
                        });
                        alert('导入成功，即将刷新页面！');
                        window.location.reload();
                    }
                } catch (err) {
                    alert('文件解析失败，请确保导入的是有效的JSON备份文件。');
                }
                e.target.value = ''; // Reset input
            };
            reader.readAsText(file);
        });
    }


    // ==========================================
    // 1.5 仿真文字图生成器 (Canvas)
    // ==========================================
    window.generateTextImgCover = function() {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // 背景：深灰到纯黑渐变
        const gradient = ctx.createLinearGradient(0, 0, 400, 400);
        gradient.addColorStop(0, '#2c2c2c');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 400);

        // 添加一些噪点质感
        const imgData = ctx.getImageData(0, 0, 400, 400);
        for(let i = 0; i < imgData.data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 15;
            imgData.data[i] += noise;
            imgData.data[i+1] += noise;
            imgData.data[i+2] += noise;
        }
        ctx.putImageData(imgData, 0, 0);

        // 装饰元素：顶部线与文字
        ctx.fillStyle = '#888888';
        ctx.fillRect(40, 40, 320, 2);
        
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText('ENCRYPTED FILE // CONFIDENTIAL', 40, 60);

        // 中间大字警告
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.font = 'bold 36px "Courier New", Courier, monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('CLASSIFIED', 200, 180);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('CONTENT IS HIDDEN FOR SECURITY', 200, 210);

        // 底部条形码模拟
        ctx.fillStyle = '#555555';
        for(let i = 0; i < 40; i++) {
            const w = Math.random() * 5 + 1;
            const x = 50 + i * 7.5;
            if(x > 350) break;
            ctx.fillRect(x, 320, w, 30);
        }

        ctx.font = '10px Courier';
        ctx.fillText('TAP TO DECRYPT AND VIEW', 200, 370);

        return canvas.toDataURL('image/jpeg', 0.8);
    };

    // ==========================================
    // 1.8 星星/礼物系统逻辑
    // ==========================================
    
    // 默认礼物列表 - Ins 风
    const defaultGifts = [
        { id: 'g_1', name: '玫瑰', price: 1, icon: 'https://img.icons8.com/color/96/000000/rose.png' },
        { id: 'g_2', name: '拿铁', price: 2, icon: 'https://img.icons8.com/color/96/000000/boba-cup.png' },
        { id: 'g_3', name: '马卡龙', price: 3, icon: 'https://img.icons8.com/color/96/000000/macaron.png' },
        { id: 'g_4', name: '钻戒', price: 5, icon: 'https://img.icons8.com/color/96/000000/diamond-ring.png' }
    ];
    
    let customGifts = JSON.parse(localStorage.getItem('chat_custom_gifts') || '[]');
    let allGifts = [...defaultGifts, ...customGifts];

    const giftDrawerGrid = document.getElementById('gift-drawer-grid');
    const starBalanceAmount = document.getElementById('star-balance-amount');
    
    // 更新余额显示
    function updateStarBalanceDisplay() {
        if (starBalanceAmount) {
            // Get balance from global system
            const balance = window.getUserStars ? window.getUserStars() : (parseInt(localStorage.getItem('user_stars')) || 0);
            starBalanceAmount.innerText = balance;
        }
    }

    // 渲染礼物抽屉
    window.renderGiftDrawer = function() {
        updateStarBalanceDisplay();
        if (!giftDrawerGrid) return;
        
        giftDrawerGrid.innerHTML = '';
        allGifts.forEach(gift => {
            const el = document.createElement('div');
            el.className = 'gift-item';
            el.innerHTML = `
                <div class="gift-icon" style="background-image: url('${gift.icon}')"></div>
                <div class="gift-name">${gift.name}</div>
                <div class="gift-price"><i class='bx bxs-star'></i> ${gift.price}</div>
            `;
            el.addEventListener('click', () => {
                sendGift(gift);
            });
            giftDrawerGrid.appendChild(el);
        });
    };

    function sendGift(gift) {
        const currentBalance = window.getUserStars ? window.getUserStars() : (parseInt(localStorage.getItem('user_stars')) || 0);
        
        if (currentBalance < gift.price) {
            alert(`星星不足！当前余额: ${currentBalance} ⭐\n需要: ${gift.price} ⭐\n去【星星系统】签到或完成任务获取更多星星吧！`);
            return;
        }
        
        // 扣除余额
        if (window.deductUserStars) {
            window.deductUserStars(gift.price);
        } else {
            localStorage.setItem('user_stars', currentBalance - gift.price);
        }
        updateStarBalanceDisplay();
        
        // 发送特定格式的送礼消息
        if (window.ChatApp && window.ChatApp.sendMsg) {
            window.ChatApp.sendMsg('me', `[送礼:${gift.name}:${gift.price}:${gift.icon}]`);
        }
        if (window.ChatApp && window.ChatApp.hideAllDrawers) {
            window.ChatApp.hideAllDrawers();
        }
    }

    // 添加自定义礼物交互
    const addCustomGiftBtn = document.getElementById('add-custom-gift-btn');
    const addGiftModal = document.getElementById('add-gift-modal');
    const closeAddGiftBtn = document.getElementById('close-add-gift-btn');
    const saveCustomGiftBtn = document.getElementById('save-custom-gift-btn');
    const uploadCustomGiftImg = document.getElementById('upload-custom-gift-img');
    const customGiftPreview = document.getElementById('custom-gift-preview');
    
    let tempGiftImgBase64 = '';

    if (addCustomGiftBtn) {
        addCustomGiftBtn.addEventListener('click', () => {
            tempGiftImgBase64 = '';
            document.getElementById('custom-gift-name').value = '';
            document.getElementById('custom-gift-price').value = '';
            customGiftPreview.style.backgroundImage = 'none';
            customGiftPreview.innerHTML = "<i class='bx bx-camera'></i>";
            if (addGiftModal) addGiftModal.style.display = 'flex';
        });
    }

    if (closeAddGiftBtn) {
        closeAddGiftBtn.addEventListener('click', () => {
            if (addGiftModal) addGiftModal.style.display = 'none';
        });
    }

    // 点击外部阴影关闭弹窗
    document.querySelectorAll('.ui-modal-bg').forEach(bg => {
        bg.addEventListener('click', () => {
            if (addGiftModal) addGiftModal.style.display = 'none';
        });
    });

    if (uploadCustomGiftImg) {
        uploadCustomGiftImg.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                tempGiftImgBase64 = event.target.result;
                customGiftPreview.style.backgroundImage = `url('${tempGiftImgBase64}')`;
                customGiftPreview.innerHTML = ''; // 移除图标
            };
            reader.readAsDataURL(file);
        });
    }

    if (saveCustomGiftBtn) {
        saveCustomGiftBtn.addEventListener('click', () => {
            const name = document.getElementById('custom-gift-name').value.trim();
            const priceVal = document.getElementById('custom-gift-price').value;
            const price = parseInt(priceVal, 10);

            if (!name) { alert('请输入礼物名称'); return; }
            if (isNaN(price) || price < 0) { alert('请输入有效的价格'); return; }
            if (!tempGiftImgBase64) { alert('请上传礼物图片'); return; }

            const newGift = {
                id: 'cg_' + Date.now(),
                name: name,
                price: price,
                icon: tempGiftImgBase64
            };

            customGifts.push(newGift);
            localStorage.setItem('chat_custom_gifts', JSON.stringify(customGifts));
            
            allGifts = [...defaultGifts, ...customGifts];
            
            if (addGiftModal) addGiftModal.style.display = 'none';
            window.renderGiftDrawer();
        });
    }

    // ==========================================
    // 2. NAI/文字图 生图设置与生成
    // ==========================================
    const naiSettingsNav = document.getElementById('nav-nai-settings');
    const naiSettingsPage = document.getElementById('nai-settings-page');
    const closeNaiBtn = document.getElementById('close-nai-settings-btn');
    const saveNaiBtn = document.getElementById('save-nai-btn');

    const modeSelect = document.getElementById('nai-mode-select');
    const apiKeyInput = document.getElementById('nai-api-key');
    const presetSelect = document.getElementById('nai-preset-select');
    const presetNameInput = document.getElementById('nai-preset-name');
    const promptInput = document.getElementById('nai-prompt');
    const negPromptInput = document.getElementById('nai-negative-prompt');
    const savePresetBtn = document.getElementById('nai-save-preset-btn');
    const delPresetBtn = document.getElementById('nai-del-preset-btn');

    let naiSettings = JSON.parse(localStorage.getItem('nai_settings') || '{"mode":"text", "apiKey":"", "presets":{}, "currentPreset":""}');

    function updateNaiUI() {
        if (!modeSelect) return;
        const isNai = modeSelect.value === 'nai';
        if (apiKeyInput) apiKeyInput.closest('.api-input-group').style.display = isNai ? 'flex' : 'none';
        if (presetSelect) presetSelect.closest('.api-input-group').style.display = isNai ? 'flex' : 'none';
        if (presetNameInput) presetNameInput.closest('.api-input-group').style.display = isNai ? 'flex' : 'none';
        if (promptInput) promptInput.closest('.api-input-group').style.display = isNai ? 'flex' : 'none';
        if (negPromptInput) negPromptInput.closest('.api-input-group').style.display = isNai ? 'flex' : 'none';
    }

    function loadNaiSettings() {
        modeSelect.value = naiSettings.mode || 'text';
        apiKeyInput.value = naiSettings.apiKey || '';
        renderPresets();
        updateNaiUI();
    }

    if (modeSelect) {
        modeSelect.addEventListener('change', updateNaiUI);
    }

    function renderPresets() {
        presetSelect.innerHTML = '<option value="">默认预设</option>';
        if (naiSettings.presets) {
            Object.keys(naiSettings.presets).forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.innerText = name;
                presetSelect.appendChild(opt);
            });
        }
        presetSelect.value = naiSettings.currentPreset || '';
        loadPreset(naiSettings.currentPreset);
    }

    function loadPreset(name) {
        if (!name || !naiSettings.presets || !naiSettings.presets[name]) {
            promptInput.value = '';
            negPromptInput.value = '';
            presetNameInput.value = '';
            return;
        }
        const p = naiSettings.presets[name];
        promptInput.value = p.prompt || '';
        negPromptInput.value = p.negative_prompt || '';
        presetNameInput.value = name;
    }

    if (naiSettingsNav) {
        naiSettingsNav.addEventListener('click', () => {
            loadNaiSettings();
            naiSettingsPage.style.display = 'flex';
        });
    }
    if (closeNaiBtn) closeNaiBtn.addEventListener('click', () => naiSettingsPage.style.display = 'none');

    if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
            loadPreset(e.target.value);
        });
    }

    if (savePresetBtn) {
        savePresetBtn.addEventListener('click', () => {
            const name = presetNameInput.value.trim();
            if (!name) { alert('请输入预设名称'); return; }
            if (!naiSettings.presets) naiSettings.presets = {};
            naiSettings.presets[name] = {
                prompt: promptInput.value.trim(),
                negative_prompt: negPromptInput.value.trim()
            };
            naiSettings.currentPreset = name;
            renderPresets();
            alert('预设保存成功');
        });
    }

    if (delPresetBtn) {
        delPresetBtn.addEventListener('click', () => {
            const name = presetSelect.value;
            if (!name) return;
            if (naiSettings.presets && naiSettings.presets[name]) {
                delete naiSettings.presets[name];
                naiSettings.currentPreset = '';
                renderPresets();
            }
        });
    }

    if (saveNaiBtn) {
        saveNaiBtn.addEventListener('click', () => {
            naiSettings.mode = modeSelect.value;
            naiSettings.apiKey = apiKeyInput.value.trim();
            // Don't auto-save preset on main save unless intended, but we save current selection
            naiSettings.currentPreset = presetSelect.value;
            localStorage.setItem('nai_settings', JSON.stringify(naiSettings));
            naiSettingsPage.style.display = 'none';
        });
    }

    // This function will be called by app.js when an AI message like [发送图片:xxx] is encountered
    window.handleAIGenerateImage = async function(description, callback) {
        // Refresh settings
        const settings = JSON.parse(localStorage.getItem('nai_settings') || '{"mode":"text", "apiKey":""}');
        const mode = settings.mode || 'text';
        
        if (mode === 'text') {
            // 文字图替代
            callback(`[文字图:【AI生图内容描述】\n${description}]`);
            return;
        }

        // NAI 生图模式
        const key = settings.apiKey;
        if (!key) {
            callback(`[文字图:【生图失败】\nNAI API Key 未配置，无法生成图片: ${description}]`);
            return;
        }

        let basePrompt = '';
        let negPrompt = 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry';
        
        if (settings.currentPreset && settings.presets && settings.presets[settings.currentPreset]) {
            basePrompt = settings.presets[settings.currentPreset].prompt || '';
            if (settings.presets[settings.currentPreset].negative_prompt) {
                negPrompt = settings.presets[settings.currentPreset].negative_prompt;
            }
        }

        const finalPrompt = basePrompt ? `${basePrompt}, ${description}` : description;

        try {
            // NAI v3 parameters
            const payload = {
                input: finalPrompt,
                model: "nai-diffusion-3",
                action: "generate",
                parameters: {
                    negative_prompt: negPrompt,
                    width: 832,
                    height: 1216,
                    scale: 1,
                    sampler: "k_euler",
                    steps: 28,
                    seed: Math.floor(Math.random() * 4294967295),
                    n_samples: 1,
                    ucPreset: 0,
                    qualityToggle: true,
                    sm: false,
                    sm_dyn: false,
                    dynamic_thresholding: false,
                    controlnet_strength: 1,
                    legacy: false,
                    add_original_image: false,
                    uncond_scale: 1,
                    cfg_rescale: 0,
                    noise_schedule: "native"
                }
            };

            const response = await fetch('https://api.novelai.net/ai/generate-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`NAI API Error: ${response.status} - ${err}`);
            }

            // NAI returns a zip file containing the image(s)
            const arrayBuffer = await response.arrayBuffer();
            
            // Basic zip extraction (NAI usually puts the image as the first file)
            // Instead of importing a complex zip library, we can look for the PNG magic numbers or just use a small zip parser.
            // Actually, for browser environments without a zip library, parsing a zip manually from an ArrayBuffer:
            // Local file header signature = 0x04034b50
            const bytes = new Uint8Array(arrayBuffer);
            
            // Search for PNG header: 89 50 4E 47 0D 0A 1A 0A
            const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
            let startIndex = -1;
            
            for (let i = 0; i < bytes.length - pngHeader.length; i++) {
                let match = true;
                for (let j = 0; j < pngHeader.length; j++) {
                    if (bytes[i+j] !== pngHeader[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    startIndex = i;
                    break;
                }
            }

            if (startIndex === -1) {
                throw new Error('未在返回数据中找到PNG图片');
            }

            // Extract the PNG file data. The PNG chunk ends with IEND chunk: 49 45 4E 44 AE 42 60 82
            const iendChunk = [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82];
            let endIndex = -1;
            for (let i = startIndex; i < bytes.length - iendChunk.length; i++) {
                let match = true;
                for (let j = 0; j < iendChunk.length; j++) {
                    if (bytes[i+j] !== iendChunk[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    endIndex = i + iendChunk.length;
                    break;
                }
            }

            if (endIndex === -1) endIndex = bytes.length; // fallback

            const imageBytes = bytes.slice(startIndex, endIndex);
            
            // Convert to base64
            let binary = '';
            for (let i = 0; i < imageBytes.byteLength; i++) {
                binary += String.fromCharCode(imageBytes[i]);
            }
            const base64 = window.btoa(binary);
            const dataUrl = `data:image/png;base64,${base64}`;

            // We need to compress it so localStorage doesn't blow up too fast
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 800; // max size to save space
                if (width > height) {
                    if (width > maxDim) { height *= maxDim / width; width = maxDim; }
                } else {
                    if (height > maxDim) { width *= maxDim / height; height = maxDim; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
                callback(`<img src="${compressedUrl}" class="chat-sent-image" style="max-width:200px; border-radius:12px;" alt="[AI Generated Image]">`);
            };
            img.src = dataUrl;

        } catch (error) {
            console.error(error);
            callback(`[文字图:【生图出错】\n${error.message}\n描述: ${description}]`);
        }
    };
});
