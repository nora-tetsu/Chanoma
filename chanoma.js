class LinkLi extends HTMLLIElement {
    constructor(title,type,option) {
        super();
        this.setAttribute('is','link-li');
        this.setAttribute('name',title);
        const icon = document.createElement('i');
        const text = document.createElement("span");
        text.innerText = title;
        text.classList.add('title');
        const ul = document.createElement('ul');
        this.append(icon,text,ul);        
        this.setAttribute('data-type',type);
        if(option) option(this);
    }
    getTitle(){
        return this.querySelector('.title').innerText;
    }
    
    //connectedCallback() {}
    static get observedAttributes() {
        return ['data-type'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if(name=='data-type'){
            this.querySelector('.title').classList.add(newValue);
            switch(newValue){
                case 'pinned':
                    this.querySelector('i').className = 'fas fa-thumbtack';
                    break;
                case 'pickup':
                    this.querySelector('.title').classList.add('pinned');
                    this.querySelector('i').className = 'fas fa-magic';
                    break;
                default:
                    this.querySelector('.title').classList.add('link-item');
                    if(!DATA.find(obj=>obj.title==this.getTitle())) this.querySelector('.title').classList.add("emptylink");
                    this.querySelector('.title').addEventListener('click',()=>body.setData(this.getTitle()));
            }
            switch(newValue){
                case 'forwardlink':
                case 'implyforwardlink':
                    this.querySelector('i').className = 'fas fa-angle-double-right';
                    break;
                case 'twohoplink':
                    this.querySelector('i').className = 'fas fa-angle-right';
                    break;
                case 'backlink':
                case 'implybacklink':
                    this.querySelector('i').className = 'fas fa-angle-double-left';
                    break;
                default:
            }
        }
    }
}
customElements.define('link-li', LinkLi, {extends: 'li'});

const LIST = {
    pin: [
        {"title":"お知らせ一覧","function":()=>pickup.info()},
        {"title":"作成日時順の最新ノート","function":()=>pickup.dateOrder("created")},
        {"title":"更新日時順の最新ノート","function":()=>pickup.dateOrder("edited")},
        {"title":"リンク済みキーワード一覧","function":()=>pickup.keywords()},
        //{"title":"ランダムピックアップ 5件","function":()=>pickup.random(5)},
    ],
    exlink: [
        {"title":"Noratetsu Lab(Blog)","URL":"https://noratetsu.blogspot.com/","imgsrc":"https://www.blogger.com/img/logo_blogger_40px.png"},
        {"title":"Scrapbox","URL":"https://scrapbox.io/noratetsu/","imgsrc":"https://gyazo.com/5f93e65a3b979ae5333aca4f32600611/max_size/1000"},
        {"title":"Twitter","URL":"https://twitter.com/Foam_Crab","imgsrc":"https://gyazo.com/c6f9ef45d7c4b64fe31909485b8a9222/max_size/1000"},
        {"title":"Twilog","URL":"https://twilog.org/Foam_Crab/asc","imgsrc":"http://www.google.com/s2/favicons?domain=https://twilog.org/Foam_Crab/asc"},
        {"title":"Substack","URL":"https://substack.com/profile/97326198--foam_crab","imgsrc":"https://gyazo.com/697681c54bb68010e6e027d724d1dd2d/max_size/1000"},
        {"title":"note","URL":"https://note.com/noratetsu/","imgsrc":"https://gyazo.com/57f5da416fed69ca4f8621766aab12f0/max_size/1000"},
    ],
}

const database = {
    data:[],
    sortCreated(){
        // 作成日時降順に並び替えたオブジェクトを返す
        const result = DATA.slice().sort(function(a, b) {
            return (a.created > b.created) ? -1 : 1;  //オブジェクトの降順ソート
        })
        return result;
    },
    sortEdited(){
        // 更新日時降順に並び替えたオブジェクトを返す
        const result = DATA.slice().sort(function(a, b) {
            return (a.edited > b.edited) ? -1 : 1;  //オブジェクトの降順ソート
        })
        return result;
    },
    getKeywordList(){
        const arr = [];
        DATA.forEach(data=>{
            const match = data.body.match(/\[\[[^\]\]]*\]\]/g);
            if(match){
                match.forEach(value=>{
                    const link = value.replace(/\[\[/,'').replace(/\]\]/,'');
                    const find = arr.find(obj=>obj.keyword==link)
                    if(find){
                        find.count++;
                    }else{
                        arr.push({keyword:link,count:1});
                    }
                })
            }
        })
        return arr;
    }
}
let DATA = database.data;

