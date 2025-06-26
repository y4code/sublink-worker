const inputLinks = document.getElementById('inputLinks');
const convertButton = document.getElementById('convertButton');
const outputConfig = document.getElementById('outputConfig');
const errorMessage = document.getElementById('errorMessage');
const copyButton = document.getElementById('copyButton');

convertButton.addEventListener('click', async () => {
    const inputText = inputLinks.value.trim();
    if (!inputText) {
        errorMessage.textContent = '请输入链接！';
        return;
    }

    // Clear previous results and errors
    outputConfig.querySelector('code').textContent = '正在转换...';
    errorMessage.textContent = '';
    convertButton.disabled = true;
    copyButton.style.display = 'none';

    try {
        // Use a generic user-agent for the browser
        const userAgent = navigator.userAgent;
        let configBuilder = new ClashConfigBuilder(inputText, userAgent);
        const config = configBuilder.build();
        
        outputConfig.querySelector('code').textContent = config;
        copyButton.style.display = 'block';

    } catch (error) {
        console.error('转换失败:', error);
        errorMessage.textContent = `发生错误: ${error.message}`;
        outputConfig.querySelector('code').textContent = '转换失败。';
    } finally {
        convertButton.disabled = false;
    }
});

copyButton.addEventListener('click', () => {
    const configText = outputConfig.querySelector('code').textContent;
    navigator.clipboard.writeText(configText).then(() => {
        copyButton.textContent = '已复制！';
        setTimeout(() => {
            copyButton.textContent = '复制配置';
        }, 2000);
    }).catch(err => {
        console.error('复制失败: ', err);
        alert('无法复制到剪贴板。');
    });
}); 