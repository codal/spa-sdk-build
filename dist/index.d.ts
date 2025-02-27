/**
 * Link to a page outside the current application.
 */
declare const TYPE_LINK_EXTERNAL = "external";
/**
 * Link to a page inside the current application.
 */
declare const TYPE_LINK_INTERNAL = "internal";
/**
 * Link to a CMS resource.
 */
declare const TYPE_LINK_RESOURCE = "resource";
/**
 * Unresolved link.
 */
declare const TYPE_LINK_UNKNOWN = "unknown";
declare type LinkType = typeof TYPE_LINK_EXTERNAL | typeof TYPE_LINK_INTERNAL | typeof TYPE_LINK_RESOURCE | typeof TYPE_LINK_UNKNOWN;
/**
 * A link to a resource or a page.
 */
interface Link {
    href?: string;
    type?: LinkType;
}
/**
 * Checks whether a value is a link.
 * @param value The value to check.
 */
declare function isLink(value: any): value is Link;

declare const TYPE_META_COMMENT = "comment";
/**
 * Meta-data following before a page component.
 */
declare const META_POSITION_BEGIN = "begin";
/**
 * Meta-data following after a page component.
 */
declare const META_POSITION_END = "end";
declare type MetaType = typeof TYPE_META_COMMENT;
declare type MetaPosition = typeof META_POSITION_BEGIN | typeof META_POSITION_END;
interface MetaModel {
    data: string;
    type: MetaType;
}
/**
 * Meta information describing a part of the page.
 */
interface Meta {
    /**
     * @return The meta-data.
     */
    getData(): string;
    /**
     * @return The meta-data position relative to the related element.
     */
    getPosition(): MetaPosition;
}
/**
 * Checks whether a value is a meta-data object.
 * @param value The value to check.
 */
declare function isMeta(value: any): value is Meta;

interface MetaCollectionModel {
    beginNodeSpan?: MetaModel[];
    endNodeSpan?: MetaModel[];
}
/**
 * Collection of the meta-data describing a part of the page.
 * @note The collection extends the built-in Array type for backward compatibility.
 */
interface MetaCollection extends Array<Meta> {
    /**
     * Clears all previously rendered meta-data objects.
     * @deprecated Use a callback returned by the `render` method.
     */
    clear(): void;
    /**
     * Renders meta-data objects on the page.
     * @param head The heading node of the page fragment.
     * @param tail The tailing node of the page fragment.
     * @return The callback to clear rendered meta-data objects.
     */
    render(head: Node, tail: Node): () => void;
}

/**
 * A reference to an entity within the page model.
 */
interface Reference {
    $ref: string;
}
/**
 * Checks whether a value is a reference.
 * @param value The value to check.
 */
declare function isReference(value: any): value is Reference;

/**
 * Generic component type.
 */
declare const TYPE_COMPONENT$1 = "component";
/**
 * Container type.
 */
declare const TYPE_COMPONENT_CONTAINER$1 = "container";
/**
 * Container item type.
 */
declare const TYPE_COMPONENT_CONTAINER_ITEM$1 = "container-item";
declare type ComponentType$1 = typeof TYPE_COMPONENT$1 | typeof TYPE_COMPONENT_CONTAINER_ITEM$1 | typeof TYPE_COMPONENT_CONTAINER$1;
declare type ComponentLinks$1 = 'self';
declare type ComponentModels$1 = Record<string, any>;
declare type ComponentParameters = Record<string, any>;
declare type ComponentProperties = ComponentParameters;
/**
 * Meta-data of a component.
 */
interface ComponentMeta extends MetaCollectionModel {
    params?: ComponentParameters;
}
/**
 * Model of a component.
 */
interface ComponentModel$1 {
    children?: Reference[];
    id: string;
    links: Record<ComponentLinks$1, Link>;
    meta: ComponentMeta;
    models?: ComponentModels$1;
    name?: string;
    type: ComponentType$1;
}
/**
 * A component in the current page.
 */
interface Component {
    /**
     * @return The component id.
     */
    getId(): string;
    /**
     * @return The component meta-data collection.
     */
    getMeta(): MetaCollection;
    /**
     * @return The map of the component models.
     */
    getModels<T extends ComponentModels$1>(): T;
    /**
     * @return The link to the partial component model.
     */
    getUrl(): string | undefined;
    /**
     * @return The name of the component.
     */
    getName(): string;
    /**
     * @return The parameters of the component.
     */
    getParameters<T = ComponentParameters>(): T;
    /**
     * @return The properties of the component.
     * @alias getParameters
     */
    getProperties<T = ComponentProperties>(): T;
    /**
     * @return The direct children of the component.
     */
    getChildren(): Component[];
    /**
     * Looks up for a nested component.
     * @param componentNames A lookup path.
     */
    getComponent<U extends Component>(...componentNames: string[]): U | undefined;
    getComponent(): this;
    /**
     * Looks up for a nested component by its id.
     * @param id A component id.
     */
    getComponentById<U extends Component>(id: string): U | this | undefined;
}

