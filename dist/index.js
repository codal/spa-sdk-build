import { injectable, inject, ContainerModule, optional, Container } from "inversify";

import "reflect-metadata";

import { Typed } from "emittery";

import render from "dom-serializer";

import { getElementsByTagName, hasAttrib, getAttributeValue } from "domutils";

import { parseDocument } from "htmlparser2";

import cookie from "cookie";

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */ function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P((function(resolve) {
            resolve(value);
        }));
    }
    return new (P || (P = Promise))((function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    }));
}

var Level;

(function(Level) {
    Level["Debug"] = "debug";
    Level["Info"] = "info";
    Level["Warn"] = "warn";
    Level["Error"] = "error";
})(Level || (Level = {}));

let Logger = class Logger {
    constructor() {
        this.level = Level.Error;
        this.debug = this.log.bind(this, Level.Debug);
        this.info = this.log.bind(this, Level.Info);
        this.warn = this.log.bind(this, Level.Warn);
        this.error = this.log.bind(this, Level.Error);
    }
    log(level, ...message) {
        const levels = Object.values(Level);
        if (!levels.includes(level) || levels.indexOf(level) < levels.indexOf(this.level)) {
            return;
        }
        this.write(level, "[SPA]", `[${level.toUpperCase()}]`, ...message);
    }
};

Logger = __decorate([ injectable(), __metadata("design:paramtypes", []) ], Logger);

const ConsoleToken = Symbol.for("ConsoleToken");

let ConsoleLogger = class ConsoleLogger extends Logger {
    constructor(console) {
        super();
        this.console = console;
    }
    write(level, ...message) {
        this.console[level](...message);
    }
};

ConsoleLogger = __decorate([ injectable(), __param(0, inject(ConsoleToken)), __metadata("design:paramtypes", [ Object ]) ], ConsoleLogger);

function LoggerModule() {
    return new ContainerModule((bind => {
        bind(ConsoleToken).toConstantValue(console);
        bind(ConsoleLogger).toSelf().inSingletonScope();
        bind(Logger).toService(ConsoleLogger);
    }));
}

const CmsEventBusService = Symbol("CmsEventBusService");

function EmitterMixin(Super) {
    return class EmitterMixin extends Super {
        constructor() {
            super(...arguments);
            /**
             * @todo should be private
             * @see https://github.com/Microsoft/TypeScript/issues/17293
             */            this.emitter = new Typed;
            this.on = this.emitter.on.bind(this.emitter);
            this.off = this.emitter.off.bind(this.emitter);
            /**
             * @todo should be private
             * @see https://github.com/Microsoft/TypeScript/issues/17293
             */            this.emit = this.emitter.emit.bind(this.emitter);
        }
    };
}

const RpcClientService = Symbol.for("RpcClientService");

const RpcServerService = Symbol.for("RpcServerService");

const TYPE_EVENT = "brxm:event";

const TYPE_RESPONSE = "brxm:response";

const TYPE_REQUEST = "brxm:request";

const STATE_FULFILLED = "fulfilled";

const STATE_REJECTED = "rejected";

class Dummy {}

class Rpc extends(EmitterMixin(Dummy)){
    constructor() {
        super(...arguments);
        this.calls = new Map;
        this.callbacks = new Map;
    }
    generateId() {
        let id;
        do {
            id = `${Math.random()}`.slice(2);
        } while (this.calls.has(id));
        return id;
    }
    call(command, ...payload) {
        return new Promise(((resolve, reject) => {
            const id = this.generateId();
            this.calls.set(id, [ resolve, reject ]);
            this.send({
                id,
                command,
                payload,
                type: TYPE_REQUEST
            });
        }));
    }
    register(command, callback) {
        this.callbacks.set(command, callback);
    }
    trigger(event, payload) {
        this.send({
            event,
            payload,
            type: TYPE_EVENT
        });
    }
    process(message) {
        switch (message === null || message === void 0 ? void 0 : message.type) {
          case TYPE_EVENT:
            this.processEvent(message);
            break;

          case TYPE_RESPONSE:
            this.processResponse(message);
            break;

          case TYPE_REQUEST:
            this.processRequest(message);
            break;
        }
    }
    processEvent(event) {
        this.emit(event.event, event.payload);
    }
    processResponse(response) {
        if (!this.calls.has(response.id)) {
            return;
        }
        const [resolve, reject] = this.calls.get(response.id);
        this.calls.delete(response.id);
        if (response.state === STATE_REJECTED) {
            reject(response.result);
        }
        resolve(response.result);
    }
    processRequest(request) {
        return __awaiter(this, void 0, void 0, (function*() {
            const callback = this.callbacks.get(request.command);
            if (!callback) {
                return;
            }
            try {
                this.send({
                    type: TYPE_RESPONSE,
                    id: request.id,
                    state: STATE_FULFILLED,
                    result: yield callback(...request.payload)
                });
            } catch (result) {
                this.send({
                    result,
                    type: TYPE_RESPONSE,
                    id: request.id,
                    state: STATE_REJECTED
                });
            }
        }));
    }
}

const CmsService = Symbol.for("CmsService");

const GLOBAL_WINDOW$2 = typeof window === "undefined" ? undefined : window;

