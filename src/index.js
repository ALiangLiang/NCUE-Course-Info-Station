const
  target = document.getElementById('result'),
  loadingIcon = {
    start: () => document.getElementById('wait').style.display = '',
    stop: () => document.getElementById('wait').style.display = 'none'
  },
  padLeft = (str, lenght) => (str.toString().length >= lenght) ? str.toString() : padLeft('0' + str.toString(), lenght);

/* 建立課程評價浮動視窗 */
const model = document.createElement('div');
model.innerHTML = `<div class="modal fade" id="model" tabindex="-1" role="dialog" aria-labelledby="comment-head">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title" id="comment-head">課程名稱載入中...</h4>
      </div>
      <div id="comment-body" class="modal-body">
      <ul class="nav nav-tabs" role="tablist">
        <li role="presentation" class="active"><a href="#comments" aria-controls="comments" role="tab" data-toggle="tab">評論</a></li>
        <li role="presentation"><a href="#comment-form" aria-controls="comment-form" role="tab" data-toggle="tab" class="btn-info">我要評論</a></li>
      </ul>
      <div class="tab-content">
        <div role="tabpanel" class="tab-pane fade active in" id="comments">課程評論載入中...</div>
        <div role="tabpanel" class="tab-pane fade" id="comment-form">
          <div class="form-group">
            <label for="content">評論內容</label>
            <textarea id="content" class="form-control" rows="5"></textarea>
          </div>
          <div class="checkbox">
            <label>
            <input id="anonymous" type="checkbox">
              <span class="checkbox-material">
                <span class="check"></span>
              </span>匿名發表
            </label>
          </div>
          <a id="comment" class="btn btn-info btn-fab">
            <i class="material-icons">mode_edit</i>
            <div class="ripple-container"></div>
          </a>
        </div>
      </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">關閉</button>
      </div>
    </div>
  </div>
</div>`;
const
  commentHead = model.querySelector('#comment-head'),
  commentBody = model.querySelector('#comments'),
  commentForm = model.querySelector('#content'),
  anonymousBtn = model.querySelector('#anonymous');
document.body.appendChild(model.querySelector('#model'));

/* 綁定課程查詢事件，並建立課程平季查詢按鈕 */
const
  commentBtn = document.getElementById('comment'),
  cardGenerator = (title, content, time) => {
    const
      panel = document.createElement('div'),
      panelHead = document.createElement('div'),
      h3 = document.createElement('h3'),
      panelBody = document.createElement('div'),
      date = new Date(time),
      timeString = `${date.getYear() + 1900}/${date.getMonth() + 1}/${date.getDate()} ${padLeft(date.getHours(),2)}:${padLeft(date.getMinutes(), 2)}`;
    panel.classList = 'panel panel-info';
    panelHead.classList = 'panel-heading';
    h3.classList = 'panel-title';
    h3.innerText = title + ' ' + timeString;
    panelBody.classList = 'panel-body';
    panelBody.innerText = content;
    panelHead.appendChild(h3);
    panel.appendChild(panelHead);
    panel.appendChild(panelBody);
    return panel;
  },
  observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type !== 'childList')
        return;
      const
        table = Array.from(mutation.addedNodes).find((e) => e.nodeName === 'TABLE'),
        newTd = document.createElement('td')
      newTd.classList = 'tbhead01';
      newTd.innerText = '評論';
      table.querySelector('thead > tr').appendChild(newTd);

      table.querySelectorAll('tbody > tr').forEach((tr) => {
        const
          courseClass = tr.children[2].innerText,
          courseName = tr.children[3].innerText,
          newTd = document.createElement('td'),
          btn = document.createElement('button');
        btn.type = 'button';
        btn.classList = 'btn btn-success btn-raised model-btn';
        btn.innerText = '查看評論';
        btn.setAttribute('data-class', courseClass);
        btn.setAttribute('data-course-name', courseName);
        btn.setAttribute('data-header', `${courseClass} ${courseName}`);
        btn.onclick = function() {
          loadingIcon.start();
          fetch(`http://aliangliang.com.tw:3000/?class=${this.getAttribute('data-class')}&courseName=${this.getAttribute('data-course-name')}`)
            .then((response) => response.json())
            .then((json) => {
              loadingIcon.stop();
              commentHead.innerText = this.getAttribute('data-header');
              while (commentBody.firstChild)
                commentBody.removeChild(commentBody.firstChild);
              json.comments.forEach((e) => commentBody.appendChild(cardGenerator(e.author, e.content, e.time)));
              commentBtn.onclick = () => {
                if (commentForm.value.trim() === '')
                  return;
                loadingIcon.start();
                fetch(new Request('http://aliangliang.com.tw:3000/', {
                    method: 'POST',
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      courseClass: this.getAttribute('data-class'),
                      courseName: this.getAttribute('data-course-name'),
                      content: commentForm.value,
                      anonymous: anonymousBtn.checked,
                      token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
                    })
                  }))
                  .then((response) => response.json())
                  .then((result) => {
                    loadingIcon.stop();
                    if (result.isSuccess) {
                      commentBody.appendChild(cardGenerator(result.author, result.content, result.time));
                      $('[href="#comments"]').tab('show');
                      commentForm.value = '';
                    } else
                      gapi.auth2.getAuthInstance().signIn();
                  });
              };
              $('#model').modal('show');
            });
        };
        newTd.appendChild(btn);
        tr.appendChild(newTd)
      });
    });
  }),
  config = {
    attributes: true,
    childList: true,
    characterData: true
  };
