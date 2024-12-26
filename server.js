const { Server } = require('socket.io');
const path = require('path');
const express = require('express');
const fs = require('fs');
const cors = require('cors');

// Server Initialize
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const Sdirectory = path.join(__dirname, '/Servers/RoomServer.json');

// JSONファイルの初期化
if (!fs.existsSync(Sdirectory)) {
    fs.writeFileSync(Sdirectory, JSON.stringify([]));
}

app.get('/search', (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: '検索クエリが指定されていません。' });
    }

    try {
        const data = fs.readFileSync(Sdirectory, 'utf8');
        const ParseData = JSON.parse(data);

        if (typeof ParseData.rooms !== 'object' || ParseData.rooms === null) {
            throw new TypeError('パースしたデータが無効です。');
        }

        const retDat = ParseData.rooms[query];

        if (retDat) {
            console.log(retDat);
            return res.json({ roomname: query, messages: retDat });
        } else {
            return res.status(404).json({ message: '一致するデータが見つかりません。' });
        }
    } catch (err) {
        console.error('JSONファイルの読み込みエラー:', err);
        return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
});


app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});
app.get('/socket', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist', 'socket.io.js'))
})
const server = app.listen(3001, "<Your_Ipaddress>", () => { //Your_IPaddressには自分のIPv4アドレスを入力
    console.log('サーバーが3001番ポートで起動しています');
});

// Socket.io Initialization with CORS settings
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('connection socket server on port 3001');

    // クライアントに過去のメッセージを送信
    try {
        const existingData = JSON.parse(fs.readFileSync(Sdirectory, 'utf-8'));
    } catch (err) {
        console.error('JSONファイルの読み込みエラー:', err);
    }

    // クライアントからの 'sdmessage' イベントをリスニング
    socket.on('sdmessage', (Mdata) => {
        if (!Mdata.content) {
            console.error('データが破損しているかクライアント側のコードが改造されています。');
        } else {
            console.log(Mdata);
            const MessageData = {
                name: Mdata.name,
                content: Mdata.content,
                timestamp: new Date().toISOString()
            };
    
            try {
                const existingData = JSON.parse(fs.readFileSync(Sdirectory, 'utf-8'));
    
                // ルームが存在しない場合、新たに作成
                if (!existingData.rooms) {
                    existingData.rooms = {};
                }
                if (!existingData.rooms[Mdata.roomname]) {
                    existingData.rooms[Mdata.roomname] = []; // 修正: 新しいルームに空配列を代入
                }
    
                // ルームに新しいメッセージを追加
                existingData.rooms[Mdata.roomname].push(MessageData);
    
                // JSONファイルに書き込む
                fs.writeFileSync(Sdirectory, JSON.stringify(existingData, null, 2));
            } catch (err) {
                console.error('JSONファイルの書き込みエラー:', err);
            }
    
            io.emit('message', MessageData);
        }
    });
    

    // 検索イベント 'test'
    socket.on('test', (Quer) => {
        try {
            const data = fs.readFileSync(Sdirectory, 'utf8');
            const ParseData = JSON.parse(data);
            const retDat = ParseData.find(SeaD => SeaD.roomname === Quer);

            if (retDat) {
                socket.emit('searchResult', retDat); // 結果をクライアントに個別送信
            } else {
                socket.emit('searchResult', { message: '一致するデータが見つかりません。' });
            }
        } catch (err) {
            console.error('JSONファイルの読み込みエラー:', err);
            socket.emit('searchResult', { error: 'サーバーエラーが発生しました。' });
        }
    });
    socket.on('CreateRoom', (CreateRoom) => {
        if(CreateRoom) {

        } else {

        }
    })
});
