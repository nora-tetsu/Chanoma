function createDOM(tagname, option, target, position = 'append') {
    const elm = document.createElement(tagname);
    editDOM(elm, option, target, position);
    return elm;
}
function editDOM(elm, option, target, position = 'append') {
    if (target) {
        switch (position) {
            case 'append':
                target.append(elm);
                break;
            case 'prepend':
                target.prepend(elm);
                break;
            case 'after':
                target.after(elm);
                break;
            case 'before':
                target.before(elm);
                break;
            default:
                console.error('editDOM: position is invalid');
        }
    }
    if (option && typeof option === 'object') {
        for (var key in option) {
            if (key.startsWith('on')) {
                elm.addEventListener(key.slice(2), option[key]);
                continue;
            }
            switch (key) {
                case '_addClass':
                    elm.classList.add(...option[key]);
                    break;
                case '_removeClass':
                    elm.classList.remove(...option[key]);
                    break;
                case 'css':
                    Object.entries(option[key]).forEach(([key, value]) => elm.style.setProperty(key, value));
                    break;
                case 'id':
                case 'className':
                case 'value':
                case 'textContent':
                case 'innerText':
                case 'innerHTML':
                case 'checked':
                    elm[key] = option[key];
                    break;
                default:
                    elm.setAttribute(key, option[key]);
            }
        }
    }
}

class ChanomaLi extends HTMLLIElement {
    constructor(title, option = () => { }) {
        super();
        createDOM('i', {}, this);
        createDOM('span', {
            textContent: title,
            className: 'title',
        }, this);
        createDOM('ul', {}, this);
        editDOM(this, {
            is: 'chanoma-li',
            name: title,
        });
        option(this);
    }
    get titleElm() { return this.querySelector('.title') }
    get title() { return this.querySelector('.title').textContent }
    set title(str) { this.querySelector('.title').textContent = str }
    get icon() { return this.querySelector('i') }
    get ul() { return this.querySelector('ul') }
    get parent() { return this.parentNode.parentNode }

    isOutline() {
        editDOM(this.icon, {
            className: 'node-icon fas fa-caret-right',
            onclick: () => {
                if (!this.ul.firstChild) return;
                if (this.ul.classList.contains('hidden')) {
                    this.ul.classList.remove('hidden');
                    this.icon.classList.remove("fa-caret-right");
                    this.icon.classList.add("fa-caret-down");
                } else {
                    this.ul.classList.add('hidden');
                    this.icon.classList.add("fa-caret-right");
                    this.icon.classList.remove("fa-caret-down");
                }
            }
        })
    }

    static is = 'chanoma-li';
    static getNodelist(parent, query = '') {
        const pElm = (parent && typeof parent == 'object') ? parent : document;
        const pStr = (parent && typeof parent == 'string') ? parent : '';
        return Array.from(pElm.querySelectorAll(`${pStr} li[is="${this.is}"]${query}`));
    }
    static getNode(parent, query = '') {
        const pElm = (parent && typeof parent == 'object') ? parent : document;
        const pStr = (parent && typeof parent == 'string') ? parent : '';
        return pElm.querySelector(`${pStr} li[is="${this.is}"]${query}`);
    }
}
customElements.define('chanoma-li', ChanomaLi, { extends: 'li' });

class TagLi extends ChanomaLi {
    constructor(title, tagName, parent) {
        super(title);
        this.isOutline();
        editDOM(this.titleElm, {
            _addClass: ['tag-title'],
            'data-tag-full': tagName,
            'data-tag': this.title || title,
            onclick: function () { body.setTagdata(this) },
        })
        editDOM(this.ul, { className: 'hidden' })
        editDOM(this, {
            name: tagName,
            is: 'tag-li',
        }, parent)
    }
    static is = 'tag-li';
}
customElements.define('tag-li', TagLi, { extends: 'li' });

class TitleLi extends ChanomaLi {
    constructor(title, parent) {
        super(title);
        editDOM(this.icon, { className: 'fas fa-angle-right' })
        editDOM(this.titleElm, {
            _addClass: ['tag-note'],
            textContent: title,
            oncontextmenu: e => { copyToClipboard(`[[${title}]]`) },
            onclick: function () { body.setData(this.textContent) },
        })
        this.ul.remove();
        editDOM(this, {
            is: 'title-li',
            css: { 'margin-left': '-14px' }
        }, parent)
    }
    static is = 'title-li';
}
customElements.define('title-li', TitleLi, { extends: 'li' });

