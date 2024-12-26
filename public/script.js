const socket = io('http://<Your_IPaddress>:3001'); //Your_IPaddressには自分のpcのIPv4アドレスを入力
let RoomID
// ルームIDの入力と検索
window.onload = async function() {
    AppendData('System', 'Connected server')

     RoomID = prompt('ルームIDを入力');
    if (RoomID) {
        console.log(`Room ID is ${RoomID}`);
        AppendData('Home/connection', `${RoomID}を検索しています。`);

        fetch(`/search?query=${encodeURIComponent(RoomID)}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data && !data.error) {
                AppendData('SYSTEM', `ルームが見つかりました: ${data.roomname}`);
                document.title = data.roomname;
                document.getElementById('name').textContent = data.roomname;
                LoadMessages(data.messages)
            } else {
                AppendData('SYSTEM', '一致するデータが見つかりません。');
            }
        })
        .catch(err => {
            console.error('検索リクエスト中にエラーが発生しました:', err);
            AppendData('SYSTEM', '検索中にエラーが発生しました。');
        });
    }
}

function AppendData(chatname, chatcontent) {
    const chatBody = document.getElementById('chatBody');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.textContent = `${chatname}: ${chatcontent}`;
    chatBody.appendChild(messageElement);
}

// サーバーからの過去メッセージを受信し、表示
function LoadMessages(messages) {
    if (!Array.isArray(messages)) {
        console.error('受信したメッセージが無効です:', messages);
        return; // エラーログを出力して処理を終了
    }

    const chatBody = document.getElementById('chatBody');
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.textContent = `${message.name}: ${message.content}`;
        chatBody.appendChild(messageElement);
    });
};

// 新しいメッセージをサーバーから受信して表示
socket.on('message', (MessageData) => {
    AppendData(MessageData.name, MessageData.content);
});

// 送信ボタンのクリックイベント
document.getElementById('sendButton').addEventListener('click', () => {
    const messageInput = document.getElementById('messageInput');
    const messageContent = messageInput.value.trim();
    if (messageContent) {
        const name = localStorage.getItem('name');
          const userName = name ? name : (localStorage.setItem('name', prompt('ユーザー名を入力')), localStorage.getItem('name'));
          
          const messageData = {
              roomname: RoomID,
              name: userName,
              content: messageContent
};
          
        socket.emit('sdmessage', messageData);
        messageInput.value = ''; // 入力欄をクリア
    }
});