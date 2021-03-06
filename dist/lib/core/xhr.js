"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var headers_1 = require("../helpers/headers");
var error_1 = require("../helpers/error");
var url_1 = require("../helpers/url");
var cookie_1 = require("../helpers/cookie");
var util_1 = require("../helpers/util");
function xhr(config) {
    return new Promise(function (resolve, reject) {
        var _a = config.data, data = _a === void 0 ? null : _a, url = config.url, method = config.method, _b = config.headers, headers = _b === void 0 ? {} : _b, responseType = config.responseType, timeout = config.timeout, cancelToken = config.cancelToken, withCredentials = config.withCredentials, xsrfCookieName = config.xsrfCookieName, xsrfHeaderName = config.xsrfHeaderName, onDownloadProgress = config.onDownloadProgress, onUploadProgress = config.onUploadProgress, auth = config.auth, validateStatus = config.validateStatus;
        var request = new XMLHttpRequest();
        // 第三个参数为 async 是否是异步请求
        // 这里可以保证运行时 url 是有值的
        request.open(method.toUpperCase(), url, true);
        configureRequest();
        addEvents();
        processHeaders();
        processCancel();
        request.send(data);
        function configureRequest() {
            if (responseType) {
                request.responseType = responseType;
            }
            if (timeout) {
                request.timeout = timeout;
            }
            if (withCredentials) {
                request.withCredentials = withCredentials;
            }
        }
        function addEvents() {
            request.onreadystatechange = function () {
                if (request.readyState !== 4) {
                    return;
                }
                if (request.status === 0) {
                    return;
                }
                var responseHeaders = headers_1.parseHeaders(request.getAllResponseHeaders());
                // 根据传入的 responseType 来决定返回的数据
                var responseData = responseType && responseType !== 'text' ? request.response : request.responseText;
                var response = {
                    data: responseData,
                    status: request.status,
                    statusText: request.statusText,
                    headers: responseHeaders,
                    config: config,
                    request: request
                };
                handleResponse(response);
            };
            request.onerror = function () {
                reject(error_1.createError("Network Error", config, null, request));
            };
            request.ontimeout = function () {
                reject(error_1.createError("Timeout of " + timeout + " ms exceeded", config, 'ECONNABORTED', request));
            };
            if (onDownloadProgress) {
                request.onprogress = onDownloadProgress;
            }
            if (onUploadProgress) {
                request.upload.onprogress = onUploadProgress;
            }
        }
        function processHeaders() {
            /**
             * 如果请求是个 FormData 类型，则删除 headers['Content-Type']
             * 让浏览器自动为请求带上合适的 Content-Type
             */
            if (util_1.isFormData(data)) {
                delete headers['Content-Type'];
            }
            /**
             * 跨站请求伪造 xsrf 防御
             * 当请求开启了 withCredentials 或者是同源请求时
             * 如果存在 xsrfCookieName 则为请求 headers 带上它的值
             */
            if ((withCredentials || url_1.isURLSameOrigin(url)) && xsrfCookieName) {
                var xsrfValue = cookie_1.default.read(xsrfCookieName);
                if (xsrfValue && xsrfHeaderName) {
                    headers[xsrfHeaderName] = xsrfValue;
                }
            }
            /**
             * kim-stamp
             * btoa() 方法用于创建一个 base-64 编码的字符串。
             * 该方法使用 "A-Z", "a-z", "0-9", "+", "/" 和 "=" 字符来编码字符串。
             */
            if (auth) {
                headers['Authorization'] = "Basic " + btoa(auth.username + " : " + auth.password);
            }
            Object.keys(headers).forEach(function (name) {
                // 如果 data 为 null headers 的 content-type 属性没有意义
                if (data === null && name.toLowerCase() === 'content-type') {
                    delete headers[name];
                }
                else {
                    request.setRequestHeader(name, headers[name]);
                }
            });
        }
        function processCancel() {
            if (cancelToken) {
                cancelToken.promise
                    .then(function (reason) {
                    request.abort();
                    reject(reason);
                })
                    .catch(
                /* istanbul ignore next */
                function () {
                    // do nothing
                });
            }
        }
        function handleResponse(response) {
            var status = response.status;
            if (!validateStatus || validateStatus(status)) {
                resolve(response);
            }
            else {
                reject(error_1.createError("Request failed with status code " + status, config, null, request, response));
            }
        }
    });
}
exports.default = xhr;
//# sourceMappingURL=xhr.js.map