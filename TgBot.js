const { G4F } = require("g4f");
const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const env = require('dotenv')
const mariadb = require('mariadb');
env.config();
const g4f = new G4F();
const bot = new Telegraf(process.env.BOT_TOKEN);
const DB = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DB,
  connectionLimit: 5
});
DBconnect();
const fs = require("fs");


async function DBconnect (){
  try{
    DBm = await DB.getConnection();
    DBm.query(`
    CREATE TABLE IF NOT EXISTS GPT4BOT (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chatid VARCHAR(255),
      text text,
      response text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      id_user VARCHAR(255),
      firstname VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      username VARCHAR(255),
      swich VARCHAR(255),
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  DBm.query(`
  CREATE TABLE IF NOT EXISTS GPT4BOT_MESSAGE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chatid VARCHAR(255),
    text text     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    response text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    id_user VARCHAR(255),
    firstname VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    username VARCHAR(255),
    swich VARCHAR(255)     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

  .then(() => {
    console.log('Готово Машка дб');
    DBm.release();
  })
  } catch (error){
   console.log(error);
  }
}

async function DBinsert(ins){
  try{
    DBm = await DB.getConnection();
    DBm.query(`
    INSERT INTO GPT4BOT (chatid, text, response, firstname, username, id_user, swich) VALUES (${ins})
  `,)
  .then(result => {
    DBm.release(); 
  })}catch (e){
    console.log(e);
  }
}

async function DBmessage(chatid, croppedText, croppedTextSubstring, first_name, username, id, chatname) {
  try {
    const DBm = await DB.getConnection();
    await DBm.query(`
      INSERT INTO GPT4BOT_MESSAGE (chatid, text, response, firstname, username, id_user, swich) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [chatid, croppedText, croppedTextSubstring, first_name, username, id, chatname]);
    DBm.release(); 
  } catch (e) {
    console.log(e);
  }
}
async function DBupdate(sw,id){
  try{
    DBm = await DB.getConnection();
    DBm.query(`
    UPDATE GPT4BOT SET swich = '${sw}' where id = ${id}
  `,)
  .then(result => {
    DBm.release(); 
  })}catch (e){
    console.log(e);
  }
}




async function DBselect(chatid, userid) {
  let str = null; 
  try {
    const DBm = await DB.getConnection();
    const sel = await DBm.query(`
      SELECT * FROM GPT4BOT WHERE chatid = '${chatid}' AND id_user = '${userid}' LIMIT 1
    `);
    if (sel && sel.length > 0) {
      str = sel[0];
    }
    DBm.release();
  } catch (e) {
    console.log(e);
  }
  return str;
}

bot.start( async (ctx) => {
  ctx.reply("Привіт, я GPT4")
  let chatid = ctx.message.chat.id;
  let from = ctx.message.from;
  let chat = ctx.message.chat;
  if(chat.first_name){
    chatname = chat.first_name;
  } else{
    chatname = chat.title;
  }
  try {
    let result = await DBselect(chatid, from.id);
    if (!result) {
      let ins = `${chatid}, '/start', '${chatname}', '${from.first_name}', '${from.username}', ${from.id}, 'text'`;
      let insertResult = await DBinsert(ins);
    }
  } catch (error) {
    console.error(error);
  }
});
  
bot.help( async (ctx) => {
  ctx.reply("text - Текстова модель \nimage - Генератор зображень \ninfo - Твої налаштування")
  
});



bot.on("message", async (ctx) => {
  let from = ctx.message.from;
  let chat = ctx.message.chat;
  if(chat.first_name){
    chatname = chat.first_name;
  } else{
    chatname = chat.title;
  }
  let text = ctx.message.text;
  if(text != undefined){
  let message_id = ctx.message.message_id;
  let sw;
  let resqwery;
  let result = await DBselect(chat.id, from.id);
  if (result) {
  resqwery = result;
  sw = result.swich;
  }
  


    switch (text) {
      case '/text':
        ctx.reply('Вибрана текстова модель...');
        sw = 'text';
        if(resqwery){
          await DBupdate(sw,resqwery.id);
          console.log('Update')
        }else{
          try {
            let ins = `${chat.id}, ' ','${chatname}' , '${from.first_name}', '${from.username}', ${from.id}, '${sw}'`;
            let insertResult = await DBinsert(ins);
        } catch (error) {
          console.error(error);
        }
        }
       break;
       case '/image':
        ctx.reply('Вибраний генератор зображень...');
        sw = 'image';
        if(resqwery){
          await DBupdate(sw,resqwery.id);
          console.log('Update')
        }else{
          try {
              let ins = `${chat.id}, ' ','${chatname}' ,'${from.first_name}', '${from.username}', ${from.id}, '${sw}'`;
              let insertResult = await DBinsert(ins);
          } catch (error) {
            console.error(error);
          }
        }
       break;
       case '/pol':
        ctx.reply("Полтава");
       break;


       case '/info':
        if(resqwery){
        ctx.reply('Налаштування: ' + from.first_name + '\n' + 'Тип: ' +  resqwery.swich);  }
      
       break;
    }
    if(resqwery){
      await DBupdate(sw,resqwery.id);
      console.log('Update')
    }else{
      try {
          sw ='text'
          let ins = `${chat.id}, ' ','${chatname}' ,'${from.first_name}', '${from.username}', ${from.id}, '${sw}'`;
          let insertResult = await DBinsert(ins);
          
      } catch (error) {
        console.error(error);
      }
    }


//////////////////////////////////////////////////////////////////////////////////
    if(sw =='text' && text !='/text' && text !='/image' && text !='/info'){
      res = await gpttext(text,chat.id,from.id);
      ctx.reply(res, {
        reply_to_message_id: message_id ,
        parse_mode: "MarkdownV2",
      
      });
      let insertResult = await DBmessage(chat.id, text, res, from.first_name, from.username, from.id,chatname);
    }
//////////////////////////////////////////////////////////////////////////////////
if (sw == 'image' && text != '/text' && text != '/image' && text != '/info') {
  ctx.reply('Генерую зображення...', {
    reply_to_message_id: message_id,
  });

  try {
    const photoPath = await gptimage(text);
    const photo = fs.readFileSync(photoPath);

    ctx.replyWithPhoto({ source: photo }, {
      reply_to_message_id: message_id,
      caption: '...'
    });
    if(text){
    let croppedText = text.substring(0, 250);
    let insertResult = await DBmessage(chat.id, croppedText ,'Картинка', from.first_name, from.username, from.id, chatname);
  }} catch (error) {
    console.error("Помилка під час генерації фотографії:", error);
  }
}
//////////////////////////////////////////////////////////////////////////////////




}
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
//////////////////////////////////////////////////////////////////////////////////
function log(a) {
  console.log(a);
}

//////////////////////////////////////////////////////////////////////////////////
async function gpttext(a,chatid,userid) {
  let messages = [];
  try {
    const DBm = await DB.getConnection();
    const sel = await DBm.query(`
      SELECT text, response, date FROM GPT4BOT_MESSAGE
      WHERE chatid = '${chatid}' AND id_user = '${userid}'
      ORDER BY date 
      LIMIT 15
    `);
    DBm.release();
    sel.forEach(row => {
      messages.push({ role: "user", content: row.text });
      messages.push({ role: "assistant", content: row.response });
    });
    messages.push({ role: "user", content: a });
  } catch (e) {
    console.log(e);
  }

const options = {
  provider: g4f.providers.GPT,
  debug: true,
  source: "UA",
};
return g4f.chatCompletion(messages, options); 
}
//////////////////////////////////////////////////////////////////////////////////

function gptimage(a) {
  return new Promise(async (resolve, reject) => {
      try {
        const base64Image = await g4f.imageGeneration(a, { 
          debug: true,
          provider: g4f.providers.Prodia,
          providerOptions: {
              model: "ICantBelieveItsNotPhotography_seco.safetensors [4e7a3dfd]",
              samplingSteps: 15,
              cfgScale: 30
          }
      });	

          const imageBuffer = Buffer.from(base64Image, 'base64');
           fs.writeFileSync('res.jpg', imageBuffer);
          resolve('res.jpg');
      } catch (error) {
          reject(error);
      }
  });
}


