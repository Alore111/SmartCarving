import {delFootPrints, fetchAll, getUserInfo, login, register, updateFootPrint, uploadFile} from "./request.js";
import "https://webapi.amap.com/maps?v=2.0&key=864f2b31e0b6558c0e4ade5157767fd1"
import "https://webapi.amap.com/loca?v=2.0.0&key=864f2b31e0b6558c0e4ade5157767fd1"

let map = null;
let loca = null;
let footprintCount = 1;


async function fetchTracks() {
    let data = await fetchAll('zuji'); // 获取所有足迹数据
    data = data.data

    const tracks = [];

    if (data && data.users) {
        for (const user of data.users) {
            const {userId, userName, tracks: userTracks} = user;

            for (const track of userTracks) {
                const {routeId, routeName, startTime, footprints} = track;

                tracks.push({
                    userId,
                    userName,
                    routeId,
                    routeName,
                    startTime,
                    footprints, // 保留原始的 footprints 数组
                });
            }
        }
    }
    console.log(tracks)
    let list_div = document.getElementById("line-list");
    list_div.innerHTML = "";
    for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i];
        list_div.innerHTML += `
            <li>
                <div class="line-info">
                    <div class="route-name">🚶‍♂️ ${track.routeName}</div>
                    <div class="user-name">👤 ${track.userName}</div>
                </div>
            </li>
        `
    }
    const items = list_div.querySelectorAll('li');

    items.forEach((item, index) => {
        item.addEventListener('click', () => {
            // 1. 先清除所有 li 的选中状态
            items.forEach(el => el.classList.remove('active'));

            // 2. 给当前点击项添加选中样式
            item.classList.add('active');

            showTrackDetails(tracks[index]);
        });
    });
    document.getElementById('track-details').classList.remove("active");

    return tracks;
}

// 展示点击的线路信息
export function showTrackDetails(trackDetail) {
    // console.log('显示线路详情:', trackDetail);
    renderFootprintPulseLines(trackDetail.footprints)

    const container = document.getElementById('track-details');
    if (!container) return;
    container.classList.add('active')

    const {userName, routeName, startTime, footprints, routeId, userId} = trackDetail;

    // 清空之前内容
    container.innerHTML = `
        <div class="track-header">
            <h3 class="track-title">${routeName}<button class="track-edit-btn">编辑</button><button class="track-del-btn">删除</button></h3>
            <p class="track-meta"><strong>用户：</strong><span class="user-info">${userName}</span></p>
            <p class="track-meta"><strong>出发时间：</strong><time class="track-time">${new Date(startTime).toLocaleString()}</time></p>
        </div>
        <hr class="track-divider"/>
        <div class="track-footprints">
            <h4 class="section-title">足迹列表</h4>
            <ul class="footprints-list"></ul>
        </div>
        
    `;
    const userInfo = localStorage.getItem('userInfo');
    let myUserId;
    if (userInfo) myUserId = JSON.parse(userInfo).userId;
    if (userId === myUserId) {
        document.querySelector('.track-edit-btn').addEventListener('click', () => {
            document.querySelector('.upload_model_box').style.display = 'block';
            document.querySelector('.upload_model_box').dataset.routeId = routeId;
            initModal();
            fillFormFromData(trackDetail);
            refreshImageUploaderListener();
        });
        document.querySelector('.track-del-btn').addEventListener('click', async () => {
            console.log(trackDetail.routeId)
            if (confirm('确定要删除这条线路吗？')) {
                const res = await delFootPrints(routeId);
                if (res.ok) {
                    Notice.show(`删除成功`, "success", 1000, 'index-loading')
                    await fetchTracks();
                }
            }
        })
    } else {
        document.querySelector('.track-edit-btn').style.display = 'none';
        document.querySelector('.track-del-btn').style.display = 'none';
    }

    const list = document.createElement('ul');
    list.className = 'footprint-list';

    footprints.forEach(fp => {
        const item = document.createElement('li');
        item.className = 'footprint-item';
        item.innerHTML = `
        <p class="track-meta location"><strong>位置：</strong>${fp.locationName}</p>
        <p class="track-meta time"><strong>时间：</strong><time class="track-time">${new Date(fp.timestamp).toLocaleString()}</time></p>
        ${fp.note ? `<p class="track-meta note"><strong>备注：</strong>${fp.note}</p>` : ''}
        ${fp.photos.map(photo => `
            <div class="footprint-photo">
                <img src="${photo.url}" alt="${photo.description}" loading="lazy" />
                ${photo.description ? `<p class="photo-caption">${photo.description}</p>` : ''}
            </div>
        `).join('')}
        <hr class="track-divider item-divider"/>
    `;
        list.appendChild(item);
    });

    container.appendChild(list);
}

