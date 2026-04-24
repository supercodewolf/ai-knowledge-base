// ==================== AI Knowledge Base Q&A ====================

class KnowledgeBase {
    constructor() {
        // State
        this.documents = [];
        this.messages = [];
        this.isLoading = false;
        
        // API 服务商配置
        this.apiProviders = {
            'openai': {
                name: 'OpenAI',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                models: [
                    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (推荐)' },
                    { id: 'gpt-4', name: 'GPT-4' },
                    { id: 'gpt-4o', name: 'GPT-4o' }
                ]
            },
            'siliconflow': {
                name: '硅基流动 (SiliconFlow)',
                endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
                models: [
                    { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B (推荐)' },
                    { id: 'Qwen/Qwen2.5-14B-Instruct', name: 'Qwen2.5-14B' },
                    { id: 'deepseek-ai/DeepSeek-V2.5', name: 'DeepSeek V2.5' }
                ]
            },
            'zhipu': {
                name: '智谱 AI (GLM)',
                endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                models: [
                    { id: 'glm-4', name: 'GLM-4 (推荐)' },
                    { id: 'glm-4-flash', name: 'GLM-4-Flash' }
                ]
            },
            'baidu': {
                name: '百度文心一言',
                endpoint: 'https://qianfan.baidubce.com/v2/app/conversation',
                models: [
                    { id: 'eb-instant', name: 'ERNIE-Speed (推荐)' },
                    { id: 'ernie-3.5-8k', name: 'ERNIE-3.5' }
                ]
            },
            'aliyun': {
                name: '阿里通义千问',
                endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
                models: [
                    { id: 'qwen-turbo', name: 'Qwen-Turbo (推荐)' },
                    { id: 'qwen-plus', name: 'Qwen-Plus' }
                ]
            },
            'deepseek': {
                name: 'DeepSeek',
                endpoint: 'https://api.deepseek.com/v1/chat/completions',
                models: [
                    { id: 'deepseek-chat', name: 'DeepSeek Chat (推荐)' }
                ]
            },
            'azure': {
                name: 'Azure OpenAI',
                endpoint: '',
                models: [
                    { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo' },
                    { id: 'gpt-4', name: 'GPT-4' }
                ]
            }
        };
        
        // 当前选中的服务商
        this.currentProvider = localStorage.getItem('kb_provider') || 'openai';
        
        // Settings
        this.settings = {
            apiEndpoint: localStorage.getItem('kb_api_endpoint') || this.apiProviders[this.currentProvider].endpoint,
            apiKey: localStorage.getItem('kb_api_key') || '',
            model: localStorage.getItem('kb_model') || this.apiProviders[this.currentProvider].models[0]?.id
        };
        
        // DOM Elements
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.documentsList = document.getElementById('documentsList');
        this.qaMessages = document.getElementById('qaMessages');
        this.questionInput = document.getElementById('questionInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearAllDocs = document.getElementById('clearAllDocs');
        this.docCount = document.getElementById('docCount');
        this.totalChars = document.getElementById('totalChars');
        this.settingsModal = document.getElementById('settingsModal');
        this.exampleQuestions = document.querySelectorAll('.example-q');
        
        this.init();
    }
    
    init() {
        this.loadDocuments();
        this.initEventListeners();
        this.initSettings();
        this.updateStats();
    }
    
    // ==================== Event Listeners ====================
    initEventListeners() {
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('dragover');
        });
        
        this.uploadZone.addEventListener('dragleave', () => {
            this.uploadZone.classList.remove('dragover');
        });
        
        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        
        this.questionInput.addEventListener('input', () => {
            this.autoResize();
            this.updateSendButton();
        });
        
        this.questionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.askQuestion();
            }
        });
        
        this.sendBtn.addEventListener('click', () => this.askQuestion());
        this.clearAllDocs.addEventListener('click', () => this.clearAllDocuments());
        
        this.exampleQuestions.forEach(btn => {
            btn.addEventListener('click', () => {
                this.questionInput.value = btn.dataset.question;
                this.autoResize();
                this.updateSendButton();
                this.askQuestion();
            });
        });
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.closeSettings();
        });
        
        // Provider change
        const providerSelect = document.getElementById('providerSelect');
        providerSelect.addEventListener('change', () => {
            this.currentProvider = providerSelect.value;
            this.updateModelOptions();
            this.updateEndpointField();
        });
    }
    
    updateModelOptions() {
        const provider = this.apiProviders[this.currentProvider];
        const modelSelect = document.getElementById('modelSelect');
        
        modelSelect.innerHTML = provider.models.map(m => 
            `<option value="${m.id}">${m.name}</option>`
        ).join('');
        
        if (provider.models.length > 0) {
            modelSelect.value = provider.models[0].id;
        }
    }
    
    updateEndpointField() {
        const provider = this.apiProviders[this.currentProvider];
        const endpointInput = document.getElementById('apiEndpoint');
        
        if (this.currentProvider === 'azure') {
            endpointInput.placeholder = '输入 Azure 端点 URL';
            endpointInput.value = '';
        } else {
            endpointInput.placeholder = provider.endpoint;
            endpointInput.value = provider.endpoint;
        }
    }
    
    // ==================== File Handling ====================
    async handleFiles(files) {
        const validTypes = ['text/plain', 'text/markdown', 'text/html', 'application/pdf'];
        
        for (const file of files) {
            // 支持 PDF 文件
            const isPDF = file.type === 'application/pdf' || file.name.match(/\.pdf$/i);
            const isValidText = validTypes.includes(file.type) || file.name.match(/\.(txt|md|html)$/i);
            
            if (!isValidText && !isPDF) {
                this.showToast(`不支持的文件类型: ${file.name}`);
                continue;
            }
            
            try {
                this.showUploadProgress(true);
                const content = await this.readFile(file);
                
                // 判断文件类型
                let fileType = file.type;
                if (!fileType && file.name.match(/\.pdf$/i)) {
                    fileType = 'application/pdf';
                } else if (!fileType) {
                    fileType = 'text/plain';
                }
                
                console.log('文档内容预览:', content.substring(0, 200), '...');
                console.log('总字符数:', content.length);
                
                this.addDocument({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    type: fileType,
                    size: file.size,
                    content: content,
                    createdAt: Date.now()
                });
                this.showUploadProgress(false);
                this.showToast(`成功上传: ${file.name}`);
            } catch (error) {
                this.showUploadProgress(false);
                this.showToast(`读取文件失败: ${error.message}`);
            }
        }
    }
    
    readFile(file) {
        return new Promise((resolve, reject) => {
            // PDF 文件需要特殊处理
            if (file.type === 'application/pdf' || file.name.match(/\.pdf$/i)) {
                this.extractPDFText(file).then(resolve).catch(reject);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    async extractPDFText(file) {
        try {
            // 确保 pdf.js 已加载
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js 库未加载，请刷新页面重试');
            }
            
            // 设置 PDF.js worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            console.log(`PDF 共有 ${pdf.numPages} 页`);
            
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                // 使用正确的属性提取文本
                const pageText = textContent.items
                    .map(item => item.str || '')
                    .filter(str => str.trim())
                    .join(' ');
                fullText += `【第${i}页】\n${pageText}\n\n`;
            }
            
            console.log('PDF 提取内容预览:', fullText.substring(0, 500));
            
            if (!fullText.trim() || fullText.length < 50) {
                throw new Error('无法提取PDF文本内容（可能是扫描版PDF或受保护）');
            }
            
            return fullText;
        } catch (error) {
            console.error('PDF 解析错误:', error);
            throw new Error('无法解析PDF文件: ' + error.message);
        }
    }
    
    showUploadProgress(show) {
        this.uploadProgress.classList.toggle('active', show);
    }
    
    // ==================== Document Management ====================
    addDocument(doc) {
        this.documents.push(doc);
        this.saveDocuments();
        this.renderDocuments();
        this.updateStats();
    }
    
    deleteDocument(id) {
        this.documents = this.documents.filter(d => d.id !== id);
        this.saveDocuments();
        this.renderDocuments();
        this.updateStats();
        this.showToast('文档已删除');
    }
    
    clearAllDocuments() {
        if (this.documents.length === 0) return;
        
        if (confirm('确定要删除所有文档吗？此操作不可恢复。')) {
            this.documents = [];
            this.saveDocuments();
            this.renderDocuments();
            this.updateStats();
            this.showToast('所有文档已删除');
        }
    }
    
    renderDocuments() {
        if (this.documents.length === 0) {
            this.documentsList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>暂无文档</p>
                    <span>上传文档开始构建知识库</span>
                </div>
            `;
            return;
        }
        
        this.documentsList.innerHTML = this.documents.map(doc => `
            <div class="document-card" data-id="${doc.id}">
                <div class="doc-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                </div>
                <div class="doc-info">
                    <div class="doc-name">${this.escapeHtml(doc.name)}</div>
                    <div class="doc-meta">${this.formatSize(doc.size)}</div>
                </div>
                <button class="doc-delete" onclick="kb.deleteDocument('${doc.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }
    
    updateStats() {
        this.docCount.textContent = this.documents.length;
        const totalChars = this.documents.reduce((sum, doc) => sum + doc.content.length, 0);
        this.totalChars.textContent = this.formatNumber(totalChars);
    }
    
    // ==================== Q&A Functions ====================
    async askQuestion() {
        const question = this.questionInput.value.trim();
        if (!question || this.isLoading) return;
        
        if (this.documents.length === 0) {
            this.showToast('请先上传文档');
            return;
        }
        
        if (!this.settings.apiKey) {
            this.showToast('请先配置API Key');
            return;
        }
        
        const welcome = this.qaMessages.querySelector('.welcome-message');
        if (welcome) welcome.style.display = 'none';
        
        this.addMessage('user', question);
        this.questionInput.value = '';
        this.autoResize();
        this.updateSendButton();
        
        this.isLoading = true;
        this.updateSendButton();
        this.showLoading();
        
        try {
            const context = this.getRelevantContext(question);
            const answer = await this.callAI(question, context);
            
            this.hideLoading();
            this.addMessage('assistant', answer, context.sources);
        } catch (error) {
            this.hideLoading();
            this.addMessage('assistant', `抱歉，发生了错误：${error.message}`);
        }
        
        this.isLoading = false;
        this.updateSendButton();
    }
    
    getRelevantContext(question) {
        const questionWords = question.toLowerCase().split(/\s+/);
        const allChunks = [];
        const sources = [];
        
        this.documents.forEach(doc => {
            // 按句子分割，而不是按段落
            const sentences = doc.content.split(/[。！？\n]+/).filter(c => c.trim().length > 10);
            
            sentences.forEach(chunk => {
                const chunkLower = chunk.toLowerCase();
                let relevance = 0;
                
                // 关键词匹配
                questionWords.forEach(word => {
                    if (chunkLower.includes(word)) {
                        relevance += 2;
                    }
                });
                
                // 如果问题很短，尝试匹配整个内容
                if (question.length < 10 && chunkLower.includes(question.toLowerCase())) {
                    relevance += 10;
                }
                
                if (relevance > 0 || this.documents.length <= 2) {
                    allChunks.push({ text: chunk, score: relevance });
                }
            });
        });
        
        // 如果没有匹配的，至少返回前几个内容块
        if (allChunks.length === 0) {
            this.documents.forEach(doc => {
                const shortChunks = doc.content.split(/[。！？\n]+/).filter(c => c.trim().length > 10);
                shortChunks.slice(0, 3).forEach(chunk => {
                    allChunks.push({ text: chunk, score: 0 });
                });
            });
        }
        
        allChunks.sort((a, b) => b.score - a.score);
        const topChunks = allChunks.slice(0, 8);
        
        console.log('找到相关内容块:', topChunks.length);
        console.log('上下文预览:', topChunks.map(c => c.text).join('\n\n').substring(0, 300));
        
        return {
            text: topChunks.map(c => c.text).join('\n\n'),
            sources: sources.slice(0, 3)
        };
    }
    
    async callAI(question, context) {
        const systemPrompt = `你是一个专业的知识库问答助手。你的任务是基于提供的文档内容回答用户的问题。

重要规则：
1. 只使用提供的文档内容来回答问题
2. 如果文档中没有相关信息，明确告知用户
3. 回答要准确、简洁、有条理
4. 如果需要，可以引用文档中的原话
5. 用简体中文回答`;

        const userPrompt = `文档内容：
${context.text}

用户问题：${question}

请根据以上文档内容回答用户的问题。`;

        const response = await fetch(this.settings.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.apiKey}`
            },
            body: JSON.stringify({
                model: this.settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1500
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API请求失败 (${response.status})`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
    
    addMessage(role, content, sources = []) {
        const message = {
            id: Date.now().toString(),
            role,
            content,
            sources,
            timestamp: Date.now()
        };
        
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }
    
    renderMessage(message) {
        const div = document.createElement('div');
        div.className = `message ${message.role}`;
        
        const formattedContent = this.formatContent(message.content);
        const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        let sourcesHtml = '';
        if (message.sources && message.sources.length > 0 && message.role === 'assistant') {
            sourcesHtml = `
                <div class="sources">
                    <div class="sources-title">参考来源</div>
                    ${message.sources.map(s => `
                        <div class="source-item">
                            <strong>${this.escapeHtml(s.documentName)}</strong>: 
                            ${this.escapeHtml(s.chunk.substring(0, 100))}...
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        div.innerHTML = `
            <div class="message-bubble">
                <div class="message-content">${formattedContent}</div>
                ${sourcesHtml}
                <div class="message-time">${time}</div>
            </div>
        `;
        
        this.qaMessages.appendChild(div);
    }
    
    formatContent(content) {
        return content
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .split('\n\n')
            .map(p => `<p>${p}</p>`)
            .join('');
    }
    
    showLoading() {
        const div = document.createElement('div');
        div.className = 'message assistant';
        div.id = 'loadingIndicator';
        div.innerHTML = `
            <div class="message-bubble">
                <div class="loading-indicator">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
            </div>
        `;
        this.qaMessages.appendChild(div);
        this.scrollToBottom();
    }
    
    hideLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) loading.remove();
    }
    
    // ==================== UI Helpers ====================
    autoResize() {
        this.questionInput.style.height = 'auto';
        this.questionInput.style.height = Math.min(this.questionInput.scrollHeight, 120) + 'px';
    }
    
    updateSendButton() {
        const hasContent = this.questionInput.value.trim().length > 0;
        const hasDocs = this.documents.length > 0;
        this.sendBtn.disabled = !hasContent || this.isLoading || !hasDocs;
        this.sendBtn.classList.toggle('loading', this.isLoading);
    }
    
    scrollToBottom() {
        this.qaMessages.scrollTop = this.qaMessages.scrollHeight;
    }
    
    // ==================== Settings ====================
    initSettings() {
        document.getElementById('providerSelect').value = this.currentProvider;
        document.getElementById('apiEndpoint').value = this.settings.apiEndpoint;
        document.getElementById('apiEndpoint').placeholder = this.apiProviders[this.currentProvider].endpoint;
        document.getElementById('apiKey').value = this.settings.apiKey;
        document.getElementById('modelSelect').value = this.settings.model;
        
        this.updateModelOptions();
    }
    
    openSettings() {
        // 每次打开时从 localStorage 读取最新保存的值
        this.currentProvider = localStorage.getItem('kb_provider') || 'openai';
        this.settings.apiEndpoint = localStorage.getItem('kb_api_endpoint') || this.apiProviders[this.currentProvider].endpoint;
        this.settings.apiKey = localStorage.getItem('kb_api_key') || '';
        this.settings.model = localStorage.getItem('kb_model') || this.apiProviders[this.currentProvider].models[0]?.id;
        
        // 更新表单值
        document.getElementById('providerSelect').value = this.currentProvider;
        document.getElementById('apiEndpoint').value = this.settings.apiEndpoint;
        document.getElementById('apiEndpoint').placeholder = this.apiProviders[this.currentProvider].endpoint;
        document.getElementById('apiKey').value = this.settings.apiKey;
        this.updateModelOptions();
        document.getElementById('modelSelect').value = this.settings.model;
        
        this.settingsModal.classList.add('active');
    }
    
    closeSettings() {
        this.settingsModal.classList.remove('active');
    }
    
    saveSettings() {
        this.currentProvider = document.getElementById('providerSelect').value;
        this.settings.apiEndpoint = document.getElementById('apiEndpoint').value || this.apiProviders[this.currentProvider].endpoint;
        this.settings.apiKey = document.getElementById('apiKey').value;
        this.settings.model = document.getElementById('modelSelect').value;
        
        localStorage.setItem('kb_provider', this.currentProvider);
        localStorage.setItem('kb_api_endpoint', this.settings.apiEndpoint);
        localStorage.setItem('kb_api_key', this.settings.apiKey);
        localStorage.setItem('kb_model', this.settings.model);
        
        this.settingsModal.classList.remove('active');
        this.showToast(`设置已保存，已切换到 ${this.apiProviders[this.currentProvider].name}`);
        this.updateSendButton();
    }
    
    // ==================== Storage ====================
    saveDocuments() {
        localStorage.setItem('kb_documents', JSON.stringify(this.documents));
    }
    
    loadDocuments() {
        const saved = localStorage.getItem('kb_documents');
        if (saved) {
            try {
                this.documents = JSON.parse(saved);
                this.renderDocuments();
            } catch (e) {
                console.error('Failed to load documents:', e);
            }
        }
    }
    
    // ==================== Utilities ====================
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    formatNumber(num) {
        if (num < 1000) return num;
        if (num < 10000) return (num / 1000).toFixed(1) + 'K';
        return (num / 10000).toFixed(1) + 'W';
    }
    
    showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.kb = new KnowledgeBase();
});