/**
 * Event listener.
 */
declare type Listener<T, U extends Extract<keyof T, string>> = (eventData: T[U]) => any;
/**
 * Function to unsubscribe a listener from an event.
 */
declare type UnsubscribeFn = () => void;
/**
 * Event emitter.
 */
interface Emitter<T> {
    /**
     * Subscribes for an event.
     * @param eventName The event name.
     * @param listener The event listener.
     * @return The unsubscribe function.
     */
    on<U extends Extract<keyof T, string>>(eventName: U, listener: Listener<T, U>): UnsubscribeFn;
    /**
     * Unsubscribes from an event.
     * @param eventName The event name.
     * @param listener The event listener.
     */
    off<U extends Extract<keyof T, string>>(eventName: U, listener: Listener<T, U>): void;
}

interface CmsOptions {
    /**
     * The window reference for the CMS integration.
     * By default the global window object will be used.
     */
    window?: Window;
}

interface PostMessageOptions {
    /**
     * The brXM origin to verify an integration with the Experience Manager.
     * This option should be used when the brXM is accessible from a host other than the Page Model API.
     * By default, the origin from the `apiBaseUrl` or `endpoint` parameters is used.
     */
    origin?: string;
    /**
     * The window reference for the CMS integration.
     * By default the global window object will be used.
     */
    window?: Window;
}

declare type ContentLinks = 'site';
/**
 * Model of a content item.
 */
interface ContentModel$1 {
    _links: Record<ContentLinks, Link>;
    _meta?: MetaCollectionModel;
    id: string;
    localeString?: string;
    name: string;
    [property: string]: any;
}
/**
 * Content used on the page.
 */
interface Content {
    /**
     * @return The content id.
     */
    getId(): string;
    /**
     * @return The content locale.
     */
    getLocale(): string | undefined;
    /**
     * @return The content meta-data collection.
     */
    getMeta(): MetaCollection;
    /**
     * @return The content name.
     */
    getName(): string;
    /**
     * @return The content data as it is returned in the Page Model API.
     */
    getData(): ContentModel$1;
    getData<T extends Record<string, any>>(): T & ContentModel$1;
    /**
     * @return The link to the content.
     */
    getUrl(): string | undefined;
}
/**
 * Checks whether a value is a content.
 * @param value The value to check.
 */
declare function isContent(value: any): value is Content;

interface DocumentDataModel {
    id: string;
    localeString?: string;
    name: string;
    [property: string]: any;
}
/**
 * Document used on the page.
 */
interface Document {
    /**
     * @return The document id.
     */
    getId(): string;
    /**
     * @return The document locale.
     */
    getLocale(): string | undefined;
    /**
     * @return The document meta-data collection.
     */
    getMeta(): MetaCollection;
    /**
     * @return The document name.
     */
    getName(): string;
    /**
     * @return The document data.
     */
    getData(): DocumentDataModel;
    getData<T extends Record<string, any>>(): T & DocumentDataModel;
    /**
     * @return The link to the content.
     */
    getUrl(): string | undefined;
}
/**
 * Checks whether a value is a document.
 * @param value The value to check.
 */
declare function isDocument(value: any): value is Document;

/**
 * A manage content button.
 */
declare const TYPE_MANAGE_CONTENT_BUTTON = "MANAGE_CONTENT_LINK";
interface ManageContentButton {
    /**
     * The content entity to open for editing.
     */
    content?: Content | Document;
    /**
     * Template query to use for creating new documents.
     */
    documentTemplateQuery?: string;
    /**
     * Template query to use in case folders specified by `path` do not yet exist and must be created.
     */
    folderTemplateQuery?: string;
    /**
     * Initial location of a new document, relative to the `root`.
     */
    path?: string;
    /**
     * Name of the component parameter in which the document path is stored.
     */
    parameter?: string;
    /**
     * Flag indicating that the picked value should be stored as a relative path.
     */
    relative?: boolean;
    /**
     * Path to the root folder of selectable document locations.
     */
    root?: string;
    /**
     * The root path of the CMS configuration to use for the picker, relative to /hippo:configuration/hippo:frontend/cms.
     * Default value: "cms-pickers/documents".
     */
    pickerConfiguration?: string;
    /**
     * When this picker is used for images, this flag determines if uploads are enabled
     */
    pickerEnableUpload?: boolean;
    /**
     * The initial path to use in the picker if nothing has been selected yet, relative to the pickerRootPath.
     * Default value: "" (empty string).
     */
    pickerInitialPath?: string;
    /**
     * Whether the picker remembers the last visited path. Default: true.
     */
    pickerRemembersLastVisited?: boolean;
    /**
     * The absolute root path to use in the picker, or an empty string if the channel content path is used. If configured
     * it must start with a "/". Default value: "" (empty string).
     */
    pickerRootPath?: string;
    /**
     * Types of nodes to be able to select in the picker, separated by a comma. By default all types are allowed.
     */
    pickerSelectableNodeTypes?: string;
}

