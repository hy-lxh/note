let host = "http://localhost:8096";
// host = "http://192.168.2.121";
resize();
/**
 * 浏览器窗口发生改变事件函数
 */
function resize() {
    document.documentElement.style.fontSize = window.innerWidth / 37.5 + "px";
}
window.onresize = resize;
let view = document.querySelector("#view");
let viewCon = document.querySelector(".bs_content");
let prevActive = null;
let menu = document.querySelector(".menu");
const up = document.querySelector(".icon.up");
up.style.display = "none";
let imgs = Array.prototype.slice.call(viewCon.querySelectorAll("img")).map(img => {
    return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
    });
});

/**
 * 当页面中的所有图片加载成功或者失败后再去获取所有标题的位置(有点问题)
 */
Promise.all(imgs).then(() => {
    getAlltitleLocation();
    if (!prevActive) {
        scrollDebounce(view);
    }
});

let locationSign = [];
/**
 * 获取所有标题的位置以及类名
 */
function getAlltitleLocation() {
    let el;
    locationSign = [];
    for (let i = 0; i < titles.length; i++) {
        el = document.querySelector(`.${titles[i].class}`);
        locationSign.push({
            class: titles[i].class,
            y: el.offsetTop
        });
        let children = titles[i].children;
        if (children) {
            (function loop(children) {
                for (let j = 0; j < children.length; j++) {
                    el = document.querySelector(`.${children[j].class}`);
                    locationSign.push({
                        class: children[j].class,
                        y: el.offsetTop
                    });
                    if (children[j].children) {
                        loop(children[j].children);
                    }
                }
            })(children);
        }
    }
}

/**
 * 防抖函数
 * @param {function} fn 防抖执行方法
 * @param {number} time 防抖时间
 * @returns 
 */
function debounce(fn, time) {
    let timer = null;
    return function (e) {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        timer = setTimeout(() => {
            clearTimeout(timer);
            timer = null;
            return typeof fn == 'function' && fn.call(this, e);
        }, time);
    }
}

/**
 * 防抖封装滚动函数，对应右侧菜单过度，显示向上按钮等逻辑
 */
let scrollDebounce = debounce(function (e) {
    let target = e.nodeType == 1 ? e : e.target, y = target.scrollTop;
    let el;
    if (locationSign.length > 0 && y <= locationSign[0].y) {
        el = document.querySelector(`#${locationSign[0].class}`);
        if (locationSign.length === 1) {
            el.classList.add("menu_active");
            prevActive = el;
            return;
        }
    }
    for (let i = 0; i < locationSign.length - 1; i++) {
        if ((locationSign[i].y <= y && locationSign[i + 1].y > y)) {
            el = document.querySelector(`#${locationSign[i].class}`);

        } else if (locationSign[i + 1].y <= y && i === (locationSign.length - 2)) {
            el = document.querySelector(`#${locationSign[i + 1].class}`);
        }
        if (el) {
            if (el != prevActive) {
                if (prevActive && y > 100 && el.parentElement.offsetTop < prevActive.parentElement.offsetTop) {
                    //向上,显示up
                    up.style.display = "block";
                } else {
                    up.style.display = "none";
                }
                let elOffsetTop = el.parentElement.offsetTop,
                    menuHeight = menu.offsetHeight;
                if (elOffsetTop + el.offsetHeight > menuHeight) {
                    menu.scroll(0, elOffsetTop - menuHeight + el.offsetHeight);
                } else {
                    menu.scroll(0, 0);
                }
                if (prevActive != null) {
                    prevActive.classList.remove("menu_active");
                }
                el.classList.add("menu_active");
                prevActive = el;
            }
            return;
        }
    }
}, 200);
view.onscroll = function (e) {
    scrollDebounce(e);
}
let viewScrollHeight, viewScrollTop;
up.addEventListener("click", function () {
    viewScrollHeight = view.scrollHeight, viewScrollTop = view.scrollTop;
    scrollAnimation(viewScrollTop, "up");
});

/**
 * 封装加速滚动动画
 * @param {number} distance 向上(下)滚动的总距离
 * @param {string} type up | down
 */
