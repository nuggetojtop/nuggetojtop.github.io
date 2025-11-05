// 获取URL中的题目ID
function getProblemIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// 渲染题目详情
function renderProblemDetail(problemId) {
    const problem = ProblemUtil.getProblemById(problemId);
    const problemDetailEl = document.getElementById('problem-detail');
    const problemNotFoundEl = document.getElementById('problem-not-found');

    if (!problem) {
        problemNotFoundEl.style.display = 'block';
        problemDetailEl.style.display = 'none';
        return;
    }

    // 填充题目信息
    document.getElementById('problem-title').textContent = problem.title;
    document.getElementById('problem-difficulty').textContent = problem.difficulty;
    document.getElementById('problem-difficulty').className = `difficulty-tag ${
        problem.difficulty === '简单' ? 'easy' : problem.difficulty === '中等' ? 'medium' : 'hard'
    }`;
    document.getElementById('problem-description').textContent = problem.description;
    document.getElementById('problem-input').textContent = problem.inputDesc;
    document.getElementById('problem-output').textContent = problem.outputDesc;
    document.getElementById('problem-sample-input').textContent = problem.sampleInput;
    document.getElementById('problem-sample-output').textContent = problem.sampleOutput;

    problemNotFoundEl.style.display = 'none';
    problemDetailEl.style.display = 'block';
}

// 提交代码处理
async function handleSubmit(problemId) {
    const user = UserUtil.getCurrentUser();
    if (!user) {
        window.location.href = '/ojtest/login.html';
        return;
    }

    const code = document.getElementById('code-editor').value.trim();
    const language = document.getElementById('language-select').value;
    const alertArea = document.getElementById('submit-alert-area');
    const submitBtn = document.getElementById('submit-btn');

    if (!code) {
        alertArea.innerHTML = '<div class="alert alert-danger">代码不能为空！</div>';
        return;
    }

    // 禁用提交按钮，防止重复提交
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';
    alertArea.innerHTML = '<div class="alert alert-success">正在提交代码，请稍候...</div>';

    try {
        // 1. 创建本地提交记录
        const submission = SubmissionUtil.createSubmission({
            problemId,
            code,
            language
        });

        // 2. 渲染提交状态初始信息
        const statusEl = document.getElementById('submission-status');
        document.getElementById('submission-id').textContent = submission.id;
        document.getElementById('submission-time').textContent = submission.submitTime;
        document.getElementById('submission-status-text').textContent = '正在判题';
        document.getElementById('submission-status-text').className = 'status-tag pending';
        document.getElementById('submission-score').textContent = '0';
        document.getElementById('submission-time-used').textContent = '0';
        document.getElementById('submission-memory-used').textContent = '0';
        statusEl.style.display = 'block';

        // 3. 调用洛谷API提交代码（注意：本地题目需关联洛谷题目ID，这里假设problemId已映射）
        const submitResult = await LuoguApi.submitCode(problemId, code, language);
        if (!submitResult.success) {
            throw new Error(submitResult.message);
        }

        // 4. 轮询查询判题结果（每2秒查询一次）
        const pollJudgeResult = async () => {
            const judgeResult = await LuoguApi.getJudgeResult(submitResult.submissionId);
            if (!judgeResult.success) {
                throw new Error(judgeResult.message);
            }

            if (judgeResult.status === 'pending') {
                // 判题中，继续轮询
                setTimeout(pollJudgeResult, 2000);
                return;
            }

            // 5. 更新本地提交状态
            SubmissionUtil.updateSubmissionStatus(
                submission.id,
                judgeResult.status,
                judgeResult.score,
                judgeResult.judgeInfo
            );

            // 6. 渲染最终判题结果
            const statusTextMap = {
                'accepted': '通过',
                'wrong_answer': '答案错误',
                'time_limit': '超时',
                'memory_limit': '内存超限',
                'compile_error': '编译错误',
                'runtime_error': '运行错误'
            };
            const statusClassMap = {
                'accepted': 'accepted',
                'wrong_answer': 'wrong',
                'time_limit': 'warning',
                'memory_limit': 'warning',
                'compile_error': 'error',
                'runtime_error': 'error'
            };

            document.getElementById('submission-status-text').textContent = statusTextMap[judgeResult.status] || '未知状态';
            document.getElementById('submission-status-text').className = `status-tag ${statusClassMap[judgeResult.status] || 'pending'}`;
            document.getElementById('submission-score').textContent = judgeResult.score;
            document.getElementById('submission-time-used').textContent = judgeResult.judgeInfo.timeUsed;
            document.getElementById('submission-memory-used').textContent = judgeResult.judgeInfo.memoryUsed;

            // 显示错误信息（如果有）
            const errorInfoContainer = document.getElementById('error-info-container');
            const errorInfoEl = document.getElementById('submission-error-info');
            if (judgeResult.judgeInfo.errorInfo) {
                errorInfoContainer.style.display = 'block';
                errorInfoEl.textContent = judgeResult.judgeInfo.errorInfo;
            } else {
                errorInfoContainer.style.display = 'none';
            }

            alertArea.innerHTML = `<div class="alert alert-success">提交成功！判题结果：${statusTextMap[judgeResult.status]}</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = '提交代码';
        };

        pollJudgeResult();
    } catch (err) {
        alertArea.innerHTML = `<div class="alert alert-danger">提交失败：${err.message}</div>`;
        submitBtn.disabled = false;
        submitBtn.textContent = '提交代码';
    }
}

// 页面加载时初始化
window.addEventListener('load', () => {
    const problemId = getProblemIdFromUrl();
    if (!problemId) {
        document.getElementById('problem-not-found').style.display = 'block';
        return;
    }

    // 渲染题目详情
    renderProblemDetail(problemId);

    // 绑定提交按钮事件
    document.getElementById('submit-btn').addEventListener('click', () => {
        handleSubmit(problemId);
    });
});
