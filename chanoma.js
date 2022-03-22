var pinList = [
    {"title":"お知らせ一覧","function":InfoPickup},
    {"title":"作成日時順の最新ノート","function":CreatedOrder},
    {"title":"更新日時順の最新ノート","function":EditedOrder},
    //{"title":"ランダムピックアップ 5件","function":RandomPickup5},
]

var exlinkList = [
    {"title":"Noratetsu Lab(Blog)","URL":"https://noratetsu.blogspot.com/","imgsrc":"https://www.blogger.com/img/logo_blogger_40px.png"},
    {"title":"Scrapbox","URL":"https://scrapbox.io/noratetsu/","imgsrc":"https://gyazo.com/5f93e65a3b979ae5333aca4f32600611/max_size/1000"},
    {"title":"Twitter","URL":"https://twitter.com/Foam_Crab","imgsrc":"https://gyazo.com/c6f9ef45d7c4b64fe31909485b8a9222/max_size/1000"},
    {"title":"note","URL":"https://note.com/noratetsu/","imgsrc":"https://gyazo.com/57f5da416fed69ca4f8621766aab12f0/max_size/1000"},
]

var masterdata;
fetch("https://nora-tetsu.github.io/Chanoma/chanomaData.json")
    .then(response => response.text())
    .then(data => {
        masterdata = JSON.parse(data.replace(/\\n/g,"<br>"));
        console.log("現在のデータベースの内容を確認");
        console.log(masterdata);
        Starting();
        console.log("ロードが完了しました。")
        });

function Starting(){
    BuildExlinks();
    BuildPinnedList();
    BuildTagList();
    SetBody("About");
}

// 以下function

function AddEventByClassName(classname,type,f){
    let targets = document.getElementsByClassName(classname);
    for(let i = 0; i < targets.length; i++){
        targets[i].addEventListener(type,f);
    }
}

// 他のサイトへのリンクを生成（右上の欄）
function BuildExlinks(){
    const target = document.getElementById("exlinks");
    for(let i = 0; i < exlinkList.length; i++){
        let item = document.createElement("li");
        let a = document.createElement("a");
        a.href = exlinkList[i].URL;
        a.title = exlinkList[i].title;
        a.target="_blank";
        let img = document.createElement("img");
        img.src = exlinkList[i].imgsrc;
        target.appendChild(item);
        item.appendChild(a);
        a.appendChild(img);
    }
}

// ピン欄を生成（左列上部）
function BuildPinnedList(){
    const target = document.querySelector(".pin-parent");
    // 各ノートのpin判定をチェックして生成
    for(let i = 0; i < masterdata.length; i++){
        if(masterdata[i].pin==true){
            let item = document.createElement("li");
            item.innerText = masterdata[i].title;
            item.className = "pinned";
            item.addEventListener("click",BuildBody);
            target.appendChild(item);
        }
    }
    // 関数を発動するアイテムを生成
    for(let i = 0; i < pinList.length; i++){
        let item = document.createElement("li");
        item.innerText = pinList[i].title;
        item.className = "pinned pickup";
        item.addEventListener("click",pinList[i].function);
        target.appendChild(item);
    }
}