function scrollAnimation(distance, type) {
    let speed = 100, a = 5;
    function loop() {
        if (speed < distance) {
            if (type === "down") {
                view.scrollBy(0, speed);
            } else {
                view.scrollBy(0, -speed);
            }
            speed += a;
            a *= 1.05;
            requestAnimationFrame(loop);
        } else {
            viewScrollHeight = view.scrollHeight, viewScrollTop = view.scrollTop;
            if (type === "down") {
                view.scrollBy(0, viewScrollHeight - viewScrollTop);
            } else {
                view.scrollBy(0, viewScrollTop);
            }
        }
    }
    requestAnimationFrame(loop);
}
let container = document.querySelector("#view > div");
/**
 * 封装ajax
 * @param {object} config 参数对象
 * @param {string} config.method 请求方法
 * @param {string} config.url 请求url
 * @param {object} config.header 请求头对象
 * @param {object} config.data 请求参数
 * @param {boolean} config.upload 是否上传文件
 * @param {number} config.timeout 请求超时时间(ms)
 * @returns 
 */
function axios(config) {
    let { method = "get", url, headers = { "content-type": "application/json" }, data, upload, timeout = 500 } = config;
    method = method.toLowerCase();
    return new Promise((resolve, reject) => {
        let success = false, timer;
        let xml = new XMLHttpRequest() ?? new ActiveXObject("Microsoft.XMLHTTP");
        if (url.includes("?") && data && method === "get") {
            url += "&";
        } else if (data && method === "get") {
            url += "?";
        }
        if (data && method == "get") {
            Object.keys(data).forEach(key => {
                url += `${key}=${data[key]}` + "&";
            });
            url = url.slice(0, url.length - 1);
        }
        if (upload) {
            let formData = new FormData;
            Object.keys(data).forEach(key => {
                formData.append(key, data[key]);
            });
            data = formData;
        }
        xml.open(method, url, true);
        if (headers) {
            for (let header in headers) {
                xml.setRequestHeader(header, headers[header]);
            }
        }
        xml.onreadystatechange = function () {
            if (xml.readyState === 4) {
                if (xml.status >= 200 && xml.status <= 304) {
                    try {
                        resolve(JSON.parse(xml.responseText));
                    } catch (err) {
                        resolve(xml.responseText);
                    }
                } else {
                    reject(xml.responseText);
                }
                success = true;
                if (timer) clearTimeout(timer);
            }
        }
        timer = setTimeout(() => {
            if (!success) {
                xml.abort();
                reject({
                    success: false,
                    errMsg: "请求超时!!!",
                    data: null
                });
            }
        }, timeout)
        xml.send(data);
    })
}

let rightDraw = document.querySelector(".rightDraw"), articleIpt, editClone, editInner = "", articleId = "";

/**
 * 初始化函数
 */
async function init() {
    let href = window.location.href;
    articleId = href.slice(href.lastIndexOf("/") + 1)?.split(".")[0];
    let dir = await axios({
        url: `${host}/getArticleDir`,
        method: "get",
        data: {
            articleId
        }
    });
    if (dir.success && rightDraw) {
        if (rightDraw) {
            rightDraw.innerHTML = dir.data;
            rightDraw.appendChild(menu);
            container.innerHTML = dir.left + container.innerHTML;
            articleIpt = document.querySelector(".searchArticle");
            editList = document.querySelector(".editList");
            editClone = editList.cloneNode(true);
            menu = document.querySelector(".menu");
            let fn = debounce(search, 300);
            articleIpt.addEventListener("input", fn, false);
            editList.addEventListener("click", articleClick, false);
            let fullScreen = document.querySelector(".full_screen"),
                praise = document.querySelector(".praise");
            fullScreen.onclick = function () {
                if (document.webkitIsFullScreen) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
            }
            praise.onclick = function () {
                let path = this.querySelector("path");
                if (path.getAttribute("fill") == "#8a8a8a") {
                    path.setAttribute("fill", "#DFA0A0");
                } else {
                    path.setAttribute("fill", "#8a8a8a");
                }
            }
        }
    } else {
        let msg = "服务器出现错误!!!";
        if (!dir.success) {
            msg = dir.errMsg;
        }
        showMessage({
            type: 4,
            msg,
            duration: 1500
        });
    }
}
requestAnimationFrame(init);
let noneNode = createNone();
/**
 * 搜索文章input事件
 * @param {Event} e 事件源
 * @returns 
 */
function search(e) {
    let word = this.value;
    if (word === "") {
        let node;
        let originCh = editList.children || [], targetCh = editClone.children || [];
        cycle:
        for (let i = 1; i < targetCh.length; i++) {
            node = targetCh[i].cloneNode(true);
            for (let j = 0; j < originCh.length; j++) {
                if (originCh[j].hasAttribute("key") && originCh[j].getAttribute('key') === node.getAttribute("key")) {
                    continue cycle;
                }
            }
            editList.appendChild(node);
        }
        noneNode("none");
        return;
    }
    let children = editClone.children;
    let list = document.querySelectorAll(".card");
    if (list) {
        for (let item of list) {
            item.remove();
        }
    }
    let is_exist = false;
    for (let child of children) {
        if (child?.hasAttribute("key") && child.innerText?.includes(word)) {
            is_exist = true;
            noneNode("none");
            editList.appendChild(child.cloneNode(true));
        }
    }
    if (!is_exist) {
        noneNode("block");
    }
}