interface ContentModel {
    type: string;
}

interface MenuItem$1 {
    /**
     * @return The child items.
     */
    getChildren(): MenuItem$1[];
    /**
     * @return The menu item depth level.
     */
    getDepth(): number;
    /**
     * @return The menu item link.
     */
    getLink(): Link | undefined;
    /**
     * @return The menu item name.
     */
    getName(): string;
    /**
     * @return The menu item parameters.
     */
    getParameters(): Record<string, unknown>;
    /**
     * @return The menu item url.
     */
    getUrl(): string | undefined;
    /**
     * @return Whether the menu item is expanded.
     */
    isExpanded(): boolean;
    /**
     * @return Whether the menu item is repository based.
     */
    isRepositoryBased(): boolean;
    /**
     * @return Whether the menu item is selected.
     */
    isSelected(): boolean;
}

/**
 * A manage menu button.
 */
declare const TYPE_MANAGE_MENU_BUTTON = "EDIT_MENU_LINK";
interface Menu$2 {
    /**
     * @return The menu items.
     */
    getItems(): MenuItem$1[];
    /**
     * @return The menu meta-data collection.
     */
    getMeta(): MetaCollection;
    /**
     * @return The menu name.
     */
    getName(): string;
    /**
     * @deprecated
     * @return The current menu item.
     */
    getSelected(): MenuItem$1 | undefined;
}
/**
 * Checks whether a value is a menu.
 * @param value The value to check.
 */
declare function isMenu(value: unknown): value is Menu$2;

/**
 * Meta-data of a visitor.
 * @see https://documentation.bloomreach.com/library/enterprise/enterprise-features/targeting/visitors-visits-and-cookies.html
 */
interface Visitor {
    /**
     * The visitor identifier.
     */
    id: string;
    /**
     * An HTTP-header using to pass the visitor id to the Page Model API.
     */
    header: string;
    /**
     * New visitor flag.
     */
    new: boolean;
}
/**
 * Meta-data of a current visit.
 * @see https://documentation.bloomreach.com/library/enterprise/enterprise-features/targeting/visitors-visits-and-cookies.html
 */
interface Visit {
    /**
     * The visit identifier.
     */
    id: string;
    /**
     * New visit flag.
     */
    new: boolean;
}

declare type ChannelParameters = Record<string, any>;
declare type PageLinks = 'self' | 'site';
/**
 * Current channel info.
 */
interface ChannelInfoModel {
    props: ChannelParameters;
}
/**
 * Current channel of a page.
 */
interface ChannelModel {
    info: ChannelInfoModel;
}
/**
 * Meta-data of a page root component.
 */
interface PageRootMeta$1 extends ComponentMeta {
    pageTitle?: string;
}
/**
 * Model of a page root component.
 */
interface PageRootModel$1 {
    meta: PageRootMeta$1;
}
/**
 * Meta-data of a page.
 */
interface PageMeta {
    /**
     * The page locale, e.g. en_US, nl_NL, etc
     */
    locale?: string;
    /**
     * The current Page Model version.
     */
    version?: string;
    /**
     * Meta-data about the current visitor. Available when the Relevance Module is enabled.
     * @see https://documentation.bloomreach.com/library/enterprise/enterprise-features/targeting/targeting.html
     */
    visitor?: Visitor;
    /**
     * Meta-data about the current visit. Available when the Relevance Module is enabled.
     * @see https://documentation.bloomreach.com/library/enterprise/enterprise-features/targeting/targeting.html
     */
    visit?: Visit;
    /**
     * Preview mode flag.
     */
    preview?: boolean;
}
/**
 * Model of a page.
 */
interface PageModel$2 {
    channel: ChannelModel;
    document?: Reference;
    links: Record<PageLinks, Link>;
    meta: PageMeta;
    page: Record<string, ((ComponentModel$1 | ContainerItemModel$1 | ContainerModel$1) & PageRootModel$1) | ContentModel>;
    root: Reference;
}
/**
 * The current page to render.
 */
