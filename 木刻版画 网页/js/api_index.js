import {fetchAll} from "./request.js";
import "../js/notice.js"

let loading_list = ['dongtai_cover', 'dongtai_list', 'luntan']

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

document.addEventListener("DOMContentLoaded", function () {
    init_dongtai()
    init_luntan()
})

const init_dongtai = async () => {
    let dongtai_box_cover = document.getElementById('dongtai_box_cover')
    let dongtai_cover_data = await fetchAll('dongtai', 'cover')
    endLoading('dongtai_cover')
    dongtai_cover_data = dongtai_cover_data.data
    let last_dongtai_cover = dongtai_cover_data[dongtai_cover_data.length - 1]
    dongtai_box_cover.innerHTML = `
    <div class="img" style="background-image: url(${last_dongtai_cover.cover_img})">
                        <a title="${last_dongtai_cover.title}" class="link"
                           href="${last_dongtai_cover.url}"
                           target="_blank">
                            <div class="h16"
                                 title="${last_dongtai_cover.title}">
                                ${last_dongtai_cover.content}
                            </div>
                        </a>
                    </div>
    `

    let dongtai_box_list = document.getElementById('dongtai_box_list')
    dongtai_box_list.innerHTML = ''

    let dongtai_list_data = await fetchAll('dongtai', 'list')
    endLoading('dongtai_list')
    dongtai_list_data = dongtai_list_data.data

    // 按日期降序排序（从新到旧），然后取前5条
    let sorted_list = dongtai_list_data.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

    sorted_list.forEach((item, index) => {
        dongtai_box_list.innerHTML += `
        <div class="li">
            <div class="date">${item.date}</div>
            <div class="h16">
                <a title="${item.title}" href="${item.url}" target="_blank">${item.title}</a>
            </div>
        </div>
    `
    })
}

const init_luntan = async () => {
    let luntan_box_list = document.getElementById('luntan_box_list')
    luntan_box_list.innerHTML = ''
    let luntan_list_data = await fetchAll('luntan', 'list')
    endLoading('luntan')
    luntan_list_data = luntan_list_data.data
    luntan_list_data.forEach((item, index) => {
        luntan_box_list.innerHTML += `
            <div class="li">
                <div class="h16"><a title="${item.title}"
                                    href="${item.url}"
                                    target="_blank">${item.title}</a>
                </div>
                <div class="p">
                    ${item.content}
                </div>
                <div class="date">${item.date}</div>
            </div>`
    })
}