class LinkLi extends ChanomaLi {
    constructor(title, type, option = () => { }) {
        super(title, option);
        editDOM(this.titleElm, {
            _addClass: [type],
        })
        editDOM(this, {
            is: 'link-li',
            'data-type': type,
        });

        switch (type) {
            case 'pinned':
                this.titleElm.classList.add('pinned');
                this.icon.className = 'fas fa-thumbtack';
                break;
            case 'pickup':
                this.titleElm.classList.add('pinned');
                this.icon.className = 'fas fa-magic';
                break;
            default:
                const find = DATA.find(obj => obj.title == this.title);
                const config = LinkLi.#config.find(obj => obj.class == type);
                if (config) this.icon.className = config.icon;
                editDOM(this.titleElm, {
                    _addClass: find ? ['link-item'] : ['link-item', 'emptylink'],
                    onclick: () => body.setData(this.title),
                    ...(config && { title: config.title }),
                })
        }
    }

    static #config = [
        { class: 'forwardlink', icon: 'fas fa-angle-double-right', title: 'このノートからリンクしているノート' },
        { class: 'implyforwardlink', icon: 'fas fa-angle-double-right', title: 'このノートの文中に含まれているキーワード' },
        { class: 'twohoplink', icon: 'fas fa-angle-right', title: 'リンク先に対してリンクしている他のノート' },
        { class: 'backlink', icon: 'fas fa-angle-double-left', title: 'このノートにリンクしているノート' },
        { class: 'implybacklink', icon: 'fas fa-angle-double-left', title: 'このノートタイトルを文中に含むノート' },
    ]
    static is = 'link-li';
}
customElements.define('link-li', LinkLi, { extends: 'li' });

const LIST = {
    pin: [
        { "title": "お知らせ一覧", "function": () => pickup.info() },
        { "title": "作成日時順の最新ノート", "function": () => pickup.dateOrder("created") },
        { "title": "更新日時順の最新ノート", "function": () => pickup.dateOrder("edited") },
        { "title": "リンク済みキーワード一覧", "function": () => pickup.keywords() },
        //{"title":"ランダムピックアップ 5件","function":()=>pickup.random(5)},
    ],
    exlink: [
        { "title": "Noratetsu Lab(Blog)", "URL": "https://noratetsu.blogspot.com/", "imgsrc": "https://www.blogger.com/img/logo_blogger_40px.png" },
        { "title": "Scrapbox", "URL": "https://scrapbox.io/noratetsu/", "imgsrc": "https://gyazo.com/5f93e65a3b979ae5333aca4f32600611/max_size/1000" },
        { "title": "Twitter", "URL": "https://twitter.com/Foam_Crab", "imgsrc": "https://gyazo.com/c6f9ef45d7c4b64fe31909485b8a9222/max_size/1000" },
        { "title": "Twilog", "URL": "https://twilog.org/Foam_Crab/asc", "imgsrc": "http://www.google.com/s2/favicons?domain=https://twilog.org/Foam_Crab/asc" },
        { "title": "Substack", "URL": "https://substack.com/profile/97326198-foam_crab", "imgsrc": "https://gyazo.com/697681c54bb68010e6e027d724d1dd2d/max_size/1000" },
        { "title": "note", "URL": "https://note.com/noratetsu/", "imgsrc": "https://gyazo.com/57f5da416fed69ca4f8621766aab12f0/max_size/1000" },
    ]
}

const getElm = {
    get bodyBox() { return document.getElementById('body') },
    get bodyTitle() { return document.getElementById('body-title') },
    get bodyText() { return document.getElementById('body-text') },
    get pageLinks() { return getElm.bodyText.querySelectorAll('span.page-link') },
    get bodyTag() { return document.getElementById('body-tag') },
    get linkParent() { return document.getElementById('link-parent') },
    get tagParent() { return document.getElementById('tag-parent') },
    get pinParent() { return document.getElementById('pin-parent') },
    get exlinkParent() { return document.getElementById('exlinks') },
}