const render = {
    exlinks(){
        // 他のサイトへのリンクを生成（右上の欄）
        const parent = document.getElementById("exlinks");
        parent.innerHTML = "";
        LIST.exlink.forEach(data=>{
            const item = document.createElement("li");
            parent.append(item);
            const a = document.createElement("a");
            a.href = data.URL;
            a.title = data.title;
            a.parent="_blank";
            item.append(a);
            const img = document.createElement("img");
            img.src = data.imgsrc;
            a.append(img);
        })
    },
    pinned(){
        // ピン欄を生成（左列上部）
        const parent = document.getElementById('pin-parent');
        parent.innerHTML = "";
        // 各ノートのpin判定をチェックして生成
        const filter = DATA.filter(obj=>obj.pin);
        filter.forEach(data=>{
            const item = new LinkLi(data.title,'pinned');
            item.addEventListener("click",function(){body.setData(this.innerText)});
            parent.append(item);
        })
        // 関数を発動するアイテムを生成
        LIST.pin.forEach(data=>{
            const item = new LinkLi(data.title,'pickup');
            item.addEventListener("click",data.function);
            parent.append(item);
        })
    },
    tags(){
        // 分類タグ欄を生成（左列下部）
        const list = document.getElementById("tags");
        document.getElementById('tag-parent').innerHTML = '';
        document.getElementById('tag-parent').append(createItem('(undefined)','undefined'));
        const sorted = database.sortCreated();
        const done = [];
        sorted.forEach(data=>{
            if(data.tag=='') return;
            const split = data.tag.split(',');
            split.forEach(tag=>{
                const tagtree = tag.split('/');
                let tagname = '', parentUl;
                tagtree.forEach(value=>{
                    if(tagname==''){
                        tagname = value;
                        parentUl = document.getElementById('tag-parent');
                    }else{
                        parentUl = list.querySelector(`li[name="${tagname}"] > ul`);
                        tagname += `/${value}`;
                    }
                    if(done.includes(tagname)) return;
                    
                    const item = createItem(value,tagname);
                    parentUl.append(item);
                    done.push(tagname);
                })
            })
        })
        function createItem(title,tagname){
            const item = document.createElement("li");
            item.setAttribute("name",tagname);
            const nodeicon = document.createElement("i");
            nodeicon.className = "node-icon fas fa-caret-right";
            nodeicon.addEventListener("click",toggleExpand);
            const span = document.createElement("span");
            span.className = "tag-title";
            span.setAttribute('data-tag-full',tagname);
            span.setAttribute('data-tag',title);
            span.innerText = title;
            span.addEventListener('click',function(){body.setTagdata(this)})
            item.append(nodeicon,span);
            const ul = document.createElement("ul");
            ul.className = "hidden";
            item.append(ul);
            return item;
        }
        
        // フォルダが先に生成されるようにtag-note構築は分けて処理
        sorted.forEach(data=>{
            const split = data.tag.split(',');
            split.forEach(tag=>{
                const item = document.createElement("li");
                item.style.marginLeft = '-14px';
                const icon = document.createElement('i');
                icon.className = 'fas fa-angle-right';
                const note = document.createElement("span");
                note.className = "tag-note";
                note.innerText = data.title;
                note.addEventListener("click",function(){body.setData(this.innerText)})
                item.append(icon,note);
                const parent = tag ? list.querySelector(`li[name="${tag}"]`) : list.querySelector('[name="undefined"]');
                parent.querySelector("ul").append(item);
            })
        })

        // 件数を表示
        const alltags = document.querySelectorAll("span.tag-title");
        alltags.forEach(elm=>{
            const parent = elm.parentNode; // li
            elm.innerText += `（${parent.querySelectorAll(".tag-note").length}）`;
        })
    },
}