interface Page {
    /**
     * Generates a manage content button.
     * @return The manage content button meta-data.
     */
    getButton(type: typeof TYPE_MANAGE_CONTENT_BUTTON, button: ManageContentButton): MetaCollection;
    /**
     * Generates a manage menu button.
     * @return The menu button meta-data.
     */
    getButton(type: typeof TYPE_MANAGE_MENU_BUTTON, menu: Menu$2): MetaCollection;
    /**
     * Generates a meta-data collection for the Experience Manager buttons.
     * @return The button meta-data.
     */
    getButton(type: string, ...params: any[]): MetaCollection;
    /**
     * Gets current channel parameters.
     * @returns The channel parameters.
     */
    getChannelParameters<T extends ChannelParameters = ChannelParameters>(): T;
    /**
     * Gets a root component in the page.
     * @return The root component.
     */
    getComponent<T extends Component>(): T;
    /**
     * Gets a component in the page (e.g. `getComponent('main', 'right')`).
     * @param componentNames The names of the component and its parents.
     * @return The component, or `undefined` if no such component exists.
     */
    getComponent<T extends Component>(...componentNames: string[]): T | undefined;
    /**
     * Gets a content item used on the page.
     * @param reference The reference to the content. It can be an object containing
     * an [RFC-6901](https://tools.ietf.org/html/rfc6901) JSON Pointer.
     */
    getContent(reference: Reference | string): Content | undefined;
    /**
     * Gets a custom content item used on the page.
     * @param reference The reference to the content. It can be an object containing
     * an [RFC-6901](https://tools.ietf.org/html/rfc6901) JSON Pointer.
     */
    getContent<T>(reference: Reference | string): T | undefined;
    /**
     * Gets the page root document.
     * This option is available only along with the Experience Pages feature.
     */
    getDocument<T>(): T | undefined;
    /**
     * The page locale, defaults to en_US.
     */
    getLocale(): string;
    /**
     * Generates a meta-data collection from the provided meta-data model.
     * @param meta The meta-data collection model as returned by the page-model-api.
     * @deprecated Use `getButton` method to create buttons.
     */
    getMeta(meta: MetaCollectionModel): MetaCollection;
    /**
     * @return The title of the page, or `undefined` if not configured.
     */
    getTitle(): string | undefined;
    /**
     * Generates a URL for a link object.
     * - If the link object type is internal, then it will prepend `spaBaseUrl` or `baseUrl`.
     *   In case when the link starts with the same path as in `cmsBaseUrl`, this part will be removed.
     *   For example, for link `/site/_cmsinternal/spa/about` with configuration options
     *   `cmsBaseUrl = "http://localhost:8080/site/_cmsinternal/spa"` and `spaBaseUrl = "http://example.com"`
     *   it will generate `http://example.com/about`.
     * - If the link object type is unknown, then it will return `undefined`.
     * - If the link parameter is omitted, then the link to the current page will be returned.
     * - In other cases, the link will be returned as-is.
     * @param link The link object to generate URL.
     */
    getUrl(link?: Link): string | undefined;
    /**
     * Generates an SPA URL for the path.
     * - If it is a relative path and `cmsBaseUrl` is present, then it will prepend `spaBaseUrl`.
     * - If it is an absolute path and `cmsBaseUrl` is present,
     *   then the behavior will be similar to internal link generation.
     * - If it is a relative path and `endpoint` is present,
     *   then it will resolve this link relative to the current page URL.
     * - If it is an absolute path and `endpoint` is present,
     *   then it will resolve this link relative to the `baseUrl` option.
     * @param path The path to generate URL.
     */
    getUrl(path: string): string;
    /**
     * @return The Page Model version.
     */
    getVersion(): string | undefined;
    /**
     * @return The current visitor data.
     */
    getVisitor(): Visitor | undefined;
    /**
     * @return The current visit data.
     */
    getVisit(): Visit | undefined;
    /**
     * @returns Whether the page is in the preview mode.
     */
    isPreview(): boolean;
    /**
     * Rewrite links to pages and resources in the HTML content.
     * This method looks up for `a` tags with `data-type` and `href` attributes and `img` tags with `src` attribute.
     * Links will be updated according to the configuration used to initialize the page.
     * @param content The HTML content to rewrite links.
     * @param type The content type.
     */
    rewriteLinks(content: string, type?: string): string;
    /**
     * Synchronizes the CMS integration state.
     */
    sync(): void;
    /**
     * @return A plain JavaScript object of the page model.
     */
    toJSON(): any;
}