const database = {
    data: [],
    deleted: [],
    get sortCreated() { // 作成日時降順に並び替えたオブジェクトを返す
        return DATA.slice().sort((a, b) => a.created > b.created ? -1 : 1);
    },
    get sortEdited() { // 更新日時降順に並び替えたオブジェクトを返す
        return DATA.slice().sort((a, b) => a.edited > b.edited ? -1 : 1);
    },
    get getKeywordList() {
        const arr = [];
        DATA.forEach(data => {
            const match = data.body.match(/\[\[[^\]\]]*\]\]/g);
            if (match) {
                match.forEach(value => {
                    const link = value.replace(/\[\[/, '').replace(/\]\]/, '');
                    const find = arr.find(obj => obj.keyword == link)
                    if (find) {
                        find.count++;
                    } else {
                        arr.push({ keyword: link, count: 1 });
                    }
                })
            }
        })
        return arr;
    }
}
const DATA = database.data;

const render = {
    exlinks() {
        // 他のサイトへのリンクを生成（右上の欄）
        const parent = getElm.exlinkParent;
        parent.innerHTML = "";
        LIST.exlink.forEach(data => {
            const item = createDOM('li', {}, parent);
            const a = createDOM('a', {
                href: data.URL,
                title: data.title,
                target: '_blank',
            }, item);
            const img = createDOM('img', { src: data.imgsrc }, a);
        })
    },
    pinned() {
        // ピン欄を生成（左列上部）
        const parent = getElm.pinParent;
        parent.innerHTML = "";
        // 各ノートのpin判定をチェックして生成
        const filter = DATA.filter(obj => obj.pin);
        filter.forEach(data => {
            editDOM(new LinkLi(data.title, 'pinned'), {
                onclick: function () { body.setData(this.textContent) },
            }, parent);
        })
        // 関数を発動するアイテムを生成
        LIST.pin.forEach(data => {
            editDOM(new LinkLi(data.title, 'pickup'), {
                onclick: data.function,
            }, parent);
        })
    },
    tags() {
        // 分類タグ欄を生成（左列下部）
        const parent = getElm.tagParent;
        parent.innerHTML = '';
        new TagLi('(undefined)', 'undefined', parent);
        const sorted = database.sortCreated;
        const done = [];
        sorted.forEach(data => {
            if (data.tag == '') return;
            const split = data.tag.split(',');
            split.forEach(tag => {
                const tagtree = tag.split('/');
                let tagname = '', parentUl;
                tagtree.forEach(value => {
                    if (tagname == '') {
                        tagname = value;
                        parentUl = parent;
                    } else {
                        parentUl = TagLi.getNode(parent, `[name="${tagname}"]`).ul;
                        tagname += `/${value}`;
                    }
                    if (done.includes(tagname)) return;

                    new TagLi(value, tagname, parentUl);
                    done.push(tagname);
                })
            })
        })

        // フォルダが先に生成されるようにtag-note構築は分けて処理
        sorted.forEach(data => {
            const split = data.tag.split(',');
            split.forEach(tag => {
                const parentTag = TagLi.getNode(parent, tag ? `[name="${tag}"]` : '[name="undefined"]');
                new TitleLi(data.title, parentTag.ul)
            })
        })

        // 件数を表示
        for (const elm of TagLi.getNodelist()) {
            elm.title += `（${TitleLi.getNodelist(elm).length}）`;
        }
    },
}