// 分類タグ欄を生成（左列下部）
function BuildTagList(){
    const list = document.getElementById("tags")
    for(let i = 0; i < masterdata.length; i++){
        let inputtag = masterdata[i].tag;
        if(inputtag=="") continue;
        let tags = inputtag.split("/");
        if(!list.querySelector('[name="'+inputtag+'"]')){
            let thistag,parenttag,targetul;
            for(let j = 0; j < tags.length; j++){
                // まとめてスキップ処理する
                if(j==0){
                    thistag = tags[0];
                    targetul = list.querySelector("ul.tag-parent");
                }else{
                    thistag = thistag + "/" + tags[j];
                    let parentspan = list.querySelector('[name="'+parenttag+'"]');
                    let parentli = parentspan.parentNode;
                    targetul = parentli.querySelector("ul");
                }
                parenttag = thistag;
                if(list.querySelector('[name="'+thistag+'"]')) continue;
                
                let item = document.createElement("li");
                let nodeicon = document.createElement("i");
                nodeicon.className = "node-icon fas fa-caret-right";
                let span = document.createElement("span");
                span.className = "tag-title";
                span.innerText = tags[j];
                span.setAttribute("name",thistag);
                item.appendChild(nodeicon);
                item.appendChild(span);
                let ul = document.createElement("ul");
                ul.className = "hiddennode"
                item.appendChild(ul);
                targetul.appendChild(item);               
            }
        }
    }
    
    // フォルダが先に生成されるようにtag-note構築は分けて処理
    for(let i = 0; i < masterdata.length; i++){
        let inputtag = masterdata[i].tag;
        let li = document.createElement("li");
        let tagNote = document.createElement("span");
        tagNote.className = "tag-note";
        tagNote.innerText = masterdata[i].title;
        li.appendChild(tagNote);
        let target;
        if(inputtag==""){
            target = list.querySelector('[name="undefined"]').parentNode;
        }else{
            target = list.querySelector('[name="'+inputtag+'"]').parentNode;
        }
        target.querySelector("ul").appendChild(li);
    }
    AddEventByClassName("tag-title","click",BuildTagBody);
    AddEventByClassName("tag-note","click",BuildBody);
    AddEventByClassName("node-icon","click",ToggleExpand);

    // 件数を表示
    const alltags = document.getElementsByClassName("tag-title");
    for(let i = 0; i < alltags.length; i++){
        let li = alltags[i].parentNode
        let tagnum = li.querySelectorAll(".tag-note");
        let target = li.querySelector("span");
        target.innerText = target.innerText + " (" + tagnum.length + ")";
    }
}

// 本文データを加工してHTMLタグを付与
function ProcessText(txt){
    let editedtxt = txt;
    let match_link = editedtxt.match(/\[\[[^\]\]]*\]\]/g); // [[hoge]]
    if(match_link!=null){
        for (let i = 0; i < match_link.length; i++) {
            let link = match_link[i].replace(/\[\[/,'<span class="page-link emptylink">').replace(/\]\]/,'</span>');
            editedtxt = editedtxt.replace(match_link[i],link);
        }
    }
    let match_img = editedtxt.match(/!\[[^\]]*\]\([^\)]*(\)\{[^\}]*\}|\))/g); // ![title](url){style}
    if(match_img!=null){
        for(let i = 0; i < match_img.length; i++){
            let link = match_img[i].replace(/!\[(.*)\]\((.*)\)/,'<img src="$2" title="$1" style="height:auto;').replace(/\{(.*)\}/,'$1') + '">';
            editedtxt = editedtxt.replace(match_img[i],link);
        }
    }
    let match_url = editedtxt.match(/\[[^\]]*\]\([^\)]*\)/g); // [title](url)
    if(match_url!=null){
        for(let i = 0; i < match_url.length; i++){
            let link = match_url[i].replace(/\[(.*)\]\((.*)\)/,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            editedtxt = editedtxt.replace(match_url[i],link);
        }
    }
    let match_quote = editedtxt.match(/\[\>[^\]]*\]/g); // [>text]
    if(match_quote!=null){
        for(let i = 0; i < match_quote.length; i++){
            let link = match_quote[i].replace(/\[\>(.*)\]/,'<blockquote>$1</blockquote>');
            editedtxt = editedtxt.replace(match_quote[i],link);
        }
    }
    return editedtxt;
}