/**
 * A container item without mapping.
 */
declare const TYPE_CONTAINER_ITEM_UNDEFINED: symbol;
interface ContainerItemParameters {
    [parameter: string]: string | undefined;
}
/**
 * Meta-data of a container item.
 */
interface ContainerItemMeta extends ComponentMeta {
    hidden?: boolean;
    params?: ContainerItemParameters;
    paramsInfo?: ComponentMeta['params'];
}
/**
 * Model of a container item.
 */
interface ContainerItemModel$1 extends ComponentModel$1 {
    content?: Reference;
    ctype?: string;
    label?: string;
    meta: ContainerItemMeta;
    type: typeof TYPE_COMPONENT_CONTAINER_ITEM$1;
}
/**
 * Container item update event.
 */
interface ContainerItemUpdateEvent {
}
interface ContainerItemEvents {
    update: ContainerItemUpdateEvent;
}
/**
 * A component that can be configured in the UI.
 */
interface ContainerItem extends Component, Emitter<ContainerItemEvents> {
    /**
     * Returns the label of a container item catalogue component.
     *
     * @return The label of a catalogue component (e.g. "News List").
     */
    getLabel(): string | undefined;
    /**
     * Returns the type of a container item. The available types depend on which
     * container items have been configured in the backend.
     *
     * @return The type of a container item (e.g. "Banner").
     */
    getType(): string | undefined;
    /**
     * Returns whether the component should not render anything.
     * Hiding components is only possible with the Relevance feature.
     *
     * @return Whether the component is hidden or not.
     */
    isHidden(): boolean;
    /**
     * Returns the content of this component.
     *
     * @param page The page that contains the content
     */
    getContent<T>(page: Page): T | null;
    /**
     * Returns a [RFC-6901](https://tools.ietf.org/html/rfc6901) JSON Pointer
     * to the content of this container item.
     */
    getContentReference(): Reference | undefined;
}
/**
 * Returns the content of this component.
 *
 * @param component The component that references the content
 * @param page The page that contains the content
 */
declare function getContainerItemContent<T>(component: ContainerItem, page: Page): T | null;

/**
 * A blocked container with blocked items.
 */
declare const TYPE_CONTAINER_BOX = "hst.vbox";
/**
 * An unordered list container.
 */
declare const TYPE_CONTAINER_UNORDERED_LIST = "hst.unorderedlist";
/**
 * An ordered list container.
 */
declare const TYPE_CONTAINER_ORDERED_LIST = "hst.orderedlist";
/**
 * A blocked container with inline items.
 */
declare const TYPE_CONTAINER_INLINE = "hst.span";
/**
 * A container without surrounding markup.
 */
declare const TYPE_CONTAINER_NO_MARKUP = "hst.nomarkup";
/**
 * Container Type.
 * @see https://documentation.bloomreach.com/library/concepts/template-composer/channel-editor-containers.html
 */
declare type ContainerType = typeof TYPE_CONTAINER_BOX | typeof TYPE_CONTAINER_UNORDERED_LIST | typeof TYPE_CONTAINER_ORDERED_LIST | typeof TYPE_CONTAINER_INLINE | typeof TYPE_CONTAINER_NO_MARKUP;
/**
 * Model of a container item.
 */
interface ContainerModel$1 extends ComponentModel$1 {
    type: typeof TYPE_COMPONENT_CONTAINER$1;
    xtype?: ContainerType;
}
/**
 * A component that holds an ordered list of container item components.
 */
interface Container extends Component {
    /**
     * Returns the type of a container.
     *
     * @see https://documentation.bloomreach.com/library/concepts/template-composer/channel-editor-containers.html
     * @return The type of a container (e.g. `TYPE_CONTAINER_BOX`).
     */
    getType(): ContainerType | undefined;
    /**
     * @return The children of a container.
     */
    getChildren(): ContainerItem[];
}

declare type MenuItemLinks = 'site';
/**
 * Essentials component menu item model.
 */
interface MenuItem {
    childMenuItems: MenuItem[];
    depth: number;
    expanded: boolean;
    name: string;
    parameters: Record<string, unknown>;
    repositoryBased: boolean;
    selected: boolean;
    _links: Partial<Record<MenuItemLinks, Link>>;
}
/**
 * Essentials component menu model.
 */
interface Menu$1 {
    _meta?: MetaCollectionModel;
    name: string;
    /**
     * @deprecated The parameter was removed in the Experience Manager 14.2.
     */
    selectSiteMenuItem?: MenuItem | null;
    siteMenuItems: MenuItem[];
}

