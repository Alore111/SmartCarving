// const BASE_URL = 'http://127.0.0.1:3396'
// const BASE_URL = 'https://carving-server.t.2ndtool.top'
const BASE_URL = 'https://carving-server.2ndtool.top'
const DATASET_API_BASE = BASE_URL + '/api/dataset'
const USER_API_BASE = BASE_URL + '/api/users'

export async function fetchAll(dataset, type = '') {
    const url = type ? `${DATASET_API_BASE}/${dataset}?type=${type}` : `${DATASET_API_BASE}/${dataset}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('获取数据失败')
    return await res.json()
}

export async function fetchById(dataset, id) {
    const res = await fetch(`${DATASET_API_BASE}/${dataset}/${id}`)
    if (!res.ok) throw new Error('获取记录失败')
    return await res.json()
}

export async function addRecord(dataset, data) {
    const res = await fetch(`${DATASET_API_BASE}/${dataset}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('添加记录失败')
    return await res.json()
}

// ========== 用户足迹 API ==========

// 获取所有用户
export async function fetchAllUsers(dataset) {
    const res = await fetch(`${USER_API_BASE}/${dataset}`)
    if (!res.ok) throw new Error('获取用户失败')
    return await res.json()
}

// 添加用户
export async function addUser(dataset, userId, userName = '') {
    const res = await fetch(`${USER_API_BASE}/${dataset}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName })
    })
    if (!res.ok) throw new Error('添加用户失败')
    return await res.json()
}

// 添加线路
export async function addTrack(dataset, userId, trackData) {
    const res = await fetch(`${USER_API_BASE}/${dataset}/${userId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData)
    })
    if (!res.ok) throw new Error('添加线路失败')
    return await res.json()
}

// 添加足迹
export async function addFootprint(dataset, userId, routeId, footprintData) {
    const res = await fetch(`${USER_API_BASE}/${dataset}/${userId}/tracks/${routeId}/footprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(footprintData)
    })
    if (!res.ok) throw new Error('添加足迹失败')
    return await res.json()
}

// 添加照片
export async function addPhotoToFootprint(dataset, userId, routeId, timestamp, photoData) {
    const res = await fetch(`${USER_API_BASE}/${dataset}/${userId}/tracks/${routeId}/footprints/${timestamp}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoData)
    })
    if (!res.ok) throw new Error('添加照片失败')
    return await res.json()
}


function generateRouteId() {
    return `route_${Date.now()}` // 示例：route_1712989892938
}

function generateTimestamp() {
    return new Date().toISOString() // 示例：2025-04-13T14:35:00.000Z
}

export async function createTrackAuto(dataset, userId, routeName) {
    const routeId = generateRouteId()
    const startTime = generateTimestamp()
    const res = await addTrack(dataset, userId, { routeId, routeName, startTime })
    res.routeId = routeId // 返回给调用者
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
    res.timestamp = timestamp // 返回给调用者
    return res
}

