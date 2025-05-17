class ShareSnapshot {
    constructor(AMapKey) {
        this.AMapKey = AMapKey;
        this.loadDependencies();
        this.injectStyles();
        this.createDOM();
    }

    async loadDependencies() {
        if (!window.html2canvas) {
            await this.loadScript('../js/html2canvas.min.js');
        }
        if (!window.QRCode) {
            await this.loadScript('../js/qrcode.min.js');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .share-snapshot-overlay {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 330px;
                background: rgba(255, 255, 255);
                border: 1px solid #ccc;
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                z-index: 99999;
                max-height: 800px;
                overflow: hidden;
            }
    
            .share-snapshot-overlay::after {
                content: "";
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 60px;
                background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 100%);
                pointer-events: none;
            }
    
            .share-snapshot-overlay img {
                max-width: 300px;
                display: block;
            }
    
            .share-snapshot-overlay .close-btn {
                position: absolute;
                top: 6px;
                right: 10px;
                font-size: 18px;
                cursor: pointer;
                color: #f8f8f8;
                background: #8B4513;
                border-radius: 50%;
                text-align: center;
                width: 26px;
                height: 26px;
            }
            .share-snapshot-overlay .share-btn {
                position: absolute;
                right: 10px;
                top: calc(100% - 60px);
                z-index: 1;
            
                display: inline-block;
                padding: 4px 16px;
            
                font-size: 14px;
                font-family: sans-serif;
                color: #fff;
                background-color: #7ACE20;
            
                border: none;
                border-radius: 6px;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                transition: background-color 0.3s ease;
            }
            
            .share-snapshot-overlay .share-btn:hover {
                background-color: #6aba1c;
            }
        `;
        document.head.appendChild(style);
    }


    createDOM() {
        this.container = document.createElement('div');
        this.container.className = 'share-snapshot-overlay';
        this.container.style.display = 'none';

        this.closeBtn = document.createElement('div');
        this.closeBtn.className = 'close-btn';
        this.closeBtn.textContent = '×';
        this.closeBtn.onclick = () => this.hide();

        this.shareBtnWeibo = document.createElement('div');
        this.shareBtnWeibo.className = 'share-btn';
        this.shareBtnWeibo.style.right = '110px';
        this.shareBtnWeibo.textContent = '分享至微博';
        // this.shareBtnWeibo.onclick = () => console.log("分享");
        this.shareBtnDownload = document.createElement('div');
        this.shareBtnDownload.className = 'share-btn';
        this.shareBtnDownload.textContent = '下载图片';
        // this.shareBtnDownload.onclick = () => console.log("分享");


        this.imageEl = document.createElement('img');

        this.container.appendChild(this.closeBtn);
        this.container.appendChild(this.shareBtnWeibo);
        this.container.appendChild(this.shareBtnDownload);
        this.container.appendChild(this.imageEl);

        document.body.appendChild(this.container);
    }

    async show(domElement, url) {
        if (!domElement || !url) {
            console.error('缺少 DOM 元素或 URL');
            return;
        }

        Notice.show(`正在生成分享图片，请稍候...`, 'loading', 1000, 'gen_share');
        await this.loadDependencies();

        // try {
        const canvas = await this.renderFullElement(domElement, window.currFootprints);
        const finalCanvas = await this.mergeWithQRCode(canvas, url);
        const dataURL = finalCanvas.toDataURL('image/png');
        // this.imageEl.src = dataURL;

        // 上传服务器
        // 将 base64 转成 Blob
        function dataURLtoBlob(dataurl) {
            const arr = dataurl.split(',')
            const mime = arr[0].match(/:(.*?);/)[1]
            const bstr = atob(arr[1])
            let n = bstr.length
            const u8arr = new Uint8Array(n)

            while (n--) {
                u8arr[n] = bstr.charCodeAt(n)
            }

            return new Blob([u8arr], { type: mime })
        }

        const blob = dataURLtoBlob(dataURL)
        const formData = new FormData()
        formData.append('image', blob, 'snapshot.png') // 关键：添加 filename
        formData.append('token', '27332ccac61013e8a71b9dd0fa735d7b')

        const res = await fetch('https://upload.f.can6.top/api/index.php', {
            method: 'POST',
            body: formData
        }).then(res => res.json())


        if (res) {
            this.imageEl.src = res.url;
        }else {
            this.imageEl.src = dataURL;
        }


        this.shareBtnWeibo.onclick = () => {
            const win = window.open('', '_blank');
            const weiboUrl = `http://service.weibo.com/share/share.php?url=${url}&title=我在${window.currFootprints.length}个足迹中发现了这个宝藏！&pic=${this.imageEl.src}&appkey=27332ccac61013e8a71b9dd0fa735d7b`;
            win.location.href = weiboUrl;
        };
        this.shareBtnDownload.onclick = () => {
            if (!this.imageEl?.src) {
                console.warn('没有可下载的图片');
                return;
            }

            const link = document.createElement('a');
            link.href = this.imageEl.src;
            link.download = 'snapshot.png';
            link.rel = 'noopener'; // 可选，增强安全性

            // 确保 link 在 DOM 中触发 click
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };


        // this.imageEl.src = `https://www.olzz.com/qr/index.php?text=${url}&size=150`;
        this.container.style.display = 'block';
        Notice.close('gen_share');
        // } catch (err) {
        //     console.error('生成分享图片失败:', err);
        // }
    }


    async renderFullElement(domElement, footprints) {
        const TARGET_WIDTH = 600;

        // ==== 1. 地图截图 ====
        const mapWrapper = document.createElement('div');
        mapWrapper.style.position = 'absolute';
        mapWrapper.style.top = '-9999px';
        mapWrapper.style.left = '-9999px';
        mapWrapper.style.zIndex = '-1';
        mapWrapper.style.pointerEvents = 'none';
        mapWrapper.style.width = TARGET_WIDTH + 'px';

        let mapImg;
        if (footprints.length > 0) {
            mapImg = new Image();
            mapImg.src = this.generateStaticMapURL(footprints);
            mapImg.style.width = '100%';
            mapImg.style.display = 'block';
            mapWrapper.appendChild(mapImg);
            document.body.appendChild(mapWrapper);
        }

        const mapCanvas = mapImg ? await html2canvas(mapWrapper, {
            useCORS: true,
            backgroundColor: '#fff',
            width: TARGET_WIDTH
        }) : null;

        if (mapImg) document.body.removeChild(mapWrapper);

        // ==== 2. 内容截图 ====
        const clone = domElement.cloneNode(true);
        this.copyComputedStyles(domElement, clone);
        clone.style.height = 'auto';
        clone.style.width = TARGET_WIDTH + 'px'; // 强制统一宽度

        const contentWrapper = document.createElement('div');
        contentWrapper.style.position = 'absolute';
        contentWrapper.style.top = '-9999px';
        contentWrapper.style.left = '-9999px';
        contentWrapper.style.zIndex = '-1';
        contentWrapper.style.pointerEvents = 'none';
        contentWrapper.style.width = TARGET_WIDTH + 'px';
        contentWrapper.appendChild(clone);
        document.body.appendChild(contentWrapper);

        // 等待 DOM 渲染完成
        await new Promise(resolve => setTimeout(resolve, 100));
        // 再执行截图
        const contentCanvas = await html2canvas(clone, {
            useCORS: true,
            backgroundColor: '#fff',
            width: TARGET_WIDTH,
            scale: 2
        });

        document.body.removeChild(contentWrapper);

        // ==== 3. 合并 canvas ====
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = TARGET_WIDTH;
        finalCanvas.height =
            (mapCanvas ? mapCanvas.height : 0) + contentCanvas.height;

        const ctx = finalCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        if (mapCanvas) ctx.drawImage(mapCanvas, 0, 0);
        ctx.drawImage(contentCanvas, 0, mapCanvas ? mapCanvas.height : 0);

        return finalCanvas;
    }



    generateStaticMapURL(footprints, size = '600*300') {
        if (!Array.isArray(footprints) || footprints.length === 0) return '';

        const lons = footprints.map(f => f.longitude);
        const lats = footprints.map(f => f.latitude);
        const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;


        const markers = footprints.slice(0, 5).map((fp, index) => {
            const label = String.fromCharCode(65 + index); // A-E
            return `mid,,${label}:${fp.longitude},${fp.latitude}`;
        }).join('|');
        const center = `${centerLon.toFixed(6)},${centerLat.toFixed(6)}`;
        const pathCoords = footprints.map(fp => `${fp.longitude},${fp.latitude}`).join(';');
        const pathParam = `10,0xFF6600,1,,:${pathCoords}`;

        // return `https://restapi.amap.com/v3/staticmap?location=${center}&size=${size}&markers=${encodeURIComponent(markers)}&paths=${encodeURIComponent(pathParam)}&key=${this.AMapKey}`;
        return `https://restapi.amap.com/v3/staticmap?location=${center}&size=${size}&markers=${encodeURIComponent(markers)}&key=${this.AMapKey}`;
    }


    copyComputedStyles(sourceEl, targetEl) {
        const computed = getComputedStyle(sourceEl);
        for (const prop of computed) {
            targetEl.style[prop] = computed.getPropertyValue(prop);
        }

        const sourceChildren = sourceEl.children;
        const targetChildren = targetEl.children;

        for (let i = 0; i < sourceChildren.length; i++) {
            this.copyComputedStyles(sourceChildren[i], targetChildren[i]);
        }
    }

    async mergeWithQRCode(canvas, url) {
        return new Promise((resolve, reject) => {
            const qrDiv = document.createElement('div');
            new QRCode(qrDiv, {
                text: url,
                width: 160,
                height: 160,
            });

            // 等待二维码生成后再绘制
            setTimeout(() => {
                const qrImg = qrDiv.querySelector('img');
                if (!qrImg) return reject(new Error('二维码生成失败'));
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                    const padding = 10;
                    const x = canvas.width - img.width - padding;
                    const y = canvas.height - img.height - padding;
                    ctx.drawImage(img, x, y);
                    resolve(canvas);
                };
                img.onerror = reject;
                img.src = qrImg.src;
                console.log(qrImg.src)
            }, 500); // 等待 QRCode 渲染
        });
    }


    hide() {
        this.container.style.display = 'none';
    }
}