/**
 * 创建一个暂无更多元素，多次利用，不需要重复创建
 * @returns 
 */
function createNone() {
    let node;
    return (type) => {
        if (type == "none" && !node) return;
        if (node) return node.style.display = type;
        let txt = document.createElement("span");
        txt.innerHTML = "暂无更多了";
        txt.classList.add("none");
        editList.appendChild(txt);
        return node = txt;
    }
}


/**
 * 文章点击事件
 * @param {Event} ev 事件源
 */
function articleClick(ev) {
    let target = ev.target;
    if (target = judgeParentHasKey(target)) {
        let path = target.getAttribute("key");
        let href = window.location.href;
        location.href = href.slice(0, href.lastIndexOf("/html") + 1) + "html/" + path + "/index.html"
    }
}

/**
 * 向上查找符合条件的父元素
 * @param {Element} node 元素
 * @returns 
 */
function judgeParentHasKey(node) {
    while (node && node !== editList) {
        if (node.hasAttribute("key")) {
            return node;
        }
        node = node.parentElement;
    }
    return false;
}

let copys;
window.addEventListener("load", function () {
    setTimeout(() => {
        let codes = document.querySelectorAll(".codePre");
        copys = document.getElementsByClassName("copy_code");
        Array.from(copys, copy => {
            copy.addEventListener("click", function () {
                let txt = copy.parentElement.parentElement.querySelector(".codePre").innerText;
                window.getSelection().empty();
                copyTxt(txt);
            }, false);
        })
        Array.prototype.slice.call(codes).forEach(code => {
            code.addEventListener("mousedown", preTouchStart, false);
        })
        let code, downX, moveX, disX;
        /**
         * 代码显示区域down事件方法
         * @param {Event} ev 事件源
         * @returns 
         */
        function preTouchStart(ev) {
            code = ev.currentTarget;
            if (!code) {
                return;
            }
            if (
                code.scrollWidth >
                code.parentElement.offsetWidth -
                code.offsetLeft ||
                code.offsetLeft < 51
            ) {
                if (window.navigator.userAgent.includes("Mobile")) {
                    downX = ev.touches[0].clientX;
                } else {
                    downX = ev.clientX;
                    code.onmousemove = ($event) => {
                        preTouchMove($event);
                    };
                    document.onmouseup = () => {
                        code.onmousemove = null;
                        document.onmouseup = null;
                    };
                }
            }
        }
        /**
         * 代码显示区域滑动事件方法
         * @param {Event} ev 事件源
         */
        function preTouchMove(ev) {
            if (downX != 0 && code != null) {
                if (window.navigator.userAgent.includes("Mobile")) {
                    moveX = ev.touches[0].clientX;
                } else {
                    moveX = ev.clientX;
                }
                disX = moveX - downX;
                if (
                    code.scrollWidth >
                    code.parentElement.offsetWidth -
                    code.offsetLeft
                ) {
                    code.scrollBy(-disX * 1.5, 0);
                }
            }
            downX = moveX;
        }
    }, 1000);
}, false);

let codeTxt = null; // 全局保留代码文本,供copy事件访问
/**
 * 在copyTxt处触发copy事件
 */
window.addEventListener("copy", function (ev) {
    let clipboardData = ev.clipboardData;
    let txt = window.getSelection(0).toString();
    if (txt == "") {
        clipboardData.setData("text", codeTxt);
        showMessage({
            msg: "复制成功",
            duration: 1500,
            type: 1
        });
        ev.preventDefault();
    }
}, false);

/**
 * 
 * @param {string} txt 复制代码方法,不使用execCommand
 */
let copyTxt = function (txt) {
    codeTxt = txt;
    document.execCommand("copy");
}


let tipCons = [];
let curMsgs = [];
let messageBox = document.querySelector(".message_box");
/**
 * 弹窗封装
 * @param msg 弹窗信息
 * @param duration 弹窗显示时间(默认1s)
 * @param type 弹窗类型
 * 1 成功
 * 2 警告
 * 3 提示
 * 4 错误
 */