/**
 * Mapping of the incoming HTTP request path to the URL of the page model API.
 */
interface UrlBuilderOptions$1 {
    /**
     * Base URL to fetch the page model from.
     */
    endpoint?: string;
    /**
     * Base URL of the SPA. Everything after it will be interpreted as a route into the page model.
     * The default base url is an empty string.
     */
    baseUrl?: string;
}

/**
 * Mapping of the incoming HTTP request path to the URL of the page model API.
 */
interface UrlBuilderOptions {
    /**
     * Base URL to fetch the page model from.
     * The default URL is `cmsBaseUrl` + `/resourceapi`.
     */
    apiBaseUrl?: string;
    /**
     * Base URL of the CMS.
     */
    cmsBaseUrl?: string;
    /**
     * Base URL of the SPA. Everything after it will be interpreted as a route into the page model.
     * The default base url is an empty string.
     */
    spaBaseUrl?: string;
}

/**
 * Extracts query parameters from URL and returns URL object that contains URL path and extracted parameters
 *
 * @param url The URL of the page.
 * @param params Parameters to extract.
 */
declare function extractSearchParams(url: string, params: string[]): {
    searchParams: URLSearchParams;
    url: string;
};

/**
 * Generic component type.
 */
declare const TYPE_COMPONENT = "COMPONENT";
/**
 * Container item type.
 */
declare const TYPE_COMPONENT_CONTAINER_ITEM = "CONTAINER_ITEM_COMPONENT";
/**
 * Container type.
 */
declare const TYPE_COMPONENT_CONTAINER = "CONTAINER_COMPONENT";
declare type ComponentType = typeof TYPE_COMPONENT | typeof TYPE_COMPONENT_CONTAINER_ITEM | typeof TYPE_COMPONENT_CONTAINER;
declare type ComponentLinks = 'componentRendering';
declare type ComponentModels = Record<string, any>;
/**
 * Model of a component.
 */
interface ComponentModel {
    _links: Record<ComponentLinks, Link>;
    _meta: ComponentMeta;
    id: string;
    models?: ComponentModels;
    name?: string;
    type: ComponentType;
    components?: ComponentModel[];
}

/**
 * Model of a container item.
 */
interface ContainerItemModel extends ComponentModel {
    _meta: ContainerItemMeta;
    ctype?: string;
    label?: string;
    type: typeof TYPE_COMPONENT_CONTAINER_ITEM;
}

/**
 * Model of a container item.
 */
interface ContainerModel extends ComponentModel {
    type: typeof TYPE_COMPONENT_CONTAINER;
    xtype?: ContainerType;
}

/**
 * Meta-data of a page root component.
 */
interface PageRootMeta extends ComponentMeta {
    pageTitle?: string;
}
/**
 * Model of a page root component.
 */
interface PageRootModel {
    _meta: PageRootMeta;
}
/**
 * Model of a page.
 */
interface PageModel$1 {
    _links: PageModel$2['links'];
    _meta: PageModel$2['meta'];
    channel?: PageModel$2['channel'];
    content?: {
        [reference: string]: ContentModel$1;
    };
    page: (ComponentModel | ContainerItemModel | ContainerModel) & PageRootModel;
}

interface Image {
    /**
     * @return The image display name.
     */
    getDisplayName(): string;
    /**
     * @return The image file name.
     */
    getFileName(): string | undefined;
    /**
     * @return The image height.
     */
    getHeight(): number;
    /**
     * @return The image mime-type.
     */
    getMimeType(): string;
    /**
     * @return The image name.
     */
    getName(): string;
    /**
     * @return The image size.
     */
    getSize(): number;
    /**
     * @return The image link.
     */
    getUrl(): string | undefined;
    /**
     * @return The image width.
     */
    getWidth(): number;
}

interface ImageSet {
    /**
     * @return The image set description.
     */
    getDescription(): string | undefined;
    /**
     * @return The image set display name.
     */
    getDisplayName(): string;
    /**
     * @return The image set file name.
     */
    getFileName(): string;
    /**
     * @return The image set id.
     */
    getId(): string;
    /**
     * @return The image set locale.
     */
    getLocale(): string | undefined;
    /**
     * @return The image name.
     */
    getName(): string;
    /**
     * @return The original image.
     */
    getOriginal(): Image | undefined;
    /**
     * @return The thumbnail.
     */
    getThumbnail(): Image | undefined;
}
/**
 * Checks whether a value is an image set.
 * @param value The value to check.
 */
declare function isImageSet(value: unknown): value is ImageSet;

