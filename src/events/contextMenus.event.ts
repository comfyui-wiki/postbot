
/**
 * Copyright (c) 2025-2099 GitCoffee All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { getSelectionContent } from "~utils/content";

import { isLoginApi } from "~api/media/user.api";

export const initContextMenusEvent = () => {

  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "syncMenuItem",
      title: "提取内容并同步",
      contexts: ["all"], // 你可以限制菜单项显示的上下文
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "syncMenuItem") {
      // 在这里处理菜单项被点击时的操作
      console.log("提取内容并同步 菜单项被点击");

      handelSyncData(info, tab);

    }
  });

  const handelSyncData = async (info, tab) => {
    const res = await isLoginApi({});
    console.log('res', res);
    if (!res?.data?.login) {
      // 本地发布模式：不打开 postbot 登录页，改为打开发布侧栏
      try {
        await chrome.sidePanel?.open({ windowId: (await chrome.windows.getCurrent()).id });
      } catch {
        chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
      }
      return;
    }

    const url = info.linkUrl || info.frameUrl || info.pageUrl;

    chrome.tabs.sendMessage(tab.id, { action: "previewContent", tabTitle: tab.title, tabUrl: url }, (response) => {
      console.log(response.content);  // 在这里处理返回的网页内容
    });
  }
}