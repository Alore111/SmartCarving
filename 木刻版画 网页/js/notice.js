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
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .notice.success { background-color: #2ecc71; }
    .notice.error { background-color: #e74c3c; }
    .notice.info { background-color: #3498db; }
    .notice.warning { background-color: #f39c12; }
    .notice.loading {
      background-color: #34495e;
    }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* 新增 loading 动画样式 */
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #fff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.className = 'notice-container';
    document.body.appendChild(container);

    const activeNotices = new Map(); // 用于追踪 loading 类型的通知

    window.Notice = {
        show(message = '', type = 'info', duration = 3000, id = null) {
            const notice = document.createElement('div');
            notice.className = `notice ${type}`;

            if (type === 'loading') {
                // 加载动画和文字
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                const text = document.createElement('span');
                text.textContent = message;
                notice.appendChild(spinner);
                notice.appendChild(text);

                // 记录 loading 类型通知
                if (id) {
                    activeNotices.set(id, notice);
                }
            } else {
                notice.textContent = message;

                setTimeout(() => {
                    notice.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    notice.style.opacity = '0';
                    notice.style.transform = 'translateY(-10px)';
                    setTimeout(() => container.removeChild(notice), 300);
                }, duration);
            }

            container.appendChild(notice);
        },

        // 新增 close 方法用于手动关闭 loading 类型
        close(id) {
            const notice = activeNotices.get(id);
            if (notice) {
                notice.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                notice.style.opacity = '0';
                notice.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    container.removeChild(notice);
                    activeNotices.delete(id);
                }, 300);
            }
        }
    };
})();
