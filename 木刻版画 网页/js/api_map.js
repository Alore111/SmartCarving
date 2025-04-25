import {fetchAll} from "./request.js";
import "../js/notice.js"

let loading_list = ['spots']

function initLoading() {
    Notice.show("加载中...", "loading", 10000, 'index-loading')
}

initLoading()

function endLoading(loading_name) {
    loading_list = loading_list.filter(item => item !== loading_name)
    if (loading_list.length === 0) {
        Notice.close('index-loading')
    }
}

async function fetchSpots() {
    const res = await fetchAll('spots');
    endLoading('spots')
    if (res.ok) {
        return res.data;
    }
    return {};
}

function latLonToRelativePosition(lat, lon) {
    // 已知的两个经纬度和相对位置106.586691,29.571256
    const lat1 = 29.588797, lon1 = 106.448503, top1 = 52.83, left1 = 44.4;
    const lat2 = 29.571256, lon2 = 106.586691, top2 = 54.27, left2 = 53.5;

    // 计算纬度和经度的差异
    const latDiff = lat2 - lat1;
    const lonDiff = lon2 - lon1;

    // 计算纬度差异对应的 top 的变化
    const topChange = (top2 - top1) / latDiff;

    // 计算经度差异对应的 left 的变化
    const leftChange = (left2 - left1) / lonDiff;

    // 计算目标纬度对应的 top 值
    const topPosition = top1 + (lat - lat1) * topChange;

    // 计算目标经度对应的 left 值
    const leftPosition = left1 + (lon - lon1) * leftChange;

    return {
        top: topPosition.toFixed(2) + '%',
        left: leftPosition.toFixed(2) + '%'
    };
}

function showSpotsPoint(spots) {

    const map_container = document.getElementById('mapWrapper');
    map_container.innerHTML = '<img src="../img/map2-ft-4.png" class="map-img ft" alt=""/>';
    for (const spot in spots) {
        const {top, left} = latLonToRelativePosition(spots[spot].details.latitude, spots[spot].details.longitude);
        map_container.innerHTML += `
            <div class="map-point" style="top: ${top}; left: ${left};" data-id="${spot}"></div>
        `
    }
}

window.onload = async function () {

    const spots = await fetchSpots()
    showSpotsPoint(spots)
    // 点击景点标记时显示信息
    document.querySelectorAll('.map-point').forEach(point => {
        point.addEventListener('click', function () {
            const spotId = this.getAttribute('data-id');
            const spot = spots[spotId];
            const infoPanel = document.querySelector('.info-panel');
            infoPanel.innerHTML = `
                    <h2 class="spot-details-title">${spot.name}</h2>
                    <div class="spot-description">${spot.description}</div>
                    <div class="spot-details">
                        <p><strong>地址：</strong>${spot.details.address}</p>
                        <p><strong>开放时间：</strong>${spot.details.openingHours}</p>
                        <p><strong>门票价格：</strong>${spot.details.ticketPrice}</p>
                        <p><strong>小提示：</strong>${spot.details.bk}</p>
                    </div>
                `;
        });
    });

}

