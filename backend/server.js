const path = require("path");
const express = require("express");
const colors = require("colors");
const dotenv = require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/db");
const { Server } = require("socket.io");

const { User } = require("./models/userModel");

const port = process.env.PORT || 5000;

const app = express();
const server = app.listen(port, () => {
 console.log(`Server started on port ${port}`);
});


app.use(express.json());
app.use(express.urlencoded({ extended: false }));


connectDB().then((response) => {
 if (response) {
  const date = () => {
   const d = new Date();
   return `${d.getDay()}-${d.getMonth()}-${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
  };

  const client = new Server(server,{
   cors: {
    origin: "*",
    methods: ["GET", "POST"],
   },
  });

  client.on("connection", (socket) => {
   sendStatus = function (s) {
    socket.emit("status", s);
   };

   socket.on("output", async (id) => {
    const user = await User.findById({ _id: id });
    const allUsersNameAndId = await User.find({}, { name: 1, _id: 1 });
    socket.emit("output", { userData: user, allUsersNameAndId });
   });

   socket.on("input", async function (data) {

    
    const {
     current_user_id,
     current_user_name,
     messenger_name,
     messenger_id,
     title,
     body,
    } = data;

    client.sockets.emit('check', { sender: current_user_name, recipient_id: messenger_id})
    
    if (
     messenger_name == "" ||
     messenger_id == "" ||
     title === "" ||
     body === ""
    ) {

     sendStatus(
      "You did not choose messenger or enter message title or message body. Plase fill all above"
     );
    } else {

     const isMessengerExists = await User.findOne({
      _id: current_user_id,
      "all_messages.messenger_id": messenger_id,
     });

     const amIExistOnRecipient = await User.findOne({
      _id: messenger_id,
      "all_messages.messenger_id": current_user_id,
     });

     if (isMessengerExists) {
      await User.findOneAndUpdate(
       { _id: current_user_id, "all_messages.messenger_id": messenger_id },
       {
        $push: {
         "all_messages.$.messages": { isMe: true, title, body, time: date() },
        },
       }
      );
     } else {
      User.findOneAndUpdate(
       { _id: current_user_id },
       {
        $push: {
         all_messages: {
          messenger_name,
          messenger_id,
          messages: [
           {
            isMe: true,
            title,
            body,
            time: date(),
           },
          ],
         },
        },
       },
      );
     }

     if (amIExistOnRecipient) {

       await User.findOneAndUpdate(
       { _id: messenger_id, "all_messages.messenger_id": current_user_id },
       {
        $push: {
         "all_messages.$.messages": { isMe: false, title, body, time: date() },
        },
       }
      );
     } else {
      User.findOneAndUpdate(
       { _id: messenger_id },
       {
        $push: {
         all_messages: {
          messenger_name: current_user_name,
          messenger_id: current_user_id,
          messages: [
           {
            isMe: false,
            title,
            body,
            time: date(),
           },
          ],
         },
        },
       },
       (err, messenger) => {
        if (err) {
         return sendStatus({
          message: err,
          clear: true,
         });
        }
        sendStatus({
         message: "Message sent successfully!",
         clear: true,
        });
       }
      );
     }
    }
   });
  });
 }
});

app.put("/gmail/user", async (req, res) => {
 const { name } = req.body;
 if (!name) {
  return res.status(400).json({ message: "Invalid credentials" });
 }

 let userName = await User.findOne({ name: name });
 if (userName) {
  return res.status(400).json({ message: "Username already taken" });
 }

 const user = await User.create({ name });
 if (user) {
  res.status(201).json({
   _id: user.id,
   name: user.name,
  });
 } else {
  res.status(400).json({ message: "Invalid credentials" });
 }
});

app.get("/gmail/user/:id", async (req, res) => {
 const id = req.params.id;
 if (!id) {
  return res
   .status(400)
   .json({ message: "Invalid credentials, not included user ID" });
 }

 const user = await User.findById({ _id: id });
 if (user) {
  res.status(201).json(user.all_messages);
 } else {
  res.status(400).json({ message: "Invalid credentials" });
 }
});


if (process.env.NODE_ENV === "production") {
 app.use(express.static(path.join(__dirname, "../frontend/build")))
 app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../', 'frontend', 'build', 'index.html')))
} else {
 app.get('/', (req, res) => res.send("Please set to production"))
}