const body = {
    clear(){
        document.getElementById('body-title').innerText = "";
        document.getElementById('body-text').innerHTML = "";
        document.getElementById('body-tag').innerHTML = "";
        document.getElementById('body-created').innerHTML = "";
        document.getElementById('body-edited').innerHTML = "";
        document.getElementById('link-parent').innerHTML = "";
        const bodyarea = document.getElementById("body");
        bodyarea.scrollTop = 0;
    },
    setData(title){
        this.clear();
        document.getElementById('body-title').innerText = title;
        const find = DATA.find(obj=>obj.title==title);
        if(find){
            document.getElementById('body-text').innerHTML = processText(find.body);
            document.getElementById('body-created').innerText = `作成日時： ${find.created}`;
            document.getElementById('body-edited').innerText = `更新日時： ${find.edited}`;
            this.renderTags(find);
            body.renderTweetByID();
            body.reflectLinkEvent();
        }
        body.renderLinks();
    },
    setTagdata(tagnode){
        // タグ一覧の内容をbody-textに表示する
        body.clear();
        document.getElementById('body-title').innerText = "# " + tagnode.getAttribute('data-tag');
        const thisname = tagnode.getAttribute('data-tag-full');
        const clone = document.querySelector(`div#tags [name="${thisname}"] ul`).cloneNode(true);
        clone.classList.remove("hidden");
        clone.querySelectorAll("ul").forEach(elm=>{
            elm.classList.remove("hidden");
            const li = elm.parentNode;
            const nodeicon = li.querySelector(".node-icon");
            nodeicon.classList.remove("fa-caret-right");
            nodeicon.classList.add("fa-caret-down");
        });
        document.getElementById('body-text').append(clone);
        document.getElementById('link-parent').innerHTML = "";
        
        const tagarea = document.getElementById('body-tag');
        const parenttags = thisname.split("/");
        let t;
        if(parenttags.length>1){
            for(let i = 0; i < parenttags.length-1; i++){
                const span = document.createElement("span");
                span.innerText = parenttags[i];
                span.setAttribute('data-tag',parenttags[i]);
                span.className = "tag-title";
                tagname = i==0 ? parenttags[i] : tagname + "/" + parenttags[i];
                span.setAttribute('data-tag-full',tagname);
                span.addEventListener("click",function(){body.setTagdata(this)});
                const hashtag = document.createTextNode('#');
                const slash = document.createTextNode('/');
                i==0 ? tagarea.append(hashtag,span) : tagarea.append(slash,span);
            }
        }
        document.querySelectorAll('#body .tag-title').forEach(elm=>{
            elm.addEventListener("click",function(){body.setTagdata(this)});
        });
        document.querySelectorAll('#body .tag-note').forEach(elm=>{
            elm.addEventListener("click",function(){body.setData(this.innerText)});
        });
        document.querySelectorAll('#body .node-icon').forEach(elm=>{
            elm.addEventListener("click",toggleExpand);
        });
    },
    renderTags(data){
        const split = data.tag.split(',');
        split.forEach(tag=>{
            const parent = document.createElement("span");
            const tagtree = tag.split('/');
            let tagname = '';
            tagtree.forEach(value=>{
                tagname=='' ? tagname = value : tagname = `${tagname}/${value}`;
                const span = document.createElement("span");
                span.setAttribute('data-tag-full',tagname);
                span.setAttribute('data-tag',value);
                span.innerText = value;
                span.classList.add('tag-title');
                span.addEventListener('click',function(){body.setTagdata(this)})
                const hashtag = document.createTextNode('#');
                const slash = document.createTextNode('/');
                if(!parent.innerHTML){
                    parent.append(hashtag,span);
                }else{
                    parent.append(slash,span);
                }
            })
            document.getElementById('body-tag').append(parent);
        })
    },
    renderLinks(){
        const parent = document.getElementById('link-parent');
        const pageLink = document.querySelectorAll('span.page-link');
        const title = document.getElementById('body-title').innerText;
        const done = []; // 既にリンク欄に出力したかを判定
        done.push(title);
        pageLink.forEach(elm=>{
            const forward = new LinkLi(elm.innerText,'forwardlink');
            forward.querySelector('span.link-item').title = 'このノートからリンクしているノート';
            parent.append(forward);
            done.push(elm.innerText);

        })
        pageLink.forEach(elm=>{
            // フォワードリンクを一通り構築した後に処理したいのでforEachを2周する
            const filterHop = DATA.filter(obj=>obj.body.includes(`[[${elm.innerText}]]`));
            filterHop.forEach(data=>{
                if(done.includes(data.title)) return;
                const hop = new LinkLi(data.title,'twohoplink');
                hop.querySelector('span.link-item').title = 'リンク先から更にリンクしているノート';
                parent.querySelector(`li[name="${elm.innerText}"] ul`).append(hop);
                done.push(data.title);
            })
        })
        const filterBack = DATA.filter(obj=>obj.body.includes(`[[${title}]]`));
        filterBack.forEach(data=>{
            // if(done.includes(data.title)) return;
            const back = new LinkLi(data.title,'backlink');
            back.querySelector('span.link-item').title = 'このノートにリンクしているノート';
            parent.append(back);
            done.push(data.title);
        })
        const filterImplyBack = DATA.filter(obj=>!obj.body.includes(`[[${title}]]`)&&obj.body.includes(title));
        filterImplyBack.forEach(data=>{
            if(done.includes(data.title)) return;
            const implyBack = new LinkLi(data.title,'implybacklink');
            implyBack.querySelector('span.link-item').title = 'このノートタイトルを文中に含むノート';
            parent.append(implyBack);
            done.push(data.title);
        })
        
        const linkList = database.getKeywordList();
        const bodyText = document.getElementById('body-text').innerText;
        linkList.forEach(data=>{
            if(done.includes(data.keyword)) return;
            if(bodyText.includes(data.keyword)){
                const implyForward = new LinkLi(data.keyword,'implyforwardlink');
                implyForward.querySelector('span.link-item').title = 'このノートの文中に含まれているキーワード';
                parent.append(implyForward);
            }
        })
    },
    renderTweetByID(){
        // https://platform.twitter.com/widgets.js が必要
        const text = document.getElementById('body-text').innerHTML;
        // https://twitter.com/Foam_Crab/status/1505159525334020098
        const match = text.match(/《https\:\/\/twitter\.com\/.*\/status\/[0-9]*》/g);
        if(match==null) return;
        let editedtext = text;
        for(let i = 0; i < match.length; i++){
            const tweetId = match[i].replace(/《.*\/status\/([0-9]*)》/,"$1");
            const tag = `<div class="tweetblock" name="${tweetId}">${match[i].replace('《','').replace('》','')}</div>`;
            editedtext = editedtext.replace(match[i],tag);
            document.getElementById('body-text').innerHTML = editedtext;
            let target = document.querySelector('[name="'+tweetId+'"]');
            // http://westplain.sakuraweb.com/translate/twitter/Documentation/Twitter-for-Websites/JavaScript/Scripting-Factory-Functions.cgi
            twttr.widgets.createTweet(
            tweetId,
            target,
            {
                align: 'center',
                width: '90%'
            })
            .then(function (el) {
                target.firstChild.remove();
                console.log("@ev's Tweet has been displayed.")
            });
        }
    },
    reflectLinkEvent(){
        // 本文中のリンクが空リンクかどうかチェック
        const pageLink = document.querySelectorAll('#body-text .page-link');
        pageLink.forEach(elm=>{
            elm.addEventListener("click",function(){body.setData(this.innerText)});
            if(DATA.find(obj=>obj.title==elm.innerText)) elm.classList.remove("emptylink");
        })

    }
}