function renderFootprintPulseLines(footprints) {
    if (!map || !Array.isArray(footprints)) {
        console.warn("请先初始化 map，并传入至少两个足迹点");
        return;
    }

    // 显示所有点
    map.clearMap();
    const points = footprints.map(fp => [fp.longitude, fp.latitude]);
    points.forEach((pos, idx) => {
        const marker = new AMap.Marker({
            position: pos,
            label: {
                content: `<div class='map-location-name'>${footprints[idx].locationName}</div>`,
                offset: new AMap.Pixel(10, -20),
            }
        });
        map.add(marker);
    });
    map.setFitView()

    if (!loca) {
        loca = new Loca.Container({map: map});
    }

    // 生成 LineString 轨迹对（成对连接）
    const lines = [];
    for (let i = 0; i < footprints.length - 1; i++) {
        lines.push({
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [
                    [footprints[i].longitude, footprints[i].latitude],
                    [footprints[i + 1].longitude, footprints[i + 1].latitude],
                ],
            },
            properties: {
                ratio: "足迹段" + (i + 1),
            },
        });
    }

    // 清空旧内容
    loca.clear();

    // --- 呼吸点 ---
    const scatter = new Loca.ScatterLayer({loca, zIndex: 5});
    scatter.setSource(new Loca.GeoJSONSource({
        data: {
            type: "FeatureCollection",
            features: footprints.map(fp => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [fp.longitude, fp.latitude],
                },
            })),
        },
    }));
    scatter.setStyle({
        unit: 'meter',
        size: [100, 100],
        texture: 'https://a.amap.com/Loca/static/loca-v2/demos/images/breath_red.png',
        duration: 2000,
        animate: true,
    });
    loca.add(scatter);

    // --- 抛物线飞线 ---
    const pulseLink = new Loca.PulseLinkLayer({
        zIndex: 10,
        visible: true,
        depth: true,
    });

    pulseLink.setSource(new Loca.GeoJSONSource({
        data: {
            type: "FeatureCollection",
            features: lines,
        },
    }));

    pulseLink.setStyle({
        unit: 'meter',
        dash: [400, 0, 400, 0],
        lineWidth: [60, 20],
        height: 500, // 抛物线高度
        smoothSteps: 50,
        speed: 300,
        flowLength: 300,
        lineColors: ['#FFD700', '#FFA500', '#FF4500'],
        maxHeightScale: 0.5,
        headColor: 'rgba(255,255,0,1)',
        trailColor: 'rgba(255,255,0,0)',
    });

    loca.add(pulseLink);
    loca.animate.start();
}


// 打开上传模态框
export function openUploadModal() {
    // 打开上传足迹的界面
    const token = localStorage.getItem('token');
    if (token) {
        initModal();
        document.querySelector('.upload_model_box').style.display = 'block';
        document.querySelector('.upload_model_box').dataset.routeId = ""
        refreshImageUploaderListener()
    } else {
        Notice.show('请先登录', 'error');
    }
}

