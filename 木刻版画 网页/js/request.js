import './notice.js'

// const BASE_URL = 'http://127.0.0.1:3396'
// const BASE_URL = 'https://carving-server.t.2ndtool.top'
const BASE_URL = 'https://carving-server.2ndtool.top'
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
    return await requestAndCheck(`${BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    }, '注册失败')
}

export async function login(username, password) {
    return await requestAndCheck(`${BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    }, '登录失败')
}

export async function getUserInfo() {
    return await requestAndCheck(`${BASE_URL}/api/users/info`, {}, '获取用户信息失败')
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
    formData.append('token', '1c17b11693cb5ec63859b091c5b9c1b2')
    try {
        const response = await fetch('https://image.t.2ndtool.top/api/index.php', {
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
