import {fetchAll, fetchComments, getUserInfo, login, register, submitComment} from "./request.js";
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

function refreshVote(votes) {
    // 计算比例
    const total = votes.thunder + votes.recommend;
    let thunderRate = ((votes.thunder / total * 100) || 0).toFixed(1);
    let recommendRate = ((votes.recommend / total * 100) || 0).toFixed(1);
    let thunderRateWidth = thunderRate;
    let recommendRateWidth = recommendRate;

    // 应用最小阈值
    if (thunderRate < 25) {
        recommendRateWidth = 75;
        thunderRateWidth = 25;
    }
    if (recommendRate < 25) {
        thunderRateWidth = 75;
        recommendRateWidth = 25;
    }
    if (thunderRate == recommendRate) {
        thunderRateWidth = 50;
        recommendRateWidth = 50;
    }

    // 更新进度条
    document.querySelector('.thunder.vote-bar').style.width = `${thunderRateWidth}%`;
    document.querySelector('.recommend.vote-bar').style.width = `${recommendRateWidth}%`;


    // 更新百分比显示
    document.querySelectorAll('.vote-btn').forEach(btn => {
        const percentEl = btn.querySelector('.percent');
        if (btn.dataset.type === 'thunder') {
            percentEl.textContent = `😡${thunderRate}%`;
        } else {
            percentEl.textContent = `😎${recommendRate}%`;
        }
    });

}

async function refreshComment(spot_id) {
    const comment_list_res = await fetchComments(spot_id)
    let comment_list = []
    const commentList = document.getElementById('comment-list');
    if (comment_list_res.ok) {
        comment_list = comment_list_res.data
        renderComments(comment_list)
        console.log(comment_list)
    }


}
function renderComments(commentData) {
    const commentList = document.getElementById('comment-list');
    commentList.innerHTML = ''; // 清空旧的

    commentData.forEach(comment => {
        const item = document.createElement('div');
        item.style.borderBottom = '1px solid #eee';
        item.style.padding = '15px 10px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '8px';

        const userInfo = document.createElement('div');
        userInfo.style.maxWidth = '150px';  // 根据需要调整最大宽度
        userInfo.style.whiteSpace = 'nowrap';
        userInfo.style.overflow = 'hidden';
        userInfo.style.textOverflow = 'ellipsis';
        userInfo.innerHTML = `<strong style="color: #633200;">${comment.userName}</strong>`;

        const recommendBadge = document.createElement('div');
        recommendBadge.style.padding = '2px 8px';
        recommendBadge.style.borderRadius = '12px';
        recommendBadge.style.fontSize = '12px';
        recommendBadge.style.color = 'white';
        recommendBadge.style.backgroundColor = comment.recommend ? '#4CAF50' : '#FF5722';
        recommendBadge.textContent = comment.recommend ? '👍推荐' : '👎避雷';

        header.appendChild(userInfo);
        header.appendChild(recommendBadge);

        const content = document.createElement('div');
        content.style.marginBottom = '8px';
        content.style.fontSize = '14px';
        content.style.wordBreak = 'break-word';
        content.style.whiteSpace = 'pre-wrap';
        content.textContent = comment.content;

        const time = document.createElement('div');
        time.style.fontSize = '12px';
        time.style.color = '#999';
        time.textContent = formatDate(comment.created_at);

        item.appendChild(header);
        item.appendChild(content);
        item.appendChild(time);

        commentList.appendChild(item);
    });
}

