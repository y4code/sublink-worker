class BaseConfigBuilder {
    constructor(inputString, baseConfig, userAgent) {
        this.inputString = inputString;
        this.config = DeepCopy(baseConfig);
        this.userAgent = userAgent;
    }

    build() {
        const customItems = this.parseCustomItems();
        this.addCustomItems(customItems);
        return this.formatConfig();
    }

    parseCustomItems() {
        const urls = this.inputString.split('\n').filter(url => url.trim() !== '');
        const parsedItems = [];
        
        for (const url of urls) {
            // Try to decode if it might be base64
            let processedUrls = this.tryDecodeBase64(url);
            
            // Handle single URL or array of URLs
            if(!Array.isArray(processedUrls)){
                processedUrls = [processedUrls];
            }

            // Handle multiple URLs from a single base64 string
            for (const processedUrl of processedUrls) {
                const result = ProxyParser.parse(processedUrl, this.userAgent);
                if (Array.isArray(result)) {
                    for (const subUrl of result) {
                        const subResult = ProxyParser.parse(subUrl, this.userAgent);
                        if (subResult) {
                            parsedItems.push(subResult);
                        }
                    }
                } else if (result) {
                    parsedItems.push(result);
                }
            }
        }
        
        return parsedItems;
    }

    tryDecodeBase64(str) {
        // If the string already has a protocol prefix, return as is
        if (str.includes('://')) {
            return str;
        }

        try {
            // Try to decode as base64
            const decoded = decodeBase64(str);
            
            // Check if decoded content contains multiple links
            if (decoded.includes('\n')) {
                // Split by newline and filter out empty lines
                const multipleUrls = decoded.split('\n').filter(url => url.trim() !== '');
                
                // Check if at least one URL is valid
                if (multipleUrls.some(url => url.includes('://'))) {
                    return multipleUrls;
                }
            }
            
            // Check if the decoded string looks like a valid URL
            if (decoded.includes('://')) {
                return decoded;
            }
        } catch (e) {
            // If decoding fails, return original string
        }
        return str;
    }

    getProxies() {
        throw new Error('getProxies must be implemented in child class');
    }

    convertProxy(proxy) {
        throw new Error('convertProxy must be implemented in child class');
    }

    addProxyToConfig(proxy) {
        throw new Error('addProxyToConfig must be implemented in child class');
    }

    addCustomItems(customItems) {
        const validItems = customItems.filter(item => item != null);
        validItems.forEach(item => {
            if (item?.tag) {
                const convertedProxy = this.convertProxy(item);
                if (convertedProxy) {
                    this.addProxyToConfig(convertedProxy);
                }
            }
        });
    }

    formatConfig() {
        throw new Error('formatConfig must be implemented in child class');
    }
}
