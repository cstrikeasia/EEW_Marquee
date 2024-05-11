const ANIMATION_DURATION = 200;
const $newsAlertLi = $('.news_alert li');
const $newsAlert = $('.news_alert');
const $containerUl = $('.news-container ul');
const $containerLi = $('.news-container li');

let eew_msg = '目前發生地震，慎防強烈搖晃，就近避難 [趴下、掩護、穩住]';
let news_msg;
let notice_msg = '地震無法有效預測，請勿在聊天室發表、轉載、引用或暗喻任何有關地震預測相關言論或文章，以免觸犯氣象法或是社會秩序維護法，也禁止討論任何政治議題，若有不當留言或名稱將直接刪除或封鎖。';

/********************************************************
	此代碼需搭配WS或者拉EWW，請自行設定執行函數傳入參數，例如:	*
	eew('這是地震速報');									*
	news('這是地震報告');									*
	notice('這是公告');									*
by.miyashooooo											*
********************************************************/

/**彈窗動畫**/
function animateNews(msg, callback) {
    $newsAlertLi.text(msg);
    $newsAlert
        .css('display', 'block')
        .animate({ width: '100%' }, ANIMATION_DURATION, function() {
            if (typeof callback === 'function') {
                callback();
            }
        });
}

/**地震速報**/
function eew(eew_msg) {
    const msgLength = eew_msg.length;
    const endPosition = -msgLength * 20;
	addStyle(endPosition);
    animateNews('地震速報', function() {
        $containerLi
            .text(eew_msg);
        $containerUl
            .css({
                animation: 'unset',
                display: 'block',
                textAlign: 'center'
            });
        setTimeout(function() {
            $newsAlert.animate({ width: '175px' }, ANIMATION_DURATION);
			setTimeout(function() {
				notice(notice_msg);
			}, 25000);
        }, 2000);
    });
}

let marqueeCounter = 0;
let endPos = 0;

/**地震報告**/
function news(msg) {
    news_msg = msg;
    const msgLength = news_msg.length;
	console.log(msgLength);
    const endPosition = -msgLength * 29;
    addStyle(endPosition);
	
    const pixelsPerSecond = 50;
    const animationDuration = msgLength * 11 / pixelsPerSecond;
    animateNews('地震報告', function() {
        $containerLi
            .text(news_msg);
        $containerUl.css('display', 'block');
        setTimeout(function() {
            resetMarquee();
            $containerUl.css('animation', `scroll ${animationDuration}s infinite linear`);
            $newsAlert.animate({ width: '175px' }, ANIMATION_DURATION);
        }, 2000);
    });
}

let counter = 0;

/**跑馬燈事件**/
$containerUl.on('animationiteration', function() {
    counter++;

    if (counter % 3 === 0) {
        news(news_msg);
    } else {
		notice(notice_msg);
	}
});

/**例行公告**/
function notice(notice_msg) {
    const msgLength = notice_msg.length;
    const endPosition = -msgLength * 33;
	addStyle(endPosition);
    $containerLi
        .text(notice_msg);
    resetMarquee();
    $newsAlert
        .animate({ width: '0px' }, ANIMATION_DURATION, function() {
            $newsAlert.css('display', 'none');
        });
}

/**重置跑馬燈位置**/
function resetMarquee() {
    $containerUl
        .css({
            animation: 'none',
            width: 'auto'
        })
        .width();
		$containerUl.css('animation', `scroll 40s infinite linear`);
}