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
import { state } from "~contents/components/postbot.data";

import { POSTBOT_ACTION } from "../message/postbot.action";

// import { checkExtensionStatus } from "~utils/extenstion";

import type { PlasmoCSConfig } from "plasmo"
import { getPlatforms } from "~media/platform";
import { getMetaInfoList } from "~media/meta";
import { windowPublish } from "~media/publisher";

import { isLoginApi } from "~api/media/user.api";

const safeSendResponse = (sendResponse, payload) => {
    try {
        sendResponse(payload);
    } catch (e) {
        console.error('[PostBot] sendResponse error', e);
    }
};

export const handleMessage = async (request, sender, sendResponse) => {
    let message = {};
    const data = request?.data;
    try {
        switch (request.action) {
            case POSTBOT_ACTION.CHECK_EXTENSION:
                message = {
                    extensionId: chrome.runtime.id,
                };
                safeSendResponse(sendResponse, message);
                break;
            case POSTBOT_ACTION.PLATFORM_LIST: {
                const platforms = getPlatforms();
                const byType = platforms?.[data?.type];
                const list = Array.isArray(byType) ? byType : Object.values(byType ?? {});
                message = { platforms: list };
                safeSendResponse(sendResponse, message);
                break;
            }
            case POSTBOT_ACTION.META_INFO_LIST: {
                const metaInfoList = await getMetaInfoList();
                state.metaInfoList = metaInfoList;
                const codes = Object.keys(metaInfoList ?? {});
                const platformsByType = getPlatforms();
                const names = codes.map((code) => {
                    for (const type of ['article', 'moment', 'video']) {
                        const p = platformsByType?.[type]?.[code];
                        if (p && (p.name || p.platformName)) return p.name || p.platformName;
                    }
                    return code;
                });
                console.log('[PostBot] 已获取平台登录信息:', names.join('、'), `(${codes.length} 个)`);
                message = { metaInfoList: metaInfoList ?? {} };
                safeSendResponse(sendResponse, message);
                break;
            }
        case POSTBOT_ACTION.PUBLISH_SYNC_DATA:
            console.debug('request.data', request.data);
            state.contentData = request.data;
            break;
        case POSTBOT_ACTION.PUBLISH_SYNC_CONTENT:
            console.debug('state.contentData', state.contentData);
            message = state.contentData;

            sendResponse(message);

            state.contentData = null;
            break;
        case POSTBOT_ACTION.PUBLISH_NOW: {
            const mediaType = data.mediaType || 'article';
            const platformCodes = data.platformCodes;
            console.debug('[PostBot] PUBLISH_NOW mediaType', mediaType, 'platformCodes', platformCodes);
            state.contentData = data;
            const publishPlatforms = getPlatforms();
            const byType = publishPlatforms[mediaType];
            if (!byType) {
                console.warn('[PostBot] 未找到内容类型:', mediaType);
                break;
            }
            const allPlatforms = Array.isArray(byType) ? byType : Object.values(byType);
            let checkedPlatforms = allPlatforms.filter((item) => platformCodes.includes(item.code));
            console.debug('[PostBot] 本次发布平台', checkedPlatforms.map((p) => p.code));

            const BILIBILI_PUBLISH_URLS = {
                moment: 'https://t.bilibili.com/',
                article: 'https://member.bilibili.com/platform/upload/text/edit',
                video: 'https://member.bilibili.com/platform/upload/video/frame',
            };
            checkedPlatforms = checkedPlatforms.map((item) => {
                const next = { ...item, metaInfo: state.metaInfoList[item.code] };
                if (item.code === 'bilibili' && BILIBILI_PUBLISH_URLS[mediaType]) {
                    next.publishUrl = BILIBILI_PUBLISH_URLS[mediaType];
                }
                return next;
            });

            const publishData = {
                platforms: checkedPlatforms,
                data: data,
            };
            windowPublish(publishData);
            break;
        }
        case 'fetchImage':
            // Keep channel open for async sendResponse
            let imageType = null;
            fetch(data?.imageUrl)
                .then((response) => {
                    const imageName = getFileName(response);
                    // 获取图片的 Blob
                    response.blob().then((blob) => {
                        imageType = blob.type;
                        console.log('blob.type', blob.type);
                        console.log('blob.size', blob.size);
                        // sendResponse({ imageName: imageName, imageBlob: blob });
                        // blobToArrayBuffer(blob)
                        //   .then(arrayBuffer => {
                        // 发送 ArrayBuffer 到 content.js

                        // })
                        // .catch(err => {
                        //   console.error('转换 Blob 为 ArrayBuffer 失败:', err);
                        // });

                        blob2base64(blob).then((base64data) => {
                            sendResponse({ imageName: imageName, base64data: base64data, imageType: imageType });
                        });


                    })
                })
                .catch((error) => {
                    console.error('获取图片失败:', error);
                    sendResponse({ error: error.message });
                });
            return true; // keep channel open for async sendResponse
        case 'checkLogin': {
            const res = await isLoginApi({});
            console.debug('res', res);
            safeSendResponse(sendResponse, { isLogin: res?.data?.login });
            break;
        }
        default:
            safeSendResponse(sendResponse, {});
            break;
        }
    } catch (err) {
        console.error('[PostBot] handleMessage error', request?.action, err);
        safeSendResponse(sendResponse, { error: err?.message || String(err) });
    }
}

const getFileName = (response) => {
    const disposition = response.headers.get('Content-Disposition');
    let filename = null;

    if (disposition && disposition.indexOf('attachment') !== -1) {
        const matches = /filename="([^;]+)"/.exec(disposition);
        if (matches != null && matches[1]) {
            filename = matches[1];
        }
    }
    return filename;
}

// function blobToArrayBuffer(blob) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onloadend = () => resolve(reader.result);
//     reader.onerror = reject;
//     reader.readAsArrayBuffer(blob);
//   });
// }

const blob2base64 = async (blob) => {
    return new Promise((resolve, reject) => {
        // 创建 FileReader 实例
        const reader = new FileReader();

        // 读取 Blob 数据为 Base64
        reader.onloadend = () => {
            const base64data = reader.result;
            console.log(base64data); // 输出 Base64 编码的字符串
            resolve(base64data);
        };

        reader.onerror = function (e) {
            reject(e)
        };

        // 开始读取 Blob 数据
        reader.readAsDataURL(blob);
    });
}