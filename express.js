import express from "express"
import {v4 as uuid } from "uuid"
import { callModel } from "."
const app = express()

app.use(cors({
    origin : "*"
}))


app.get("/", (req, res)=>{
    res.json({
        msg : "server running"
    })
})

app.post("/start", async (req, res) => {
    try{

        const { symptoms } = req.body
        if(!symptoms || symptoms == ""){
            return res.status(403).json({
                msg : "please provide atleast 2 symptoms"
            })
        }

        const sessionID = uuid()

        const response = await callModel(sessionID, symptoms)

        if(!response){
            res.status(500).json({
                msg : "error occurred while retrieving from the model"
            })
        }
        
        return res.status(200).json({
            session_id : sessionID,
            msg : response
        })
    }catch(err){
        return res.status(403).send("error occurred")
    }
})

app.post('follow-up' , async (req, res) => {
    const { session_id, answer } = req.body

    if(!session_id || answer) {
        return res.status(403).json({
            msg : "error occurred. Invalid payload"
        })
    }

    try{
        const response = await callModel(session_id, answer)
        
        if(!response){
            res.status(500).json({
                msg : "error occurred while retrieving from the model"
            })
        }
        
        return res.status(200).json({
            session_id ,
            msg : response
        })
    }catch(err){
        return res.status(500).json({
            msg : "error occurred"
        })
    }
})

app.listen(3000, () => console.log("server is listening on port 3000"))