function initModal() {
    footprintCount = 1;
    const modal = document.querySelector('.upload_model_box');
    modal.innerHTML = ""
    modal.innerHTML = `
    <div class="modal_content">
        <div class="modal_header">
            <h3 class="modal_title">设计旅行轨迹</h3>
            <span class="close_btn">&times;</span>
        </div>
        <div class="modal_body">
            <form id="uploadForm">
                <div class="grid_2col">
                    <div class="form_group">
                        <label>路线名称</label>
                        <input type="text" class="form_control" id="routeName" required>
                    </div>
                    <div class="form_group">
                        <label>开始时间</label>
                        <input type="datetime-local" class="form_control" id="startTime" required>
                    </div>
                </div>

                <div id="footprintsContainer">
                    <div class="footprint_section">
                        <div class="footprint_section_header">
                            <h4>足迹 #1</h4>
                        </div>
                        <div class="grid_2col">
                            <div class="form_group">
                                <label>时间</label>
                                <input type="datetime-local" class="form_control" required>
                            </div>
                            <div class="form_group">
                                <label>地点名称</label>
                                <input type="text" class="form_control" required>
                            </div>
                        </div>

                        <div class="form_group">
                            <label>坐标选择</label>
                            <button type="button" class="btn_secondary map_picker">地图选点</button>
                            <div class="map_container"></div>
                            <div class="flex">
                                <input type="number" step="0.000001" class="form_control" placeholder="纬度" required>
                                <input type="number" step="0.000001" class="form_control" placeholder="经度" required>
                            </div>
                        </div>

                        <div class="form_group">
                            <label>备注</label>
                            <textarea class="form_control" rows="2"></textarea>
                        </div>

                        <div class="photo_upload">
                            <label>照片上传</label>
                            <div class="photo_upload_item">
                                <div class="drop_zone">
                                    拖放照片或点击上传
                                    <input type="file" accept="image/*" multiple hidden>
                                </div>
                                <div class="preview_container"></div>
                                <input type="text" class="form_control" placeholder="照片描述">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form_group">
                    <button type="button" class="btn_primary" id="addFootprint">添加足迹</button>
                </div>
            </form>
        </div>
        <div class="modal_footer">
            <button class="btn_primary" id="submitBtn">提交</button>
            <button class="btn_secondary" id="cancelBtn">取消</button>
        </div>
    </div>
    `;
    initModalListener();
}

