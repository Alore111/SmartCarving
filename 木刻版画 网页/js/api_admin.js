import {
    fetchAll,
    login,
    getUserInfo,
    updateUserInfo,
    insertUser,
    deleteUser,
    deleteRecord,
    updateRecord, addRecord
} from "./request.js";

export const fetchUsers = async () => {
    return await fetchAll('users')
}
export const fetchSpots = async () => {
    return await fetchAll('spots')
}
export const fetchComments = async () => {

}
export const AdminLogin = async (username, password) => {
    return await login(username, password)
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