const pickup = {
    dateOrder(type){ // 作成日時順/更新日時順で最新を表示
        body.clear();
        let sorted;
        let N = 100; // 最大100件
        if(type=="created"){
            sorted = database.sortCreated();
            if(sorted.length < N) N = sorted.length;
            document.getElementById('body-title').innerText = "作成日時順の最新ノート（"+N+"件）";
        }else if(type=="edited"){
            sorted = database.sortEdited();
            if(sorted.length < N) N = sorted.length;
            document.getElementById('body-title').innerText = "更新日時順の最新ノート（"+N+"件）";
        }
        for(let i = 0; i < N; i++){
            const date = sorted[i][type].substr(0,10);
            let datediv,dateul;
            if(!document.querySelector('[name="'+date+'"]')){
                datediv = document.createElement("div");
                datediv.setAttribute("name",date);
                const datelabel = document.createElement("p");
                datelabel.innerText = date;
                datelabel.className = "datelabel";
                dateul = document.createElement("ul");
                document.getElementById('body-text').append(datediv);
                datediv.append(datelabel,dateul);
            }else{
                datediv = document.querySelector('[name="'+date+'"]');
                dateul = datediv.querySelector("ul");
            }
            const item = document.createElement("li");
            const icon = document.createElement('i');
            icon.className = 'fas fa-angle-right';
            const texttitle = document.createElement("span");
            texttitle.innerText = sorted[i].title;
            texttitle.className = "date-note";
            texttitle.addEventListener("click",function(){body.setData(this.innerText)});
            item.append(icon,texttitle);
            dateul.append(item);
            body.reflectLinkEvent();
        }
    },
    info(){
        // お知らせタグピックアップ
        body.clear();
        const target = document.getElementById('body-text');
        const pickdata = database.sortCreated().filter(obj=>obj.tag.includes("お知らせ"));
        document.getElementById('body-title').innerText = `お知らせ一覧（${pickdata.length}件）`;
        pickdata.forEach(data=>{
            const p = document.createElement("p");
            p.innerText = data.title;
            p.className = "note-title";
            p.addEventListener("click",function(){body.setData(this.innerText)});
            const div = document.createElement("div");
            div.innerHTML = processText(data.body);
            target.append(p,div);
        })
        body.renderTweetByID();
        body.reflectLinkEvent();
    },
    random(num){
        // 件数を指定してランダムピックアップ
        const pickdata = DATA.filter(obj=>!obj.tag.includes("お知らせ")&&!obj.tag.includes("日記"));
        const n = num>pickdata.length ? pickdata.length : num;
        body.clear();
        document.getElementById('body-title').innerText = `ランダムピックアップ${n}件（埋め込みツイートは表示しません）`;
        const target = document.getElementById('body-text');
        let x; // 乱数
        let xArray = []; // 使った乱数を記録する配列
        for(let i = 0; i < n; i++){
            do {
                x = random(0,pickdata.length-1); // 存在する件数内で乱数生成
            }while(xArray.includes(x)); // 重複しなくなるまで（既に配列にある場合はやり直し）

            const p = document.createElement("p");
            p.innerText = pickdata[x].title;
            p.className = "note-title";
            p.addEventListener("click",function(){body.setData(this.innerText)});
            const div = document.createElement("div");
            div.innerHTML = processText(pickdata[x].body);
            target.append(p,div);

            xArray.push(x);
        }
        //body.renderTweetByID(); 挙動が怪しいのでツイート埋め込みはしない
    },
    keywords(){
        body.clear();
        const keywordList = database.getKeywordList();
        keywordList.sort((a,b)=>a.keyword.length - b.keyword.length);
        keywordList.sort((a,b)=>b.count - a.count);

        document.getElementById('body-title').innerText = `リンクが生成されているキーワード（リンク数/言及数）（${keywordList.length}件）`;
        const target = document.getElementById('body-text');
        const parent = document.createElement("ul");
        target.append(parent);
        keywordList.forEach(data=>{
            const item = document.createElement("li");
            parent.append(item);
            const icon = document.createElement('i');
            icon.className = 'fas fa-angle-right';
            const span = document.createElement("span");
            span.innerText = data.keyword;
            span.className = "date-note page-link emptylink";
            if(DATA.find(obj=>obj.title==data.keyword)) span.classList.remove("emptylink");
            span.setAttribute("name",data.keyword);
            span.addEventListener("click",function(){body.setData(this.innerText)});
            const numspan = document.createElement("span");
            numspan.className = "times"
            numspan.innerText = `（${data.count}/${DATA.filter(e => e.body.includes(data.keyword)).length}）`;
            item.append(icon,span,numspan);
        })
    },
}

