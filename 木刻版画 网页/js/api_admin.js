import {
    fetchAll,
    getUserInfo,
    updateUserInfo,
    insertUser,
    deleteUser,
    deleteRecord,
    updateRecord, addRecord, fetchAllComments, deleteComment, approveComment, rejectComment
} from "./request.js";

export const fetchUsers = async () => {
    return await fetchAll('users')
}
export const fetchSpots = async () => {
    return await fetchAll('spots')
}

export const AdminInfo = async () => {
    return await getUserInfo()
}

export const updateUser = async (data) => {
    return await updateUserInfo(data)
}

export const updateSpot = async (code, date) => {
    return await updateRecord('spots', code, date)
}

export const AdminInsertUser = async (data) => {
    return await insertUser(data)
}

export const AdminInsertSpot = async (data) => {
    return await addRecord('spots', data)
}

export const AdminDeleteUser = async (id) => {
    return await deleteUser(id)
}

export const AdminDeleteSpot = async (code) => {
    return await deleteRecord('spots', code)
}
// 获取所有评论
export const AdminFetchComments = async () => {
    return await fetchAllComments(0)
}

// 删除指定评论
export const AdminDeleteComment = async (commentId) => {
    return await deleteComment(commentId)
}

export const updateCommentStatus = async (commentId, status) => {
    if (status == 'approved') {
        return await approveComment(commentId)
    }else if (status == 'rejected'){
        return await rejectComment(commentId)
    }else{
        return {ok: true}
    }
}






