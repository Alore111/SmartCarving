import './notice.js'

// const BASE_URL = 'http://127.0.0.1:3396'
// const BASE_URL = 'https://carving-server.t.2ndtool.top'
// const BASE_URL = 'https://carving-server.2ndtool.top'
const BASE_URL = 'https://carving-server.f.can6.top'
const DATASET_API_BASE = BASE_URL + '/api/dataset'
const USER_API_BASE = BASE_URL + '/api/users'

const SUCCESS_CODE_LIST = [200, 201]

// 通用请求处理函数
async function requestAndCheck(url, options = {}, errorMsg = '请求失败') {
    const token = localStorage.getItem('token')
    if (token) options.headers = {...options.headers, 'Authorization': "Bearer " + token}
    const response = await fetch(url, options)
    let res = await response.json()
    res.ok = true
    if (!SUCCESS_CODE_LIST.includes(res.code)) {
        Notice.show(res.message || errorMsg, 'error')
        res.ok = false
    }
    // console.log(res)
    return res
}

// ========== 用户认证 ==========
export async function register(username, password) {
    return await requestAndCheck(`${USER_API_BASE}/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    }, '注册失败')
}

export async function login(username, password) {
    return await requestAndCheck(`${USER_API_BASE}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    }, '登录失败')
}

export async function getUserInfo() {
    return await requestAndCheck(`${USER_API_BASE}/info`, {}, '获取用户信息失败')
}

export async function updateUserInfo(data) {
    return await requestAndCheck(`${USER_API_BASE}/info`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }, '更新用户信息失败')
}

export async function insertUser(data) {
    return await requestAndCheck(`${USER_API_BASE}/add`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }, '新增用户失败')
}

export async function deleteUser(userId) {
    return await requestAndCheck(`${USER_API_BASE}/delete/${userId}`, {
        method: 'DELETE'
    }, '删除失败')
}


// ========== 通用数据集 API ==========
export async function fetchAll(dataset, type = '') {
    const url = type ? `${DATASET_API_BASE}/${dataset}?type=${type}` : `${DATASET_API_BASE}/${dataset}`
    return await requestAndCheck(url, {}, '获取数据失败')
}

export async function fetchById(dataset, id) {
    return await requestAndCheck(`${DATASET_API_BASE}/${dataset}/${id}`, {}, '获取数据失败')
}

export async function addRecord(dataset, data) {
    return await requestAndCheck(`${DATASET_API_BASE}/${dataset}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }, '添加数据失败')
}

export async function updateRecord(dataset, id, data) {
    return await requestAndCheck(`${DATASET_API_BASE}/${dataset}/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }, "更新数据失败")
}

export async function deleteRecord(dataset, id) {
    return await requestAndCheck(`${DATASET_API_BASE}/${dataset}/${id}`, {
        method: 'DELETE'
    }, "删除数据失败")
}

// ========== 用户足迹 API ==========
export async function updateFootPrint(footprintData) {
    let userInfo = localStorage.getItem('userInfo')
    let userId
    if (userInfo) userId = JSON.parse(userInfo).userId
    return await requestAndCheck(`${USER_API_BASE}/zuji/${userId}/tracks/update`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(footprintData)
    }, '更新数据失败')
}

export async function delFootPrints(routeId) {
    let userInfo = localStorage.getItem('userInfo')
    let userId
    if (userInfo) userId = JSON.parse(userInfo).userId
    return await requestAndCheck(`${USER_API_BASE}/zuji/${userId}/tracks/${routeId}`, {
        method: 'DELETE'
    }, '删除数据失败')
}

export async function uploadFile(file) {
    const formData = new FormData()
    formData.append('image', file)
    // formData.append('token', '1c17b11693cb5ec63859b091c5b9c1b2')
    formData.append('token', '27332ccac61013e8a71b9dd0fa735d7b')
    try {
        const response = await fetch('https://upload.f.can6.top/api/index.php', {
            method: 'POST',
            body: formData
        })
        const res = await response.json()
        res.ok = true
        if (res.code !== 200 && res.code !== 201) {
            Notice.show(res.message || '文件上传失败', 'error')
            res.ok = false
        }
        return res
    } catch (err) {
        Notice.show('网络错误，文件上传失败', 'error')
        return {ok: false, message: err.message}
    }
}

// ========== 景点评论 API ==========

// 获取评论列表
export async function fetchComments(spotId, limit = 10, offset = 0) {
    const url = `${BASE_URL}/api/comments?spot_id=${spotId}&limit=${limit}&offset=${offset}`
    return await requestAndCheck(url, {}, '获取评论失败')
}
// 获取所有评论
export async function fetchAllComments(limit = 20, offset = 0, status = '') {
    let url = `${BASE_URL}/api/comments/all?limit=${limit}&offset=${offset}`
    if (status) url += `&status=${status}`
    return await requestAndCheck(url, {}, '获取所有评论失败')
}

// 提交新评论
export async function submitComment(commentData) {
    return await requestAndCheck(`${BASE_URL}/api/comments`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(commentData)
    }, '提交评论失败')
}

// 审核通过评论
export async function approveComment(commentId) {
    return await requestAndCheck(`${BASE_URL}/api/comments/${commentId}/approve`, {
        method: 'PUT'
    }, '审核评论失败')
}

// 审核拒绝评论
export async function rejectComment(commentId) {
    return await requestAndCheck(`${BASE_URL}/api/comments/${commentId}/reject`, {
        method: 'PUT'
    }, '拒绝评论失败')
}

// 删除评论（软删除）
export async function deleteComment(commentId) {
    return await requestAndCheck(`${BASE_URL}/api/comments/${commentId}`, {
        method: 'DELETE'
    }, '删除评论失败')
}