// 本文データを加工してHTMLタグを付与
function processText(txt){
    let editedtxt = txt;
    const match_link = editedtxt.match(/\[\[[^\]\]]*\]\]/g); // [[hoge]]
    if(match_link!=null){
        for (let i = 0; i < match_link.length; i++) {
            const link = match_link[i].replace(/\[\[/,'<span class="page-link emptylink">').replace(/\]\]/,'</span>');
            editedtxt = editedtxt.replace(match_link[i],link);
        }
    }
    const match_img = editedtxt.match(/!\[[^\]]*\]\([^\)]*(\)\{[^\}]*\}|\))/g); // ![title](url){style}
    if(match_img!=null){
        for(let i = 0; i < match_img.length; i++){
            const link = match_img[i].replace(/!\[(.*)\]\((.*)\)/,'<img src="$2" title="$1" style="height:auto;').replace(/\{(.*)\}/,'$1') + '">';
            editedtxt = editedtxt.replace(match_img[i],link);
        }
    }
    const match_url = editedtxt.match(/\[[^\]]*\]\([^\)]*\)/g); // [title](url)
    if(match_url!=null){
        for(let i = 0; i < match_url.length; i++){
            const link = match_url[i].replace(/\[(.*)\]\((.*)\)/,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            editedtxt = editedtxt.replace(match_url[i],link);
        }
    }
    const match_quote = editedtxt.match(/\[\>[^\]]*\]/g); // [>text]
    if(match_quote!=null){
        for(let i = 0; i < match_quote.length; i++){
            const link = match_quote[i].replace(/\[\>(.*)\]/,'<blockquote>$1</blockquote>');
            editedtxt = editedtxt.replace(match_quote[i],link).replace('</blockquote><br>','</blockquote>');
        }
    }
    editedtxt = editedtxt.replaceAll("</h3><br>","</h3>");
    return editedtxt;
}


// タグ一覧の子項目開閉
function toggleExpand(){
    const parentli = this.parentNode;
    const targetul = parentli.querySelector("ul");
    const tag = "hidden";
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


// 実行
FetchData("https://nora-tetsu.github.io/Chanoma/chanomaData.json");

function FetchData(json){
    fetch(json)
        .then(response => response.text())
        .then(data => {
            try{
                database.data = JSON.parse(data.replace(/\\n/g,"<br>"));
            }catch(e){
                console.error('サーバーエラー');
                document.getElementById('body-title').innerText = "";
                document.getElementById('body-text').innerText = "データに不備があり現在修正中です。\nよろしければ時間を置いてまたお越しください。\n（すみません）";
            }
            DATA = database.data;
            console.log("現在のデータベースの内容を確認");
            console.log(DATA);
        })
        .then(()=>{
            render.exlinks();
            render.pinned();
            render.tags();
            body.setData("About茶の間");
            console.log("ロードが完了しました。")
        })
}