let CmsImpl = class CmsImpl {
    constructor(rpcClient, rpcServer, cmsEventBus, logger) {
        var _a;
        this.rpcClient = rpcClient;
        this.rpcServer = rpcServer;
        this.cmsEventBus = cmsEventBus;
        this.logger = logger;
        this.onStateChange = this.onStateChange.bind(this);
        (_a = this.cmsEventBus) === null || _a === void 0 ? void 0 : _a.on("page.ready", this.onPageReady.bind(this));
        this.rpcClient.on("update", this.onUpdate.bind(this));
        this.rpcServer.register("inject", this.inject.bind(this));
    }
    initialize({window = GLOBAL_WINDOW$2}) {
        var _a, _b, _c, _d;
        if (this.window === window) {
            return;
        }
        this.window = window;
        if (((_b = (_a = this.window) === null || _a === void 0 ? void 0 : _a.document) === null || _b === void 0 ? void 0 : _b.readyState) !== "loading") {
            this.onInitialize();
            return;
        }
        (_d = (_c = this.window) === null || _c === void 0 ? void 0 : _c.document) === null || _d === void 0 ? void 0 : _d.addEventListener("readystatechange", this.onStateChange);
    }
    onInitialize() {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("The page is ready to accept incoming messages.");
        this.rpcServer.trigger("ready", undefined);
    }
    onStateChange() {
        if (this.window.document.readyState === "loading") {
            return;
        }
        this.onInitialize();
        this.window.document.removeEventListener("readystatechange", this.onStateChange);
    }
    onPageReady() {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Synchronizing the page.");
        this.rpcClient.call("sync");
    }
    onUpdate(event) {
        var _a, _b, _c;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Received update event.");
        (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("Event:", event);
        (_c = this.cmsEventBus) === null || _c === void 0 ? void 0 : _c.emit("cms.update", event);
    }
    inject(resource) {
        var _a, _b, _c;
        if (!((_a = this.window) === null || _a === void 0 ? void 0 : _a.document)) {
            return Promise.reject(new Error("SPA document is not ready."));
        }
        (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("Received request to inject a resource.");
        (_c = this.logger) === null || _c === void 0 ? void 0 : _c.debug("Resource:", resource);
        return new Promise(((resolve, reject) => {
            const script = this.window.document.createElement("script");
            script.type = "text/javascript";
            script.src = resource;
            script.addEventListener("load", (() => resolve()));
            script.addEventListener("error", (() => reject(new Error(`Failed to load resource '${resource}'.`))));
            this.window.document.body.appendChild(script);
        }));
    }
};

CmsImpl = __decorate([ injectable(), __param(0, inject(RpcClientService)), __param(1, inject(RpcServerService)), __param(2, inject(CmsEventBusService)), __param(2, optional()), __param(3, inject(Logger)), __param(3, optional()), __metadata("design:paramtypes", [ Object, Object, Object, Logger ]) ], CmsImpl);

const GLOBAL_WINDOW$1 = typeof window === "undefined" ? undefined : window;

let Cms14Impl = class Cms14Impl {
    constructor(eventBus, logger) {
        this.eventBus = eventBus;
        this.logger = logger;
        this.postponed = [];
    }
    flush() {
        return __awaiter(this, void 0, void 0, (function*() {
            this.postponed.splice(0).forEach((task => task()));
        }));
    }
    postpone(task) {
        return (...args) => {
            if (this.api) {
                return task.apply(this, args);
            }
            this.postponed.push(task.bind(this, ...args));
            return undefined;
        };
    }
    initialize({window = GLOBAL_WINDOW$1}) {
        var _a, _b;
        if (this.api || !window || window.SPA) {
            return;
        }
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Initiating a handshake with the Experience Manager.");
        (_b = this.eventBus) === null || _b === void 0 ? void 0 : _b.on("page.ready", this.postpone(this.sync));
        window.SPA = {
            init: this.onInit.bind(this),
            renderComponent: this.onRenderComponent.bind(this)
        };
    }
    onInit(api) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Completed the handshake with the Experience Manager.");
        this.api = api;
        this.flush();
    }
    onRenderComponent(id, properties) {
        var _a, _b, _c, _d;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Received component rendering request.");
        (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("Component:", id);
        (_c = this.logger) === null || _c === void 0 ? void 0 : _c.debug("Properties", properties);
        (_d = this.eventBus) === null || _d === void 0 ? void 0 : _d.emit("cms.update", {
            id,
            properties
        });
    }
    sync() {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Synchronizing the page.");
        this.api.sync();
    }
};

Cms14Impl = __decorate([ injectable(), __param(0, inject(CmsEventBusService)), __param(0, optional()), __param(1, inject(Logger)), __param(1, optional()), __metadata("design:paramtypes", [ Object, Logger ]) ], Cms14Impl);

function parseUrl(url) {
    const DUMMY_BASE_URL = "http://example.com";
    const parsedUrl = new URL(url, DUMMY_BASE_URL);
    const {hash, search, searchParams} = parsedUrl;
    let {origin, pathname} = parsedUrl;
    origin = origin !== DUMMY_BASE_URL ? origin : "";
    if (url.startsWith("//")) {
        origin = origin.replace(parsedUrl.protocol, "");
    }
    if (url.startsWith(origin) && !url.replace(origin, "").startsWith("/") && pathname.startsWith("/")) {
        pathname = pathname.substring(1);
    }
    return {
        hash,
        origin,
        pathname,
        search,
        searchParams,
        path: `${pathname}${search}${hash}`
    };
}

function buildUrl(url) {
    var _a, _b, _c, _d, _e, _f, _g;
    const searchParams = (_b = (_a = url.searchParams) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "";
    const search = (_c = url.search) !== null && _c !== void 0 ? _c : `${searchParams && `?${searchParams}`}`;
    const path = (_d = url.path) !== null && _d !== void 0 ? _d : `${(_e = url.pathname) !== null && _e !== void 0 ? _e : ""}${search}${(_f = url.hash) !== null && _f !== void 0 ? _f : ""}`;
    return `${(_g = url.origin) !== null && _g !== void 0 ? _g : ""}${path}`;
}

function mergeSearchParams(params, ...rest) {
    const result = new URLSearchParams(params);
    rest.forEach((restParams => restParams.forEach(((value, key) => result.set(key, value)))));
    return result;
}

function appendSearchParams(url, params) {
    const {hash, origin, pathname, searchParams} = parseUrl(url);
    return buildUrl({
        hash,
        origin,
        pathname,
        searchParams: mergeSearchParams(searchParams, params)
    });
}

/**
 * Extracts query parameters from URL and returns URL object that contains URL path and extracted parameters
 *
 * @param url The URL of the page.
 * @param params Parameters to extract.
 */ function extractSearchParams(url, params) {
    const {hash, origin, pathname, searchParams} = parseUrl(url);
    const extracted = new URLSearchParams;
    params.forEach((param => {
        if (searchParams.has(param)) {
            extracted.set(param, searchParams.get(param));
            searchParams.delete(param);
        }
    }));
    return {
        searchParams: extracted,
        url: buildUrl({
            hash,
            origin,
            pathname,
            searchParams
        })
    };
}

function isAbsoluteUrl(url) {
    const {origin, pathname} = parseUrl(url);
    return !!origin || pathname.startsWith("/");
}

function isMatchedOrigin(origin, baseOrigin) {
    const [schema, host = ""] = origin.split("//", 2);
    const [baseSchema, baseHost = ""] = baseOrigin.split("//", 2);
    return !baseOrigin || !origin || (!schema || !baseSchema || schema === baseSchema) && baseHost === host;
}

function isMatchedPathname(pathname, basePathname) {
    return !basePathname || pathname.startsWith(basePathname);
}

function isMatchedQuery(search, baseSearch) {
    let match = true;
    baseSearch.forEach(((value, key) => {
        match = match && (!value && search.has(key) || search.getAll(key).includes(value));
    }));
    return match;
}

function isMatched(link, base = "") {
    const linkUrl = parseUrl(link);
    const baseUrl = parseUrl(base);
    return isMatchedOrigin(linkUrl.origin, baseUrl.origin) && isMatchedPathname(linkUrl.pathname, baseUrl.pathname) && isMatchedQuery(linkUrl.searchParams, baseUrl.searchParams);
}

function resolveUrl(url, base) {
    const baseUrl = parseUrl(base);
    const sourceUrl = parseUrl(url);
    const pathname = sourceUrl.pathname.startsWith("/") ? sourceUrl.pathname : `${baseUrl.pathname}${baseUrl.pathname.endsWith("/") || !sourceUrl.pathname ? "" : "/"}${sourceUrl.pathname}`;
    return buildUrl({
        pathname,
        hash: sourceUrl.hash || baseUrl.hash,
        origin: sourceUrl.origin || baseUrl.origin,
        searchParams: mergeSearchParams(baseUrl.searchParams, sourceUrl.searchParams)
    });
}

const UrlBuilderOptionsToken = Symbol.for("UrlBuilderOptionsToken");

const UrlBuilderService = Symbol.for("UrlBuilderService");

let UrlBuilderImpl$1 = class UrlBuilderImpl {
    constructor(options) {
        var _a, _b;
        this.endpoint = parseUrl((_a = options.endpoint) !== null && _a !== void 0 ? _a : "");
        this.baseUrl = parseUrl((_b = options.baseUrl) !== null && _b !== void 0 ? _b : "");
    }
    getApiUrl(link) {
        const {pathname, searchParams} = parseUrl(link);
        if (this.baseUrl.pathname && !pathname.startsWith(this.baseUrl.pathname)) {
            throw new Error(`The path "${pathname}" does not start with the base path "${this.baseUrl.pathname}".`);
        }
        const route = pathname.substring(this.baseUrl.pathname.length);
        return buildUrl({
            origin: this.endpoint.origin,
            pathname: `${this.endpoint.pathname}${route}`,
            searchParams: mergeSearchParams(searchParams, this.endpoint.searchParams)
        });
    }
    getSpaUrl(link) {
        const {hash, pathname, searchParams} = parseUrl(link);
        const route = !pathname.startsWith("/") && !this.baseUrl.pathname ? `/${pathname}` : pathname;
        return buildUrl({
            origin: this.baseUrl.origin,
            pathname: `${this.baseUrl.pathname}${route}`,
            searchParams: mergeSearchParams(searchParams, this.baseUrl.searchParams),
            hash: hash || this.baseUrl.hash
        });
    }
};

UrlBuilderImpl$1 = __decorate([ injectable(), __param(0, inject(UrlBuilderOptionsToken)), __metadata("design:paramtypes", [ Object ]) ], UrlBuilderImpl$1);

function UrlModule$1() {
    return new ContainerModule((bind => {
        bind(UrlBuilderService).to(UrlBuilderImpl$1).inSingletonScope();
    }));
}

const DEFAULT_API_BASE_URL = "/resourceapi";

const DEFAULT_SPA_BASE_URL = "";

let UrlBuilderImpl = class UrlBuilderImpl {
    constructor(options) {
        var _a, _b, _c, _d;
        this.apiBaseUrl = parseUrl((_a = options.apiBaseUrl) !== null && _a !== void 0 ? _a : `${(_b = options.cmsBaseUrl) !== null && _b !== void 0 ? _b : ""}${DEFAULT_API_BASE_URL}`);
        this.cmsBaseUrl = parseUrl((_c = options.cmsBaseUrl) !== null && _c !== void 0 ? _c : "");
        this.spaBaseUrl = parseUrl((_d = options.spaBaseUrl) !== null && _d !== void 0 ? _d : DEFAULT_SPA_BASE_URL);
    }
    getApiUrl(link) {
        const {pathname, searchParams} = parseUrl(link);
        if (this.apiBaseUrl.pathname && pathname.startsWith(this.apiBaseUrl.pathname)) {
            return buildUrl({
                pathname,
                origin: this.apiBaseUrl.origin,
                searchParams: mergeSearchParams(this.apiBaseUrl.searchParams, searchParams)
            });
        }
        if (this.spaBaseUrl.pathname && !pathname.startsWith(this.spaBaseUrl.pathname)) {
            throw new Error(`The path "${pathname}" does not start with the base path "${this.spaBaseUrl.pathname}".`);
        }
        const route = pathname.substring(this.spaBaseUrl.pathname.length);
        return buildUrl({
            origin: this.apiBaseUrl.origin,
            pathname: `${this.apiBaseUrl.pathname}${route}`,
            searchParams: mergeSearchParams(searchParams, this.apiBaseUrl.searchParams)
        });
    }
    getSpaUrl(link) {
        const {hash, pathname, searchParams} = parseUrl(link);
        let route = pathname.startsWith(this.cmsBaseUrl.pathname) ? pathname.substring(this.cmsBaseUrl.pathname.length) : pathname;
        if (!route.startsWith("/") && !this.spaBaseUrl.pathname) {
            route = `/${route}`;
        }
        return buildUrl({
            origin: this.spaBaseUrl.origin,
            pathname: `${this.spaBaseUrl.pathname}${route}`,
            searchParams: mergeSearchParams(searchParams, this.spaBaseUrl.searchParams),
            hash: hash || this.spaBaseUrl.hash
        });
    }
};

UrlBuilderImpl = __decorate([ injectable(), __param(0, inject(UrlBuilderOptionsToken)), __metadata("design:paramtypes", [ Object ]) ], UrlBuilderImpl);

function UrlModule() {
    return new ContainerModule((bind => {
        bind(UrlBuilderService).to(UrlBuilderImpl).inSingletonScope();
    }));
}

const PostMessageService = Symbol.for("PostMessageService");

const GLOBAL_WINDOW = typeof window === "undefined" ? undefined : window;

let PostMessage = class PostMessage extends Rpc {
    constructor(logger) {
        super();
        this.logger = logger;
        this.onMessage = this.onMessage.bind(this);
    }
    initialize({origin, window = GLOBAL_WINDOW}) {
        var _a, _b;
        (_a = this.window) === null || _a === void 0 ? void 0 : _a.removeEventListener("message", this.onMessage, false);
        this.origin = origin;
        this.window = window;
        (_b = this.window) === null || _b === void 0 ? void 0 : _b.addEventListener("message", this.onMessage, false);
    }
    send(message) {
        var _a, _b, _c;
        if (!this.origin) {
            return;
        }
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("[OUTGOING]", `[${this.origin}]`, message);
        (_c = (_b = this.window) === null || _b === void 0 ? void 0 : _b.parent) === null || _c === void 0 ? void 0 : _c.postMessage(message, this.origin);
    }
    onMessage(event) {
        var _a, _b;
        if (!event.data || !isMatched(event.origin, this.origin === "*" ? "" : this.origin)) {
            return;
        }
        if ((_a = event.data) === null || _a === void 0 ? void 0 : _a.type) {
            (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("[INCOMING]", `[${event.origin}]`, event.data);
        }
        this.process(event.data);
    }
};

PostMessage = __decorate([ injectable(), __param(0, inject(Logger)), __param(0, optional()), __metadata("design:paramtypes", [ Logger ]) ], PostMessage);

function CmsModule() {
    return new ContainerModule((bind => {
        bind(CmsEventBusService).toDynamicValue((() => new Typed)).inSingletonScope().when((() => typeof window !== "undefined"));
        bind(PostMessageService).to(PostMessage).inSingletonScope();
        bind(RpcClientService).toService(PostMessageService);
        bind(RpcServerService).toService(PostMessageService);
        bind(CmsService).to(CmsImpl).inSingletonScope().whenTargetIsDefault();
        bind(CmsService).to(Cms14Impl).inSingletonScope().whenTargetNamed("cms14");
    }));
}

function isConfigurationWithProxy(value) {
    var _a, _b;
    return !!(((_a = value === null || value === void 0 ? void 0 : value.options) === null || _a === void 0 ? void 0 : _a.live) && ((_b = value === null || value === void 0 ? void 0 : value.options) === null || _b === void 0 ? void 0 : _b.preview));
}

function isConfigurationWithJwt09(value) {
    return !!(value === null || value === void 0 ? void 0 : value.cmsBaseUrl);
}

/**
 * Link to a page outside the current application.
 */ const TYPE_LINK_EXTERNAL = "external";

/**
 * Link to a page inside the current application.
 */ const TYPE_LINK_INTERNAL = "internal";

/**
 * Link to a CMS resource.
 */ const TYPE_LINK_RESOURCE = "resource";

/**
 * Unresolved link.
 */ const TYPE_LINK_UNKNOWN = "unknown";

/**
 * Checks whether a value is a link.
 * @param value The value to check.
 */ function isLink(value) {
    return !!value && (Object.prototype.hasOwnProperty.call(value, "href") || Object.prototype.hasOwnProperty.call(value, "type") && [ TYPE_LINK_EXTERNAL, TYPE_LINK_INTERNAL, TYPE_LINK_RESOURCE, TYPE_LINK_UNKNOWN ].includes(value.type));
}

class SimpleFactory {
    constructor() {
        this.mapping = new Map;
    }
    /**
     * Registers a builder for the specified type.
     * @param type The entity type.
     * @param builder The entity builder.
     */
    register(type, builder) {
        this.mapping.set(type, builder);
        return this;
    }
}

let LinkFactory = class LinkFactory extends SimpleFactory {
    create(link) {
        if (isLink(link)) {
            return this.createLink(link);
        }
        return this.createPath(link);
    }
    createLink(link) {
        if (!link.type || typeof link.href === "undefined" || !this.mapping.has(link.type)) {
            return link.href;
        }
        const builder = this.mapping.get(link.type);
        return builder(link.href);
    }
    createPath(path) {
        return this.createLink({
            href: path,
            type: TYPE_LINK_INTERNAL
        });
    }
};

LinkFactory = __decorate([ injectable() ], LinkFactory);

const MetaCollectionFactory = Symbol.for("MetaCollectionFactory");

const ComponentChildrenToken = Symbol.for("ComponentChildrenToken");

const ComponentModelToken = Symbol.for("ComponentModelToken");

/**
 * Generic component type.
 */ const TYPE_COMPONENT$1 = "component";

/**
 * Container type.
 */ const TYPE_COMPONENT_CONTAINER$1 = "container";

/**
 * Container item type.
 */ const TYPE_COMPONENT_CONTAINER_ITEM$1 = "container-item";

/**
 * Container item content type.
 */ const TYPE_COMPONENT_CONTAINER_ITEM_CONTENT = "componentcontent";

let ComponentImpl$1 = class ComponentImpl {
    constructor(model, children, linkFactory, metaFactory) {
        this.model = model;
        this.children = children;
        this.linkFactory = linkFactory;
        this.meta = metaFactory(this.model.meta);
    }
    getId() {
        return this.model.id;
    }
    getMeta() {
        return this.meta;
    }
    getModels() {
        return this.model.models || {};
    }
    getUrl() {
        return this.linkFactory.create(this.model.links.self);
    }
    getName() {
        return this.model.name || "";
    }
    getParameters() {
        var _a;
        return (_a = this.model.meta.params) !== null && _a !== void 0 ? _a : {};
    }
    getProperties() {
        return this.getParameters();
    }
    getChildren() {
        return this.children;
    }
    getComponent(...componentNames) {
        let component = this;
        while (componentNames.length && component) {
            const name = componentNames.shift();
            component = component.getChildren().find((childComponent => childComponent.getName() === name));
        }
        return component;
    }
    getComponentById(id) {
        const queue = [ this ];
        while (queue.length) {
            const component = queue.shift();
            if (component.getId() === id) {
                return component;
            }
            queue.push(...component.getChildren());
        }
        return undefined;
    }
};

ComponentImpl$1 = __decorate([ injectable(), __param(0, inject(ComponentModelToken)), __param(1, inject(ComponentChildrenToken)), __param(2, inject(LinkFactory)), __param(3, inject(MetaCollectionFactory)), __metadata("design:paramtypes", [ Object, Array, LinkFactory, Function ]) ], ComponentImpl$1);

/**
 * Checks whether a value is a page component.
 * @param value The value to check.
 */ function isComponent$2(value) {
    return value instanceof ComponentImpl$1;
}

/**
 * Generic component type.
 */ const TYPE_COMPONENT = "COMPONENT";

/**
 * Container item type.
 */ const TYPE_COMPONENT_CONTAINER_ITEM = "CONTAINER_ITEM_COMPONENT";

/**
 * Container type.
 */ const TYPE_COMPONENT_CONTAINER = "CONTAINER_COMPONENT";

let ComponentImpl = class ComponentImpl {
    constructor(model, children, metaFactory, urlBuilder) {
        this.model = model;
        this.children = children;
        this.urlBuilder = urlBuilder;
        this.meta = metaFactory(this.model._meta);
    }
    getId() {
        return this.model.id;
    }
    getMeta() {
        return this.meta;
    }
    getModels() {
        return this.model.models || {};
    }
    getUrl() {
        return this.urlBuilder.getApiUrl(this.model._links.componentRendering.href);
    }
    getName() {
        return this.model.name || "";
    }
    getParameters() {
        var _a;
        return (_a = this.model._meta.params) !== null && _a !== void 0 ? _a : {};
    }
    getProperties() {
        return this.getParameters();
    }
    getChildren() {
        return this.children;
    }
    getComponent(...componentNames) {
        let component = this;
        while (componentNames.length && component) {
            const name = componentNames.shift();
            component = component.getChildren().find((childComponent => childComponent.getName() === name));
        }
        return component;
    }
    getComponentById(id) {
        const queue = [ this ];
        while (queue.length) {
            const component = queue.shift();
            if (component.getId() === id) {
                return component;
            }
            queue.push(...component.getChildren());
        }
        return undefined;
    }
};

ComponentImpl = __decorate([ injectable(), __param(0, inject(ComponentModelToken)), __param(1, inject(ComponentChildrenToken)), __param(2, inject(MetaCollectionFactory)), __param(3, inject(UrlBuilderService)), __metadata("design:paramtypes", [ Object, Array, Function, Object ]) ], ComponentImpl);

/**
 * Checks whether a value is a page component.
 * @param value The value to check.
 */ function isComponent$1(value) {
    return value instanceof ComponentImpl;
}

/**
 * A blocked container with blocked items.
 */ const TYPE_CONTAINER_BOX = "hst.vbox";

/**
 * An unordered list container.
 */ const TYPE_CONTAINER_UNORDERED_LIST = "hst.unorderedlist";

/**
 * An ordered list container.
 */ const TYPE_CONTAINER_ORDERED_LIST = "hst.orderedlist";

/**
 * A blocked container with inline items.
 */ const TYPE_CONTAINER_INLINE = "hst.span";

/**
 * A container without surrounding markup.
 */ const TYPE_CONTAINER_NO_MARKUP = "hst.nomarkup";

let ContainerImpl$1 = class ContainerImpl extends ComponentImpl$1 {
    getChildren() {
        return this.children;
    }
    getType() {
        var _a;
        return (_a = this.model.xtype) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    }
};

ContainerImpl$1 = __decorate([ injectable() ], ContainerImpl$1);

/**
 * Checks whether a value is a page container.
 * @param value The value to check.
 */ function isContainer$2(value) {
    return value instanceof ContainerImpl$1;
}

let ContainerImpl = class ContainerImpl extends ComponentImpl {
    getChildren() {
        return this.children;
    }
    getType() {
        var _a;
        return (_a = this.model.xtype) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    }
};

ContainerImpl = __decorate([ injectable() ], ContainerImpl);

/**
 * Checks whether a value is a page container.
 * @param value The value to check.
 */ function isContainer$1(value) {
    return value instanceof ContainerImpl;
}

const PageEventBusService = Symbol("PageEventBusService");

/**
 * Checks whether a value is a reference.
 * @param value The value to check.
 */ function isReference(value) {
    return !!(value === null || value === void 0 ? void 0 : value.$ref);
}

function resolve(object, reference) {
    return reference.$ref.split("/").reduce(((value, key) => key ? value === null || value === void 0 ? void 0 : value[key] : object), object);
}

/**
 * A container item without mapping.
 */ const TYPE_CONTAINER_ITEM_UNDEFINED = Symbol.for("ContainerItemUndefined");

/**
 * Returns the content of this component.
 *
 * @param component The component that references the content
 * @param page The page that contains the content
 */ function getContainerItemContent(component, page) {
    const contentRef = component.getContentReference();
    if (!contentRef) {
        return null;
    }
    const componentContent = page.getContent(contentRef);
    if (!componentContent) {
        return null;
    }
    if ((componentContent === null || componentContent === void 0 ? void 0 : componentContent.type) !== TYPE_COMPONENT_CONTAINER_ITEM_CONTENT) {
        return null;
    }
    return componentContent.data;
}

let ContainerItemImpl$1 = class ContainerItemImpl extends(EmitterMixin(ComponentImpl$1)){
    constructor(model, linkFactory, metaFactory, eventBus, logger) {
        super(model, [], linkFactory, metaFactory);
        this.model = model;
        this.metaFactory = metaFactory;
        this.logger = logger;
        eventBus === null || eventBus === void 0 ? void 0 : eventBus.on("page.update", this.onPageUpdate.bind(this));
    }
    onPageUpdate(event) {
        var _a, _b;
        const page = event.page;
        const model = resolve(page, page.root);
        if ((model === null || model === void 0 ? void 0 : model.id) !== this.getId()) {
            return;
        }
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Received container item update event.");
        (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("Event:", event);
        this.model = model;
        this.meta = this.metaFactory(model.meta);
        this.emit("update", {});
    }
    getLabel() {
        return this.model.label;
    }
    getType() {
        var _a;
        return (_a = this.model.ctype) !== null && _a !== void 0 ? _a : this.model.label;
    }
    isHidden() {
        return !!this.model.meta.hidden;
    }
    getParameters() {
        var _a;
        return (_a = this.model.meta.paramsInfo) !== null && _a !== void 0 ? _a : {};
    }
    getContent(page) {
        return getContainerItemContent(this, page);
    }
    getContentReference() {
        return this.model.content;
    }
};

ContainerItemImpl$1 = __decorate([ injectable(), __param(0, inject(ComponentModelToken)), __param(1, inject(LinkFactory)), __param(2, inject(MetaCollectionFactory)), __param(3, inject(PageEventBusService)), __param(3, optional()), __param(4, inject(Logger)), __param(4, optional()), __metadata("design:paramtypes", [ Object, LinkFactory, Function, Object, Logger ]) ], ContainerItemImpl$1);

/**
 * Checks whether a value is a page container item.
 * @param value The value to check.
 */ function isContainerItem$2(value) {
    return value instanceof ContainerItemImpl$1;
}

let ContainerItemImpl = class ContainerItemImpl extends(EmitterMixin(ComponentImpl)){
    constructor(model, metaFactory, urlBuilder, eventBus, logger) {
        super(model, [], metaFactory, urlBuilder);
        this.model = model;
        this.metaFactory = metaFactory;
        this.logger = logger;
        eventBus === null || eventBus === void 0 ? void 0 : eventBus.on("page.update", this.onPageUpdate.bind(this));
    }
    onPageUpdate(event) {
        var _a, _b;
        const {page: model} = event.page;
        if (model.id !== this.getId()) {
            return;
        }
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Received container item update event.");
        (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("Event:", event);
        this.model = model;
        this.meta = this.metaFactory(model._meta);
        this.emit("update", {});
    }
    getLabel() {
        return this.model.label;
    }
    getType() {
        var _a;
        return (_a = this.model.ctype) !== null && _a !== void 0 ? _a : this.model.label;
    }
    isHidden() {
        return !!this.model._meta.hidden;
    }
    getParameters() {
        var _a;
        return (_a = this.model._meta.paramsInfo) !== null && _a !== void 0 ? _a : {};
    }
    getContent() {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn('The method "getContent" is not supported in PMA 0.9 and always returns "null".');
        return null;
    }
    getContentReference() {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn('The method "getContentReference" is not supported in PMA 0.9 and always returns "undefined".');
        return undefined;
    }
};

ContainerItemImpl = __decorate([ injectable(), __param(0, inject(ComponentModelToken)), __param(1, inject(MetaCollectionFactory)), __param(2, inject(UrlBuilderService)), __param(3, inject(PageEventBusService)), __param(3, optional()), __param(4, inject(Logger)), __param(4, optional()), __metadata("design:paramtypes", [ Object, Function, Object, Object, Logger ]) ], ContainerItemImpl);

/**
 * Checks whether a value is a page container item.
 * @param value The value to check.
 */ function isContainerItem$1(value) {
    return value instanceof ContainerItemImpl;
}

const TYPE_META_COMMENT = "comment";

/**
 * Meta-data following before a page component.
 */ const META_POSITION_BEGIN = "begin";

/**
 * Meta-data following after a page component.
 */ const META_POSITION_END = "end";

class MetaImpl {
    constructor(model, position) {
        this.model = model;
        this.position = position;
    }
    getData() {
        return this.model.data;
    }
    getPosition() {
        return this.position;
    }
}

/**
 * Checks whether a value is a meta-data object.
 * @param value The value to check.
 */ function isMeta(value) {
    return value instanceof MetaImpl;
}

const HTML_COMMENT = /^<!--(.*)-->$/;

/**
 * Meta information stored in HST-comments.
 */ class MetaCommentImpl extends MetaImpl {
    getData() {
        const data = super.getData();
        const [, payload = data] = data.match(HTML_COMMENT) || [];
        return payload;
    }
}

/**
 * Checks whether a value is a meta-data comment.
 * @param value The value to check.
 */ function isMetaComment(value) {
    return value instanceof MetaCommentImpl;
}

/**
 * The factory to produce meta-data collection from the page model meta-data.
 */ let MetaFactory = class MetaFactory extends SimpleFactory {
    create(meta, position) {
        const builder = this.mapping.get(meta.type);
        if (!builder) {
            throw new Error(`Unsupported meta type: '${meta.type}'.`);
        }
        return builder(meta, position);
    }
};

MetaFactory = __decorate([ injectable() ], MetaFactory);

var MetaCollectionImpl_1;

const MetaCollectionModelToken = Symbol.for("MetaCollectionModelToken");

let MetaCollectionImpl = MetaCollectionImpl_1 = class MetaCollectionImpl extends Array {
    constructor(model, metaFactory) {
        super(...(model.beginNodeSpan || []).map((beginModel => metaFactory.create(beginModel, META_POSITION_BEGIN))), ...(model.endNodeSpan || []).map((endModel => metaFactory.create(endModel, META_POSITION_END))));
        this.comments = [];
        const prototype = Object.create(MetaCollectionImpl_1.prototype);
        prototype.constructor = Array.prototype.constructor;
        Object.setPrototypeOf(this, prototype);
        Object.freeze(this);
    }
    clear(comments = [ ...this.comments ]) {
        comments.forEach((comment => {
            comment.remove();
            const index = this.comments.indexOf(comment);
            if (index > -1) {
                this.comments.splice(index, 1);
            }
        }));
    }
    render(head, tail) {
        var _a;
        const document = (_a = head.ownerDocument) !== null && _a !== void 0 ? _a : tail.ownerDocument;
        const comments = document ? [ ...this.filter(isMetaComment).filter((meta => meta.getPosition() === META_POSITION_BEGIN)).map((meta => document.createComment(meta.getData()))).map((comment => {
            var _a;
            (_a = head.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(comment, head);
            return comment;
        })), ...this.filter(isMetaComment).filter((meta => meta.getPosition() === META_POSITION_END)).reverse().map((meta => document.createComment(meta.getData()))).map((comment => {
            var _a, _b;
            if (tail.nextSibling) {
                (_a = tail.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(comment, tail.nextSibling);
            } else {
                (_b = tail.parentNode) === null || _b === void 0 ? void 0 : _b.appendChild(comment);
            }
            return comment;
        })) ] : [];
        this.comments.push(...comments);
        return this.clear.bind(this, comments);
    }
};

MetaCollectionImpl = MetaCollectionImpl_1 = __decorate([ injectable(), __param(0, inject(MetaCollectionModelToken)), __param(1, inject(MetaFactory)), __metadata("design:paramtypes", [ Object, MetaFactory ]) ], MetaCollectionImpl);

/**
 * Checks whether a value is a meta-data collection.
 * @param value The value to check.
 */ function isMetaCollection(value) {
    return value instanceof MetaCollectionImpl;
}

let ButtonFactory = class ButtonFactory extends SimpleFactory {
    constructor(metaCollectionFactory) {
        super();
        this.metaCollectionFactory = metaCollectionFactory;
    }
    create(type, ...params) {
        if (!this.mapping.has(type)) {
            throw new Error(`Unsupported button type: '${type}'.`);
        }
        const meta = this.mapping.get(type)(...params);
        return isMetaCollection(meta) ? meta : this.metaCollectionFactory(meta);
    }
};

ButtonFactory = __decorate([ injectable(), __param(0, inject(MetaCollectionFactory)), __metadata("design:paramtypes", [ Function ]) ], ButtonFactory);

/**
 * A component factory producing components based on a type.
 */ let ComponentFactory$1 = class ComponentFactory extends SimpleFactory {
    /**
     * Produces a component based on the page model.
     * @param page The page model.
     */
    create(page) {
        var _a, _b;
        const heap = [ page.root ];
        const pool = new Map;
        for (let i = 0; i < heap.length; i++) {
            heap.push(...(_b = (_a = resolve(page, heap[i])) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : []);
        }
        return heap.reverse().reduce(((previous, reference) => {
            var _a, _b;
            const model = resolve(page, reference);
            const children = (_b = (_a = model === null || model === void 0 ? void 0 : model.children) === null || _a === void 0 ? void 0 : _a.map((child => pool.get(resolve(page, child))))) !== null && _b !== void 0 ? _b : [];
            const component = this.buildComponent(model, children);
            pool.set(model, component);
            return component;
        }), undefined);
    }
    buildComponent(model, children) {
        const builder = this.mapping.get(model.type);
        if (!builder) {
            throw new Error(`Unsupported component type: '${model.type}'.`);
        }
        return builder(model, children);
    }
};

ComponentFactory$1 = __decorate([ injectable() ], ComponentFactory$1);

let ContentFactory$1 = class ContentFactory extends SimpleFactory {
    create(model) {
        if (!this.mapping.has(model.type)) {
            return model;
        }
        return this.mapping.get(model.type)(model);
    }
};

ContentFactory$1 = __decorate([ injectable() ], ContentFactory$1);

const LinkRewriterService = Symbol.for("LinkRewriterService");

let LinkRewriterImpl = class LinkRewriterImpl {
    constructor(linkFactory) {
        this.linkFactory = linkFactory;
    }
    rewrite(content, type = "text/html") {
        const document = parseDocument(content, {
            xmlMode: type !== "text/html"
        });
        this.rewriteAnchors(document);
        this.rewriteImages(document);
        return render(document, {
            selfClosingTags: true
        });
    }
    rewriteAnchors(document) {
        Array.from(getElementsByTagName("a", document)).filter((element => hasAttrib(element, "href") && hasAttrib(element, "data-type"))).forEach((element => {
            const url = this.linkFactory.create({
                href: getAttributeValue(element, "href"),
                type: getAttributeValue(element, "data-type")
            });
            if (url) {
                element.attribs.href = url;
            }
            return element;
        }));
    }
    rewriteImages(document) {
        Array.from(getElementsByTagName("img", document)).filter((element => hasAttrib(element, "src"))).forEach((element => {
            const url = this.linkFactory.create({
                href: getAttributeValue(element, "src"),
                type: TYPE_LINK_RESOURCE
            });
            if (url) {
                element.attribs.src = url;
            }
        }));
    }
};

LinkRewriterImpl = __decorate([ injectable(), __param(0, inject(LinkFactory)), __metadata("design:paramtypes", [ LinkFactory ]) ], LinkRewriterImpl);

const PageModelToken = Symbol.for("PageModelToken");

let PageImpl$1 = class PageImpl {
    constructor(model, buttonFactory, componentFactory, contentFactory, linkFactory, linkRewriter, metaFactory, cmsEventBus, pageEventBus, logger) {
        this.model = model;
        this.buttonFactory = buttonFactory;
        this.contentFactory = contentFactory;
        this.linkFactory = linkFactory;
        this.linkRewriter = linkRewriter;
        this.metaFactory = metaFactory;
        this.cmsEventBus = cmsEventBus;
        this.logger = logger;
        this.content = new WeakMap;
        pageEventBus === null || pageEventBus === void 0 ? void 0 : pageEventBus.on("page.update", this.onPageUpdate.bind(this));
        this.root = componentFactory.create(model);
    }
    onPageUpdate(event) {
        Object.assign(this.model.page, event.page.page);
    }
    getButton(type, ...params) {
        return this.buttonFactory.create(type, ...params);
    }
    getChannelParameters() {
        return this.model.channel.info.props;
    }
    getComponent(...componentNames) {
        var _a;
        return (_a = this.root) === null || _a === void 0 ? void 0 : _a.getComponent(...componentNames);
    }
    getContent(reference) {
        if (typeof window !== "undefined") {
            alert("getContent CALL");
        }
        console.log("getContent reference", reference);
        console.trace(reference);
        const model = resolve(this.model, isReference(reference) ? reference : {
            $ref: `/page/${reference}`
        });
        if (!model) {
            return undefined;
        }
        if (!this.content.has(model)) {
            this.content.set(model, this.contentFactory.create(model));
        }
        return this.content.get(model);
    }
    getDocument() {
        return this.model.document && this.getContent(this.model.document);
    }
    getLocale() {
        return this.model.meta.locale || "en_US";
    }
    getMeta(meta) {
        return this.metaFactory(meta);
    }
    getTitle() {
        var _a, _b;
        return (_b = (_a = resolve(this.model, this.model.root)) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.pageTitle;
    }
    getUrl(link) {
        var _a, _b, _c;
        if (typeof link === "undefined" || isLink(link) || isAbsoluteUrl(link)) {
            return this.linkFactory.create((_b = (_a = link) !== null && _a !== void 0 ? _a : this.model.links.site) !== null && _b !== void 0 ? _b : "");
        }
        return resolveUrl(link, (_c = this.linkFactory.create(this.model.links.site)) !== null && _c !== void 0 ? _c : "");
    }
    getVersion() {
        return this.model.meta.version;
    }
    getVisitor() {
        return this.model.meta.visitor;
    }
    getVisit() {
        return this.model.meta.visit;
    }
    isPreview() {
        return !!this.model.meta.preview;
    }
    rewriteLinks(content, type = "text/html") {
        return this.linkRewriter.rewrite(content, type);
    }
    sync() {
        var _a;
        (_a = this.cmsEventBus) === null || _a === void 0 ? void 0 : _a.emit("page.ready", {});
    }
    toJSON() {
        return this.model;
    }
};

PageImpl$1 = __decorate([ injectable(), __param(0, inject(PageModelToken)), __param(1, inject(ButtonFactory)), __param(2, inject(ComponentFactory$1)), __param(3, inject(ContentFactory$1)), __param(4, inject(LinkFactory)), __param(5, inject(LinkRewriterService)), __param(6, inject(MetaCollectionFactory)), __param(7, inject(CmsEventBusService)), __param(7, optional()), __param(8, inject(PageEventBusService)), __param(8, optional()), __param(9, inject(Logger)), __param(9, optional()), __metadata("design:paramtypes", [ Object, ButtonFactory, ComponentFactory$1, ContentFactory$1, LinkFactory, Object, Function, Object, Object, Logger ]) ], PageImpl$1);

/**
 * Checks whether a value is a page.
 * @param value The value to check.
 */ function isPage$2(value) {
    return value instanceof PageImpl$1;
}

/**
 * A component factory producing components based on a type.
 */ let ComponentFactory = class ComponentFactory extends SimpleFactory {
    /**
     * Produces a component based on the model.
     * @param model The component model.
     */
    create(model) {
        var _a, _b;
        let component;
        const queue = [ {
            model
        } ];
        while (queue.length) {
            const head = queue.shift();
            if (!head.children && ((_a = head.model.components) === null || _a === void 0 ? void 0 : _a.length)) {
                head.children = [];
                queue.unshift(...head.model.components.map((componentModel => ({
                    model: componentModel,
                    siblings: head.children
                }))), head);
                continue;
            }
            component = this.buildComponent(head.model, (_b = head.children) !== null && _b !== void 0 ? _b : []);
            if (head.siblings) {
                head.siblings.push(component);
            }
        }
        return component;
    }
    buildComponent(model, children) {
        const builder = this.mapping.get(model.type);
        if (!builder) {
            throw new Error(`Unsupported component type: '${model.type}'.`);
        }
        return builder(model, children);
    }
};

ComponentFactory = __decorate([ injectable() ], ComponentFactory);

const ContentFactory = Symbol.for("ContentFactory");

var PageImpl_1;

let PageImpl = PageImpl_1 = class PageImpl {
    constructor(model, buttonFactory, componentFactory, contentFactory, linkFactory, linkRewriter, metaFactory, cmsEventBus, eventBus, logger) {
        this.model = model;
        this.buttonFactory = buttonFactory;
        this.contentFactory = contentFactory;
        this.linkFactory = linkFactory;
        this.linkRewriter = linkRewriter;
        this.metaFactory = metaFactory;
        this.cmsEventBus = cmsEventBus;
        this.logger = logger;
        eventBus === null || eventBus === void 0 ? void 0 : eventBus.on("page.update", this.onPageUpdate.bind(this));
        this.root = componentFactory.create(model.page);
        this.content = new Map(Object.entries(model.content || {}).map((([alias, m]) => [ alias, this.contentFactory(m) ])));
    }
    onPageUpdate(event) {
        Object.entries(event.page.content || {}).forEach((([alias, model]) => this.content.set(alias, this.contentFactory(model))));
    }
    static getContentReference(reference) {
        return reference.$ref.split("/", 3)[2] || "";
    }
    getButton(type, ...params) {
        return this.buttonFactory.create(type, ...params);
    }
    getChannelParameters() {
        var _a, _b;
        return (_b = (_a = this.model.channel) === null || _a === void 0 ? void 0 : _a.info.props) !== null && _b !== void 0 ? _b : {};
    }
    getComponent(...componentNames) {
        return this.root.getComponent(...componentNames);
    }
    getContent(reference) {
        const contentReference = isReference(reference) ? PageImpl_1.getContentReference(reference) : reference;
        return this.content.get(contentReference);
    }
    getDocument() {
        throw new Error("The page document is not supported by this version of the Page Model API.");
    }
    getLocale() {
        throw new Error("The locale is not supported by this version of the Page Model API.");
    }
    getMeta(meta) {
        return this.metaFactory(meta);
    }
    getTitle() {
        return this.model.page._meta.pageTitle;
    }
    getUrl(link) {
        var _a;
        return this.linkFactory.create((_a = link) !== null && _a !== void 0 ? _a : Object.assign(Object.assign({}, this.model._links.site), {
            type: TYPE_LINK_INTERNAL
        }));
    }
    getVersion() {
        return this.model._meta.version;
    }
    getVisitor() {
        return this.model._meta.visitor;
    }
    getVisit() {
        return this.model._meta.visit;
    }
    isPreview() {
        return !!this.model._meta.preview;
    }
    rewriteLinks(content, type = "text/html") {
        return this.linkRewriter.rewrite(content, type);
    }
    sync() {
        var _a;
        (_a = this.cmsEventBus) === null || _a === void 0 ? void 0 : _a.emit("page.ready", {});
    }
    toJSON() {
        return this.model;
    }
};

PageImpl = PageImpl_1 = __decorate([ injectable(), __param(0, inject(PageModelToken)), __param(1, inject(ButtonFactory)), __param(2, inject(ComponentFactory)), __param(3, inject(ContentFactory)), __param(4, inject(LinkFactory)), __param(5, inject(LinkRewriterService)), __param(6, inject(MetaCollectionFactory)), __param(7, inject(CmsEventBusService)), __param(8, inject(PageEventBusService)), __param(8, optional()), __param(9, inject(Logger)), __param(9, optional()), __metadata("design:paramtypes", [ Object, ButtonFactory, ComponentFactory, Function, LinkFactory, Object, Function, Object, Object, Logger ]) ], PageImpl);

/**
 * Checks whether a value is a page.
 * @param value The value to check.
 */ function isPage$1(value) {
    return value instanceof PageImpl;
}

const ContentModelToken = Symbol.for("ContentModelToken");

let ContentImpl = class ContentImpl {
    constructor(model, linkFactory, metaFactory) {
        var _a;
        this.model = model;
        this.linkFactory = linkFactory;
        this.meta = metaFactory((_a = this.model._meta) !== null && _a !== void 0 ? _a : {});
    }
    getId() {
        return this.model.id;
    }
    getLocale() {
        return this.model.localeString;
    }
    getMeta() {
        return this.meta;
    }
    getName() {
        return this.model.name;
    }
    getData() {
        return this.model;
    }
    getUrl() {
        return this.linkFactory.create(this.model._links.site);
    }
};

ContentImpl = __decorate([ injectable(), __param(0, inject(ContentModelToken)), __param(1, inject(LinkFactory)), __param(2, inject(MetaCollectionFactory)), __metadata("design:paramtypes", [ Object, LinkFactory, Function ]) ], ContentImpl);

/**
 * Checks whether a value is a content.
 * @param value The value to check.
 */ function isContent(value) {
    return value instanceof ContentImpl;
}

const DocumentModelToken = Symbol.for("DocumentModelToken");

const TYPE_DOCUMENT = "document";

let DocumentImpl = class DocumentImpl {
    constructor(model, linkFactory, metaFactory) {
        var _a;
        this.model = model;
        this.linkFactory = linkFactory;
        this.meta = metaFactory((_a = this.model.meta) !== null && _a !== void 0 ? _a : {});
    }
    getId() {
        return this.model.data.id;
    }
    getLocale() {
        return this.model.data.localeString;
    }
    getMeta() {
        return this.meta;
    }
    getName() {
        return this.model.data.name;
    }
    getData() {
        return this.model.data;
    }
    getUrl() {
        return this.linkFactory.create(this.model.links.site);
    }
};

DocumentImpl = __decorate([ injectable(), __param(0, inject(DocumentModelToken)), __param(1, inject(LinkFactory)), __param(2, inject(MetaCollectionFactory)), __metadata("design:paramtypes", [ Object, LinkFactory, Function ]) ], DocumentImpl);

/**
 * Checks whether a value is a document.
 * @param value The value to check.
 */ function isDocument(value) {
    return value instanceof DocumentImpl;
}

const ImageFactory = Symbol.for("ImageFactory");

const ImageModelToken = Symbol.for("ImageModelToken");

let ImageImpl = class ImageImpl {
    constructor(model, linkFactory) {
        this.model = model;
        this.linkFactory = linkFactory;
    }
    getDisplayName() {
        return this.model.displayName;
    }
    getFileName() {
        var _a;
        return (_a = this.model.fileName) !== null && _a !== void 0 ? _a : undefined;
    }
    getHeight() {
        return this.model.height;
    }
    getMimeType() {
        return this.model.mimeType;
    }
    getName() {
        return this.model.name;
    }
    getSize() {
        return this.model.size;
    }
    getUrl() {
        return this.model.links.site && this.linkFactory.create(this.model.links.site);
    }
    getWidth() {
        return this.model.width;
    }
};

ImageImpl = __decorate([ injectable(), __param(0, inject(ImageModelToken)), __param(1, inject(LinkFactory)), __metadata("design:paramtypes", [ Object, LinkFactory ]) ], ImageImpl);

const ImageSetModelToken = Symbol.for("ImageSetModelToken");

const TYPE_IMAGE_SET = "imageset";

let ImageSetImpl = class ImageSetImpl {
    constructor(model, imageFactory) {
        this.model = model;
        this.original = model.data.original ? imageFactory(model.data.original) : undefined;
        this.thumbnail = model.data.thumbnail ? imageFactory(model.data.thumbnail) : undefined;
    }
    getDescription() {
        var _a;
        return (_a = this.model.data.description) !== null && _a !== void 0 ? _a : undefined;
    }
    getDisplayName() {
        return this.model.data.displayName;
    }
    getFileName() {
        var _a;
        return (_a = this.model.data.fileName) !== null && _a !== void 0 ? _a : undefined;
    }
    getId() {
        return this.model.data.id;
    }
    getLocale() {
        var _a;
        return (_a = this.model.data.localeString) !== null && _a !== void 0 ? _a : undefined;
    }
    getName() {
        return this.model.data.name;
    }
    getOriginal() {
        return this.original;
    }
    getThumbnail() {
        return this.thumbnail;
    }
};

ImageSetImpl = __decorate([ injectable(), __param(0, inject(ImageSetModelToken)), __param(1, inject(ImageFactory)), __metadata("design:paramtypes", [ Object, Function ]) ], ImageSetImpl);

/**
 * Checks whether a value is an image set.
 * @param value The value to check.
 */ function isImageSet(value) {
    return value instanceof ImageSetImpl;
}

/**
 * A manage content button.
 */ const TYPE_MANAGE_CONTENT_BUTTON = "MANAGE_CONTENT_LINK";

function createManageContentButton(params) {
    var _a;
    const meta = (_a = params.content) === null || _a === void 0 ? void 0 : _a.getMeta();
    const entries = [ [ "defaultPath", params.path ], [ "documentTemplateQuery", params.documentTemplateQuery ], [ "folderTemplateQuery", params.folderTemplateQuery ], [ "rootPath", params.root ], [ "parameterName", params.parameter ], [ "parameterValueIsRelativePath", params.relative ? "true" : undefined ], [ "pickerEnableUpload", params.pickerEnableUpload ], [ "pickerConfiguration", params.pickerConfiguration ], [ "pickerInitialPath", params.pickerInitialPath ], [ "pickerRemembersLastVisited", params.pickerRemembersLastVisited ? "true" : undefined ], [ "pickerRootPath", params.pickerRootPath ], [ "pickerSelectableNodeTypes", params.pickerSelectableNodeTypes ] ].filter((([, value]) => !!value));
    if (!entries.length) {
        return meta !== null && meta !== void 0 ? meta : {};
    }
    const model = Object.fromEntries(entries);
    if (!meta) {
        return {
            beginNodeSpan: [ {
                type: TYPE_META_COMMENT,
                data: JSON.stringify(Object.assign({
                    "HST-Type": TYPE_MANAGE_CONTENT_BUTTON
                }, model))
            } ]
        };
    }
    const merge = item => ({
        type: TYPE_META_COMMENT,
        data: JSON.stringify(Object.assign(JSON.parse(item.getData()), model))
    });
    return {
        beginNodeSpan: meta.filter((item => item.getPosition() === META_POSITION_BEGIN)).map(merge),
        endNodeSpan: meta.filter((item => item.getPosition() === META_POSITION_END)).map(merge)
    };
}

const MenuItemFactory = Symbol.for("MenuItemFactory");

const MenuItemModelToken = Symbol.for("MenuItemModelToken");

let MenuItemImpl = class MenuItemImpl {
    constructor(model, linkFactory, menuItemFactory) {
        this.model = model;
        this.linkFactory = linkFactory;
        this.children = model.childMenuItems.map(menuItemFactory);
    }
    getChildren() {
        return this.children;
    }
    getDepth() {
        return this.model.depth;
    }
    getLink() {
        return this.model.links.site;
    }
    getName() {
        return this.model.name;
    }
    getParameters() {
        return this.model.parameters;
    }
    getUrl() {
        return this.model.links.site && this.linkFactory.create(this.model.links.site);
    }
    isExpanded() {
        return this.model.expanded;
    }
    isRepositoryBased() {
        return this.model.repositoryBased;
    }
    isSelected() {
        return this.model.selected;
    }
};

MenuItemImpl = __decorate([ injectable(), __param(0, inject(MenuItemModelToken)), __param(1, inject(LinkFactory)), __param(2, inject(MenuItemFactory)), __metadata("design:paramtypes", [ Object, LinkFactory, Function ]) ], MenuItemImpl);

const MenuModelToken = Symbol.for("MenuModelToken");

/**
 * A manage menu button.
 */ const TYPE_MANAGE_MENU_BUTTON = "EDIT_MENU_LINK";

const TYPE_MENU = "menu";

let MenuImpl = class MenuImpl {
    constructor(model, metaFactory, menuItemFactory) {
        this.model = model;
        this.items = model.data.siteMenuItems.map(menuItemFactory);
        this.meta = metaFactory(model.meta);
        this.selected = model.data.selectSiteMenuItem ? menuItemFactory(model.data.selectSiteMenuItem) : undefined;
    }
    getItems() {
        return this.items;
    }
    getMeta() {
        return this.meta;
    }
    getName() {
        return this.model.data.name;
    }
    getSelected() {
        return this.selected;
    }
};

MenuImpl = __decorate([ injectable(), __param(0, inject(MenuModelToken)), __param(1, inject(MetaCollectionFactory)), __param(2, inject(MenuItemFactory)), __metadata("design:paramtypes", [ Object, Function, Function ]) ], MenuImpl);

/**
 * Checks whether a value is a menu.
 * @param value The value to check.
 */ function isMenu(value) {
    return value instanceof MenuImpl;
}

const PageFactory = Symbol.for("PageFactory");

const PaginationItemFactory = Symbol.for("PaginationItemFactory");

const PaginationItemModelToken = Symbol.for("PaginationItemModelToken");

let PaginationItemImpl = class PaginationItemImpl {
    constructor(model, linkFactory) {
        this.model = model;
        this.linkFactory = linkFactory;
    }
    getNumber() {
        return this.model.number;
    }
    getUrl() {
        return this.linkFactory.create(this.model.links.site);
    }
};

PaginationItemImpl = __decorate([ injectable(), __param(0, inject(PaginationItemModelToken)), __param(1, inject(LinkFactory)), __metadata("design:paramtypes", [ Object, LinkFactory ]) ], PaginationItemImpl);

const PaginationModelToken = Symbol.for("PaginationModelToken");

const TYPE_PAGINATION = "pagination";

let PaginationImpl = class PaginationImpl {
    constructor(model, paginationItemFactory) {
        this.model = model;
        this.current = paginationItemFactory(model.current);
        this.first = paginationItemFactory(model.first);
        this.last = paginationItemFactory(model.last);
        this.next = model.next ? paginationItemFactory(model.next) : undefined;
        this.previous = model.previous ? paginationItemFactory(model.previous) : undefined;
        this.pages = model.pages.map(paginationItemFactory);
    }
    getCurrent() {
        return this.current;
    }
    getFirst() {
        return this.first;
    }
    getItems() {
        return this.model.items;
    }
    getLast() {
        return this.last;
    }
    getNext() {
        return this.next;
    }
    getOffset() {
        return this.model.offset;
    }
    getPages() {
        return this.pages;
    }
    getPrevious() {
        return this.previous;
    }
    getSize() {
        return this.model.size;
    }
    getTotal() {
        return this.model.total;
    }
    isEnabled() {
        return this.model.enabled;
    }
};

PaginationImpl = __decorate([ injectable(), __param(0, inject(PaginationModelToken)), __param(1, inject(PaginationItemFactory)), __metadata("design:paramtypes", [ Object, Function ]) ], PaginationImpl);

/**
 * Checks whether a value is a pagination.
 * @param value The value to check.
 */ function isPagination(value) {
    return value instanceof PaginationImpl;
}

function PageModule$1() {
    return new ContainerModule((bind => {
        bind(PageEventBusService).toDynamicValue((() => new Typed)).inSingletonScope().when((() => typeof window !== "undefined"));
        bind(LinkRewriterService).to(LinkRewriterImpl).inSingletonScope();
        bind(ButtonFactory).toSelf().inSingletonScope().onActivation(((context, factory) => factory.register(TYPE_MANAGE_CONTENT_BUTTON, createManageContentButton).register(TYPE_MANAGE_MENU_BUTTON, (menu => menu.getMeta()))));
        bind(LinkFactory).toSelf().inSingletonScope().onActivation((({container}, factory) => {
            const url = container.get(UrlBuilderService);
            return factory.register(TYPE_LINK_INTERNAL, url.getSpaUrl.bind(url));
        }));
        bind(MetaCollectionFactory).toFactory((({container}) => model => {
            const scope = container.createChild();
            scope.bind(MetaCollectionImpl).toSelf();
            scope.bind(MetaCollectionModelToken).toConstantValue(model);
            return scope.get(MetaCollectionImpl);
        }));
        bind(MetaFactory).toSelf().inSingletonScope().onActivation(((context, factory) => factory.register(TYPE_META_COMMENT, ((model, position) => new MetaCommentImpl(model, position)))));
        bind(MenuItemFactory).toFactory((({container}) => model => {
            const scope = container.createChild();
            scope.bind(MenuItemImpl).toSelf();
            scope.bind(MenuItemModelToken).toConstantValue(model);
            return scope.get(MenuItemImpl);
        }));
        bind(ImageFactory).toFactory((({container}) => model => {
            const scope = container.createChild();
            scope.bind(ImageImpl).toSelf();
            scope.bind(ImageModelToken).toConstantValue(model);
            return scope.get(ImageImpl);
        }));
        bind(PaginationItemFactory).toFactory((({container}) => model => {
            const scope = container.createChild();
            scope.bind(PaginationItemImpl).toSelf();
            scope.bind(PaginationItemModelToken).toConstantValue(model);
            return scope.get(PaginationItemImpl);
        }));
        bind(ContentFactory$1).toSelf().inSingletonScope().onActivation((({container}, factory) => factory.register(TYPE_DOCUMENT, (model => {
            const scope = container.createChild();
            scope.bind(DocumentImpl).toSelf();
            scope.bind(DocumentModelToken).toConstantValue(model);
            return scope.get(DocumentImpl);
        })).register(TYPE_IMAGE_SET, (model => {
            const scope = container.createChild();
            scope.bind(ImageSetImpl).toSelf();
            scope.bind(ImageSetModelToken).toConstantValue(model);
            return scope.get(ImageSetImpl);
        })).register(TYPE_MENU, (model => {
            const scope = container.createChild();
            scope.bind(MenuImpl).toSelf();
            scope.bind(MenuModelToken).toConstantValue(model);
            return scope.get(MenuImpl);
        })).register(TYPE_PAGINATION, (model => {
            const scope = container.createChild();
            scope.bind(PaginationImpl).toSelf();
            scope.bind(PaginationModelToken).toConstantValue(model);
            return scope.get(PaginationImpl);
        }))));
        bind(ComponentFactory$1).toSelf().inSingletonScope().onActivation((({container}, factory) => factory.register(TYPE_COMPONENT$1, ((model, children) => {
            const scope = container.createChild();
            scope.bind(ComponentImpl$1).toSelf();
            scope.bind(ComponentModelToken).toConstantValue(model);
            scope.bind(ComponentChildrenToken).toConstantValue(children);
            return scope.get(ComponentImpl$1);
        })).register(TYPE_COMPONENT_CONTAINER$1, ((model, children) => {
            const scope = container.createChild();
            scope.bind(ContainerImpl$1).toSelf();
            scope.bind(ComponentModelToken).toConstantValue(model);
            scope.bind(ComponentChildrenToken).toConstantValue(children);
            return scope.get(ContainerImpl$1);
        })).register(TYPE_COMPONENT_CONTAINER_ITEM$1, (model => {
            const scope = container.createChild();
            scope.bind(ContainerItemImpl$1).toSelf();
            scope.bind(ComponentModelToken).toConstantValue(model);
            return scope.get(ContainerItemImpl$1);
        }))));
        bind(PageFactory).toFactory((({container}) => model => {
            const scope = container.createChild();
            scope.bind(PageImpl$1).toSelf();
            scope.bind(PageModelToken).toConstantValue(model);
            return scope.get(PageImpl$1);
        }));
    }));
}

function PageModule() {
    return new ContainerModule((bind => {
        bind(PageEventBusService).toDynamicValue((() => new Typed)).inSingletonScope().when((() => typeof window !== "undefined"));
        bind(LinkRewriterService).to(LinkRewriterImpl).inSingletonScope();
        bind(ButtonFactory).toSelf().inSingletonScope().onActivation(((context, factory) => factory.register(TYPE_MANAGE_CONTENT_BUTTON, createManageContentButton).register(TYPE_MANAGE_MENU_BUTTON, (({_meta}) => _meta !== null && _meta !== void 0 ? _meta : {}))));
        bind(LinkFactory).toSelf().inSingletonScope().onActivation((({container}, factory) => {
            const url = container.get(UrlBuilderService);
            return factory.register(TYPE_LINK_INTERNAL, url.getSpaUrl.bind(url));
        }));
        bind(MetaCollectionFactory).toFactory((({container}) => model => {
            const scope = container.createChild();
            scope.bind(MetaCollectionImpl).toSelf();
            scope.bind(MetaCollectionModelToken).toConstantValue(model);
            return scope.get(MetaCollectionImpl);
        }));
        bind(MetaFactory).toSelf().inSingletonScope().onActivation(((context, factory) => factory.register(TYPE_META_COMMENT, ((model, position) => new MetaCommentImpl(model, position)))));
        bind(ContentFactory).toFactory((({container}) => model => {
            const scope = container.createChild();
            scope.bind(ContentImpl).toSelf();
            scope.bind(ContentModelToken).toConstantValue(model);
            return scope.get(ContentImpl);
        }));
        bind(ComponentFactory).toSelf().inSingletonScope().onActivation((({container}, factory) => factory.register(TYPE_COMPONENT, ((model, children) => {
            const scope = container.createChild();
            scope.bind(ComponentImpl).toSelf();
            scope.bind(ComponentModelToken).toConstantValue(model);
            scope.bind(ComponentChildrenToken).toConstantValue(children);
            return scope.get(ComponentImpl);
        })).register(TYPE_COMPONENT_CONTAINER, ((model, children) => {
            const scope = container.createChild();
            scope.bind(ContainerImpl).toSelf();
            scope.bind(ComponentModelToken).toConstantValue(model);
            scope.bind(ComponentChildrenToken).toConstantValue(children);
            return scope.get(ContainerImpl);
        })).register(TYPE_COMPONENT_CONTAINER_ITEM, (model => {
            const scope = container.createChild();
            scope.bind(ContainerItemImpl).toSelf();
            scope.bind(ComponentModelToken).toConstantValue(model);
            return scope.get(ContainerItemImpl);
        }))));
        bind(PageFactory).toFactory((({container}) => model => {
            const scope = container.createChild();
            scope.bind(PageImpl).toSelf();
            scope.bind(PageModelToken).toConstantValue(model);
            return scope.get(PageImpl);
        }));
    }));
}

/**
 * Checks whether a value is a page component.
 * @param value The value to check.
 */ function isComponent(value) {
    return isComponent$2(value) || isComponent$1(value);
}

/**
 * Checks whether a value is a page container.
 * @param value The value to check.
 */ function isContainer(value) {
    return isContainer$2(value) || isContainer$1(value);
}

/**
 * Checks whether a value is a page container item.
 * @param value The value to check.
 */ function isContainerItem(value) {
    return isContainerItem$2(value) || isContainerItem$1(value);
}

/**
 * Checks whether a value is a page.
 * @param value The value to check.
 */ function isPage(value) {
    return isPage$2(value) || isPage$1(value);
}

class Cookie {
    /**
     * Set cookie in the document
     * @param name Cookie name
     * @param value Cookie value
     * @param ttl  Sets the cookie max-age in days
     */
    static SET_COOKIE(name, value, ttl) {
        if (this.isWindowAvailable() && name && value) {
            const maxAge = ttl > this.MAX_TTL_DAYS ? this.getSeconds(this.MAX_TTL_DAYS) : this.getSeconds(ttl);
            document.cookie = cookie.serialize(name, value, {
                maxAge
            });
        }
    }
    /**
     * Retrieve data from cookies
     * @return Cookie object.
     */    static GET_COOKIE() {
        var _a;
        return this.isWindowAvailable() ? cookie.parse((_a = document.cookie) !== null && _a !== void 0 ? _a : "") : {};
    }
    /**
     * Retrieve data from request cookies
     * @param request Current user's request.
     * @return Cookie object.
     */    static GET_COOKIE_FROM_REQUEST(request) {
        var _a, _b;
        return cookie.parse((_b = (_a = request.headers) === null || _a === void 0 ? void 0 : _a.cookie) !== null && _b !== void 0 ? _b : "");
    }
    /**
     * Erase cookie in the document
     * @param name Cookie name
     */    static ERASE_COOKIE(name) {
        if (this.isWindowAvailable()) {
            document.cookie = cookie.serialize(name, "", {
                maxAge: 0
            });
        }
    }
    /**
     * Check if Window is available
     */    static isWindowAvailable() {
        return typeof window !== "undefined";
    }
    /**
     * Convert days to seconds
     * @param days Time in days
     * @return number
     */    static getSeconds(days) {
        return days * 24 * 60 * 60;
    }
}

Cookie.MAX_TTL_DAYS = 28;

class Campaign {
    /**
     * Get the campaign variant from URL or cookie
     * @param campaignId Campaign id from URL
     * @param segmentId Segment id from URL
     * @param ttl TTL param in days from URL
     * @param request Current user's request
     * @return string
     */
    static GET_VARIANT_ID(campaignId, segmentId, ttl, request) {
        const TTL = this.getCookieTTL(ttl);
        if (TTL === 0) {
            return "";
        }
        if (campaignId && segmentId) {
            return `${campaignId}:${segmentId}`;
        }
        const {[this.CAMPAIGN_PARAMETER]: _campaignId, [this.SEGMENT_PARAMETER]: _segmentId} = (request === null || request === void 0 ? void 0 : request.headers) ? Cookie.GET_COOKIE_FROM_REQUEST(request) : Cookie.GET_COOKIE();
        if (_campaignId && _segmentId) {
            return `${_campaignId}:${_segmentId}`;
        }
        return "";
    }
    /**
     * Get cookie TTL value
     * @param ttl TTL param in days
     * @return number
     */    static getCookieTTL(ttl) {
        const TTL = Number(ttl);
        return Number.isNaN(TTL) ? this.DEFAULT_TTL_DAYS : TTL;
    }
}

Campaign.CAMPAIGN_PARAMETER = "__br__campaign_id";

Campaign.SEGMENT_PARAMETER = "__br__segment";

Campaign.TTL_PARAMETER = "__br__ttl";

Campaign.DEFAULT_TTL_DAYS = 7;

class Segmentation {
    /**
     * Get the segmentIds from cookie
     * @return string
     */
    static GET_SEGMENT_IDS(request) {
        var _a;
        const cookie = (request === null || request === void 0 ? void 0 : request.headers) ? Cookie.GET_COOKIE_FROM_REQUEST(request) : Cookie.GET_COOKIE();
        return (_a = cookie[this.SEGMENT_IDS_PARAMETER]) !== null && _a !== void 0 ? _a : "";
    }
}

Segmentation.SEGMENT_IDS_PARAMETER = "__br__segment_ids";

var ApiImpl_1;

const DEFAULT_API_VERSION_HEADER = "Accept-Version";

const DEFAULT_AUTHORIZATION_HEADER = "Authorization";

const DEFAULT_SERVER_ID_HEADER = "Server-Id";

const ApiOptionsToken = Symbol.for("ApiOptionsToken");

const ApiService = Symbol.for("ApiService");

let ApiImpl = ApiImpl_1 = class ApiImpl {
    constructor(urlBuilder, options, logger) {
        this.urlBuilder = urlBuilder;
        this.logger = logger;
        this.headers = ApiImpl_1.getHeaders(options);
        this.httpClient = options.httpClient;
    }
    static getHeaders(options) {
        var _a, _b, _c, _d;
        const {cookie, referer, "x-forwarded-for": ip = ((_b = (_a = options.request) === null || _a === void 0 ? void 0 : _a.connection) === null || _b === void 0 ? void 0 : _b.remoteAddress), "user-agent": userAgent} = ((_c = options.request) === null || _c === void 0 ? void 0 : _c.headers) || {};
        const {apiVersionHeader = DEFAULT_API_VERSION_HEADER, apiVersion, authorizationHeader = DEFAULT_AUTHORIZATION_HEADER, authorizationToken, serverIdHeader = DEFAULT_SERVER_ID_HEADER, serverId, visitor = (_d = options.request) === null || _d === void 0 ? void 0 : _d.visitor} = options;
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, ip && {
            "X-Forwarded-For": ip
        }), apiVersion && {
            [apiVersionHeader]: apiVersion
        }), authorizationToken && {
            [authorizationHeader]: `Bearer ${authorizationToken}`
        }), isConfigurationWithProxy(options) && cookie && {
            Cookie: cookie
        }), referer && {
            Referer: referer
        }), serverId && {
            [serverIdHeader]: serverId
        }), userAgent && {
            "User-Agent": userAgent
        }), visitor && {
            [visitor.header]: visitor.id
        });
    }
    getPage(path) {
        const url = this.urlBuilder.getApiUrl(path);
        return this.send({
            url,
            method: "GET"
        });
    }
    getComponent(url, payload) {
        const data = new URLSearchParams(payload);
        return this.send({
            url,
            data: data.toString(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: Object.keys(payload || {}).length ? "POST" : "GET"
        });
    }
    send(config) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, (function*() {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Request:", config.method, config.url);
            (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("Headers:", Object.assign(Object.assign({}, this.headers), config.headers));
            if (config.data) {
                (_c = this.logger) === null || _c === void 0 ? void 0 : _c.debug("Body:", config.data);
            }
            const response = yield this.httpClient(Object.assign(Object.assign({}, config), {
                headers: Object.assign(Object.assign({}, this.headers), config.headers)
            }));
            return response.data;
        }));
    }
};

ApiImpl = ApiImpl_1 = __decorate([ injectable(), __param(0, inject(UrlBuilderService)), __param(1, inject(ApiOptionsToken)), __param(2, inject(Logger)), __param(2, optional()), __metadata("design:paramtypes", [ Object, Object, Logger ]) ], ApiImpl);

const SpaService = Symbol.for("SpaService");

/**
 * SPA entry point interacting with the Channel Manager and the Page Model API.
 */ let Spa = class Spa {
    /**
     * @param pageEventBus Event bus to exchange data between submodules.
     * @param api Api client.
     * @param pageFactory Factory to produce page instances.
     */
    constructor(api, pageFactory, cmsEventBus, pageEventBus, logger) {
        this.api = api;
        this.pageFactory = pageFactory;
        this.cmsEventBus = cmsEventBus;
        this.pageEventBus = pageEventBus;
        this.logger = logger;
        this.onCmsUpdate = this.onCmsUpdate.bind(this);
    }
    onCmsUpdate(event) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, (function*() {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Received CMS update event.");
            (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("Event:", event);
            const root = this.page.getComponent();
            const component = root.getComponentById(event.id);
            const url = component === null || component === void 0 ? void 0 : component.getUrl();
            if (!url) {
                (_c = this.logger) === null || _c === void 0 ? void 0 : _c.debug("Skipping the update event.");
                return;
            }
            (_d = this.logger) === null || _d === void 0 ? void 0 : _d.debug("Trying to request the component model.");
            const model = yield this.api.getComponent(url, event.properties);
            (_e = this.logger) === null || _e === void 0 ? void 0 : _e.debug("Model:", model);
            (_f = this.pageEventBus) === null || _f === void 0 ? void 0 : _f.emit("page.update", {
                page: model
            });
        }));
    }
    /**
     * Initializes the SPA.
     * @param modelOrPath A preloaded page model or URL to a page model.
     */    initialize(modelOrPath) {
        var _a, _b;
        if (typeof modelOrPath === "string") {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Trying to request the page model.");
            return this.api.getPage(modelOrPath).then(this.hydrate.bind(this));
        }
        (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("Received dehydrated model.");
        return this.hydrate(modelOrPath);
    }
    hydrate(model) {
        var _a, _b, _c;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Model:", model);
        (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug("Hydrating.");
        this.page = this.pageFactory(model);
        if (this.page.isPreview()) {
            (_c = this.cmsEventBus) === null || _c === void 0 ? void 0 : _c.on("cms.update", this.onCmsUpdate);
        }
        return this.page;
    }
    /**
     * Destroys the integration with the SPA page.
     */    destroy() {
        var _a, _b, _c;
        (_a = this.cmsEventBus) === null || _a === void 0 ? void 0 : _a.off("cms.update", this.onCmsUpdate);
        (_b = this.pageEventBus) === null || _b === void 0 ? void 0 : _b.clearListeners();
        delete this.page;
        (_c = this.logger) === null || _c === void 0 ? void 0 : _c.debug("Destroyed page.");
    }
};

Spa = __decorate([ injectable(), __param(0, inject(ApiService)), __param(1, inject(PageFactory)), __param(2, inject(CmsEventBusService)), __param(2, optional()), __param(3, inject(PageEventBusService)), __param(3, optional()), __param(4, inject(Logger)), __param(4, optional()), __metadata("design:paramtypes", [ Object, Function, Object, Object, Logger ]) ], Spa);

function SpaModule() {
    return new ContainerModule((bind => {
        bind(ApiService).to(ApiImpl).inSingletonScope();
        bind(SpaService).to(Spa).inSingletonScope();
    }));
}

const DEFAULT_AUTHORIZATION_PARAMETER = "token";

const DEFAULT_SERVER_ID_PARAMETER = "server-id";

const BTM_PREFIX = "btm_";

const DEFAULT_CAMPAIGN_VARIANT_PARAMETER_URL = `${BTM_PREFIX}campaign_id`;

const DEFAULT_SEGMENT_PARAMETER_URL = `${BTM_PREFIX}segment`;

const DEFAULT_TTL_PARAMETER_URL = `${BTM_PREFIX}ttl`;

const BR_PREFIX = "__br__";

const DEFAULT_CAMPAIGN_VARIANT_PARAMETER_API = `${BR_PREFIX}campaignVariant`;

const DEFAULT_SEGMENT_IDS_PARAMETER_API = `${BR_PREFIX}segmentIds`;

const container = new Container({
    skipBaseClassChecks: true
});

const pages = new WeakMap;

container.load(CmsModule(), LoggerModule(), UrlModule$1());

function onReady(value, callback) {
    const wrapper = result => (callback(result), result);
    return value instanceof Promise ? value.then(wrapper) : wrapper(value);
}

function initializeWithProxy(scope, configuration, model) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const logger = scope.get(Logger);
    logger.info("Enabled reverse-proxy based setup.");
    logger.warn("This setup is deprecated and will not work in the next major release.");
    logger.debug("Path:", (_c = (_a = configuration.path) !== null && _a !== void 0 ? _a : (_b = configuration.request) === null || _b === void 0 ? void 0 : _b.path) !== null && _c !== void 0 ? _c : "/");
    logger.debug("Base URL:", configuration.options.preview.spaBaseUrl);
    const options = isMatched((_f = (_d = configuration.path) !== null && _d !== void 0 ? _d : (_e = configuration.request) === null || _e === void 0 ? void 0 : _e.path) !== null && _f !== void 0 ? _f : "/", configuration.options.preview.spaBaseUrl) ? configuration.options.preview : configuration.options.live;
    logger.info(`Using ${options === configuration.options.preview ? "preview" : "live"} configuration.`);
    const config = Object.assign(Object.assign({}, configuration), {
        NBRMode: configuration.NBRMode || false
    });
    scope.load(PageModule(), SpaModule(), UrlModule());
    scope.bind(ApiOptionsToken).toConstantValue(config);
    scope.bind(UrlBuilderOptionsToken).toConstantValue(options);
    scope.getNamed(CmsService, "cms14").initialize(configuration);
    return onReady(scope.get(SpaService).initialize((_j = (_g = model !== null && model !== void 0 ? model : configuration.path) !== null && _g !== void 0 ? _g : (_h = configuration.request) === null || _h === void 0 ? void 0 : _h.path) !== null && _j !== void 0 ? _j : "/"), (() => {
        scope.unbind(ApiOptionsToken);
        scope.unbind(UrlBuilderOptionsToken);
    }));
}

function initializeWithJwt09(scope, configuration, model) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const logger = scope.get(Logger);
    logger.info("Enabled token-based setup.");
    logger.info("Using Page Model API 0.9.");
    logger.warn("This version of the Page Model API is deprecated and will be removed in the next major release.");
    const authorizationParameter = (_a = configuration.authorizationQueryParameter) !== null && _a !== void 0 ? _a : DEFAULT_AUTHORIZATION_PARAMETER;
    const serverIdParameter = (_b = configuration.serverIdQueryParameter) !== null && _b !== void 0 ? _b : DEFAULT_SERVER_ID_PARAMETER;
    const {url: path, searchParams} = extractSearchParams((_e = (_c = configuration.path) !== null && _c !== void 0 ? _c : (_d = configuration.request) === null || _d === void 0 ? void 0 : _d.path) !== null && _e !== void 0 ? _e : "/", [ authorizationParameter, serverIdParameter ].filter(Boolean));
    const authorizationToken = (_f = searchParams.get(authorizationParameter)) !== null && _f !== void 0 ? _f : undefined;
    const serverId = (_g = searchParams.get(serverIdParameter)) !== null && _g !== void 0 ? _g : undefined;
    const config = Object.assign(Object.assign({}, configuration), {
        origin: (_h = configuration.origin) !== null && _h !== void 0 ? _h : parseUrl((_k = (_j = configuration.apiBaseUrl) !== null && _j !== void 0 ? _j : configuration.cmsBaseUrl) !== null && _k !== void 0 ? _k : "").origin,
        spaBaseUrl: appendSearchParams((_l = configuration.spaBaseUrl) !== null && _l !== void 0 ? _l : "", searchParams),
        NBRMode: configuration.NBRMode || false
    });
    if (authorizationToken) {
        logger.debug("Token:", authorizationToken);
    }
    if (serverId) {
        logger.debug("Server Id:", serverId);
    }
    logger.debug("Origin:", config.origin);
    logger.debug("Path:", path);
    logger.debug("Base URL:", config.spaBaseUrl);
    scope.load(PageModule(), SpaModule(), UrlModule());
    scope.bind(ApiOptionsToken).toConstantValue(Object.assign({
        authorizationToken,
        serverId
    }, config));
    scope.bind(UrlBuilderOptionsToken).toConstantValue(config);
    return onReady(scope.get(SpaService).initialize(model !== null && model !== void 0 ? model : path), (page => {
        if (page.isPreview() && config.cmsBaseUrl) {
            logger.info("Running in preview mode.");
            scope.get(PostMessageService).initialize(config);
            scope.get(CmsService).initialize(config);
        } else {
            logger.info("Running in live mode.");
        }
        scope.unbind(ApiOptionsToken);
        scope.unbind(UrlBuilderOptionsToken);
    }));
}

function initializeWithJwt10(scope, configuration, model) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const logger = scope.get(Logger);
    logger.info("Enabled token-based setup.");
    logger.info("Using Page Model API 1.0.");
    const authorizationParameter = (_a = configuration.authorizationQueryParameter) !== null && _a !== void 0 ? _a : DEFAULT_AUTHORIZATION_PARAMETER;
    const serverIdParameter = (_b = configuration.serverIdQueryParameter) !== null && _b !== void 0 ? _b : DEFAULT_SERVER_ID_PARAMETER;
    const campaignParameter = DEFAULT_CAMPAIGN_VARIANT_PARAMETER_URL;
    const segmentParameter = DEFAULT_SEGMENT_PARAMETER_URL;
    const ttlParameter = DEFAULT_TTL_PARAMETER_URL;
    const {url: path, searchParams} = extractSearchParams((_e = (_c = configuration.path) !== null && _c !== void 0 ? _c : (_d = configuration.request) === null || _d === void 0 ? void 0 : _d.path) !== null && _e !== void 0 ? _e : "/", [ authorizationParameter, serverIdParameter, campaignParameter, segmentParameter, ttlParameter ].filter(Boolean));
    const authorizationToken = (_f = searchParams.get(authorizationParameter)) !== null && _f !== void 0 ? _f : undefined;
    const serverId = (_g = searchParams.get(serverIdParameter)) !== null && _g !== void 0 ? _g : undefined;
    const campaignId = (_h = searchParams.get(campaignParameter)) !== null && _h !== void 0 ? _h : undefined;
    const segmentId = (_j = searchParams.get(segmentParameter)) !== null && _j !== void 0 ? _j : undefined;
    const ttl = (_k = searchParams.get(ttlParameter)) !== null && _k !== void 0 ? _k : undefined;
    let endpointUrl = configuration.endpoint;
    const campaignVariantId = Campaign.GET_VARIANT_ID(campaignId, segmentId, ttl, configuration.request);
    const segmentIds = Segmentation.GET_SEGMENT_IDS(configuration.request);
    const params = new URLSearchParams;
    if (campaignVariantId) {
        params.append(DEFAULT_CAMPAIGN_VARIANT_PARAMETER_API, campaignVariantId);
    }
    if (segmentIds) {
        params.append(DEFAULT_SEGMENT_IDS_PARAMETER_API, segmentIds);
    }
    endpointUrl = appendSearchParams(endpointUrl !== null && endpointUrl !== void 0 ? endpointUrl : "", params);
    const config = Object.assign(Object.assign({}, configuration), {
        endpoint: endpointUrl,
        baseUrl: appendSearchParams((_l = configuration.baseUrl) !== null && _l !== void 0 ? _l : "", searchParams),
        origin: (_m = configuration.origin) !== null && _m !== void 0 ? _m : parseUrl((_o = configuration.endpoint) !== null && _o !== void 0 ? _o : "").origin,
        NBRMode: configuration.NBRMode || false
    });
    if (authorizationToken) {
        logger.debug("Token:", authorizationToken);
    }
    if (serverId) {
        logger.debug("Server Id:", serverId);
    }
    if (campaignId) {
        logger.debug("Campaign Id:", campaignId);
    }
    if (segmentId) {
        logger.debug("Segment Id:", segmentId);
    }
    if (ttl) {
        logger.debug("TTL:", ttl);
    }
    if (campaignVariantId) {
        logger.debug("Campaign variant Id:", campaignVariantId);
    }
    logger.debug("Endpoint:", config.endpoint);
    logger.debug("Origin:", config.origin);
    logger.debug("Path:", path);
    logger.debug("Base URL:", config.baseUrl);
    scope.load(PageModule$1(), SpaModule(), UrlModule$1());
    scope.bind(ApiOptionsToken).toConstantValue(Object.assign({
        authorizationToken,
        serverId
    }, config));
    scope.bind(UrlBuilderOptionsToken).toConstantValue(config);
    return onReady(scope.get(SpaService).initialize(model !== null && model !== void 0 ? model : path), (page => {
        if (page.isPreview() && config.endpoint) {
            logger.info("Running in preview mode.");
            scope.get(PostMessageService).initialize(config);
            scope.get(CmsService).initialize(config);
        } else {
            logger.info("Running in live mode.");
        }
        scope.unbind(ApiOptionsToken);
        scope.unbind(UrlBuilderOptionsToken);
    }));
}

