import {fetchAll} from "./request.js";
import "https://webapi.amap.com/maps?v=2.0&key=864f2b31e0b6558c0e4ade5157767fd1"


function generateRouteId() {
    return `route_${Date.now()}`
}

function generateTimestamp() {
    return new Date().toISOString() // 示例：2025-04-13T14:35:00.000Z
}

export async function createTrackAuto(dataset, userId, routeName) {
    const routeId = generateRouteId()
    const startTime = generateTimestamp()
    const res = await addTrack(dataset, userId, { routeId, routeName, startTime })
    res.routeId = routeId
    return res
}

export async function createFootprintAuto(dataset, userId, routeId, locationName, lat, lng, note = '') {
    const timestamp = generateTimestamp()
    const res = await addFootprint(dataset, userId, routeId, {
        timestamp,
        locationName,
        latitude: lat,
        longitude: lng,
        note,
        photos: []
    })
    res.timestamp = timestamp
    return res
}


async function fetchTracks() {
    let data = await fetchAll('zuji'); // 获取所有足迹数据

    const tracks = [];

    if (data && data.users) {
        for (const user of data.users) {
            const { userId, userName, tracks: userTracks } = user;

            for (const track of userTracks) {
                const { routeId, routeName, startTime, footprints } = track;

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

    const add_tracks_btn = document.querySelector(".upload-btn")
    add_tracks_btn.addEventListener("click", openUploadModal);
    return tracks;
}

// 展示点击的线路信息
export function showTrackDetails(trackDetail) {
    console.log('显示线路详情:', trackDetail);

    const container = document.getElementById('track-details');
    if (!container) return;
    container.classList.add('active')

    const { userName, routeName, startTime, footprints } = trackDetail;

    // 清空之前内容
    container.innerHTML = `
        <h3>${routeName}</h3>
        <p><strong>用户：</strong>${userName}</p>
        <p><strong>出发时间：</strong>${new Date(startTime).toLocaleString()}</p>
        <hr/>
        <h4>足迹列表：</h4>
    `;

    const list = document.createElement('ul');
    list.className = 'footprint-list';

    footprints.forEach(fp => {
        const item = document.createElement('li');
        item.className = 'footprint-item';
        item.innerHTML = `
            <p><strong>位置：</strong>${fp.locationName}</p>
            <p><strong>时间：</strong>${new Date(fp.timestamp).toLocaleString()}</p>
            <p><strong>备注：</strong>${fp.note}</p>
            ${fp.photos.map(photo => `
                <div class="photo">
                    <img src="${photo.url}" alt="${photo.description}" />
                    <p class="photo-desc">${photo.description}</p>
                </div>
            `).join('')}
            <hr/>
        `;
        list.appendChild(item);
    });

    container.appendChild(list);
}


// 打开上传照片的模态框
export function openUploadModal() {
    // 打开上传足迹图片的界面
    console.log("打开上传照片的窗口");
}

// 调用接口创建新的足迹
export async function createNewFootprint() {
    let footprintData = {
        // 根据用户输入的数据设置
    };
    await createFootprintAuto(footprintData);
    console.log('新足迹已创建');
}

// 页面加载后初始化
window.onload = async function () {
    let user_tracks = await fetchTracks();  // 获取线路列表
    console.log(user_tracks)
    const map = new AMap.Map('track_map', {
        center: [106.55,29.56], // 默认中心点：天安门
        zoom: 14, // 默认缩放级别
        resizeEnable: true
    });

    // 可选：添加缩放控件
    AMap.plugin(['AMap.ToolBar'], function () {
        map.addControl(new AMap.ToolBar());
    });

    // 示例：添加一个标记点
    const marker = new AMap.Marker({
        position: [116.3975, 39.9087],
        title: '天安门广场',
        map: map
    });
}
