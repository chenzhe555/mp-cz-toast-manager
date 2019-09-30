'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * WX toast管理器类
 */
var ToastManager = function ToastManager() {
    _classCallCheck(this, ToastManager);
};

ToastManager.toastManagerStrategy = {
    'Immediately': 1,
    'Queue': 2
    //失败策略: 1.忽略 2.重试
};
ToastManager.toastManagerFailStrategy = {
    'Immediately': 1,
    'Queue': 2
    // 当前是否有toast文本正在显示
};
ToastManager.isShowingToast = false;
ToastManager.defaultDuring = 1500;
ToastManager.showQueue = [];
ToastManager.showStrategy = ToastManager.toastManagerStrategy.Immediately;
ToastManager.showFailStrategy = ToastManager.toastManagerFailStrategy.Continue;

ToastManager.show = function () {
    var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    //空串 返回
    if (msg.length <= 0) {
        return;
    }

    //设置Toast相关配置信息
    var toastConfig = Object.assign({ 'title': msg, 'icon': 'none', 'duration': undefined.defaultDuring }, config);

    // 显示策略判断
    switch (undefined.showStrategy) {
        case undefined.toastManagerStrategy.Immediately:
            {
                //如果是立即，则直接执行微信Toast显示方法
                wx.showToast(toastConfig);
            }
            break;
        case undefined.toastManagerStrategy.Queue:
            {
                //如果是走队列，则把配置文件放入队列，执行显示Toast操作
                undefined.showQueue.push(toastConfig);
                if (!undefined.isShowingToast) {
                    undefined._showToastFunc();
                }
            }
            break;
        default:
            break;
    }
};

ToastManager.hide = function () {
    var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    switch (undefined.showStrategy) {
        case undefined.toastManagerStrategy.Immediately:
            {
                //如果是立即，则直接执行微信Toast隐藏方法
                wx.hideToast();
            }
            break;
        case undefined.toastManagerStrategy.Queue:
            {
                // 如果是走队列，则清除定时器和第一个配置信息或者特定key对应的
                if (undefined.showQueue.length > 0) {
                    // 默认清除第一个配置信息
                    var cleanIndex = 0;
                    // 如果存在特定key，找出是否有符合的, cleanIndex设置为-1
                    if (key.length > 0) {
                        cleanIndex = -1;
                        var config = null;
                        //筛选元素
                        for (var i = 0; i < undefined.showQueue.length; ++i) {
                            config = undefined.showQueue[i];
                            if (config['key'] === key) {
                                cleanIndex = i;
                                break;
                            }
                        }
                    }

                    // 清除并重新显示,如果是第一个，停止定时；如果不是第一个，直接删除数组元素即可
                    if (cleanIndex !== -1) {
                        undefined.showQueue.splice(cleanIndex, 1);
                        if (cleanIndex === 0) {
                            undefined._clean();
                            undefined._showToastFunc();
                        }
                    }
                } else {
                    wx.hideToast();
                    undefined._clean();
                }
            }
            break;
        default:
            break;
    }
};

ToastManager._showToastFunc = function () {
    //如果队列里没有，则返回
    if (undefined.showQueue.length <= 0) {
        undefined._clean();
        return;
    }

    //取出队列中第一个配置文件
    var config = undefined.showQueue[0];

    // eslint-disable-next-line no-warning-comments
    // TODO 失败暂未实测
    if (undefined.showFailStrategy === undefined.toastManagerFailStrategy.Retry) {
        //如果选择失败重试，则实现Fail方法
        config['fail'] = undefined.showToastFail;
    }

    //显示Toast
    undefined.isShowingToast = true;
    wx.showToast(config);

    //设置定时器
    undefined.showTimeoutCallback = setTimeout(function () {
        //移除第一个配置
        undefined.showQueue.shift();
        undefined._clean();
        undefined._showToastFunc();
    }, config['duration']);
};

ToastManager._clean = function () {
    if (undefined.showTimeoutCallback) {
        clearTimeout(undefined.showTimeoutCallback);
    }
    undefined.isShowingToast = false;
};

ToastManager.showToastFail = function () {
    //如果失败，清除定时器，并重新显示第一个配置
    undefined._clean();
    undefined._showToastFunc();
};

exports.default = ToastManager;