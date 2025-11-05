// 洛谷 API 基础配置（需替换为你的 AppID 和 AppSecret）
const LUOGU_CONFIG = {
    BASE_URL: 'https://app-api.luogu.com.cn',
    APP_ID: 'YOUR_APP_ID', // 前往洛谷开放平台申请
    APP_SECRET: 'YOUR_APP_SECRET'
};

// 洛谷 API 工具类
const LuoguApi = {
    // 获取访问令牌（需先申请授权）
    async getToken() {
        try {
            const response = await fetch(`${LUOGU_CONFIG.BASE_URL}/auth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'client_credentials',
                    client_id: LUOGU_CONFIG.APP_ID,
                    client_secret: LUOGU_CONFIG.APP_SECRET
                })
            });
            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('luogu_token', data.access_token);
                return data.access_token;
            }
            throw new Error('获取洛谷令牌失败');
        } catch (err) {
            console.error('洛谷 API 错误：', err);
            return null;
        }
    },

    // 提交代码到洛谷判题
    async submitCode(problemId, code, language) {
        // 语言映射（洛谷支持的语言 ID）
        const langMap = {
            c: 1,
            cpp: 2,
            java: 3,
            python3: 4,
            javascript: 5
        };
        const langId = langMap[language] || 2; // 默认 C++

        const token = localStorage.getItem('luogu_token') || await this.getToken();
        if (!token) return { success: false, message: '洛谷授权失败' };

        try {
            const response = await fetch(`${LUOGU_CONFIG.BASE_URL}/judge/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    problemId: parseInt(problemId), // 洛谷题目 ID（需与本地题目关联）
                    code: code,
                    language: langId
                })
            });
            const data = await response.json();
            if (data.status === 'accepted') {
                return { success: true, submissionId: data.submissionId };
            }
            return { success: false, message: data.message || '提交失败' };
        } catch (err) {
            console.error('洛谷提交错误：', err);
            return { success: false, message: '网络错误' };
        }
    },

    // 查询判题结果
    async getJudgeResult(submissionId) {
        const token = localStorage.getItem('luogu_token');
        if (!token) return { success: false, message: '未授权' };

        try {
            const response = await fetch(`${LUOGU_CONFIG.BASE_URL}/judge/result/${submissionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            // 映射洛谷状态到本地状态
            const statusMap = {
                'accepted': 'accepted',
                'wrong_answer': 'wrong_answer',
                'time_limit_exceeded': 'time_limit',
                'memory_limit_exceeded': 'memory_limit',
                'compile_error': 'compile_error',
                'runtime_error': 'runtime_error'
            };

            return {
                success: true,
                status: statusMap[data.status] || 'pending',
                score: data.score || 0,
                judgeInfo: {
                    timeUsed: data.timeUsed || 0,
                    memoryUsed: data.memoryUsed || 0,
                    errorInfo: data.errorInfo || ''
                }
            };
        } catch (err) {
            console.error('查询判题结果错误：', err);
            return { success: false, message: '网络错误' };
        }
    }
};

// 注意：洛谷开放平台 API 需提前申请，个人开发者需完成实名认证
// 申请地址：https://open.luogu.com.cn/docs
