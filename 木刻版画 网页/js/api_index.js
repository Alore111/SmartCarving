import {fetchAll} from "./request.js";

document.addEventListener("DOMContentLoaded", function () {
    init_dongtai()
})

const init_dongtai = async () => {
    let dongtai_box_cover = document.getElementById('dongtai_box_cover')
    let dongtai_cover_data = await fetchAll('dongtai', 'cover')
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