const body = {
    get title() { return document.getElementById('body-title').textContent },
    set title(value) { document.getElementById('body-title').textContent = value },
    set created(value) { document.getElementById('body-created').textContent = value },
    set edited(value) { document.getElementById('body-edited').textContent = value },
    clear() {
        body.title = '';
        getElm.bodyText.innerHTML = '';
        getElm.bodyTag.innerHTML = '';
        body.created = '';
        body.edited = '';
        getElm.linkParent.innerHTML = '';
        getElm.bodyBox.scrollTop = 0;
    },
    setData(title) {
        this.clear();
        body.title = title;
        const find = DATA.find(obj => obj.title == title);
        if (find) {
            //getElm.bodyText.innerHTML = processText(find.body);
            MarkdownToHTML(find.body, getElm.bodyText);
            body.created = `作成日時： ${find.created}`;
            body.edited = `更新日時： ${find.edited}`;
            this.renderTags(find);
            body.reflectLinkEvent();
        }
        body.renderLinks();
    },
    setTagdata(tagnode) {
        // タグ一覧の内容をbody-textに表示する
        body.clear();
        body.title = `# ${tagnode.getAttribute('data-tag')}`;
        const thisname = tagnode.getAttribute('data-tag-full');

        const nodelist = TagLi.getNode(getElm.tagParent, `[name="${thisname}"]`).querySelectorAll('li');
        const parent = createDOM('ul', {}, getElm.bodyText);
        for (const elm of nodelist) {
            let parentUl;
            const parentTagName = elm.parent.getAttribute('name');
            if (parentTagName == thisname) {
                parentUl = parent;
            } else {
                parentUl = TagLi.getNode(parent, `[name="${parentTagName}"]`).ul;
            }
            switch (elm.getAttribute('is')) {
                case 'tag-li':
                    new TagLi(elm.title, elm.getAttribute('name'), parentUl);
                    break;
                case 'title-li':
                    new TitleLi(elm.title, parentUl);
                    break;
                default:
            }
        }

        const tagarea = getElm.bodyTag;
        const parenttags = thisname.split("/");
        let tagname = '';
        if (parenttags.length > 1) {
            for (let i = 0; i < parenttags.length - 1; i++) {
                tagarea.append(document.createTextNode(i == 0 ? '#' : '/'));
                tagname = i == 0 ? parenttags[i] : `${tagname}/${parenttags[i]}`;
                createDOM('span', {
                    className: 'tag-title',
                    textContent: parenttags[i],
                    'data-tag': parenttags[i],
                    'data-tag-full': tagname,
                    onclick: function () { body.setTagdata(this) },
                }, tagarea);
            }
        }
    },
    renderTags(data) {
        const split = data.tag.split(',');
        split.forEach(tag => {
            const parent = createDOM('span', {}, getElm.bodyTag);
            const tagtree = tag.split('/');
            let tagname = '';
            tagtree.forEach(value => {
                parent.append(document.createTextNode(!parent.innerHTML ? '#' : '/'));
                tagname == '' ? tagname = value : tagname = `${tagname}/${value}`;
                const span = createDOM('span', {
                    className: 'tag-title',
                    textContent: value,
                    'data-tag': value,
                    'data-tag-full': tagname,
                    onclick: function () { body.setTagdata(this) },
                }, parent);
            })
        })
    },
    renderLinks() {
        const parent = getElm.linkParent;
        const title = body.title;
        const done = []; // 既にリンク欄に出力したかを判定
        done.push(title);
        getElm.pageLinks.forEach(elm => {
            parent.append(new LinkLi(elm.textContent, 'forwardlink'));
            done.push(elm.textContent);
        })
        getElm.pageLinks.forEach(elm => {
            // フォワードリンクを一通り構築した後に処理したいのでforEachを2周する
            const filterHop = DATA.filter(obj => obj.body.includes(`[[${elm.textContent}]]`));
            filterHop.forEach(data => {
                if (done.includes(data.title)) return;
                LinkLi.getNode(parent, `[name="${elm.textContent}"]`).ul.append(new LinkLi(data.title, 'twohoplink'));
                done.push(data.title);
            })
        })
        const filterBack = DATA.filter(obj => obj.body.includes(`[[${title}]]`));
        filterBack.forEach(data => {
            // if(done.includes(data.title)) return;
            parent.prepend(new LinkLi(data.title, 'backlink'));
            done.push(data.title);
        })
        const filterImplyBack = DATA.filter(obj => !obj.body.includes(`[[${title}]]`) && obj.body.includes(title));
        filterImplyBack.forEach(data => {
            if (done.includes(data.title)) return;
            parent.append(new LinkLi(data.title, 'implybacklink'));
            done.push(data.title);
        })

        const linkList = database.getKeywordList;
        const bodyText = getElm.bodyText.textContent;
        linkList.forEach(data => {
            if (done.includes(data.keyword)) return;
            if (bodyText.includes(data.keyword)) {
                parent.append(new LinkLi(data.keyword, 'implyforwardlink'));
            }
        })
    },
    reflectLinkEvent() {
        // 本文中のリンクが空リンクかどうかチェック
        getElm.pageLinks.forEach(elm => {
            editDOM(elm, {
                onclick: function () { body.setData(this.textContent) },
                ...(DATA.find(obj => obj.title == elm.textContent) && { _removeClass: ['emptylink'] }),
            })
        })
    }
}

