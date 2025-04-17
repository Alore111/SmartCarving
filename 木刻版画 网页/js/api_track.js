import {fetchAll} from "./request.js";
import "https://webapi.amap.com/maps?v=2.0&key=864f2b31e0b6558c0e4ade5157767fd1"
import "https://webapi.amap.com/loca?v=2.0.0&key=864f2b31e0b6558c0e4ade5157767fd1"

let map = null;
let loca = null;

function generateRouteId() {
    return `route_${Date.now()}`
}

function generateTimestamp() {
    return new Date().toISOString() // 示例：2025-04-13T14:35:00.000Z
}

export async function createTrackAuto(dataset, userId, routeName) {
    const routeId = generateRouteId()
    const startTime = generateTimestamp()
    const res = await addTrack(dataset, userId, {routeId, routeName, startTime})
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
    // console.log('显示线路详情:', trackDetail);
    renderFootprintPulseLines(trackDetail.footprints)

    const container = document.getElementById('track-details');
    if (!container) return;
    container.classList.add('active')

    const {userName, routeName, startTime, footprints} = trackDetail;

    // 清空之前内容
    container.innerHTML = `
        <div class="track-header">
            <h3 class="track-title">${routeName}</h3>
            <p class="track-meta"><strong>用户：</strong><span class="user-info">${userName}</span></p>
            <p class="track-meta"><strong>出发时间：</strong><time class="track-time">${new Date(startTime).toLocaleString()}</time></p>
        </div>
        <hr class="track-divider"/>
        <div class="track-footprints">
            <h4 class="section-title">足迹列表</h4>
            <ul class="footprints-list"></ul>
        </div>
    `;

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
        loca = new Loca.Container({ map: map });
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
    const scatter = new Loca.ScatterLayer({ loca, zIndex: 5 });
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
    map = new AMap.Map('track_map', {
        center: [106.55, 29.56],
        viewMode: '3D',
        pitch: 48,
        zoom: 14, // 默认缩放级别
        resizeEnable: true,
        mapStyle: "amap://styles/whitesmoke",
    });
}