// 时间格式化辅助函数
function formatDate(rawDate) {
    const d = new Date(rawDate);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n) {
    return n < 10 ? '0' + n : n;
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


window.onload = async function () {

    const spots = await fetchSpots()
    showSpotsPoint(spots)
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
    // 点击景点标记时显示信息
    document.querySelectorAll('.map-point').forEach(point => {
        point.addEventListener('click', function () {
            const spotId = this.getAttribute('data-id');
            const spot = spots[spotId];
            const infoPanel = document.querySelector('.info-panel');
            const spotName = document.getElementById('spot-name');
            spotName.textContent = spot.name;
            refreshComment(spotId)
            const spotContainer = infoPanel.querySelector(".spot-container")
            spotContainer.innerHTML = `
                <div class="spot-description">${spot.description}</div>
                <div class="spot-details">
                    <div><span class="spot-details-tip">地址：</span><span class="spot-details-content">${spot.details.address}</span></div>
                    <div><span class="spot-details-tip">开放时间：</span><span class="spot-details-content">${spot.details.openingHours}</span></div>
                    <div><span class="spot-details-tip">门票价格：</span><span class="spot-details-content">${spot.details.ticketPrice}</span></div>
                    <div><span class="spot-details-tip">小提示：</span><span class="spot-details-content">${spot.details.bk}</span></div>
                </div>
                <div class="vote-container">
                    <div class="vote-progress vote-buttons">
                        <div class="vote-bar thunder" style="width: 50%">
                            <button class="vote-btn thunder voted" data-type="thunder">
                                <span class="label">👎避雷</span>
                                <span class="percent">0%</span>
                            </button>
                        </div>
                        <div class="vote-bar recommend" style="width: 50%">
                            <button class="vote-btn recommend voted" data-type="recommend">
                                <span class="label">👍推荐</span>
                                <span class="percent">0%</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div id="comment-list"></div>
            `;

            // 投票逻辑
            let votes = {thunder: spot.details.thunder_count, recommend: spot.details.recommend_count};
            refreshVote(votes)


            document.querySelectorAll('.vote-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    // if(this.classList.contains('voted')) return;

                    const token = localStorage.getItem('token');
                    if (!token) {
                        Notice.show('请先登录', 'error');
                        return;
                    }

                    const type = this.dataset.type;
                    votes[type]++;

                    // 更新进度条
                    refreshVote(votes)

                    // this.classList.add('voted');

                    const recommend = type === 'recommend' ? 1 : 0;

                    // 弹出评论框
                    showCommentModal(spotId, recommend);
                });
            });


            // 显示评论弹窗
            function showCommentModal(spotId, recommend) {
                // 创建遮罩层
                const overlay = document.createElement('div');
                Object.assign(overlay.style, {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: '999',
                    backdropFilter: 'blur(3px)',  // 添加毛玻璃效果
                    animation: 'fadeIn 0.3s ease-out'  // 添加淡入动画
                });

                // 创建弹窗
                const modal = document.createElement('div');
                Object.assign(modal.style, {
                    backgroundColor: '#fff',
                    padding: '0',
                    borderRadius: '16px',
                    width: '90%',
                    maxWidth: '480px',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transform: 'scale(0.95)',  // 初始缩放
                    animation: 'scaleIn 0.3s ease-out forwards'  // 添加缩放动画
                });

                modal.innerHTML = `
                    <div style="padding: 32px;">
                        <h3 style="color: #2D1A0F; margin: 0 0 28px 0; font-size: 1.5rem; font-weight: 600; text-align: center; letter-spacing: 0.5px;">
                            写下你的理由
                        </h3>
                        <textarea 
                            id="commentContent" 
                            placeholder="请输入你的宝贵意见..."
                            style="width: 100%;
                                   height: 140px;
                                   padding: 16px;
                                   margin-bottom: 24px;
                                   border: 2px solid #EEE5DE;
                                   border-radius: 12px;
                                   background: #FFFCFA;
                                   font-size: 16px;
                                   line-height: 1.6;
                                   resize: vertical;
                                   transition: all 0.2s ease;
                                   box-sizing: border-box;
                                   &:focus {
                                       outline: none;
                                       border-color: #C3B09F;
                                       box-shadow: 0 0 0 3px rgba(195, 176, 159, 0.2);
                                   }"></textarea>
                        <div style="display: flex; gap: 16px; justify-content: flex-end;">
                            <button 
                                id="submitComment"
                                style="background: #5D4433;
                                       color: white;
                                       border: none;
                                       padding: 14px 32px;
                                       border-radius: 8px;
                                       font-weight: 600;
                                       cursor: pointer;
                                       transition: all 0.2s ease;
                                       box-shadow: 0 4px 12px rgba(93, 68, 51, 0.2);
                                       &:hover {
                                           background: #4A3528;
                                           transform: translateY(-1px);
                                       }">
                                提交
                            </button>
                            <button 
                                id="cancelComment"
                                style="background: transparent;
                                       color: #5D4433;
                                       border: 2px solid #E5DCD3;
                                       padding: 14px 32px;
                                       border-radius: 8px;
                                       font-weight: 600;
                                       cursor: pointer;
                                       transition: all 0.2s ease;
                                       &:hover {
                                           background: #F8F5F2;
                                           border-color: #D4C9BE;
                                       }">
                                取消
                            </button>
                        </div>
                    </div>
                `;

                // 添加动画样式
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes scaleIn {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);

                overlay.appendChild(modal);
                document.body.appendChild(overlay);

                // 绑定提交按钮
                document.getElementById('submitComment').addEventListener('click', async function () {
                    const content = document.getElementById('commentContent').value.trim();
                    if (!content) {
                        Notice.show('评论内容不能为空', 'error')
                        return;
                    }

                    try {
                        await submitComment({
                            spot_id: spotId,
                            content: content,
                            recommend: recommend
                        });
                        Notice.show('提交成功,请等待审核', 'success')
                        document.body.removeChild(overlay); // 关闭弹窗
                    } catch (err) {
                    }
                });

                // 绑定取消按钮
                document.getElementById('cancelComment').addEventListener('click', function () {
                    document.body.removeChild(overlay); // 关闭弹窗
                    votes = {thunder: spot.details.thunder_count, recommend: spot.details.recommend_count}
                    refreshVote(votes)
                });
            }


        });


    });

}