function initModalListener() {
    // 动态添加足迹
    document.getElementById('addFootprint').addEventListener('click', () => {
        footprintCount++;
        const newFootprint = `
    <div class="footprint_section">
        <div class="footprint_section_header">
            <h4>足迹 #${footprintCount}</h4>
            <button type="button" class="remove_footprint">删除</button>
        </div>
      <div class="grid_2col">
        <div class="form_group">
            <label>时间</label>
            <input type="datetime-local" class="form_control" required>
        </div>
        <div class="form_group">
            <label>地点名称</label>
            <input type="text" class="form_control" required>
        </div>
    </div>
    
    <div class="form_group">
        <label>坐标选择</label>
        <button type="button" class="btn_secondary map_picker">地图选点</button>
        <div class="map_container"></div>
        <div class="flex">
            <input type="number" step="0.000001" class="form_control" placeholder="纬度" required>
            <input type="number" step="0.000001" class="form_control" placeholder="经度" required>
        </div>
    </div>
    
    <div class="form_group">
        <label>备注</label>
        <textarea class="form_control" rows="2"></textarea>
    </div>
    
    <div class="photo_upload">
        <label>照片上传</label>
        <div class="photo_upload_item">
            <div class="drop_zone">
                拖放照片或点击上传
                <input type="file" accept="image/*" multiple hidden>
            </div>
            <div class="preview_container"></div>
            <input type="text" class="form_control" placeholder="照片描述">
        </div>
    </div>
    </div>`;
        document.getElementById('footprintsContainer').insertAdjacentHTML('beforeend', newFootprint);
        refreshImageUploaderListener()
    });


    // 提交处理
    document.getElementById('submitBtn').addEventListener('click', async () => {
        const formData = {
            routeName: document.getElementById('routeName').value,
            startTime: document.getElementById('startTime').value,
            footprints: []
        };
        let isPhotoUploadComplete = true;

        // 收集足迹数据
        document.querySelectorAll('.footprint_section').forEach(section => {
            const inputs = section.querySelectorAll('input, textarea');
            const footprint = {
                timestamp: inputs[0].value,
                locationName: inputs[1].value,
                latitude: parseFloat(inputs[2].value),
                longitude: parseFloat(inputs[3].value),
                note: inputs[4].value,
                photos: []
            };

            // 收集照片数据
            section.querySelectorAll('.photo_upload_item').forEach(item => {
                if (section.querySelector('.drop_zone').style.display === 'none') {
                    if(!item.querySelector('.preview_item').dataset.url){
                        isPhotoUploadComplete = false;
                    }
                    footprint.photos.push({
                        description: item.querySelector('input[type="text"]').value,
                        url: item.querySelector('.preview_item').dataset.url
                    });
                }
            });

            formData.footprints.push(footprint);
        });

        if (!isPhotoUploadComplete) {
            Notice.show("等待图片上传完成", "warning");
            return;
        }

        const form_route_id = document.querySelector(".upload_model_box").dataset.routeId;
        if (form_route_id) {
            formData.routeId = form_route_id;
        }
        const validate = validateFormData(formData);
        if (!validate.valid) {
            Notice.show(validate.message, 'error');
            return;
        }
        const res = await updateFootPrint(formData);
        if (res.ok) {
            Notice.show('更新成功', 'success');
            document.querySelector('.upload_model_box').style.display = 'none'
            await window.refreshList()
        }
    });


    // 提交处理
    document.getElementById('cancelBtn').addEventListener('click', async () => {
        document.querySelector('.upload_model_box').style.display = 'none'
    });
}

function validateFormData(formData) {
    if (!formData) return { valid: false, message: '参数为空' };

    // 校验主字段
    const requiredFields = ['routeName', 'startTime', 'footprints'];
    for (const field of requiredFields) {
        if (!formData[field] || (Array.isArray(formData[field]) && formData[field].length === 0)) {
            return { valid: false, message: `字段 ${field} 不能为空` };
        }
    }

    // 校验 footprints 数组
    if (!Array.isArray(formData.footprints)) {
        return { valid: false, message: 'footprints 应为数组' };
    }

    for (let i = 0; i < formData.footprints.length; i++) {
        const fp = formData.footprints[i];
        const requiredFpFields = ['timestamp', 'locationName', 'latitude', 'longitude'];
        for (const field of requiredFpFields) {
            if (!fp[field] && fp[field] !== 0) {
                return { valid: false, message: `第 ${i + 1} 条足迹缺少字段 ${field}` };
            }
        }

        // 可选校验 note
        if (typeof fp.note !== 'string') {
            return { valid: false, message: `footprint 第 ${i + 1} 的 note 应为字符串` };
        }

        // 校验 photos 数组（可选，但如果存在则需验证）
        if (fp.photos && Array.isArray(fp.photos)) {
            for (let j = 0; j < fp.photos.length; j++) {
                const photo = fp.photos[j];
                if (!photo.url || typeof photo.url !== 'string') {
                    return { valid: false, message: `footprint 第 ${i + 1} 的 photo 第 ${j + 1} 缺少 url` };
                }
            }
        }
    }

    return { valid: true, message: '验证通过' };
}



window.handleSubmit = async function handleSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerText = document.getElementById('form-title').textContent + '中...';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    let response = null;
    if (isLogin) {
        response = await login(username, password);
    } else {
        response = await register(username, password);
    }
    console.log(response);
    if (response.ok) {
        Notice.show(document.getElementById('form-title').textContent + '成功', 'success')
        if (!isLogin) {
            toggleForm();
        } else {
            document.getElementById('login_status').textContent = '已登录:' + username;
            const userInfo = {
                username: username,
                userId: response.data.userId
            }
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            localStorage.setItem('token', response.data.token);
            closeLogin();
        }
    }

    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerText = document.getElementById('form-title').textContent;
}

