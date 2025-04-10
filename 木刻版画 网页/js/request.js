// const API_BASE = 'http://127.0.0.1:3398/api/dataset'
const API_BASE = 'http://carving-server.t.2ndtool.top:3396/api/dataset'

export async function fetchAll(dataset, type = '') {
    const url = type ? `${API_BASE}/${dataset}?type=${type}` : `${API_BASE}/${dataset}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('获取数据失败')
    return await res.json()
}

export async function fetchById(dataset, id) {
    const res = await fetch(`${API_BASE}/${dataset}/${id}`)
    if (!res.ok) throw new Error(`获取记录失败`)
    return await res.json()
}

export async function addRecord(dataset, data) {
    const res = await fetch(`${API_BASE}/${dataset}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('添加记录失败')
    return await res.json()
}

