import { GoogleGenAI, Type } from "@google/genai";
import { INITIAL_DOCTOR_INSTRUCTION, SCHEMA, USER_FRAMING_STRING } from "./prompt.js"
import * as dotenv from "dotenv"
import { clearMessage, getMessage, saveMessage } from "./redis.js";
// import  { createClient, REDIS_FLUSH_MODES } from "redis"

// const redis = createClient({
//     url : "redis://localhost:6379"
// })
// redis.on("error", (err) => console.log(err))
// await redis.connect()


// // Define redis keys for chat history
// const sessionID = "random"
// const CHAT_KEY = 'doctor:chat:'+sessionID

// async function saveMessage(role, content){
//     await redis.rPush(CHAT_KEY, JSON.stringify({role, content}))
// }

// async function getMessage(){
//     const messages = await redis.lRange(CHAT_KEY, 0 , -1) 
//     return messages.map((e) => JSON.parse(e))
// }

const sessionID = "abc-def-hij"

async function testingRedis(role, content){
    await saveMessage(sessionID, role, content)
    
    const allMessages = await getMessage(sessionID)

    console.log(allMessages)
}


// await testingRedis("assitant", "Do you feel cough or sore throat ?  ")

dotenv.config()




const ai = new GoogleGenAI({
    apiKey : process.env.GEMINI_API_KEY
});

export async function callModel(sessionID, user_query, isContextToBeTaken){
    let chatMessages ;

    if(isContextToBeTaken){
        const history = await getMessage(sessionID)
        chatMessages = history 
    }
    console.log(chatMessages)
    const chat = await ai.chats.create({
        model : "gemini-2.5-flash",
        history : typeof(chatMessages) == "object" ? chatMessages.map((m=>({
            role : m.role,
            parts : [{
                text : m.content
            }]
        }))) : [{
            role : "user",
            parts : [{
                text : `${USER_FRAMING_STRING} ${user_query}`
            }]
        }],
        config: {
            systemInstruction: INITIAL_DOCTOR_INSTRUCTION(),
            responseMimeType : "application/json",
            responseSchema : SCHEMA
        },
    })
    const response = await chat.sendMessage({
        message : `${USER_FRAMING_STRING} ${String(user_query)}`
    })
    
    const parsedResponse = JSON.parse(response.text)

    console.log(parsedResponse)

    return parsedResponse[0]

}