window.refreshList = async function refreshList() {
    Notice.show('正在刷新', 'loading', 3000, "refreshList")
    const res = await fetchTracks();
    if (res) {
        Notice.close("refreshList")
    }
}


function refreshImageUploaderListener() {
    removeImageUploaderListener()
    initImageUploaderListener()
}

function initImageUploaderListener() {
    // 处理文件上传
    document.querySelectorAll('.drop_zone').forEach(dropZone => {
        const fileInput = dropZone.querySelector('input');
        const previewContainer = dropZone.closest('.photo_upload_item').querySelector('.preview_container');
        const descriptionInput = dropZone.closest('.photo_upload_item').querySelector('input[type="text"]');

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files, previewContainer, descriptionInput);
        });
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files, previewContainer, descriptionInput));
    });
}

function removeImageUploaderListener() {
    document.querySelectorAll('.drop_zone').forEach(dropZone => {
        const fileInput = dropZone.querySelector('input');
        const previewContainer = dropZone.closest('.photo_upload_item').querySelector('.preview_container');
        const descriptionInput = dropZone.closest('.photo_upload_item').querySelector('input[type="text"]');

        dropZone.removeEventListener('click', () => fileInput.click());
        dropZone.removeEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.removeEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.removeEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files, previewContainer, descriptionInput);
        });
        fileInput.removeEventListener('change', (e) => handleFiles(e.target.files, previewContainer, descriptionInput));
    });
}


async function handleFiles(files, container, descInput) {
    for (const file of files) {
        const reader = new FileReader();
        const availableSpace = 15 * 1024 * 1024; // 15MB
        const availableTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (file.size > availableSpace) {
            Notice.show('文件大小不能超过15MB', 'error');
            return;
        }
        else if (!availableTypes.includes(file.type)) {
            Notice.show('只支持上传JPEG、PNG和GIF格式的图片', 'error');
            return;
        }
        reader.onload = async (e) => {
            const div = document.createElement('div');
            div.className = 'preview_item';
            div.innerHTML = `
                <img src="${e.target.result}" class="preview_img">
                <button class="delete_photo">&times;</button>
            `;
            div.querySelector('.delete_photo').addEventListener('click', () => {
                div.remove()
                container.previousElementSibling.style.display = 'block';
            });
            container.appendChild(div);
            container.previousElementSibling.style.display = 'none';
            // 实际使用时替换为真实上传逻辑
            Notice.show("正在上传图片，请稍后...", "loading", 3000, "uploading")
            const result = await uploadFile(file);
            Notice.close("uploading")
            Notice.show("图片上传成功", "success")
            div.dataset.url = result.url;
        };
        reader.readAsDataURL(file);

    }
}

