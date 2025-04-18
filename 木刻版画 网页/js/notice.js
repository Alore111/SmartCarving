// 创建Notice容器和样式
(function () {
    const style = document.createElement('style');
    style.innerHTML = `
    .notice-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .notice {
      min-width: 220px;
      max-width: 300px;
      padding: 12px 16px;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      animation: slideIn 0.4s ease;
      position: relative;
      overflow: hidden;
    }
    .notice.success { background-color: #2ecc71; }
    .notice.error { background-color: #e74c3c; }
    .notice.info { background-color: #3498db; }
    .notice.warning { background-color: #f39c12; }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.className = 'notice-container';
    document.body.appendChild(container);

    window.Notice = {
        show(message = '', type = 'info', duration = 3000) {
            const notice = document.createElement('div');
            notice.className = `notice ${type}`;
            notice.textContent = message;

            container.appendChild(notice);

            setTimeout(() => {
                notice.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                notice.style.opacity = '0';
                notice.style.transform = 'translateY(-10px)';
                setTimeout(() => container.removeChild(notice), 300);
            }, duration);
        }
    };
})();