const pickup = {
    dateOrder(type) { // 作成日時順/更新日時順で最新を表示
        body.clear();
        const sorted = (function () {
            if (type == "created") {
                return database.sortCreated;
            } else if (type == "edited") {
                return database.sortEdited;
            }
        })();
        const N = sorted.length < 100 ? sorted.length : 100; // 最大100件
        body.title = (function () {
            if (type == "created") {
                return `作成日時順の最新ノート（${N}件）`;
            } else if (type == "edited") {
                return `更新日時順の最新ノート（${N}件）`;
            }
        })();
        if (sorted.length < N) N = sorted.length;
        for (let i = 0; i < N; i++) {
            const date = sorted[i][type].substr(0, 10);
            let datediv, dateul;
            if (!getElm.bodyText.querySelector(`div[name="${date}"]`)) {
                datediv = createDOM('div', {
                    name: date,
                }, getElm.bodyText);
                const datelabel = createDOM('p', {
                    textContent: date,
                    className: 'datelabel',
                }, datediv);
                dateul = createDOM('ul', {}, datediv);
            } else {
                datediv = getElm.bodyText.querySelector(`div[name="${date}"]`);
                dateul = datediv.querySelector("ul");
            }
            const item = new TitleLi(sorted[i].title, dateul);
            editDOM(item.titleElm, { _addClass: ['date-note'], _removeClass: ['tag-note'] });
            const tag = createDOM('span', {
                textContent: ` #${sorted[i].tag}`,
                css: { color: '#ddd', 'font-size': '10px' },
            }, item);

            body.reflectLinkEvent();
        }
    },
    info() {
        // お知らせタグピックアップ
        body.clear();
        const target = getElm.bodyText;
        const pickdata = database.sortCreated.filter(obj => obj.tag.includes("お知らせ"));
        body.title = `お知らせ一覧（${pickdata.length}件）`;
        pickdata.forEach(data => {
            const p = createDOM('p', {
                textContent: data.title,
                className: 'note-title',
                onclick: function () { body.setData(this.textContent) },
            }, target);
            const div = createDOM('div', {
                // innerHTML: processText(data.body),
            }, target);
            MarkdownToHTML(data.body, div);
        })
        body.reflectLinkEvent();
    },
    random(num) {
        // 件数を指定してランダムピックアップ
        const pickdata = DATA.filter(obj => !obj.tag.includes("お知らせ") && !obj.tag.includes("日記"));
        const n = num > pickdata.length ? pickdata.length : num;
        body.clear();
        body.title = `ランダムピックアップ${n}件（埋め込みツイートは表示しません）`;
        const target = getElm.bodyText;
        const done = []; // 使った乱数を記録する配列
        for (let i = 0; i < n; i++) {
            let x; // 乱数
            do {
                x = random(0, pickdata.length - 1); // 存在する件数内で乱数生成
            } while (done.includes(x)); // 重複しなくなるまで（既に配列にある場合はやり直し）

            const p = createDOM('p', {
                textContent: pickdata[x].title,
                className: 'note-title',
                onclick: function () { body.setData(this.textContent) },
            }, target);
            const div = createDOM('div', {
                // innerHTML: processText(pickdata[x].body),
            }, target);
            MarkdownToHTML(pickdata[x].body, div);

            done.push(x);
        }
    },
    keywords() {
        body.clear();
        const keywordList = database.getKeywordList;
        keywordList.sort((a, b) => a.keyword.length - b.keyword.length);
        keywordList.sort((a, b) => b.count - a.count);

        body.title = `リンクが生成されているキーワード（リンク数/言及数）（${keywordList.length}件）`;
        const target = getElm.bodyText;
        const parent = createDOM('ul', {}, target);
        keywordList.forEach(data => {
            const item = new TitleLi(data.keyword, parent);
            editDOM(item.titleElm, {
                _removeClass: ['tag-note'],
                _addClass: DATA.find(obj => obj.title == data.keyword) ? ['date-note', 'page-link'] : ['date-note', 'page-link', 'emptylink'],
                name: data.keyword,
            })
            createDOM('span', {
                className: 'times',
                textContent: `（${data.count}/${DATA.filter(e => e.body.includes(data.keyword)).length}）`,
            }, item);
        })
    }
}