function fillFormFromData(data) {
    // 填充路线名称和开始时间
    document.getElementById('routeName').value = data.routeName;
    document.getElementById('startTime').value = data.startTime.slice(0, 16); // 去掉时区

    const container = document.getElementById('footprintsContainer');
    container.innerHTML = ''; // 清空原有足迹内容
    footprintCount = 0

    data.footprints.forEach((fp, index) => {
        // 创建一个新的 footprint_section 节点
        const section = document.createElement('div');
        section.className = 'footprint_section';

        section.innerHTML = `
            <div class="footprint_section_header">
                <h4>足迹 #${index + 1}</h4>
            </div>
            <div class="grid_2col">
                <div class="form_group">
                    <label>时间</label>
                    <input type="datetime-local" class="form_control" required value="${fp.timestamp.slice(0, 16)}">
                </div>
                <div class="form_group">
                    <label>地点名称</label>
                    <input type="text" class="form_control" required value="${fp.locationName}">
                </div>
            </div>

            <div class="form_group">
                <label>坐标选择</label>
                <button type="button" class="btn_secondary map_picker">地图选点</button>
                <div class="map_container"></div>
                <div class="flex">
                    <input type="number" step="0.000001" class="form_control" placeholder="纬度" required value="${fp.latitude}">
                    <input type="number" step="0.000001" class="form_control" placeholder="经度" required value="${fp.longitude}">
                </div>
            </div>

            <div class="form_group">
                <label>备注</label>
                <textarea class="form_control" rows="2">${fp.note || ''}</textarea>
            </div>

            <div class="photo_upload">
                <label>照片上传</label>
                <div class="photo_upload_item">
                    <div class="drop_zone" style="display: none;">
                        拖放照片或点击上传
                        <input type="file" accept="image/*" multiple hidden>
                    </div>
                    <div class="preview_container">
                        ${fp.photos.map(photo => `
                            <div class="preview_item" data-url="${photo.url}">
                                <img src="${photo.url}" alt="预览图" style="max-width: 100px; max-height: 100px;" />
                                <button class="delete_photo">&times;</button>
                            </div>
                        `).join('')}
                    </div>
                    <input type="text" class="form_control" placeholder="照片描述" value="${fp.photos[0]?.description || ''}">
                </div>
            </div>
        `;
        container.appendChild(section);
        footprintCount++;
        section.addEventListener('click', (e) => {
            // 只对删除按钮生效
            if (!e.target.classList.contains('delete_photo')) return;

            // 先缓存 photo_upload_item
            const uploadItem = e.target.closest('.photo_upload_item');
            // 再缓存要移除的 preview_item
            const preview = e.target.closest('.preview_item');

            // 执行移除
            preview.remove();

            // 如果当前没有任何预览，就把 drop_zone 显示出来
            if (!uploadItem.querySelector('.preview_item')) {
                uploadItem.querySelector('.drop_zone').style.display = 'block';
            }
        });
        if (!fp.photos.length){
            section.querySelector('.drop_zone').style.display = 'block';
        }
    });
}



// 页面加载后初始化
window.onload = async function () {
    await fetchTracks();  // 获取线路列表
    const add_tracks_btn = document.querySelector(".upload-btn")
    add_tracks_btn.addEventListener("click", openUploadModal);
    const token = localStorage.getItem('token');
    if (token || token === '') {
        const user_info_res = await getUserInfo()
        if (user_info_res.ok) {
            const user_info = user_info_res.data
            document.getElementById('login_status').textContent = '已登录:' + user_info.userName;
            localStorage.setItem('userInfo', JSON.stringify(user_info));
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
        }
    }


    // 初始化地图选择功能
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('map_picker')) {
            const button = e.target;
            const container = button.nextElementSibling;
            const latInput = container.nextElementSibling.querySelector('input:first-child');
            const lngInput = container.nextElementSibling.querySelector('input:last-child');

            container.style.display = 'block';
            const map = new AMap.Map(container, {
                zoom: 10,
                center: [106.55, 29.56]
            });

            const marker = new AMap.Marker({map});
            map.on('click', (e) => {
                marker.setPosition(e.lnglat);
                latInput.value = e.lnglat.getLat().toFixed(6);
                lngInput.value = e.lnglat.getLng().toFixed(6);
            });
        }

        // 动态删除足迹
        if (e.target.classList.contains('remove_footprint')) {
            e.target.closest('.footprint_section').remove()
        }

        if (e.target.classList.contains('close_btn')) {
            document.querySelector('.upload_model_box').style.display = 'none'
        }
    });

    map = new AMap.Map('track_map', {
        center: [106.55, 29.56],
        viewMode: '3D',
        pitch: 48,
        zoom: 14, // 默认缩放级别
        resizeEnable: true,
        mapStyle: "amap://styles/whitesmoke",
    });
}
