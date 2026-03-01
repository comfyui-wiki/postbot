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

// Global state for storing pending video file
let pendingVideoFile: File | null = null;

const safeSendResponse = (sendResponse, payload) => {
    try {
        sendResponse(payload);
    } catch (e) {
        console.error('[PostBot] sendResponse error', e);
    }
};

const isFromExtensionPage = (sender: chrome.runtime.MessageSender | undefined): boolean => {
    if (!sender?.url) return false;
    try {
        const extUrl = chrome.runtime.getURL('');
        return sender.url.startsWith(extUrl);
    } catch {
        return false;
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
        case 'OPEN_SIDE_PANEL':
            try {
                const win = await chrome.windows.getCurrent();
                if (win?.id != null) await chrome.sidePanel?.open({ windowId: win.id });
            } catch {
                chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
            }
            safeSendResponse(sendResponse, {});
            break;
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
            if (!isFromExtensionPage(sender)) {
                console.warn('[PostBot] 仅接受来自扩展侧栏/弹窗的发布请求，已忽略');
                break;
            }
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
            // 按平台 code 去重，避免同一平台被打开多次
            const seen = new Set<string>();
            checkedPlatforms = checkedPlatforms.filter((item) => {
                if (seen.has(item.code)) return false;
                seen.add(item.code);
                return true;
            });
            console.debug('[PostBot] 本次发布平台', checkedPlatforms.map((p) => p.code), 'mediaType=', mediaType);

            const BILIBILI_PUBLISH_URLS: Record<string, string> = {
                moment: 'https://t.bilibili.com/',
                article: 'https://member.bilibili.com/platform/upload/text/edit',
                video: 'https://member.bilibili.com/platform/upload/video/frame',
            };
            checkedPlatforms = checkedPlatforms.map((item) => {
                const next = { ...item, metaInfo: state.metaInfoList[item.code] };
                if (item.code === 'bilibili') {
                    const url = BILIBILI_PUBLISH_URLS[mediaType];
                    if (url) {
                        next.publishUrl = url;
                        delete (next as Record<string, unknown>).publishUrls;
                    }
                }
                return next;
            });

            // 仅选「动态」+「哔哩哔哩」时：只保留一个平台且 URL 必须是 t.bilibili.com
            if (mediaType === 'moment' && Array.isArray(platformCodes) && platformCodes.length === 1 && platformCodes[0] === 'bilibili') {
                const single = checkedPlatforms.find((p) => p.code === 'bilibili');
                if (single) {
                    (single as Record<string, unknown>).publishUrl = BILIBILI_PUBLISH_URLS.moment;
                    delete (single as Record<string, unknown>).publishUrls;
                    checkedPlatforms = [single];
                }
            }

            // 完全排除 exmay.com 及非当前类型的 B 站视频页，避免误开登录/创作中心
            const forbidUrl = (url: string) => {
                if (!url || typeof url !== 'string') return true;
                const u = url.toLowerCase();
                if (u.includes('exmay.com')) return true;
                if (mediaType === 'moment' && u.includes('member.bilibili.com') && u.includes('video')) return true;
                return false;
            };
            checkedPlatforms = checkedPlatforms.filter((item) => {
                const url = typeof item.publishUrl === 'string' ? item.publishUrl : (item as Record<string, unknown>).publishUrls?.[0];
                if (forbidUrl(url)) {
                    console.warn('[PostBot] 已排除平台链接（exmay/错误B站）:', item.code, url);
                    return false;
                }
                return true;
            });

            const publishData = {
                platforms: checkedPlatforms,
                data: data,
            };

            // Store the video file if present
            if (data.videoData && mediaType === 'video') {
                // The File object will be passed by the content script via chrome.runtime.sendMessage
                // We store it in memory for later retrieval
                console.log('[PostBot] 准备发布视频，视频元数据:', data.videoData);
            }

            windowPublish(publishData);
            break;
        }
        case 'STORE_PENDING_VIDEO_FILE': {
            // Called from side panel to store the File object in memory
            if (!isFromExtensionPage(sender)) {
                console.warn('[PostBot] 仅接受来自扩展侧栏的视频文件存储请求，已忽略');
                break;
            }
            // Store the File object in memory for later retrieval by content script
            pendingVideoFile = data?.videoFile || null;
            if (pendingVideoFile) {
                console.log('[PostBot] 视频文件已存储 (来自侧栏):', pendingVideoFile.name, pendingVideoFile.size);
            }
            safeSendResponse(sendResponse, { success: true });
            break;
        }
        case 'GET_PENDING_VIDEO_FILE': {
            // Called from content script to retrieve the stored File object
            if (pendingVideoFile) {
                console.log('[PostBot] 返回待发布视频文件 (来自内容脚本):', pendingVideoFile.name);
                safeSendResponse(sendResponse, {
                    file: pendingVideoFile,
                    success: true
                });
                // Clear after retrieval
                pendingVideoFile = null;
            } else {
                console.warn('[PostBot] 未找到待发布的视频文件');
                safeSendResponse(sendResponse, {
                    file: null,
                    success: false,
                    error: '未找到待发布的视频文件'
                });
            }
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