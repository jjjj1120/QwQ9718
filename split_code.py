import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract CSS
css_match = re.search(r'<style>\s*(:root.*?)</style>', content, re.DOTALL)
if css_match:
    css_content = css_match.group(1)
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css_content.strip() + '\n')
    # Replace style in HTML
    content = content[:css_match.start(0)] + '<link rel="stylesheet" href="style.css">' + content[css_match.end(0):]

# Extract JS
js_match = re.search(r'<script>\s*(// JavaScript部分与上一版完全相同，无需改动.*?)</script>', content, re.DOTALL)
if js_match:
    js_content = js_match.group(1)
    
    # Expose global variables at the end of DOMContentLoaded
    global_expose = """
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
    """
    
    # Insert global_expose before the last line of js_content (});)
    js_lines = js_content.split('\n')
    js_lines.insert(-2, global_expose)
    js_content = '\n'.join(js_lines)
    
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(js_content.strip() + '\n')
    
    # Replace script in HTML
    content = content[:js_match.start(0)] + '<script src="app.js"></script>\n<script src="features.js"></script>' + content[js_match.end(0):]

# Write updated HTML
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# Write features.js
features_js = """// features.js
// 这是一个专门为你准备的功能扩展文件！
// 由于所有的核心数据和方法都已经挂载到了 window.ChatApp 上，
// 你可以直接在这个文件里编写全新的代码，完全不用担心把主文件弄乱。

document.addEventListener('DOMContentLoaded', () => {
    // 打印测试，确保它能拿到核心数据
    console.log("扩展功能模块已成功加载！当前消息数据:", window.ChatApp.messagesData);
    
    // 你可以像这样测试发送一条消息（取消下方注释即可看到效果）：
    // setTimeout(() => {
    //     if (window.ChatApp.sendMsg) {
    //         // 注意：需要先点进一个聊天框才会生效
    //         // window.ChatApp.sendMsg('me', '我在用新文件发消息！');
    //     }
    // }, 2000);
});
"""
with open('features.js', 'w', encoding='utf-8') as f:
    f.write(features_js)