var linkArray;
function BuildForwardLinks(){
    // フォワードリンク構築
    const allLinks = document.getElementsByClassName("page-link");
    if(allLinks.length==0) return;
    const target = document.querySelector(".link-parent");
    linkArray = new Array(); // 本文中に含まれるリンクの配列を作る
    for(let i = 0; i < allLinks.length; i++){
        let pageLink = allLinks[i].innerText
        if(!linkArray.includes(pageLink)){ // 既に追加されていなければ
            linkArray.push(pageLink);
        }
    }
    for(let j = 0; j < linkArray.length; j++){
        let item = document.createElement("li");
        let span = document.createElement("span");
        span.innerText = linkArray[j];
        span.className = "link-item forwardlink emptylink";
        span.addEventListener("click",BuildBody);
        target.appendChild(item);
        item.appendChild(span);
        let ul = document.createElement("ul");
        item.appendChild(ul);
        for(let k = 0; k < masterdata.length; k++){
            if(linkArray[j]==masterdata[k].title){ // 空リンクでない時
                span.classList.remove("emptylink");
            }
        }
        Build2hopLinks(ul,linkArray[j]);
    }
}
function Build2hopLinks(ul,title){
    // 各フォワードリンクに2hopリンク構築
    const all2hop = document.querySelectorAll(".twohoplink");
    const allbacklink = document.querySelectorAll(".backlink");
    let jArray = new Array(); // 既に生成されているリンクの配列を作る
    jArray.push(document.querySelector(".body-title").innerText);
    for(let i = 0; i < all2hop.length; i++){
        jArray.push(all2hop[i].innerText);
    }
    for(let i = 0; i < allbacklink.length; i++){
        jArray.push(allbacklink[i].innerText);
    }
    for(let i = 0; i < masterdata.length; i++){
        if(jArray.includes(masterdata[i].title)) continue; // 既に存在していればスキップ
        if(linkArray.includes(masterdata[i].title)) continue; // フォワードリンクとして生成されるものはスキップ
        let match = masterdata[i].body.includes("[["+title+"]]");
        if(match){
            let item = document.createElement("li");
            let span = document.createElement("span");
            span.innerText = masterdata[i].title;
            span.className = "link-item twohoplink";
            span.addEventListener("click",BuildBody);
            ul.appendChild(item);
            item.appendChild(span);
        }
    }
}
function BuildBackLinks(){
    // バックリンク構築
    const target = document.querySelector(".link-parent");
    const notetitle = document.querySelector(".body-title").innerText;
    for(let i = 0; i < masterdata.length; i++){
        let match = masterdata[i].body.includes("[["+notetitle+"]]");
        if(match){
            let item = document.createElement("li");
            let span = document.createElement("span");
            span.innerText = masterdata[i].title;
            span.className = "link-item backlink";
            span.addEventListener("click",BuildBody);
            target.appendChild(item);
            item.appendChild(span);
            let ul = document.createElement("ul");
            item.appendChild(ul);
        }
    }
}
function BuildImplyBackLinks(){
    // 非明示的バックリンク構築
    const target = document.querySelector(".link-parent");
    const notetitle = document.querySelector(".body-title").innerText;
    const alllink = target.querySelectorAll(".link-item");
    let jArray = new Array(); // 既に生成されているリンクの配列を作る
    jArray.push(notetitle);
    for(let i = 0; i < alllink.length; i++){
        jArray.push(alllink[i].innerText);
    }
    for(let i = 0; i < masterdata.length; i++){
        let match = masterdata[i].body.includes(notetitle);
        if(match){
            if(jArray.includes(masterdata[i].title)) continue; // 既に生成されていればスキップ
            let item = document.createElement("li");
            let span = document.createElement("span");
            span.innerText = masterdata[i].title;
            span.className = "link-item implybacklink";
            span.addEventListener("click",BuildBody);
            target.appendChild(item);
            item.appendChild(span);
            let ul = document.createElement("ul");
            item.appendChild(ul);
        }
    }
}
function BuildImplyforwardLinks(){
    // 非明示的フロントリンク構築
    const target = document.querySelector(".link-parent");
    const notetitle = document.querySelector(".body-title").innerText;
    const alllink = target.querySelectorAll(".link-item");
    let jArray = new Array(); // 既に生成されているリンクの配列を作る
    jArray.push(notetitle);
    for(let i = 0; i < alllink.length; i++){
        jArray.push(alllink[i].innerText);
    }
    // まず全データ中の[[hoge]]を探して配列にする
    let wordArray = new Array();
    for(let i = 0; i < masterdata.length; i++){
        let match_link = masterdata[i].body.match(/\[\[[^\]\]]*\]\]/g);
        if(match_link!=null){
            for (let i = 0; i < match_link.length; i++) {
                let link = match_link[i].replace(/\[\[/,'').replace(/\]\]/,'');
                if(wordArray.includes(link)) continue; // 既にあればスキップ
                wordArray.push(link);
            }
        }
    }
    // 表示している本文中にhogeと一致するワードがあれば、hogeへのリンクを作る
    const text = document.querySelector(".body-text").innerText
    for(let i = 0; i < wordArray.length; i++){
        if(jArray.includes(wordArray[i])) continue;
        if(text.includes(wordArray[i])){
            let item = document.createElement("li");
            let span = document.createElement("span");
            span.innerText = wordArray[i];
            span.className = "link-item implyforwardlink";
            span.addEventListener("click",BuildBody);
            target.appendChild(item);
            item.appendChild(span);
            let ul = document.createElement("ul");
            item.appendChild(ul);
        }
    }
}