declare type MetaComment = Meta;
/**
 * Checks whether a value is a meta-data comment.
 * @param value The value to check.
 */
declare function isMetaComment(value: any): value is MetaComment;

interface PaginationItem {
    /**
     * @return The page number.
     */
    getNumber(): number;
    /**
     * @return The page URL.
     */
    getUrl(): string | undefined;
}

interface Pagination {
    /**
     * @return The current page.
     */
    getCurrent(): PaginationItem;
    /**
     * @return The first page.
     */
    getFirst(): PaginationItem;
    /**
     * @return The current page items.
     */
    getItems(): Reference[];
    /**
     * @return The last page.
     */
    getLast(): PaginationItem;
    /**
     * @return The next page.
     */
    getNext(): PaginationItem | undefined;
    /**
     * @return The number of items before the current page.
     */
    getOffset(): number;
    /**
     * @return Currently listed pages.
     */
    getPages(): PaginationItem[];
    /**
     * @return The previous page.
     */
    getPrevious(): PaginationItem | undefined;
    /**
     * @return The number of items listed on the current page.
     */
    getSize(): number;
    /**
     * @return The total number of items.
     */
    getTotal(): number;
    /**
     * @return Whether the pagination is enabled.
     */
    isEnabled(): boolean;
}
/**
 * Checks whether a value is a pagination.
 * @param value The value to check.
 */
declare function isPagination(value: unknown): value is Pagination;

/**
 * Checks whether a value is a page component.
 * @param value The value to check.
 */
declare function isComponent(value: any): value is Component;
/**
 * Checks whether a value is a page container.
 * @param value The value to check.
 */
declare function isContainer(value: any): value is Container;
/**
 * Checks whether a value is a page container item.
 * @param value The value to check.
 */
declare function isContainerItem(value: any): value is ContainerItem;
/**
 * Checks whether a value is a page.
 * @param value The value to check.
 */
declare function isPage(value: any): value is Page;
/**
 * Model of a page.
 */
declare type PageModel = PageModel$2 | PageModel$1;
/**
 * Menu content model.
 */
declare type Menu = Menu$1 | (Menu$1 & Menu$2);

/**
 * Map of HTTP headers.
 */
declare type HttpHeaders = Record<string, string | number | boolean>;
/**
 * Configuration of an HTTP client call.
 */
declare type HttpClientConfig = {
    /**
     * HTTP request method.
     */
    method: 'GET' | 'POST';
    /**
     * The URL to send the HTTP request to.
     */
    url: string;
    /**
     * Optional: the headers to send with the HTTP request.
     */
    headers?: HttpHeaders;
    /**
     * Optional: the data to send with the HTTP request.
     * Will only be provided when the 'method' is 'post'.
     */
    data?: any;
};
/**
 * An HTTP response.
 */
interface HttpResponse<T> {
    /**
     * The data returned in the response.
     */
    data: T;
}
/**
 * Fetches the page model data.
 */
declare type HttpClient<T> = (config: HttpClientConfig) => Promise<HttpResponse<T>>;
/**
 * An HTTP connection.
 */
interface HttpConnection {
    /**
     * Client's remote IP address.
     */
    remoteAddress?: string;
}
/**
 * An HTTP request
 */
interface HttpRequest {
    /**
     * HTTP connection data.
     */
    connection?: HttpConnection;
    /**
     * Emits an event in the request scope.
     * @see https://nodejs.org/api/stream.html#stream_readable_streams
     */
    emit?(event: string | symbol, ...args: any[]): boolean;
    /**
     * All request headers (including cookies).
     */
    headers?: Partial<Record<string, string | string[]>>;
    /**
     * The path part of the URL, including a query string if present.
     * For example: '/path/to/page?foo=1'. The path always starts with '/'.
     * @deprecated The parameter is deprecated in favor of `path` in the configuration object.
     */
    path?: string;
    /**
     * Current request visitor.
     */
    visitor?: Omit<Visitor, 'new'>;
}

interface ApiOptions {
    /**
     * API version header.
     * By default, `Accept-Version` will be used.
     */
    apiVersionHeader?: string;
    /**
     * Current API version.
     * By default, the compatible with the current setup version will be chosen.
     */
    apiVersion?: string;
    /**
     * Authorization header.
     * By default, `Authorization` will be used.
     */
    authorizationHeader?: string;
    /**
     * Authorization token.
     * By default, the SDK will try to extract the token from the request query string
     * using `authorizationQueryParameter` option.
     */
    authorizationToken?: string;
    /**
     * HTTP client that will be used to fetch the page model.
     */
    httpClient: HttpClient<PageModel>;
    /**
     * Current user's request.
     */
    request?: HttpRequest;
    /**
     * Header identifying the current cluster node.
     * By default, `Server-Id` will be used.
     */
    serverIdHeader?: string;
    /**
     * Cluster node identifier.
     * By default, the SDK will try to extract the value from the request query string
     * using `serverIdQueryParameter` option.
     */
    serverId?: string;
    /**
     * Current visitor.
     * This parameter takes precedence over `request.visitor`.
     */
    visitor?: HttpRequest['visitor'];
}

