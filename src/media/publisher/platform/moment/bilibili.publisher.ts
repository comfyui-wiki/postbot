/**
 * Copyright (c) 2025-2099 GitCoffee All Rights Reserved.
 * B 站「动态」发布页 t.bilibili.com：填输入框、上传图片，并可选点击发布。
 */
export const bilibiliMomentPublisher = async (data) => {
    const contentData = data?.data;
    if (!contentData) return;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const waitFor = (selector, timeout = 15000) =>
        new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) {
                resolve(el);
                return;
            }
            const observer = new MutationObserver(() => {
                const e = document.querySelector(selector);
                if (e) {
                    observer.disconnect();
                    resolve(e);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error('timeout'));
            }, timeout);
        });

    const base64ToBinary = (base64: string) => {
        const binaryString = atob(base64);
        const byteArray = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) byteArray[i] = binaryString.charCodeAt(i);
        return byteArray;
    };

    /** Parse base64 data URL to bits + type. */
    const parseBase64Data = (base64data: string): { bits: Uint8Array; type: string } => {
        const dataPairs = base64data.split(',');
        const fileType = (dataPairs[0] || '').replace('data:', '').split(';')[0] || 'image/jpeg';
        const base64 = dataPairs[1] || '';
        return { bits: base64ToBinary(base64), type: fileType || 'image/jpeg' };
    };

    const fetchImage = (imageUrl: string): Promise<{ bits: Uint8Array; type: string; fileName?: string }> =>
        new Promise((resolve, reject) => {
            if (typeof chrome?.runtime?.sendMessage !== 'function') {
                reject(new Error('扩展环境不可用'));
                return;
            }
            chrome.runtime.sendMessage(
                { type: 'request', action: 'fetchImage', data: { imageUrl } },
                (response: { base64data?: string; imageName?: string }) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    const base64data = response?.base64data;
                    if (!base64data) {
                        reject(new Error('获取图片失败'));
                        return;
                    }
                    const { bits, type } = parseBase64Data(base64data);
                    resolve({ bits, type, fileName: response?.imageName });
                }
            );
        });

    await sleep(2000);

    const text =
        (contentData.title ? contentData.title + '\n\n' : '') +
        (contentData.content || contentData.description || '').replace(/<[^>]+>/g, '').trim();

    let input: HTMLElement | null = null;
    const inputSelectors = [
        'div[contenteditable="true"]',
        'textarea[placeholder*="分享"]',
        'textarea[placeholder*="想和大家"]',
        'div.bb-rich-editor',
        'textarea',
    ];
    for (const sel of inputSelectors) {
        input = document.querySelector(sel) as HTMLElement;
        if (input && (input.getAttribute('contenteditable') === 'true' || input.tagName === 'TEXTAREA')) break;
    }

    if (input) {
        input.focus();
        if (text) {
            if (input.getAttribute('contenteditable') === 'true') {
                input.innerText = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                (input as HTMLTextAreaElement).value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        await sleep(300);
    } else if (!text) {
        return;
    } else {
        console.warn('[PostBot] B站动态: 未找到输入框，请手动粘贴内容');
    }

    // Pre-fetched images from background (preferred, no messaging)
    const contentImagesData = contentData.contentImagesData as Array<{ base64data: string; imageType: string; imageName?: string }> | undefined;
    const imageItems: Array<{ bits: Uint8Array; type: string; fileName?: string }> = [];

    if (contentImagesData?.length) {
        for (const item of contentImagesData) {
            if (!item?.base64data) continue;
            try {
                const { bits, type } = parseBase64Data(item.base64data);
                imageItems.push({
                    bits,
                    type: item.imageType || type,
                    fileName: item.imageName,
                });
            } catch (e) {
                console.warn('[PostBot] B站动态 解析预取图片失败', e);
            }
        }
    }
    if (imageItems.length === 0) {
        const cover = contentData.cover || [];
        const contentImages = contentData.contentImages || contentData.images || [];
        const urlList: string[] = [];
        for (const img of cover) {
            const u = typeof img === 'object' && img != null && 'url' in img ? (img as { url: string }).url : img;
            if (u) urlList.push(String(u));
        }
        for (const img of contentImages) {
            const o = typeof img === 'object' && img != null ? (img as { url?: string; src?: string }) : null;
            const u = o ? (o.url || o.src || '') : String(img || '');
            if (u) urlList.push(u);
        }
        for (const url of urlList) {
            if (!url) continue;
            try {
                const imageData = await fetchImage(url);
                imageItems.push(imageData);
            } catch (e) {
                console.warn('[PostBot] B站动态 获取图片失败', url, e);
            }
        }
    }

    if (imageItems.length > 0) {
        await sleep(500);

        /** Click the pic toolbar button to reveal the uploader area */
        const clickToolbarPic = async (): Promise<void> => {
            const toolPic = document.querySelector('.bili-dyn-publishing__tools__item.pic') as HTMLElement | null;
            if (toolPic) {
                toolPic.click();
                await sleep(800);
            }
        };

        /** Wait for the uploader area to become visible */
        const ensureUploaderVisible = async (): Promise<void> => {
            if (document.querySelector('.bili-pics-uploader')) return;
            try {
                await waitFor('.bili-pics-uploader', 8000);
            } catch {
                // ignore
            }
        };

        /** Click the add button to trigger B站's file input creation */
        const clickAddImage = async (): Promise<void> => {
            const addEl =
                document.querySelector('.bili-pics-uploader__add') as HTMLElement | null ||
                document.querySelector('.bili-pics-uploader [class*="add"]') as HTMLElement | null;
            if (addEl) {
                addEl.click();
            }
        };

        /**
         * B站 creates a transient (non-DOM) <input type="file"> and calls .click() on it to open
         * the native file picker. We intercept that .click() call to inject our image files via
         * DataTransfer, bypassing the native picker entirely.
         */
        const originalClick = HTMLInputElement.prototype.click;
        let pendingImageIndex = 0;
        HTMLInputElement.prototype.click = function patchedClick(this: HTMLInputElement) {
            if (this.type === 'file' && pendingImageIndex < imageItems.length) {
                const idx = pendingImageIndex++;
                const imageData = imageItems[idx];
                const fileName = imageData.fileName || `image_${idx + 1}.jpg`;
                try {
                    const blob = new Blob([imageData.bits as unknown as BlobPart], { type: imageData.type });
                    const file = new File([blob], fileName, { type: imageData.type });
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    this.files = dt.files;
                    this.dispatchEvent(new Event('change', { bubbles: true }));
                    this.dispatchEvent(new Event('input', { bubbles: true }));
                } catch (e) {
                    console.warn('[PostBot] B站动态 图片写入失败', fileName, e);
                    pendingImageIndex--; // rollback so caller can retry or skip
                    originalClick.apply(this);
                }
                return;
            }
            originalClick.apply(this);
        };

        try {
            await clickToolbarPic();
            await ensureUploaderVisible();

            for (let i = 0; i < imageItems.length; i++) {
                await clickAddImage();
                // Wait for B站 to process and upload the image to their CDN
                await sleep(2000);
            }
        } finally {
            HTMLInputElement.prototype.click = originalClick;
        }
    }

    if (contentData.isAutoPublish) {
        await sleep(1500);
        const btn =
            Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === '发布') ||
            document.querySelector('button.primary') ||
            document.querySelector('button[type="button"]');
        if (btn) (btn as HTMLElement).click();
    }
};