// 本文中のリンクが空リンクかどうかチェック
function CheckLink(){
    const allLinks = document.getElementsByClassName("page-link");
    for(let i = 0; i < allLinks.length; i++){
        allLinks[i].addEventListener("click",BuildBody);
        for(let j = 0; j < masterdata.length; j++){
            if(allLinks[i].innerText==masterdata[j].title){
                allLinks[i].classList.remove("emptylink");
            }
        }
    }
}

function ClearBody(){
    document.querySelector(".body-title").innerText = "";
    document.querySelector(".body-text").innerHTML = "";
    document.querySelector(".body-tag").innerHTML = "";
    document.querySelector(".link-parent").innerHTML = "";
}
function BuildBody(){ // onclickで発動
    const title = this.innerText;
    SetBody(title);
}
function SetBody(title){
    ClearBody();
    document.querySelector(".body-title").innerText = title;
    for(let i = 0; i < masterdata.length; i++){
        if(title==masterdata[i].title){
            document.querySelector(".body-text").innerHTML = ProcessText(masterdata[i].body);
            CheckLink();

            // 下部のタグ欄を生成
            let tagarea = document.querySelector(".body-tag");
            tagarea.innerHTML = "";
            let inputtag = masterdata[i].tag;
            let tags = inputtag.split("/");
            let t,tagname;
            for(let j = 0; j < tags.length; j++){
                let span = document.createElement("span");
                span.innerText = tags[j];
                span.className = "tag-title";
                if(j==0){
                    tagname = tags[j];
                }else{
                    tagname = tagname + "/" + tags[j];
                }
                span.setAttribute("name",tagname);
                if(j==0){
                    t = "#" + span.outerHTML;
                }else{
                    t = t + "/" + span.outerHTML;
                }
            }
            tagarea.innerHTML = t;
        }
    }
    CreateTweetByID();
    BuildBackLinks();
    BuildForwardLinks();
    BuildImplyBackLinks();
    BuildImplyforwardLinks();
    AddEventByClassName("tag-title","click",BuildTagBody);
}
function BuildTagBody(){ // タグのonclickで発動
    ClearBody();
    const title = "# " + this.innerText;
    const thisname = this.getAttribute("name");
    const listli = document.querySelector('div#tags [name="'+thisname+'"]').parentNode;
    const listul = listli.querySelector("ul");
    let clone = listul.cloneNode(true);
    clone.classList.remove("hiddennode");
    let uls = clone.querySelectorAll("ul");
    for(let i = 0; i < uls.length; i++){
        uls[i].classList.remove("hiddennode");
        let li = uls[i].parentNode;
        let nodeicon = li.querySelector(".node-icon")
        nodeicon.classList.remove("fa-caret-right")
        nodeicon.classList.add("fa-caret-down")
    }
    document.querySelector(".body-text").appendChild(clone);
    document.querySelector(".body-title").innerText = title;
    document.querySelector(".link-parent").innerHTML = "";
    
    let tagarea = document.querySelector(".body-tag");
    let parenttags = this.getAttribute("name").split("/");
    let t;
    if(parenttags.length>1){
        for(let j = 0; j < parenttags.length-1; j++){
            let span = document.createElement("span");
            span.innerText = parenttags[j];
            span.className = "tag-title";
            if(j==0){
                tagname = parenttags[j];
            }else{
                tagname = tagname + "/" + parenttags[j];
            }
            span.setAttribute("name",tagname);
            if(j==0){
                t = "#" + span.outerHTML;
            }else{
                t = t + "/" + span.outerHTML;
            }
        }
        tagarea.innerHTML = t;
    }
    AddEventByClassName("tag-title","click",BuildTagBody);
    AddEventByClassName("tag-note","click",BuildBody);
    AddEventByClassName("node-icon","click",ToggleExpand);
}

