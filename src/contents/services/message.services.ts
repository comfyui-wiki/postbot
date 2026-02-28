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
import { getReaderData } from "~media/parser"

import { state } from "../components/postbot.data"

import { handleMetaMessage } from "./meta.services";

export const handleMessage = (request, sender, sendResponse) => {
    const data = getReaderData();
    const { content, contentImages } = data;

    let mesage = {};
    let userInfo = {};
    switch (request.action) {
        case 'doLogin':
            // 本地发布模式：不再打开 exmay.com 登录/发布页，改为通知打开侧栏（由调用方或 contextMenus 处理）
            sendResponse({});
            break;
        case 'getImages':
            message = { contentImages: contentImages };
            sendResponse(message);
            break;
        case 'getContent':
            message = { content: content };
            sendResponse(message);
            break;
        case 'previewContent':
            message = { content: content };
            // pageContent('test');
            state.rangType = 'content';
            state.isModalVisible = true;
            sendResponse(message);
            break;
        case 'selectionContent':
            message = { content: content };
            // pageContent('test');
            state.rangType = 'selection';
            state.isModalVisible = true;
            sendResponse(message);
            break;
        case 'setFlowButton':
            state.showFlowButton = request?.showFlowButton;
            sendResponse({});
            break;
        default:
            handleMetaMessage(request, sender, sendResponse);
            break;
    }
}