// 本文データを加工してHTMLタグを付与
function processText(txt) {
    let editedtxt = txt;
    const arr = [
        { // [[link]]
            regexp: /\[\[([^\]]*)\]\]/g,
            func(match, title) { return `<span class="page-link emptylink">${title}</span>` },
        },
        /* { // ![title](url){style}
            regexp: /!\[([^\]]*)\]\((([^\)]*)(\)\{([^\}]*)\}|\)))/g,
            func(match,title,x,url,style){return `<img src="${url}" title="${title}" style="height:auto;${style}">`},
        },
        { // [title](url)
            regexp: /\[([^\]]*)\]\(([^\)]*)\)/g,
            func(match,title,url){return `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`},
        }, */
        { // [>text]
            regexp: /\[\>([^\]]*)\]/g,
            func(match, text) { return `<blockquote>${text}</blockquote>` },
        }
    ]
    for (const obj of arr) {
        editedtxt = editedtxt.replace(obj.regexp, obj.func);
    }
    editedtxt = editedtxt.replaceAll('</blockquote><br>', '</blockquote>');
    editedtxt = editedtxt.replaceAll("</h3><br>", "</h3>");
    return editedtxt;
}

function MarkdownToHTML(text, target) {
    const processedText = processText(text).replace(/(\n|<br>)/g, '  \n');

    // 要 <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    target.innerHTML = marked.parse(processedText);
    target.classList.add('formatted');

    // トグルできるようにする
    target.querySelectorAll('li').forEach(li => {
        li.setAttribute('data-status', 'expanded');
        const icon = createDOM('i', {
            className: 'node-icon fas fa-caret-down',
            css: { color: li.querySelector('ul') ? '#444' : '#ddd' },
            onclick: () => {
                if (li.getAttribute('data-status') == 'expanded') {
                    li.setAttribute('data-status', 'collapsed');
                    icon.classList.remove('fa-caret-down');
                    icon.classList.add('fa-caret-right');
                    if (li.querySelector('ul')) {
                        li.querySelector('ul').classList.add('hidden');
                    }
                } else {
                    li.setAttribute('data-status', 'expanded');
                    icon.classList.remove('fa-caret-right');
                    icon.classList.add('fa-caret-down');
                    if (li.querySelector('ul')) {
                        li.querySelector('ul').classList.remove('hidden');
                    }
                }
            },
        }, li, 'prepend');
    })

    target.querySelectorAll('span.link').forEach(link => {
        link.classList.add('page-link', 'emptylink');
        link.textContent = replaceRegExp(link.textContent, '[[]]');
    })
    target.querySelectorAll('img').forEach(elm => {
        if (elm.nextSibling.textContent.startsWith('{')) {
            elm.setAttribute('style', elm.nextSibling.textContent.replace('{', '').replace('}', ''));
            elm.nextSibling.remove();
        }
    })
    target.querySelectorAll('p').forEach(elm => {
        const link = elm.querySelector('a');
        if (!link) return;
        if (link.textContent.startsWith('https://twitter.com/') && link.textContent.endsWith('》')) {
            const orig = elm.textContent;
            elm.innerHTML = '';
            const tweetId = orig.replace(/《?.*\/status\/([0-9]*)》/, "$1").trim();
            const tweetblock = createDOM('div', {
                className: 'tweetblock',
                name: tweetId,
                textContent: orig.replace('《', '').replace('》', ''),
            }, elm);
            // http://westplain.sakuraweb.com/translate/twitter/Documentation/Twitter-for-Websites/JavaScript/Scripting-Factory-Functions.cgi
            twttr.widgets.createTweet(
                tweetId,
                tweetblock,
                {
                    align: 'center',
                    width: '90%'
                })
                .then(function (el) {
                    //tweetblock.firstChild.remove();
                    console.log(`${orig.replace('《', '').replace('》', '')}\nhas been displayed`);
                })
        }
    })
    // heading要素のidをdata-idに変える
    for (let i = 1; i < 10; i++) {
        target.querySelectorAll(`h${i}`).forEach(elm => {
            if (elm.id) {
                elm.setAttribute('data-id', elm.id);
                elm.removeAttribute('id');
            }
        })
    }
}


// 実行
fetchData("https://nora-tetsu.github.io/Chanoma/chanomaData.json");

function fetchData(json) {
    fetch(json)
        .then(response => response.text())
        .then(data => {
            try {
                DATA.splice(0, DATA.length, ...JSON.parse(data));
            } catch (e) {
                console.error('サーバーエラー');
                body.title = "";
                getElm.bodyText.textContent = "データに不備があり現在修正中です。\nよろしければ時間を置いてまたお越しください。\n（すみません）";
            }
            console.group('Loading')
            console.info("現在のデータベースの内容を確認");
            console.log(DATA);
        })
        .then(() => {
            render.exlinks();
            render.pinned();
            render.tags();
            body.setData("About茶の間");
            console.log("ロードが完了しました。");
            console.groupEnd();
        })
}

