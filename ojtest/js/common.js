// 本地存储键名
const STORAGE_KEYS = {
    USERS: 'oj_users',
    CURRENT_USER: 'oj_current_user',
    PROBLEMS: 'oj_problems',
    SUBMISSIONS: 'oj_submissions'
};

// 初始化本地存储（若不存在则创建空结构）
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        // 默认管理员账号：admin/admin123
        const defaultAdmin = {
            username: 'admin',
            password: 'admin123', // 生产环境需加密存储
            role: 'admin',
            nickname: '管理员'
        };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([defaultAdmin]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROBLEMS)) {
        localStorage.setItem(STORAGE_KEYS.PROBLEMS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify([]));
    }
}

// 用户相关工具
const UserUtil = {
    // 获取当前登录用户
    getCurrentUser() {
        const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return userStr ? JSON.parse(userStr) : null;
    },

    // 验证用户是否登录
    isLogin() {
        return !!this.getCurrentUser();
    },

    // 验证是否为管理员
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    },

    // 登录（返回是否成功）
    login(username, password) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            return true;
        }
        return false;
    },

    // 注册（返回是否成功，用户名不可重复）
    register(userInfo) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
        if (users.some(u => u.username === userInfo.username)) {
            return false; // 用户名已存在
        }
        const newUser = {
            username: userInfo.username,
            password: userInfo.password,
            role: 'user',
            nickname: userInfo.nickname || userInfo.username
        };
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return true;
    },

    // 退出登录
    logout() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        window.location.href = '/ojtest/login.html';
    }
};

// 题目相关工具
const ProblemUtil = {
    // 获取所有题目
    getAllProblems() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROBLEMS)) || [];
    },

    // 根据ID获取题目
    getProblemById(id) {
        const problems = this.getAllProblems();
        return problems.find(p => p.id === id) || null;
    },

    // 创建题目（管理员）
    createProblem(problemInfo) {
        const problems = this.getAllProblems();
        const newProblem = {
            id: Date.now().toString(), // 用时间戳作为唯一ID
            title: problemInfo.title,
            description: problemInfo.description,
            inputDesc: problemInfo.inputDesc,
            outputDesc: problemInfo.outputDesc,
            sampleInput: problemInfo.sampleInput,
            sampleOutput: problemInfo.sampleOutput,
            difficulty: problemInfo.difficulty,
            author: UserUtil.getCurrentUser().username,
            createTime: new Date().toLocaleString()
        };
        problems.push(newProblem);
        localStorage.setItem(STORAGE_KEYS.PROBLEMS, JSON.stringify(problems));
        return newProblem;
    },

    // 编辑题目（管理员）
    updateProblem(id, updatedInfo) {
        let problems = this.getAllProblems();
        const index = problems.findIndex(p => p.id === id);
        if (index === -1) return false;
        problems[index] = { ...problems[index], ...updatedInfo };
        localStorage.setItem(STORAGE_KEYS.PROBLEMS, JSON.stringify(problems));
        return true;
    },

    // 删除题目（管理员）
    deleteProblem(id) {
        let problems = this.getAllProblems();
        problems = problems.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PROBLEMS, JSON.stringify(problems));
        // 同时删除该题的所有提交记录
        let submissions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) || [];
        submissions = submissions.filter(s => s.problemId !== id);
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
        return true;
    }
};

// 提交记录相关工具
const SubmissionUtil = {
    // 提交代码
    createSubmission(submissionInfo) {
        const submissions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) || [];
        const newSubmission = {
            id: Date.now().toString(),
            problemId: submissionInfo.problemId,
            username: UserUtil.getCurrentUser().username,
            code: submissionInfo.code,
            language: submissionInfo.language,
            status: 'pending', // pending/running/accepted/wrong_answer/time_limit/exceeded/memory_limit/compile_error
            score: 0,
            submitTime: new Date().toLocaleString(),
            judgeInfo: {} // 存储洛谷返回的判题信息
        };
        submissions.push(newSubmission);
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
        return newSubmission;
    },

    // 获取用户的所有提交记录
    getUserSubmissions(username) {
        const submissions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) || [];
        return submissions.filter(s => s.username === username).reverse(); // 倒序排列（最新在前）
    },

    // 获取某题的所有提交记录
    getProblemSubmissions(problemId) {
        const submissions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) || [];
        return submissions.filter(s => s.problemId === problemId).reverse();
    },

    // 更新提交状态（判题后）
    updateSubmissionStatus(id, status, score, judgeInfo) {
        let submissions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) || [];
        const index = submissions.findIndex(s => s.id === id);
        if (index === -1) return false;
        submissions[index].status = status;
        submissions[index].score = score;
        submissions[index].judgeInfo = judgeInfo;
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
        return true;
    }
};

// 页面加载时初始化存储
window.addEventListener('load', initStorage);

// 全局导航栏渲染（根据用户角色显示不同入口）
function renderNav() {
    const user = UserUtil.getCurrentUser();
    const navEl = document.querySelector('.nav');
    const adminNavEl = document.querySelector('.admin-nav');

    if (user) {
        // 已登录：显示首页、题目、我的记录、退出
        navEl.innerHTML = `
            <a href="/ojtest/index.html">首页</a>
            <a href="/ojtest/problem/index.html">题目列表</a>
            <a href="/ojtest/myrecords/index.html">我的记录</a>
            <a href="javascript:UserUtil.logout()">退出登录</a>
        `;
        // 管理员额外显示管理员入口
        if (UserUtil.isAdmin()) {
            adminNavEl.style.display = 'block';
            adminNavEl.innerHTML = `<a href="/ojtest/admin/index.html">管理员控制台</a>`;
        }
    } else {
        // 未登录：显示登录、注册
        navEl.innerHTML = `
            <a href="/ojtest/index.html">首页</a>
            <a href="/ojtest/problem/index.html">题目列表</a>
            <a href="/ojtest/login.html">登录</a>
            <a href="/ojtest/register.html">注册</a>
        `;
    }
}

// 页面加载时渲染导航栏
window.addEventListener('load', renderNav);
