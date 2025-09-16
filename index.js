import { GoogleGenAI, Type } from "@google/genai";
import { INITIAL_DOCTOR_INSTRUCTION } from "./prompt.js"
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

const SCHEMA = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            followup_question: {
                type: Type.STRING,
            },
            isEmergency : {
                type : Type.BOOLEAN
            },
            final_response : {
                type : Type.ARRAY,
                items: {
                   type : Type.STRING
                }
            },
            clarification_if_emergency : {
                type : Type.STRING
            }
        },
        propertyOrdering: ["followup_question", "isEmergency", "final_response", "clarification_if_emergency"],
    },
}

let CHAT_HISTORY = []

const ai = new GoogleGenAI({
    apiKey : process.env.GEMINI_API_KEY
});

async function main() {

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: CHAT_HISTORY.map((m)=>({
        role : m.role,
        parts : [{
            text : m.content
        }]
    })),
    config: {
      systemInstruction: INITIAL_DOCTOR_INSTRUCTION(),
      responseMimeType : "application/json",
      responseSchema : SCHEMA
    },
  });
  console.log(response)
  console.log('='.repeat(20))
  console.log(response.text);
//   CHAT_HISTORY.push({
//     role : "assitant",
//     content : `${response.text}`
//   })
}

// await main();

export async function callModel(sessionID, user_query){

    const chatMessages = await getMessage(sessionID)

    const chat = await ai.chats.create({
        model : "gemini-2.5-flash",
        history : chatMessages.length > 0 ? chatMessages.map((m=>({
            role : m.role,
            parts : [{
                text : m.content
            }]
        }))) : [],
        config: {
            systemInstruction: INITIAL_DOCTOR_INSTRUCTION(),
            responseMimeType : "application/json",
            responseSchema : SCHEMA
        },
    })
    const response = await chat.sendMessage({
        message : `The user is suffering from => ${String(user_query)}`
    })
    await saveMessage(sessionID, "user", `${user_query}`)
    
    const parsedResponse = JSON.parse(response.text)

    await saveMessage(sessionID, "model", parsedResponse[0].followup_question)
    console.log(parsedResponse)

    return parsedResponse

}