/**
 * Configuration options for configuring behavior of the SDK.
 */
interface SDKOptions {
    /**
     * The NBRMode parameter used to indicate whether the children of the BrPage component should be rendered
     * immediatly or wait with rendering until the Page model has been retrieved and parsed.
     * By default, the option is `false`.
     */
    NBRMode?: boolean;
}
/**
 * Configuration options for generating the page model URL.
 */
interface UrlOptions {
    /**
     * URL mapping for the live page model.
     */
    live: UrlBuilderOptions;
    /**
     * URL mapping for the preview page model.
     */
    preview: UrlBuilderOptions;
}
/**
 * Configuration of the SPA SDK using reverse proxy-based setup.
 */
interface ConfigurationWithProxy extends ApiOptions, CmsOptions, SDKOptions {
    /**
     * Options for generating the page model API URL.
     */
    options: UrlOptions;
    /**
     * The path part of the URL, including a query string if present.
     * For example: '/path/to/page?foo=1'. The path always starts with '/'.
     */
    path?: string;
    /**
     * The option enabling debug mode.
     */
    debug?: boolean;
}
/**
 * Configuration of the SPA SDK using the JWT token-based setup.
 */
interface ConfigurationWithJwt extends ApiOptions, CmsOptions, PostMessageOptions, SDKOptions {
    /**
     * The query string parameter used to pass authorization header value.
     * By default, `token` parameter is used.
     */
    authorizationQueryParameter?: string;
    /**
     * The query string parameter used to pass a cluster node identifier.
     * By default, `server-id` parameter is used.
     */
    serverIdQueryParameter?: string;
    /**
     * The path part of the URL, including a query string if present.
     * For example: '/path/to/page?foo=1'. The path always starts with '/'.
     */
    path?: string;
    /**
     * The option enabling debug mode.
     */
    debug?: boolean;
}
/**
 * Configuration of the SPA SDK using the JWT token-based setup and the Page Model API v0.9.
 */
interface ConfigurationWithJwt09 extends ConfigurationWithJwt, UrlBuilderOptions {
}
/**
 * Configuration of the SPA SDK using the JWT token-based setup and the Page Model API v1.0.
 */
interface ConfigurationWithJwt10 extends ConfigurationWithJwt, UrlBuilderOptions$1 {
}
/**
 * Configuration of the SPA SDK.
 */
declare type Configuration = ConfigurationWithProxy | ConfigurationWithJwt09 | ConfigurationWithJwt10;

/**
 * Initializes the page model.
 *
 * @param configuration Configuration of the SPA integration with brXM.
 * @param model Preloaded page model.
 */
declare function initialize(configuration: Configuration, model: Page | PageModel): Page;
/**
 * Initializes the page model.
 *
 * @param configuration Configuration of the SPA integration with brXM.
 * @param [model] Preloaded page model.
 */
declare function initialize(configuration: Configuration): Promise<Page>;
/**
 * Destroys the integration with the SPA page.
 * @param page Page instance to destroy.
 */
declare function destroy(page: Page): void;

export { Component, Configuration, Container, ContainerItem, Content, Document, Image, ImageSet, Link, META_POSITION_BEGIN, META_POSITION_END, ManageContentButton, Menu, MenuItem$1 as MenuItem, Meta, MetaCollection, MetaComment, Page, PageModel, Pagination, PaginationItem, Reference, TYPE_CONTAINER_BOX, TYPE_CONTAINER_INLINE, TYPE_CONTAINER_ITEM_UNDEFINED, TYPE_CONTAINER_NO_MARKUP, TYPE_CONTAINER_ORDERED_LIST, TYPE_CONTAINER_UNORDERED_LIST, TYPE_LINK_EXTERNAL, TYPE_LINK_INTERNAL, TYPE_LINK_RESOURCE, TYPE_MANAGE_CONTENT_BUTTON, TYPE_MANAGE_MENU_BUTTON, destroy, extractSearchParams, getContainerItemContent, initialize, isComponent, isContainer, isContainerItem, isContent, isDocument, isImageSet, isLink, isMenu, isMeta, isMetaComment, isPage, isPagination, isReference };
