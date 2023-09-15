import { Level } from "level"
let Databases = {}

exports.DataStore = (dbPath, config) => {
    console.log(Databases[dbPath] && "opened cached db")
    const db = Databases[dbPath] || new Level(dbPath, config)

    const get = (key,callback?) => {
        return new Promise((resolve, reject) => {
            db.get(key, (error, value) => {
                if (error) {
                    if(callback) callback(null)
                    if (error.notFound) {
                        resolve(null)
                    } else {
                        console.warn(error)
                        reject(error)
                    }
                } else {
                    if(callback) callback(value)
                    resolve(value)
                }
            })
        })
    }

    const account = (key,defaultValue) => {
        return new Promise((resolve, reject) => {
            db.get(key, (error, value) => {
                if (error) {
                    if (error.notFound) {
                        db.put(key, defaultValue)
                        resolve(null)
                    } else {
                        console.warn(error)
                        reject(error)
                    }
                } else {
                    resolve(value)
                }
            })
        })
    }

    const list = async() => {
        let list = {}
        for await (const [key, value] of db.iterator()) {
            list[key] = value
        }
        return list
    }

    const add = (key,item) => {
        return new Promise((resolve, reject) => {
            db.get(key, (error, value) => {
                if (error) {
                    if (error.notFound) {
                        const items = [item]
                        db.put(key,items)
                        resolve(items)
                    } else {
                        console.warn(error)
                        reject(error)
                    }
                } else {
                    if (Array.isArray(value)) {
                        value.push(item)
                        db.put(key,value)
                        resolve(value)
                    }
                }
            })
        })
    }

    const set = (key, item,v) => {
        return new Promise((resolve, reject) => {
            if (v) {
                db.get(key,item,(error,value) => {
                    if (value) {
                        value[item] = v
                        db.put(key,value)
                        resolve(value)
                    } else {
                        if (error.notFound) {
                            const obj = {[item]:value}
                            db.put(key,obj)
                            resolve(obj)
                        } else {
                            console.warn(error)
                            reject(error)
                        }
                    }
                })
            } else {
                db.put(key, item, (error) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve(null)
                    }
                });
            }
        });
    };

    const close = () => {
        return new Promise((resolve, reject) => {
            db.close((error) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(null)
                }
            })
        })
    }

    const del = (key,callback?) => {
        return new Promise((resolve, reject) => {
            db.del(key, (error) => {
                if (error) {
                    if (error.notFound) {
                        resolve(null)
                    } else {
                        reject(error)
                    }
                } else {
                    if(callback) callback()
                    resolve(null)
                }
            })
        })
    }

    const iterator = () => {
        return db.iterator()
    }

    Databases[dbPath] = db

    return { get, set, list, add, account, close, del, iterator }
}