function initialize(configuration, model) {
    if (isPage(model)) {
        return model;
    }
    const scope = container.createChild();
    const logger = scope.get(Logger);
    logger.level = configuration.debug ? Level.Debug : Level.Error;
    logger.debug("Configuration:", configuration);
    return onReady(isConfigurationWithProxy(configuration) ? initializeWithProxy(scope, configuration, model) : isConfigurationWithJwt09(configuration) ? initializeWithJwt09(scope, configuration, model) : initializeWithJwt10(scope, configuration, model), (page => {
        var _a, _b;
        pages.set(page, scope);
        (_b = (_a = configuration.request) === null || _a === void 0 ? void 0 : _a.emit) === null || _b === void 0 ? void 0 : _b.call(_a, "br:spa:initialized", page);
    }));
}

/**
 * Destroys the integration with the SPA page.
 * @param page Page instance to destroy.
 */ function destroy(page) {
    const scope = pages.get(page);
    pages.delete(page);
    scope === null || scope === void 0 ? void 0 : scope.get(SpaService).destroy();
}

export { META_POSITION_BEGIN, META_POSITION_END, TYPE_CONTAINER_BOX, TYPE_CONTAINER_INLINE, TYPE_CONTAINER_ITEM_UNDEFINED, TYPE_CONTAINER_NO_MARKUP, TYPE_CONTAINER_ORDERED_LIST, TYPE_CONTAINER_UNORDERED_LIST, TYPE_LINK_EXTERNAL, TYPE_LINK_INTERNAL, TYPE_LINK_RESOURCE, TYPE_MANAGE_CONTENT_BUTTON, TYPE_MANAGE_MENU_BUTTON, destroy, extractSearchParams, getContainerItemContent, initialize, isComponent, isContainer, isContainerItem, isContent, isDocument, isImageSet, isLink, isMenu, isMeta, isMetaComment, isPage, isPagination, isReference };
//# sourceMappingURL=index.js.map
