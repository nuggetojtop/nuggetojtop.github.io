// 登录表单提交事件
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault(); // 阻止默认表单提交

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const alertArea = document.getElementById('alert-area');

    // 验证输入
    if (!username || !password) {
        alertArea.innerHTML = '<div class="alert alert-danger">用户名和密码不能为空！</div>';
        return;
    }

    // 调用登录工具
    const loginSuccess = UserUtil.login(username, password);
    if (loginSuccess) {
        alertArea.innerHTML = '<div class="alert alert-success">登录成功，即将跳转...</div>';
        // 跳转首页
        setTimeout(() => {
            window.location.href = '/ojtest/index.html';
        }, 1000);
    } else {
        alertArea.innerHTML = '<div class="alert alert-danger">用户名或密码错误！</div>';
    }
});

// 页面加载时检查是否已登录
window.addEventListener('load', () => {
    if (UserUtil.isLogin()) {
        window.location.href = '/ojtest/index.html';
    }
});
