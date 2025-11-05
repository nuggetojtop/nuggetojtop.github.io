// 渲染管理员题目列表
function renderAdminProblemList() {
    const problems = ProblemUtil.getAllProblems();
    const tableBody = document.getElementById('admin-problem-table').querySelector('tbody');

    if (problems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">暂无题目，点击"创建新题目"添加</td></tr>';
        return;
    }

    let html = '';
    problems.forEach(problem => {
        html += `
            <tr>
                <td>${problem.id}</td>
                <td>${problem.title}</td>
                <td>
                    <span class="difficulty-tag ${problem.difficulty === '简单' ? 'easy' : problem.difficulty === '中等' ? 'medium' : 'hard'}">
                        ${problem.difficulty}
                    </span>
                </td>
                <td>${problem.createTime}</td>
                <td>
                    <button class="btn btn-sm" onclick="editProblem('${problem.id}')">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProblem('${problem.id}')">删除</button>
                </td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;
}

// 显示创建题目表单
function showAddProblemForm() {
    const formCard = document.getElementById('problem-form-card');
    const formTitle = document.getElementById('form-title');
    const problemIdInput = document.getElementById('problem-id');

    // 重置表单
    document.getElementById('problem-form').reset();
    problemIdInput.value = '';
    formTitle.textContent = '创建新题目';
    formCard.style.display = 'block';
}

// 显示编辑题目表单
function editProblem(id) {
    const problem = ProblemUtil.getProblemById(id);
    if (!problem) return;

    const formCard = document.getElementById('problem-form-card');
    const formTitle = document.getElementById('form-title');
    const problemIdInput = document.getElementById('problem-id');

    // 填充表单数据
    problemIdInput.value = problem.id;
    document.getElementById('problem-title').value = problem.title;
    document.getElementById('problem-difficulty').value = problem.difficulty;
    document.getElementById('problem-description').value = problem.description;
    document.getElementById('problem-input').value = problem.inputDesc;
    document.getElementById('problem-output').value = problem.outputDesc;
    document.getElementById('problem-sample-input').value = problem.sampleInput;
    document.getElementById('problem-sample-output').value = problem.sampleOutput;

    formTitle.textContent = '编辑题目';
    formCard.style.display = 'block';
}

// 删除题目
function deleteProblem(id) {
    if (!confirm('确定要删除该题目吗？删除后相关提交记录也会被删除！')) {
        return;
    }

    ProblemUtil.deleteProblem(id);
    renderAdminProblemList();
}

// 提交题目表单（创建/编辑）
document.getElementById('problem-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const problemId = document.getElementById('problem-id').value;
    const alertArea = document.getElementById('form-alert-area');

    // 收集表单数据
    const problemInfo = {
        title: document.getElementById('problem-title').value.trim(),
        difficulty: document.getElementById('problem-difficulty').value,
        description: document.getElementById('problem-description').value.trim(),
        inputDesc: document.getElementById('problem-input').value.trim(),
        outputDesc: document.getElementById('problem-output').value.trim(),
        sampleInput: document.getElementById('problem-sample-input').value.trim(),
        sampleOutput: document.getElementById('problem-sample-output').value.trim()
    };

    // 验证数据
    if (!problemInfo.title || !problemInfo.description) {
        alertArea.innerHTML = '<div class="alert alert-danger">标题和描述不能为空！</div>';
        return;
    }

    try {
        if (problemId) {
            // 编辑题目
            ProblemUtil.updateProblem(problemId, problemInfo);
            alertArea.innerHTML = '<div class="alert alert-success">题目编辑成功！</div>';
        } else {
            // 创建题目
            ProblemUtil.createProblem(problemInfo);
            alertArea.innerHTML = '<div class="alert alert-success">题目创建成功！</div>';
        }

        // 刷新题目列表，3秒后隐藏表单
        renderAdminProblemList();
        setTimeout(() => {
            document.getElementById('problem-form-card').style.display = 'none';
        }, 1500);
    } catch (err) {
        alertArea.innerHTML = `<div class="alert alert-danger">操作失败：${err.message}</div>`;
    }
});

// 取消表单
document.getElementById('cancel-form-btn').addEventListener('click', () => {
    document.getElementById('problem-form-card').style.display = 'none';
});
