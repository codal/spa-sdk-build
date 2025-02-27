'use strict';

var _tslib = require('./_virtual/_tslib.js');
var cookie = require('cookie');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var cookie__default = /*#__PURE__*/_interopDefaultLegacy(cookie);

/*
 * Copyright 2020-2023 Bloomreach
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DEFAULT_COOKIE_NAME = '_v';
const DEFAULT_COOKIE_MAX_AGE_IN_SECONDS = 365 * 24 * 60 * 60;
function withOptions(_a = {}) {
    var { httpOnly = true, name = DEFAULT_COOKIE_NAME, maxAge = DEFAULT_COOKIE_MAX_AGE_IN_SECONDS } = _a, options = _tslib.__rest(_a, ["httpOnly", "name", "maxAge"]);
    const handler = (request, response, next) => {
        var _a, _b, _c;
        const { [name]: value } = cookie__default["default"].parse((_b = (_a = request.headers) === null || _a === void 0 ? void 0 : _a.cookie) !== null && _b !== void 0 ? _b : '');
        if (value) {
            try {
                request.visitor = JSON.parse(value);
                // eslint-disable-next-line no-empty
            }
            catch (_d) { }
        }
        (_c = request.once) === null || _c === void 0 ? void 0 : _c.call(request, 'br:spa:initialized', (page) => {
            var _a, _b, _c;
            const visitor = page.getVisitor();
            if (!visitor) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const rest = _tslib.__rest(visitor, ["new"]);
            const serialized = cookie__default["default"].serialize(name, JSON.stringify(rest), Object.assign(Object.assign({}, options), { httpOnly, maxAge }));
            const cookies = (_b = (_a = response.getHeader) === null || _a === void 0 ? void 0 : _a.call(response, 'set-cookie')) !== null && _b !== void 0 ? _b : [];
            (_c = response.setHeader) === null || _c === void 0 ? void 0 : _c.call(response, 'Set-Cookie', [...(Array.isArray(cookies) ? cookies : [cookies]), serialized]);
        });
        next === null || next === void 0 ? void 0 : next();
    };
    return handler;
}
const relevance = Object.assign(withOptions(), { withOptions });

module.exports = relevance;