// 作成日時/更新日時でピックアップ
function SortCreatedOrder(){ // 作成日時降順に並び替えたオブジェクトを返す
    let result = masterdata.slice().sort(function(a, b) {
        return (a.created > b.created) ? -1 : 1;  //オブジェクトの降順ソート
      })
    return result;
}
function SortEditedOrder(){ // 更新日時降順に並び替えたオブジェクトを返す
    let result = masterdata.slice().sort(function(a, b) {
        return (a.edited > b.edited) ? -1 : 1;  //オブジェクトの降順ソート
      })
    return result;
}
function BuildDateOrder(type){
    ClearBody();
    let sorted;
    let N = 100; // 最大100件
    if(type=="created"){
        sorted = SortCreatedOrder();
        if(sorted.length < N) N = sorted.length;
        document.querySelector(".body-title").innerText = "作成日時順の最新ノート（"+N+"件）";
    }else if(type=="edited"){
        sorted = SortEditedOrder();
        if(sorted.length < N) N = sorted.length;
        document.querySelector(".body-title").innerText = "更新日時順の最新ノート（"+N+"件）";
    }
    for(let i = 0; i < N; i++){
        let date = sorted[i][type].substr(0,10);
        let datediv,dateul;
        if(!document.querySelector('[name="'+date+'"]')){
            datediv = document.createElement("div");
            datediv.setAttribute("name",date);
            let datelabel = document.createElement("p");
            datelabel.innerText = date;
            datelabel.className = "datelabel";
            dateul = document.createElement("ul");
            document.querySelector(".body-text").appendChild(datediv);
            datediv.appendChild(datelabel);
            datediv.appendChild(dateul);
        }else{
            datediv = document.querySelector('[name="'+date+'"]');
            dateul = datediv.querySelector("ul");
        }
        let texttitle = document.createElement("li");
        texttitle.innerText = sorted[i].title;
        texttitle.className = "date-note";
        dateul.appendChild(texttitle);
        CheckLink();
    }
    AddEventByClassName("date-note","click",BuildBody);
}
function CreatedOrder(){
    BuildDateOrder("created");
}
function EditedOrder(){
    BuildDateOrder("edited");
}

// お知らせタグピックアップ
function InfoPickup(){
    ClearBody();
    const target = document.querySelector(".body-text");
    let sorted = SortCreatedOrder();
    let pickdata = new Array();
    pickdata = sorted.filter(e => {
        if(e.tag.includes("お知らせ")) return e;
    });
    document.querySelector(".body-title").innerText = "お知らせ一覧（"+pickdata.length+"件）";
    for(let i = 0; i < pickdata.length; i++){
        let p = document.createElement("p");
        p.innerText = pickdata[i].title;
        p.className = "note-title";
        p.addEventListener("click",BuildBody);
        let div = document.createElement("div");
        div.innerHTML = ProcessText(pickdata[i].body);
        target.appendChild(p);
        target.appendChild(div);
    }
    CreateTweetByID();
}

// 件数を指定してランダムピックアップ
function RandomPickup(num){
    let n = num;
    let pickdata = new Array();
    pickdata = masterdata.filter(e => {
        if(!e.tag.includes("お知らせ") && !e.tag.includes("日記")) return e;
    });
    if(num>pickdata.length) n = pickdata.length
    ClearBody();
    document.querySelector(".body-title").innerText = "ランダムピックアップ " + n + "件（埋め込みツイートは表示しません）"
    const target = document.querySelector(".body-text");
    let x; // 乱数
    let xArray = new Array(); // 使った乱数を記録する配列
    for(let i = 0; i < n; i++){
        do {
            x = random(0,pickdata.length-1); // 存在する件数内で乱数生成
        }while(xArray.includes(x)); // 重複しなくなるまで（既に配列にある場合はやり直し）

        let p = document.createElement("p");
        p.innerText = pickdata[x].title;
        p.className = "note-title";
        p.addEventListener("click",BuildBody);
        let div = document.createElement("div");
        div.innerHTML = ProcessText(pickdata[x].body);
        target.appendChild(p);
        target.appendChild(div);

        xArray.push(x);
    }
    AddEventByClassName("node-title","click",BuildBody);
}
function RandomPickup5(){
    RandomPickup(5)
}

// タグ一覧の子項目開閉
function ToggleExpand(){
    let parentli = this.parentNode;
    let targetul = parentli.querySelector("ul");
    let tag;
    tag = "hiddennode";
    if(targetul.firstChild){ // 子項目があれば
        if(targetul.classList.contains(tag)){
            targetul.classList.remove(tag)
            this.classList.remove("fa-caret-right")
            this.classList.add("fa-caret-down")
        }else{
            targetul.classList.add(tag);
            this.classList.remove("fa-caret-down")
            this.classList.add("fa-caret-right")
        }   
    }
}
