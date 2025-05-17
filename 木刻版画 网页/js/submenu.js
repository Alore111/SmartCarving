// JavaScript部分
document.querySelectorAll('.dropdown').forEach(item => {
    let timer;

    // 鼠标进入父菜单
    item.addEventListener('mouseenter', () => {
        clearTimeout(timer);
        item.querySelector('.submenu').classList.add('active');
    });

    // 鼠标离开父菜单（包括子菜单）
    item.addEventListener('mouseleave', (e) => {
        // 延迟100ms关闭，给鼠标移动到子菜单的时间
        timer = setTimeout(() => {
            item.querySelector('.submenu').classList.remove('active');
        }, 100);
    });

    // 子菜单自身悬浮时保持激活
    item.querySelector('.submenu').addEventListener('mouseenter', () => {
        clearTimeout(timer);
    });

    // 子菜单离开时关闭
    item.querySelector('.submenu').addEventListener('mouseleave', () => {
        item.querySelector('.submenu').classList.remove('active');
    });
});
document.querySelector('.menu-toggle').addEventListener('click', function() {
    const links = document.querySelector('.social-links');
    links.classList.toggle('active');

    // 关闭所有打开的下拉菜单
    document.querySelectorAll('.submenu').forEach(menu => {
        menu.classList.remove('active');
    });
});

// 下拉菜单交互保持原有逻辑，但建议添加移动端触摸支持
document.querySelectorAll('.dropdown > .nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            const submenu = this.nextElementSibling;
            submenu.classList.toggle('active');
        }
    });
});
