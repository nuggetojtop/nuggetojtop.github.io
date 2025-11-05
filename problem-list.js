// 渲染题目列表
function renderProblemList(filter = 'all') {
    const problems = ProblemUtil.getAllProblems();
    const tableBody = document.getElementById('problem-table').querySelector('tbody');
    const problemCountEl = document.getElementById('problem-count');

    // 过滤难度
    const filteredProblems = filter === 'all' 
        ? problems 
        : problems.filter(p => p.difficulty === filter);

    problemCountEl.textContent = filteredProblems.length;

    if (filteredProblems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">暂无题目</td></tr>';
        return;
    }

    let html = '';
    filteredProblems.forEach(problem => {
        html += `
            <tr>
                <td>${problem.id}</td>
                <td><a href="/ojtest/problem/detail.html?id=${problem.id}" style="color: #3498db; text-decoration: none;">${problem.title}</a></td>
                <td>
                    <span class="difficulty-tag ${problem.difficulty === '简单' ? 'easy' : problem.difficulty === '中等' ? 'medium' : 'hard'}">
                        ${problem.difficulty}
                    </span>
                </td>
                <td>${problem.createTime}</td>
                <td>
                    <a href="/ojtest/problem/detail.html?id=${problem.id}" class="btn btn-sm">查看</a>
                </td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;
}

// 难度筛选事件
document.getElementById('difficulty-filter').addEventListener('change', (e) => {
    renderProblemList(e.target.value);
});

// 页面加载时渲染题目列表
window.addEventListener('load', () => {
    renderProblemList();
});
