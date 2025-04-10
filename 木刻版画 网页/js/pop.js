
document.addEventListener('DOMContentLoaded', function () {
    const wechatBtn = document.getElementById('wechatBtn');
    const modal = document.getElementById('wechatQrModal');
    const closeBtn = document.querySelector('.close-modal');

    // 打开弹窗
    wechatBtn.addEventListener('click', function (e) {
        e.preventDefault();
        modal.classList.add('active');
    });

    // 关闭弹窗
    closeBtn.addEventListener('click', function () {
        modal.classList.remove('active');
    });

    // 点击外部区域关闭
    window.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});



// 抖音弹窗控制
document.getElementById('tiktokBtn').addEventListener('click', function () {
    closeAllModals();
    document.getElementById('tiktokQrModal').classList.add('active');
});

// 通用关闭函数
function closeAllModals() {
    document.querySelectorAll('.qr-modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// 关闭按钮事件（需确保该代码在DOM加载后执行）
document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', function () {
        closeAllModals();
    });
});

// 点击模态外部关闭
document.querySelectorAll('.qr-modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeAllModals();
        }
    });
});

// 获取B站相关元素
const bilibiliBtn = document.getElementById('bilibiliBtn');
const bilibiliModal = document.getElementById('bilibiliQrModal');

// B站弹窗逻辑
bilibiliBtn.addEventListener('click', () => {
    bilibiliModal.classList.add('active');
});

// 通用关闭逻辑
document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        e.target.closest('.qr-modal').classList.remove('active');
    });
});

// 点击外部关闭
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('qr-modal')) {
        e.target.classList.remove('active');
    }
});


// 在现有的微信弹窗代码后追加
const xhsBtn = document.getElementById('xiaohongshuBtn');
const xhsModal = document.getElementById('xiaohongshuQrModal');
const closeXhsModal = xhsModal.querySelector('.close-modal');

// 打开小红书弹窗
xhsBtn.addEventListener('click', function() {
    xhsModal.style.display = 'flex';
});

// 关闭弹窗逻辑
closeXhsModal.addEventListener('click', function() {
    xhsModal.style.display = 'none';
});

// 点击外部关闭
window.addEventListener('click', function(e) {
    if (e.target === xhsModal) {
        xhsModal.style.display = 'none';
    }
    if (e.target === wechatQrModal) { // 保留原有微信逻辑
        wechatQrModal.style.display = 'none';
    }
});