function showMessage(config) {
    let { msg, duration = 1000, type = 3 } = config;
    let tips_src, className;
    switch (type) {
        case 1: tips_src = `<svg t="1649310215390" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2204" width="20" height="20"><path d="M512 981.333333C252.8 981.333333 42.666667 771.2 42.666667 512S252.8 42.666667 512 42.666667s469.333333 210.133333 469.333333 469.333333-210.133333 469.333333-469.333333 469.333333z m-50.432-326.101333L310.613333 504.32a32 32 0 0 0-45.226666 45.226667l174.72 174.762666a32.341333 32.341333 0 0 0 0.341333 0.341334l0.256 0.213333a32 32 0 0 0 50.048-6.144l337.450667-379.605333a32 32 0 1 0-47.872-42.496l-318.762667 358.613333z" fill="#52C41A" p-id="2205"></path></svg>`; className = "success"; break;
        case 2: tips_src = `<svg t="1649310374817" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4532" width="20" height="20"><path d="M512 85.333333c235.648 0 426.666667 191.018667 426.666667 426.666667s-191.018667 426.666667-426.666667 426.666667S85.333333 747.648 85.333333 512 276.352 85.333333 512 85.333333z m0 170.666667a42.666667 42.666667 0 0 0-42.666667 42.666667v341.333333a42.666667 42.666667 0 0 0 85.333334 0V298.666667a42.666667 42.666667 0 0 0-42.666667-42.666667z m0 554.666667a42.666667 42.666667 0 1 0 0-85.333334 42.666667 42.666667 0 0 0 0 85.333334z" fill="#FAAD14" p-id="4533"></path></svg>`; className = "warn"; break;
        case 3: tips_src = `<svg t="1649310444372" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7377" width="20" height="20"><path d="M512 85.333333c235.648 0 426.666667 191.018667 426.666667 426.666667s-191.018667 426.666667-426.666667 426.666667S85.333333 747.648 85.333333 512 276.352 85.333333 512 85.333333z m0 170.666667a42.666667 42.666667 0 0 0-42.666667 42.666667v341.333333a42.666667 42.666667 0 0 0 85.333334 0V298.666667a42.666667 42.666667 0 0 0-42.666667-42.666667z m0 554.666667a42.666667 42.666667 0 1 0 0-85.333334 42.666667 42.666667 0 0 0 0 85.333334z" fill="#909399" p-id="7378"></path></svg>`; break;
        case 4: tips_src = `<svg t="1649310316756" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3043" width="20" height="20"><path d="M549.044706 512l166.189176-166.249412a26.383059 26.383059 0 0 0 0-36.98447 26.383059 26.383059 0 0 0-37.044706 0L512 475.015529l-166.249412-166.249411a26.383059 26.383059 0 0 0-36.98447 0 26.383059 26.383059 0 0 0 0 37.044706L475.015529 512l-166.249411 166.249412a26.383059 26.383059 0 0 0 0 36.98447 26.383059 26.383059 0 0 0 37.044706 0L512 548.984471l166.249412 166.249411a26.383059 26.383059 0 0 0 36.98447 0 26.383059 26.383059 0 0 0 0-37.044706L548.984471 512zM512 1024a512 512 0 1 1 0-1024 512 512 0 0 1 0 1024z" fill="#E84335" p-id="3044"></path></svg>`; className = "error";
    };
    let el_box;
    if (tipCons.length === 0) {
        el_box = document.createElement("div");
        el_box.classList.add("message");
        el_box.innerHTML = `${tips_src}<span>${msg}</span>`
    } else {
        el_box = tipCons.shift();
        el_box.removeChild(el_box.children[0]);
        el_box.innerHTML = tips_src + el_box.innerHTML;
        el_box.children[1].innerText = msg;
    }
    if (className) {
        el_box.classList.add(className);
    }
    el_box.style.top = "-10px";
    messageBox.appendChild(el_box);
    setTimeout(() => {
        el_box.style.top = "0px";
    }, 0)
    let timer = setTimeout(() => {
        el_box.style.top = "-10px";
        setTimeout(() => {
            (className && el_box.classList.remove(className));
            messageBox.removeChild(el_box);
            tipCons.push(el_box);
        }, 100);
    }, duration);
    el_box.addEventListener("mouseenter", function () {
        clearTimeout(timer);
    });
    el_box.addEventListener("mouseleave", function () {
        timer = setTimeout(() => {
            el_box.style.top = "-10px";
            setTimeout(() => {
                (className && el_box.classList.remove(className));
                messageBox.removeChild(el_box);
                tipCons.push(el_box);
            }, 100);
        }, duration);
    });
}