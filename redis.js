import { createClient } from "redis";

const redis = createClient({
    // run => docker run -p 6379:6379 -d redis
    url : "redis://localhost:6379"
})


redis.on("error", (err)=>console.log(err))

redis.connect()

const CHAT_KEY = (sessionId) => {
    return `doctor:chat:${sessionId}`
}

export async function saveMessage(sessionId, role, content){
    await redis.rPush(CHAT_KEY(sessionId), JSON.stringify({role , content}))
    console.log("Message added successfully")
}

export async function getMessage(sessionId){
    const history = await redis.lRange(CHAT_KEY(sessionId), 0, -1)
    return history.map((m)=>JSON.parse(m))
}

const res = await getMessage("12c00603-4ec2-4448-80d6-38312d2504e1")
console.log(res)

export async function clearMessage(sessionId){
    await redis.del(CHAT_KEY(sessionId))
}