observer.observe(target, config);

/* 建立 google 登入鈕 */
const div = document.createElement('div');
div.id = 'my-signin2';
const
  logoutA = document.createElement('a'),
  logoutI = document.createElement('i'),
  logoutDiv = document.createElement('div'),
  signBtnToggle = () => {
    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
      div.style.display = 'none';
      logoutA.style.display = '';
    } else {
      div.style.display = '';
      logoutA.style.display = 'none';
    }
  };
logoutA.onclick = () => gapi.auth2.getAuthInstance().signOut().then(() => signBtnToggle());
logoutA.id = 'logoutBtn';
logoutA.classList = 'btn btn-info btn-fab';
logoutI.classList = 'material-icons';
logoutI.innerText = 'exit_to_app';
logoutDiv.classList = 'ripple-container';
logoutA.appendChild(logoutI);
logoutA.appendChild(logoutDiv);
document.body.querySelector('#mynav > div.container-fluid').appendChild(div);
document.body.querySelector('#mynav > div.container-fluid').appendChild(logoutA);

/* 初始化 google oauth2 套件 */
gapi.auth2.init({
  client_id: '90791698805-qttq6in0t4q6bldl6ro39f3hp1i2fi9r.apps.googleusercontent.com',
  hosted_domain: 'gm.ncue.edu.tw'
});

/* 渲染 google 登入紐 */
gapi.signin2.render('my-signin2', {
  scope: 'profile email',
  width: 240,
  height: 50,
  longtitle: true,
  onsuccess: onSuccess,
  onfailure: onFailure
});

signBtnToggle();

function onSuccess(googleUser) {
  console.log(googleUser.isSignedIn());
  signBtnToggle();
}

function onFailure(error) {
  console.log(error);
}

if (localStorage['remind'] !== 'true') {
  const
    container = document.querySelector('body > div.container-fluid'),
    alertDiv = document.createElement('div'),
    btn = document.createElement('button'),
    header = document.createElement('h4'),
    body = document.createElement('p');
  alertDiv.classList = 'alert alert-dismissible alert-warning';
  btn.type = 'button';
  btn.classList = 'close';
  btn.setAttribute('data-dismiss', 'alert');
  btn.innerText = 'x';
  btn.addEventListener('click', () => {
    localStorage['remind'] = 'true'
  });
  header.innerText = '歡迎使用 NCUE+ 課程評論系統';
  body.innerText = `操作說明：
  點擊右上角登入按鈕
  使用學校 G suite 帳戶登入
  帳號為 小寫學號@gm.ncue.edu.tw
  密碼若未更改過則為 身分證前八碼
  ex. s0254003@gm.ncue.edu.tw / B1234567
  登入完成後即可進行課程評論`;
  alertDiv.appendChild(btn);
  alertDiv.appendChild(header);
  alertDiv.appendChild(body);
  container.insertBefore(alertDiv, container.firstChild);
}
