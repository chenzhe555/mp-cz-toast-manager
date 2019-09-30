/**
 * WX toast管理器类
 */
export default class ToastManager {}
ToastManager.toastManagerStrategy = {
  'Immediately': 1,
  'Queue': 2
};
ToastManager.toastManagerFailStrategy = {
  'Immediately': 1,
  'Queue': 2
};
ToastManager.isShowingToast = false;
ToastManager.defaultDuring = 1500;
ToastManager.showQueue = [];
ToastManager.showStrategy = ToastManager.toastManagerStrategy.Immediately;
ToastManager.showFailStrategy = ToastManager.toastManagerFailStrategy.Continue;
ToastManager.showTimeoutCallback = void 0;

ToastManager.show = (msg = '', config = {}) => {
  //空串 返回
  if (msg.length <= 0) {
    return;
  } //设置Toast相关配置信息


  let toastConfig = Object.assign({
    'title': msg,
    'icon': 'none',
    'duration': ToastManager.defaultDuring
  }, config); // 显示策略判断

  switch (ToastManager.showStrategy) {
    case ToastManager.toastManagerStrategy.Immediately:
      {
        //如果是立即，则直接执行微信Toast显示方法
        wx.showToast(toastConfig);
      }
      break;

    case ToastManager.toastManagerStrategy.Queue:
      {
        //如果是走队列，则把配置文件放入队列，执行显示Toast操作
        ToastManager.showQueue.push(toastConfig);

        if (!ToastManager.isShowingToast) {
          ToastManager._showToastFunc();
        }
      }
      break;

    default:
      break;
  }
};

ToastManager.hide = (key = '') => {
  switch (ToastManager.showStrategy) {
    case ToastManager.toastManagerStrategy.Immediately:
      {
        //如果是立即，则直接执行微信Toast隐藏方法
        wx.hideToast();
      }
      break;

    case ToastManager.toastManagerStrategy.Queue:
      {
        // 如果是走队列，则清除定时器和第一个配置信息或者特定key对应的
        if (ToastManager.showQueue.length > 0) {
          // 默认清除第一个配置信息
          let cleanIndex = 0; // 如果存在特定key，找出是否有符合的, cleanIndex设置为-1

          if (key.length > 0) {
            cleanIndex = -1;
            let config = null; //筛选元素

            for (let i = 0; i < ToastManager.showQueue.length; ++i) {
              config = ToastManager.showQueue[i];

              if (config['key'] === key) {
                cleanIndex = i;
                break;
              }
            }
          } // 清除并重新显示,如果是第一个，停止定时；如果不是第一个，直接删除数组元素即可


          if (cleanIndex !== -1) {
            ToastManager.showQueue.splice(cleanIndex, 1);

            if (cleanIndex === 0) {
              ToastManager._clean();

              ToastManager._showToastFunc();
            }
          }
        } else {
          wx.hideToast();

          ToastManager._clean();
        }
      }
      break;

    default:
      break;
  }
};

ToastManager._showToastFunc = () => {
  //如果队列里没有，则返回
  if (ToastManager.showQueue.length <= 0) {
    ToastManager._clean();

    return;
  } //取出队列中第一个配置文件


  let config = ToastManager.showQueue[0]; // eslint-disable-next-line no-warning-comments
  // TODO 失败暂未实测

  if (ToastManager.showFailStrategy === ToastManager.toastManagerFailStrategy.Retry) {
    //如果选择失败重试，则实现Fail方法
    config['fail'] = ToastManager.showToastFail;
  } //显示Toast


  ToastManager.isShowingToast = true;
  wx.showToast(config); //设置定时器

  ToastManager.showTimeoutCallback = setTimeout(() => {
    //移除第一个配置
    ToastManager.showQueue.shift();

    ToastManager._clean();

    ToastManager._showToastFunc();
  }, config['duration']);
};

ToastManager._clean = () => {
  if (ToastManager.showTimeoutCallback) {
    clearTimeout(ToastManager.showTimeoutCallback);
  }

  ToastManager.isShowingToast = false;
};

ToastManager.showToastFail = () => {
  //如果失败，清除定时器，并重新显示第一个配置
  ToastManager._clean();

  ToastManager._showToastFunc();
};