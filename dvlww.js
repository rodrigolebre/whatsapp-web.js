/**
 * dvlww.js
 *
 * Script único e independente para abrir o WhatsApp Web via Puppeteer,
 * injetar os wrappers internos e expor todas as funções em `window.dvlww`
 * (sem depender do objeto `window.DVLww` ou das classes do pacote).
 *
 * Fluxo em alto nível:
 *  - abre o WhatsApp Web usando um perfil dedicado (`./dvlww-session`);
 *  - aguarda o carregamento do WhatsApp (você deve escanear o QR no navegador
 *    na primeira execução);
 *  - injeta `ExposeStore` e `LoadUtils` diretamente nos scripts da página;
 *  - copia todos os wrappers gerados para `window.dvlww` para uso direto;
 *  - gera um relatório de cobertura de wrappers e demonstra chamadas práticas
 *    (listar chats, buscar mensagens e, opcionalmente, enviar "visto").
 *
 * Execução:
 *    node dvlww.js
 *
 * Para enviar o "visto" no primeiro chat encontrado, defina DVLWW_SEND_SEEN=1
 * antes de rodar. O navegador é aberto em modo não-headless para permitir que
 * você escaneie o QR code na primeira execução. As sessões são persistidas em
 * ./dvlww-session.
 */

const path = require('path');
const puppeteer = require('puppeteer');

// Implementação inline do moduleRaid (v5) para evitar qualquer dependência de require.
// O código é copiado do pacote @pedroslopez/moduleraid/moduleraid e mantém o mesmo comportamento.
const moduleRaid = function () {
    moduleRaid.mID = Math.random().toString(36).substring(7);
    moduleRaid.mObj = {};

    fillModuleArray = function () {
        (window.webpackChunkbuild || window.webpackChunkwhatsapp_web_client).push([
            [moduleRaid.mID], {}, function (e) {
                Object.keys(e.m).forEach(function (mod) {
                    moduleRaid.mObj[mod] = e(mod);
                });
            }
        ]);
    };

    fillModuleArray();

    get = function get(id) {
        return moduleRaid.mObj[id];
    };

    findModule = function findModule(query) {
        results = [];
        modules = Object.keys(moduleRaid.mObj);

        modules.forEach(function (mKey) {
            mod = moduleRaid.mObj[mKey];

            if (typeof mod !== 'undefined') {
                if (typeof query === 'string') {
                    if (typeof mod.default === 'object') {
                        for (key in mod.default) {
                            if (key == query) results.push(mod);
                        }
                    }

                    for (key in mod) {
                        if (key == query) results.push(mod);
                    }
                } else if (typeof query === 'function') {
                    if (query(mod)) {
                        results.push(mod);
                    }
                } else {
                    throw new TypeError('findModule can only find via string and function, ' + (typeof query) + ' was passed');
                }

            }
        });

        return results;
    };

    return {
        modules: moduleRaid.mObj,
        constructors: moduleRaid.cArr,
        findModule: findModule,
        get: get
    };
};



// --- Injetores embutidos (sem require) -----------------------------
const ExposeStore = () => {
    /**
     * Helper function that compares between two WWeb versions. Its purpose is to help the developer to choose the correct code implementation depending on the comparison value and the WWeb version.
     * @param {string} lOperand The left operand for the WWeb version string to compare with
     * @param {string} operator The comparison operator
     * @param {string} rOperand The right operand for the WWeb version string to compare with
     * @returns {boolean} Boolean value that indicates the result of the comparison
     */
    window.compareWwebVersions = (lOperand, operator, rOperand) => {
        if (!['>', '>=', '<', '<=', '='].includes(operator)) {
            throw new class _ extends Error {
                constructor(m) { super(m); this.name = 'CompareWwebVersionsError'; }
            }('Invalid comparison operator is provided');

        }
        if (typeof lOperand !== 'string' || typeof rOperand !== 'string') {
            throw new class _ extends Error {
                constructor(m) { super(m); this.name = 'CompareWwebVersionsError'; }
            }('A non-string WWeb version type is provided');
        }

        lOperand = lOperand.replace(/-beta$/, '');
        rOperand = rOperand.replace(/-beta$/, '');

        while (lOperand.length !== rOperand.length) {
            lOperand.length > rOperand.length
                ? rOperand = rOperand.concat('0')
                : lOperand = lOperand.concat('0');
        }

        lOperand = Number(lOperand.replace(/\./g, ''));
        rOperand = Number(rOperand.replace(/\./g, ''));

        return (
            operator === '>' ? lOperand > rOperand :
                operator === '>=' ? lOperand >= rOperand :
                    operator === '<' ? lOperand < rOperand :
                        operator === '<=' ? lOperand <= rOperand :
                            operator === '=' ? lOperand === rOperand :
                                false
        );
    };

    window.Store = Object.assign({}, window.require('WAWebCollections'));
    window.Store.AppState = window.require('WAWebSocketModel').Socket;
    window.Store.BlockContact = window.require('WAWebBlockContactAction');
    window.Store.Conn = window.require('WAWebConnModel').Conn;
    window.Store.Cmd = window.require('WAWebCmd').Cmd;
    window.Store.DownloadManager = window.require('WAWebDownloadManager').downloadManager;
    window.Store.GroupQueryAndUpdate = window.require('WAWebGroupQueryJob').queryAndUpdateGroupMetadataById;
    window.Store.MediaPrep = window.require('WAWebPrepRawMedia');
    window.Store.MediaObject = window.require('WAWebMediaStorage');
    window.Store.MediaTypes = window.require('WAWebMmsMediaTypes');
    window.Store.MediaUpload = window.require('WAWebMediaMmsV4Upload');
    window.Store.MsgKey = window.require('WAWebMsgKey');
    window.Store.OpaqueData = window.require('WAWebMediaOpaqueData');
    window.Store.QueryProduct = window.require('WAWebBizProductCatalogBridge');
    window.Store.QueryOrder = window.require('WAWebBizOrderBridge');
    window.Store.SendClear = window.require('WAWebChatClearBridge');
    window.Store.SendDelete = window.require('WAWebDeleteChatAction');
    window.Store.SendMessage = window.require('WAWebSendMsgChatAction');
    window.Store.EditMessage = window.require('WAWebSendMessageEditAction');
    window.Store.MediaDataUtils = window.require('WAWebMediaDataUtils');
    window.Store.BlobCache = window.require('WAWebMediaInMemoryBlobCache');
    window.Store.SendSeen = window.require('WAWebUpdateUnreadChatAction');
    window.Store.User = window.require('WAWebUserPrefsMeUser');
    window.Store.ContactMethods = {
        ...window.require('WAWebContactGetters'),
        ...window.require('WAWebFrontendContactGetters')
    };
    window.Store.UserConstructor = window.require('WAWebWid');
    window.Store.Validators = window.require('WALinkify');
    window.Store.WidFactory = window.require('WAWebWidFactory');
    window.Store.ProfilePic = window.require('WAWebContactProfilePicThumbBridge');
    window.Store.PresenceUtils = window.require('WAWebPresenceChatAction');
    window.Store.ChatState = window.require('WAWebChatStateBridge');
    window.Store.findCommonGroups = window.require('WAWebFindCommonGroupsContactAction').findCommonGroups;
    window.Store.StatusUtils = window.require('WAWebContactStatusBridge');
    window.Store.ConversationMsgs = window.require('WAWebChatLoadMessages');
    window.Store.sendReactionToMsg = window.require('WAWebSendReactionMsgAction').sendReactionToMsg;
    window.Store.createOrUpdateReactionsModule = window.require('WAWebDBCreateOrUpdateReactions');
    window.Store.EphemeralFields = window.require('WAWebGetEphemeralFieldsMsgActionsUtils');
    window.Store.MsgActionChecks = window.require('WAWebMsgActionCapability');
    window.Store.QuotedMsg = window.require('WAWebQuotedMsgModelUtils');
    window.Store.LinkPreview = window.require('WAWebLinkPreviewChatAction');
    window.Store.Socket = window.require('WADeprecatedSendIq');
    window.Store.SocketWap = window.require('WAWap');
    window.Store.SearchContext = window.require('WAWebChatMessageSearch');
    window.Store.DrawerManager = window.require('WAWebDrawerManager').DrawerManager;
    window.Store.LidUtils = window.require('WAWebApiContact');
    window.Store.WidToJid = window.require('WAWebWidToJid');
    window.Store.JidToWid = window.require('WAWebJidToWid');
    window.Store.getMsgInfo = window.require('WAWebApiMessageInfoStore').queryMsgInfo;
    window.Store.QueryExist = window.require('WAWebQueryExistsJob').queryWidExists;
    window.Store.ReplyUtils = window.require('WAWebMsgReply');
    window.Store.BotSecret = window.require('WAWebBotMessageSecret');
    window.Store.BotProfiles = window.require('WAWebBotProfileCollection');
    window.Store.ContactCollection = window.require('WAWebContactCollection').ContactCollection;
    window.Store.DeviceList = window.require('WAWebApiDeviceList');
    window.Store.HistorySync = window.require('WAWebSendNonMessageDataRequest');
    window.Store.AddonReactionTable = window.require('WAWebAddonReactionTableMode').reactionTableMode;
    window.Store.AddonPollVoteTable = window.require('WAWebAddonPollVoteTableMode').pollVoteTableMode;
    window.Store.ChatGetters = window.require('WAWebChatGetters');
    window.Store.UploadUtils = window.require('WAWebUploadManager');
    window.Store.WAWebStreamModel = window.require('WAWebStreamModel');
    window.Store.FindOrCreateChat = window.require('WAWebFindChatAction');
    window.Store.CustomerNoteUtils = window.require('WAWebNoteAction');
    window.Store.BusinessGatingUtils = window.require('WAWebBizGatingUtils');
    window.Store.PollsVotesSchema = window.require('WAWebPollsVotesSchema');
    window.Store.PollsSendVote = window.require('WAWebPollsSendVoteMsgAction');
    
    window.Store.Settings = {
        ...window.require('WAWebUserPrefsGeneral'),
        ...window.require('WAWebUserPrefsNotifications'),
        setPushname: window.require('WAWebSetPushnameConnAction').setPushname
    };
    window.Store.NumberInfo = {
        ...window.require('WAPhoneUtils'),
        ...window.require('WAPhoneFindCC')
    };
    window.Store.ForwardUtils = {
        ...window.require('WAWebChatForwardMessage')
    };
    window.Store.PinnedMsgUtils = {
        ...window.require('WAWebPinInChatSchema'),
        ...window.require('WAWebSendPinMessageAction')
    };
    window.Store.ScheduledEventMsgUtils = {
        ...window.require('WAWebGenerateEventCallLink'),
        ...window.require('WAWebSendEventEditMsgAction'),
        ...window.require('WAWebSendEventResponseMsgAction')
    };
    window.Store.VCard = {
        ...window.require('WAWebFrontendVcardUtils'),
        ...window.require('WAWebVcardParsingUtils'),
        ...window.require('WAWebVcardGetNameFromParsed')
    };
    window.Store.StickerTools = {
        ...window.require('WAWebImageUtils'),
        ...window.require('WAWebAddWebpMetadata')
    };
    window.Store.GroupUtils = {
        ...window.require('WAWebGroupCreateJob'),
        ...window.require('WAWebGroupModifyInfoJob'),
        ...window.require('WAWebExitGroupAction'),
        ...window.require('WAWebContactProfilePicThumbBridge'),
        ...window.require('WAWebSetPropertyGroupAction')
    };
    window.Store.GroupParticipants = {
        ...window.require('WAWebModifyParticipantsGroupAction'),
        ...window.require('WASmaxGroupsAddParticipantsRPC')
    };
    window.Store.GroupInvite = {
        ...window.require('WAWebGroupInviteJob'),
        ...window.require('WAWebGroupQueryJob'),
        ...window.require('WAWebMexFetchGroupInviteCodeJob')
    };
    window.Store.GroupInviteV4 = {
        ...window.require('WAWebGroupInviteV4Job'),
        ...window.require('WAWebChatSendMessages')
    };
    window.Store.MembershipRequestUtils = {
        ...window.require('WAWebApiMembershipApprovalRequestStore'),
        ...window.require('WASmaxGroupsMembershipRequestsActionRPC')
    };
    window.Store.ChannelUtils = {
        ...window.require('WAWebLoadNewsletterPreviewChatAction'),
        ...window.require('WAWebNewsletterMetadataQueryJob'),
        ...window.require('WAWebNewsletterCreateQueryJob'),
        ...window.require('WAWebEditNewsletterMetadataAction'),
        ...window.require('WAWebNewsletterDeleteAction'),
        ...window.require('WAWebNewsletterSubscribeAction'),
        ...window.require('WAWebNewsletterUnsubscribeAction'),
        ...window.require('WAWebNewsletterDirectorySearchAction'),
        ...window.require('WAWebNewsletterToggleMuteStateJob'),
        ...window.require('WAWebNewsletterGatingUtils'),
        ...window.require('WAWebNewsletterModelUtils'),
        ...window.require('WAWebMexAcceptNewsletterAdminInviteJob'),
        ...window.require('WAWebMexRevokeNewsletterAdminInviteJob'),
        ...window.require('WAWebChangeNewsletterOwnerAction'),
        ...window.require('WAWebDemoteNewsletterAdminAction'),
        ...window.require('WAWebNewsletterDemoteAdminJob'),
        countryCodesIso: window.require('WAWebCountriesNativeCountryNames'),
        currentRegion: window.require('WAWebL10N').getRegion(),
    };
    window.Store.SendChannelMessage = {
        ...window.require('WAWebNewsletterUpdateMsgsRecordsJob'),
        ...window.require('WAWebMsgDataFromModel'),
        ...window.require('WAWebNewsletterSendMessageJob'),
        ...window.require('WAWebNewsletterSendMsgAction'),
        ...window.require('WAMediaCalculateFilehash')
    };
    window.Store.ChannelSubscribers = {
        ...window.require('WAWebMexFetchNewsletterSubscribersJob'),
        ...window.require('WAWebNewsletterSubscriberListAction')
    };
    window.Store.AddressbookContactUtils = {
        ...window.require('WAWebSaveContactAction'),
        ...window.require('WAWebDeleteContactAction')
    };

    if (!window.Store.Chat._find || !window.Store.Chat.findImpl) {
        window.Store.Chat._find = e => {
            const target = window.Store.Chat.get(e);
            return target ? Promise.resolve(target) : Promise.resolve({
                id: e
            });
        };
        window.Store.Chat.findImpl = window.Store.Chat._find;
    }

    /**
     * Target options object description
     * @typedef {Object} TargetOptions
     * @property {string|number} module The target module
     * @property {string} function The function name to get from a module
     */
    /**
     * Function to modify functions
     * @param {TargetOptions} target Options specifying the target function to search for modifying
     * @param {Function} callback Modified function
     */
    window.injectToFunction = (target, callback) => {
        try {
            let module = window.require(target.module);
            if (!module) return; 

            const path = target.function.split('.');
            const funcName = path.pop();

            for (const key of path) {
                if (!module[key]) return;
                module = module[key];
            }

            const originalFunction = module[funcName];
            if (typeof originalFunction !== 'function') return;

            module[funcName] = (...args) => {
                try {
                    return callback(originalFunction, ...args);
                } catch {
                    return originalFunction(...args);
                }
            };

        } catch {
            return;
        }
    };

    window.injectToFunction({ module: 'WAWebBackendJobsCommon', function: 'mediaTypeFromProtobuf' }, (func, ...args) => { const [proto] = args; return proto.locationMessage ? null : func(...args); });

    window.injectToFunction({ module: 'WAWebE2EProtoUtils', function: 'typeAttributeFromProtobuf' }, (func, ...args) => { const [proto] = args; return proto.locationMessage || proto.groupInviteMessage ? 'text' : func(...args); });
};

const ExposeAuthStore = () => {
    window.AuthStore = {};
    window.AuthStore.AppState = window.require('WAWebSocketModel').Socket;
    window.AuthStore.Cmd = window.require('WAWebCmd').Cmd;
    window.AuthStore.Conn = window.require('WAWebConnModel').Conn;
    window.AuthStore.OfflineMessageHandler = window.require('WAWebOfflineHandler').OfflineMessageHandler;
    window.AuthStore.PairingCodeLinkUtils = window.require('WAWebAltDeviceLinkingApi');
    window.AuthStore.Base64Tools = window.require('WABase64');
    window.AuthStore.RegistrationUtils = {
        ...window.require('WAWebCompanionRegClientUtils'),
        ...window.require('WAWebAdvSignatureApi'),
        ...window.require('WAWebUserPrefsInfoStore'),
        ...window.require('WAWebSignalStoreApi'),
    };
};

const ExposeLegacyAuthStore = (moduleRaidStr) => {
    eval('var moduleRaid = ' + moduleRaidStr);
    // eslint-disable-next-line no-undef
    window.mR = moduleRaid();
    window.AuthStore = {};
    window.AuthStore.AppState = window.mR.findModule('Socket')[0].Socket;
    window.AuthStore.Cmd = window.mR.findModule('Cmd')[0].Cmd;
    window.AuthStore.Conn = window.mR.findModule('Conn')[0].Conn;
    window.AuthStore.OfflineMessageHandler = window.mR.findModule('OfflineMessageHandler')[0].OfflineMessageHandler;
    window.AuthStore.PairingCodeLinkUtils = window.mR.findModule('initializeAltDeviceLinking')[0];
    window.AuthStore.Base64Tools = window.mR.findModule('encodeB64')[0];
    window.AuthStore.RegistrationUtils = {
        ...window.mR.findModule('getCompanionWebClientFromBrowser')[0],
        ...window.mR.findModule('verifyKeyIndexListAccountSignature')[0],
        ...window.mR.findModule('waNoiseInfo')[0],
        ...window.mR.findModule('waSignalStore')[0],
    };
};

const LoadUtils = () => {
    window.DVLww = {};

    window.DVLww.forwardMessage = async (chatId, msgId) => {
        const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
        const chat = await window.DVLww.getChat(chatId, { getAsModel: false });
        return await window.Store.ForwardUtils.forwardMessages({'chat': chat, 'msgs' : [msg], 'multicast': true, 'includeCaption': true, 'appendedText' : undefined});
    };

    window.DVLww.sendSeen = async (chatId) => {
        const chat = await window.DVLww.getChat(chatId, { getAsModel: false });
        if (chat) {
            window.Store.WAWebStreamModel.Stream.markAvailable();
            await window.Store.SendSeen.sendSeen(chat);
            window.Store.WAWebStreamModel.Stream.markUnavailable();
            return true;
        }
        return false;
    };

    window.DVLww.sendMessage = async (chat, content, options = {}) => {
        const isChannel = window.Store.ChatGetters.getIsNewsletter(chat);

        let mediaOptions = {};
        if (options.media) {
            mediaOptions =  options.sendMediaAsSticker && !isChannel
                ? await window.DVLww.processStickerData(options.media)
                : await window.DVLww.processMediaData(options.media, {
                    forceSticker: options.sendMediaAsSticker,
                    forceGif: options.sendVideoAsGif,
                    forceVoice: options.sendAudioAsVoice,
                    forceDocument: options.sendMediaAsDocument,
                    forceMediaHd: options.sendMediaAsHd,
                    sendToChannel: isChannel
                });
            mediaOptions.caption = options.caption;
            content = options.sendMediaAsSticker ? undefined : mediaOptions.preview;
            mediaOptions.isViewOnce = options.isViewOnce;
            delete options.media;
            delete options.sendMediaAsSticker;
        }

        let quotedMsgOptions = {};
        if (options.quotedMessageId) {
            let quotedMessage = window.Store.Msg.get(options.quotedMessageId);
            !quotedMessage && (quotedMessage = (await window.Store.Msg.getMessagesById([options.quotedMessageId]))?.messages?.[0]);
            if (quotedMessage) {

                const canReply = window.Store.ReplyUtils
                    ? window.Store.ReplyUtils.canReplyMsg(quotedMessage.unsafe())
                    : quotedMessage.canReply();

                if (canReply) {
                    quotedMsgOptions = quotedMessage.msgContextInfo(chat);
                }
            } else {
                if (!options.ignoreQuoteErrors) {
                    throw new Error('Could not get the quoted message.');
                }
            }
            
            delete options.ignoreQuoteErrors;
            delete options.quotedMessageId;
        }

        if (options.mentionedJidList) {
            options.mentionedJidList = options.mentionedJidList.map((id) => window.Store.WidFactory.createWid(id));
            options.mentionedJidList = options.mentionedJidList.filter(Boolean);
        }

        if (options.groupMentions) {
            options.groupMentions = options.groupMentions.map((e) => ({
                groupSubject: e.subject,
                groupJid: window.Store.WidFactory.createWid(e.id)
            }));
        }

        let locationOptions = {};
        if (options.location) {
            let { latitude, longitude, description, url } = options.location;
            url = window.Store.Validators.findLink(url)?.href;
            url && !description && (description = url);
            locationOptions = {
                type: 'location',
                loc: description,
                lat: latitude,
                lng: longitude,
                clientUrl: url
            };
            delete options.location;
        }

        let pollOptions = {};
        if (options.poll) {
            const { pollName, pollOptions: _pollOptions } = options.poll;
            const { allowMultipleAnswers, messageSecret } = options.poll.options;
            pollOptions = {
                kind: 'pollCreation',
                type: 'poll_creation',
                pollName: pollName,
                pollOptions: _pollOptions,
                pollSelectableOptionsCount: allowMultipleAnswers ? 0 : 1,
                messageSecret:
                    Array.isArray(messageSecret) && messageSecret.length === 32
                        ? new Uint8Array(messageSecret)
                        : window.crypto.getRandomValues(new Uint8Array(32))
            };
            delete options.poll;
        }

        let eventOptions = {};
        if (options.event) {
            const { name, startTimeTs, eventSendOptions } = options.event;
            const { messageSecret } = eventSendOptions;
            eventOptions = {
                type: 'event_creation',
                eventName: name,
                eventDescription: eventSendOptions.description,
                eventStartTime: startTimeTs,
                eventEndTime: eventSendOptions.endTimeTs,
                eventLocation: eventSendOptions.location && {
                    degreesLatitude: 0,
                    degreesLongitude: 0,
                    name: eventSendOptions.location
                },
                eventJoinLink: eventSendOptions.callType === 'none' ? null : await window.Store.ScheduledEventMsgUtils.createEventCallLink(
                    startTimeTs,
                    eventSendOptions.callType
                ),
                isEventCanceled: eventSendOptions.isEventCanceled,
                messageSecret:
                    Array.isArray(messageSecret) && messageSecret.length === 32
                        ? new Uint8Array(messageSecret)
                        : window.crypto.getRandomValues(new Uint8Array(32)),
            };
            delete options.event;
        }

        let vcardOptions = {};
        if (options.contactCard) {
            let contact = window.Store.Contact.get(options.contactCard);
            vcardOptions = {
                body: window.Store.VCard.vcardFromContactModel(contact).vcard,
                type: 'vcard',
                vcardFormattedName: contact.formattedName
            };
            delete options.contactCard;
        } else if (options.contactCardList) {
            let contacts = options.contactCardList.map(c => window.Store.Contact.get(c));
            let vcards = contacts.map(c => window.Store.VCard.vcardFromContactModel(c));
            vcardOptions = {
                type: 'multi_vcard',
                vcardList: vcards,
                body: null
            };
            delete options.contactCardList;
        } else if (options.parseVCards && typeof (content) === 'string' && content.startsWith('BEGIN:VCARD')) {
            delete options.parseVCards;
            delete options.linkPreview;
            try {
                const parsed = window.Store.VCard.parseVcard(content);
                if (parsed) {
                    vcardOptions = {
                        type: 'vcard',
                        vcardFormattedName: window.Store.VCard.vcardGetNameFromParsed(parsed)
                    };
                }
            } catch (_) {
                // not a vcard
            }
        }

        if (options.linkPreview) {
            delete options.linkPreview;
            const link = window.Store.Validators.findLink(content);
            if (link) {
                let preview = await window.Store.LinkPreview.getLinkPreview(link);
                if (preview && preview.data) {
                    preview = preview.data;
                    preview.preview = true;
                    preview.subtype = 'url';
                    options = {...options, ...preview};
                }
            }
        }

        let buttonOptions = {};
        if (options.buttons) {
            let caption;
            if (options.buttons.type === 'chat') {
                content = options.buttons.body;
                caption = content;
            } else {
                caption = options.caption ? options.caption : ' '; //Caption can't be empty
            }
            buttonOptions = {
                productHeaderImageRejected: false,
                isFromTemplate: false,
                isDynamicReplyButtonsMsg: true,
                title: options.buttons.title ? options.buttons.title : undefined,
                footer: options.buttons.footer ? options.buttons.footer : undefined,
                dynamicReplyButtons: options.buttons.buttons,
                replyButtons: options.buttons.buttons,
                caption: caption
            };
            delete options.buttons;
        }

        let listOptions = {};
        if (options.list) {
            if (window.Store.Conn.platform === 'smba' || window.Store.Conn.platform === 'smbi') {
                throw '[LT01] Whatsapp business can\'t send this yet';
            }
            listOptions = {
                type: 'list',
                footer: options.list.footer,
                list: {
                    ...options.list,
                    listType: 1
                },
                body: options.list.description
            };
            delete options.list;
            delete listOptions.list.footer;
        }

        const botOptions = {};
        if (options.invokedBotWid) {
            botOptions.messageSecret = window.crypto.getRandomValues(new Uint8Array(32));
            botOptions.botMessageSecret = await window.Store.BotSecret.genBotMsgSecretFromMsgSecret(botOptions.messageSecret);
            botOptions.invokedBotWid = window.Store.WidFactory.createWid(options.invokedBotWid);
            botOptions.botPersonaId = window.Store.BotProfiles.BotProfileCollection.get(options.invokedBotWid).personaId;
            delete options.invokedBotWid;
        }

        const lidUser = window.Store.User.getMaybeMeLidUser();
        const meUser = window.Store.User.getMaybeMePnUser();
        const newId = await window.Store.MsgKey.newId();
        let from = chat.id.isLid() ? lidUser : meUser;
        let participant;

        if (typeof chat.id?.isGroup === 'function' && chat.id.isGroup()) {
            from = chat.groupMetadata && chat.groupMetadata.isLidAddressingMode ? lidUser : meUser;
            participant = window.Store.WidFactory.asUserWidOrThrow(from);
        }

        const newMsgKey = new window.Store.MsgKey({
            from: from,
            to: chat.id,
            id: newId,
            participant: participant,
            selfDir: 'out',
        });

        const extraOptions = options.extraOptions || {};
        delete options.extraOptions;

        const ephemeralFields = window.Store.EphemeralFields.getEphemeralFields(chat);

        const message = {
            ...options,
            id: newMsgKey,
            ack: 0,
            body: content,
            from: from,
            to: chat.id,
            local: true,
            self: 'out',
            t: parseInt(new Date().getTime() / 1000),
            isNewMsg: true,
            type: 'chat',
            ...ephemeralFields,
            ...mediaOptions,
            ...(mediaOptions.toJSON ? mediaOptions.toJSON() : {}),
            ...quotedMsgOptions,
            ...locationOptions,
            ...pollOptions,
            ...eventOptions,
            ...vcardOptions,
            ...buttonOptions,
            ...listOptions,
            ...botOptions,
            ...extraOptions
        };
        
        // Bot's won't reply if canonicalUrl is set (linking)
        if (botOptions) {
            delete message.canonicalUrl;
        }

        if (isChannel) {
            const msg = new window.Store.Msg.modelClass(message);
            const msgDataFromMsgModel = window.Store.SendChannelMessage.msgDataFromMsgModel(msg);
            const isMedia = Object.keys(mediaOptions).length > 0;
            await window.Store.SendChannelMessage.addNewsletterMsgsRecords([msgDataFromMsgModel]);
            chat.msgs.add(msg);
            chat.t = msg.t;

            const sendChannelMsgResponse = await window.Store.SendChannelMessage.sendNewsletterMessageJob({
                msg: msg,
                type: message.type === 'chat' ? 'text' : isMedia ? 'media' : 'pollCreation',
                newsletterJid: chat.id.toJid(),
                ...(isMedia
                    ? {
                        mediaMetadata: msg.avParams(),
                        mediaHandle: isMedia ? mediaOptions.mediaHandle : null,
                    }
                    : {}
                )
            });

            if (sendChannelMsgResponse.success) {
                msg.t = sendChannelMsgResponse.ack.t;
                msg.serverId = sendChannelMsgResponse.serverId;
            }
            msg.updateAck(1, true);
            await window.Store.SendChannelMessage.updateNewsletterMsgRecord(msg);
            return msg;
        }

        const [msgPromise, sendMsgResultPromise] = window.Store.SendMessage.addAndSendMsgToChat(chat, message);
        await msgPromise;

        if (options.waitUntilMsgSent) await sendMsgResultPromise;

        return window.Store.Msg.get(newMsgKey._serialized);
    };
	
    window.DVLww.editMessage = async (msg, content, options = {}) => {
        const extraOptions = options.extraOptions || {};
        delete options.extraOptions;
        
        if (options.mentionedJidList) {
            options.mentionedJidList = options.mentionedJidList.map((id) => window.Store.WidFactory.createWid(id));
            options.mentionedJidList = options.mentionedJidList.filter(Boolean);
        }

        if (options.groupMentions) {
            options.groupMentions = options.groupMentions.map((e) => ({
                groupSubject: e.subject,
                groupJid: window.Store.WidFactory.createWid(e.id)
            }));
        }

        if (options.linkPreview) {
            delete options.linkPreview;
            const link = window.Store.Validators.findLink(content);
            if (link) {
                const preview = await window.Store.LinkPreview.getLinkPreview(link);
                preview.preview = true;
                preview.subtype = 'url';
                options = { ...options, ...preview };
            }
        }


        const internalOptions = {
            ...options,
            ...extraOptions
        };

        await window.Store.EditMessage.sendMessageEdit(msg, content, internalOptions);
        return window.Store.Msg.get(msg.id._serialized);
    };

    window.DVLww.toStickerData = async (mediaInfo) => {
        if (mediaInfo.mimetype == 'image/webp') return mediaInfo;

        const file = window.DVLww.mediaInfoToFile(mediaInfo);
        const webpSticker = await window.Store.StickerTools.toWebpSticker(file);
        const webpBuffer = await webpSticker.arrayBuffer();
        const data = window.DVLww.arrayBufferToBase64(webpBuffer);

        return {
            mimetype: 'image/webp',
            data
        };
    };

    window.DVLww.processStickerData = async (mediaInfo) => {
        if (mediaInfo.mimetype !== 'image/webp') throw new Error('Invalid media type');

        const file = window.DVLww.mediaInfoToFile(mediaInfo);
        let filehash = await window.DVLww.getFileHash(file);
        let mediaKey = await window.DVLww.generateHash(32);

        const controller = new AbortController();
        const uploadedInfo = await window.Store.UploadUtils.encryptAndUpload({
            blob: file,
            type: 'sticker',
            signal: controller.signal,
            mediaKey
        });

        const stickerInfo = {
            ...uploadedInfo,
            clientUrl: uploadedInfo.url,
            deprecatedMms3Url: uploadedInfo.url,
            uploadhash: uploadedInfo.encFilehash,
            size: file.size,
            type: 'sticker',
            filehash
        };

        return stickerInfo;
    };

    window.DVLww.processMediaData = async (mediaInfo, { forceSticker, forceGif, forceVoice, forceDocument, forceMediaHd, sendToChannel }) => {
        const file = window.DVLww.mediaInfoToFile(mediaInfo);
        const opaqueData = await window.Store.OpaqueData.createFromData(file, file.type);
        const mediaParams = {
            asSticker: forceSticker,
            asGif: forceGif,
            isPtt: forceVoice,
            asDocument: forceDocument
        };
      
        if (forceMediaHd && file.type.indexOf('image/') === 0) {
            mediaParams.maxDimension = 2560;
        }
      
        const mediaPrep = window.Store.MediaPrep.prepRawMedia(opaqueData, mediaParams);
        const mediaData = await mediaPrep.waitForPrep();
        const mediaObject = window.Store.MediaObject.getOrCreateMediaObject(mediaData.filehash);
        const mediaType = window.Store.MediaTypes.msgToMediaType({
            type: mediaData.type,
            isGif: mediaData.isGif,
            isNewsletter: sendToChannel,
        });

        if (!mediaData.filehash) {
            throw new Error('media-fault: sendToChat filehash undefined');
        }

        if (forceVoice && mediaData.type === 'ptt') {
            const waveform = mediaObject.contentInfo.waveform;
            mediaData.waveform =
                waveform || await window.DVLww.generateWaveform(file);
        }

        if (!(mediaData.mediaBlob instanceof window.Store.OpaqueData)) {
            mediaData.mediaBlob = await window.Store.OpaqueData.createFromData(
                mediaData.mediaBlob,
                mediaData.mediaBlob.type
            );
        }

        mediaData.renderableUrl = mediaData.mediaBlob.url();
        mediaObject.consolidate(mediaData.toJSON());
        
        mediaData.mediaBlob.autorelease();
        const shouldUseMediaCache = window.Store.MediaDataUtils.shouldUseMediaCache(
            window.Store.MediaTypes.castToV4(mediaObject.type)
        );
        if (shouldUseMediaCache && mediaData.mediaBlob instanceof window.Store.OpaqueData) {
            const formData = mediaData.mediaBlob.formData();
            window.Store.BlobCache.InMemoryMediaBlobCache.put(mediaObject.filehash, formData);
        }

        const dataToUpload = {
            mimetype: mediaData.mimetype,
            mediaObject,
            mediaType,
            ...(sendToChannel ? { calculateToken: window.Store.SendChannelMessage.getRandomFilehash } : {})
        };

        const uploadedMedia = !sendToChannel
            ? await window.Store.MediaUpload.uploadMedia(dataToUpload)
            : await window.Store.MediaUpload.uploadUnencryptedMedia(dataToUpload);

        const mediaEntry = uploadedMedia.mediaEntry;
        if (!mediaEntry) {
            throw new Error('upload failed: media entry was not created');
        }

        mediaData.set({
            clientUrl: mediaEntry.mmsUrl,
            deprecatedMms3Url: mediaEntry.deprecatedMms3Url,
            directPath: mediaEntry.directPath,
            mediaKey: mediaEntry.mediaKey,
            mediaKeyTimestamp: mediaEntry.mediaKeyTimestamp,
            filehash: mediaObject.filehash,
            encFilehash: mediaEntry.encFilehash,
            uploadhash: mediaEntry.uploadHash,
            size: mediaObject.size,
            streamingSidecar: mediaEntry.sidecar,
            firstFrameSidecar: mediaEntry.firstFrameSidecar,
            mediaHandle: sendToChannel ? mediaEntry.handle : null,
        });

        return mediaData;
    };

    window.DVLww.getMessageModel = (message) => {
        const msg = message.serialize();

        msg.isEphemeral = message.isEphemeral;
        msg.isStatusV3 = message.isStatusV3;
        msg.links = (window.Store.Validators.findLinks(message.mediaObject ? message.caption : message.body)).map((link) => ({
            link: link.href,
            isSuspicious: Boolean(link.suspiciousCharacters && link.suspiciousCharacters.size)
        }));

        if (msg.buttons) {
            msg.buttons = msg.buttons.serialize();
        }
        if (msg.dynamicReplyButtons) {
            msg.dynamicReplyButtons = JSON.parse(JSON.stringify(msg.dynamicReplyButtons));
        }
        if (msg.replyButtons) {
            msg.replyButtons = JSON.parse(JSON.stringify(msg.replyButtons));
        }

        if (typeof msg.id.remote === 'object') {
            msg.id = Object.assign({}, msg.id, { remote: msg.id.remote._serialized });
        }

        delete msg.pendingAckUpdate;

        return msg;
    };

    window.DVLww.getChat = async (chatId, { getAsModel = true } = {}) => {
        const isChannel = /@\w*newsletter\b/.test(chatId);
        const chatWid = window.Store.WidFactory.createWid(chatId);
        let chat;

        if (isChannel) {
            try {
                chat = window.Store.NewsletterCollection.get(chatId);
                if (!chat) {
                    await window.Store.ChannelUtils.loadNewsletterPreviewChat(chatId);
                    chat = await window.Store.NewsletterCollection.find(chatWid);
                }
            } catch (err) {
                chat = null;
            }
        } else {
            chat = window.Store.Chat.get(chatWid) || (await window.Store.FindOrCreateChat.findOrCreateLatestChat(chatWid))?.chat;
        }

        return getAsModel && chat
            ? await window.DVLww.getChatModel(chat, { isChannel: isChannel })
            : chat;
    };

    window.DVLww.getChannelMetadata = async (inviteCode) => {
        const response =
            await window.Store.ChannelUtils.queryNewsletterMetadataByInviteCode(
                inviteCode,
                window.Store.ChannelUtils.getRoleByIdentifier(inviteCode)
            );

        const picUrl = response.newsletterPictureMetadataMixin?.picture[0]?.queryPictureDirectPathOrEmptyResponseMixinGroup.value.directPath;

        return {
            id: response.idJid,
            createdAtTs: response.newsletterCreationTimeMetadataMixin.creationTimeValue,
            titleMetadata: {
                title: response.newsletterNameMetadataMixin.nameElementValue,
                updatedAtTs: response.newsletterNameMetadataMixin.nameUpdateTime
            },
            descriptionMetadata: {
                description: response.newsletterDescriptionMetadataMixin.descriptionQueryDescriptionResponseMixin.elementValue,
                updatedAtTs: response.newsletterDescriptionMetadataMixin.descriptionQueryDescriptionResponseMixin.updateTime
            },
            inviteLink: `https://whatsapp.com/channel/${response.newsletterInviteLinkMetadataMixin.inviteCode}`,
            membershipType: window.Store.ChannelUtils.getRoleByIdentifier(inviteCode),
            stateType: response.newsletterStateMetadataMixin.stateType,
            pictureUrl: picUrl ? `https://pps.whatsapp.net${picUrl}` : null,
            subscribersCount: response.newsletterSubscribersMetadataMixin.subscribersCount,
            isVerified: response.newsletterVerificationMetadataMixin.verificationState === 'verified'
        };
    };

    window.DVLww.getChats = async () => {
        const chats = window.Store.Chat.getModelsArray();
        const chatPromises = chats.map(chat => window.DVLww.getChatModel(chat));
        return await Promise.all(chatPromises);
    };

    window.DVLww.getChannels = async () => {
        const channels = window.Store.NewsletterCollection.getModelsArray();
        const channelPromises = channels?.map((channel) => window.DVLww.getChatModel(channel, { isChannel: true }));
        return await Promise.all(channelPromises);
    };

    window.DVLww.getChatModel = async (chat, { isChannel = false } = {}) => {
        if (!chat) return null;

        const model = chat.serialize();
        model.isGroup = false;
        model.isMuted = chat.mute?.expiration !== 0;
        if (isChannel) {
            model.isChannel = window.Store.ChatGetters.getIsNewsletter(chat);
        } else {
            model.formattedTitle = chat.formattedTitle;
        }

        if (chat.groupMetadata) {
            model.isGroup = true;
            const chatWid = window.Store.WidFactory.createWid(chat.id._serialized);
            await window.Store.GroupMetadata.update(chatWid);
            chat.groupMetadata.participants._models
                .filter(x => x.id?._serialized?.endsWith('@lid'))
                .forEach(x => x.contact?.phoneNumber && (x.id = x.contact.phoneNumber));
            model.groupMetadata = chat.groupMetadata.serialize();
            model.isReadOnly = chat.groupMetadata.announce;
        }

        if (chat.newsletterMetadata) {
            await window.Store.NewsletterMetadataCollection.update(chat.id);
            model.channelMetadata = chat.newsletterMetadata.serialize();
            model.channelMetadata.createdAtTs = chat.newsletterMetadata.creationTime;
        }

        model.lastMessage = null;
        if (model.msgs && model.msgs.length) {
            const lastMessage = chat.lastReceivedKey
                ? window.Store.Msg.get(chat.lastReceivedKey._serialized) || (await window.Store.Msg.getMessagesById([chat.lastReceivedKey._serialized]))?.messages?.[0]
                : null;
            lastMessage && (model.lastMessage = window.DVLww.getMessageModel(lastMessage));
        }

        delete model.msgs;
        delete model.msgUnsyncedButtonReplyMsgs;
        delete model.unsyncedButtonReplies;

        return model;
    };

    window.DVLww.getContactModel = contact => {
        let res = contact.serialize();
        res.isBusiness = contact.isBusiness === undefined ? false : contact.isBusiness;

        if (contact.businessProfile) {
            res.businessProfile = contact.businessProfile.serialize();
        }

        res.isMe = window.Store.ContactMethods.getIsMe(contact);
        res.isUser = window.Store.ContactMethods.getIsUser(contact);
        res.isGroup = window.Store.ContactMethods.getIsGroup(contact);
        res.isWAContact = window.Store.ContactMethods.getIsWAContact(contact);
        res.isMyContact = window.Store.ContactMethods.getIsMyContact(contact);
        res.isBlocked = contact.isContactBlocked;
        res.userid = window.Store.ContactMethods.getUserid(contact);
        res.isEnterprise = window.Store.ContactMethods.getIsEnterprise(contact);
        res.verifiedName = window.Store.ContactMethods.getVerifiedName(contact);
        res.verifiedLevel = window.Store.ContactMethods.getVerifiedLevel(contact);
        res.statusMute = window.Store.ContactMethods.getStatusMute(contact);
        res.name = window.Store.ContactMethods.getName(contact);
        res.shortName = window.Store.ContactMethods.getShortName(contact);
        res.pushname = window.Store.ContactMethods.getPushname(contact);

        return res;
    };

    window.DVLww.getContact = async contactId => {
        const wid = window.Store.WidFactory.createWid(contactId);
        let contact = await window.Store.Contact.find(wid);
        if (contact.id._serialized.endsWith('@lid')) {
            contact.id = contact.phoneNumber;
        }
        const bizProfile = await window.Store.BusinessProfile.fetchBizProfile(wid);
        bizProfile.profileOptions && (contact.businessProfile = bizProfile);
        return window.DVLww.getContactModel(contact);
    };

    window.DVLww.getContacts = () => {
        const contacts = window.Store.Contact.getModelsArray();
        return contacts.map(contact => window.DVLww.getContactModel(contact));
    };

    window.DVLww.mediaInfoToFile = ({ data, mimetype, filename }) => {
        const binaryData = window.atob(data);

        const buffer = new ArrayBuffer(binaryData.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binaryData.length; i++) {
            view[i] = binaryData.charCodeAt(i);
        }

        const blob = new Blob([buffer], { type: mimetype });
        return new File([blob], filename, {
            type: mimetype,
            lastModified: Date.now()
        });
    };

    window.DVLww.arrayBufferToBase64 = (arrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    window.DVLww.arrayBufferToBase64Async = (arrayBuffer) =>
        new Promise((resolve, reject) => {
            const blob = new Blob([arrayBuffer], {
                type: 'application/octet-stream',
            });
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const [, data] = fileReader.result.split(',');
                resolve(data);
            };
            fileReader.onerror = (e) => reject(e);
            fileReader.readAsDataURL(blob);
        });

    window.DVLww.getFileHash = async (data) => {
        let buffer = await data.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    };

    window.DVLww.generateHash = async (length) => {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };

    window.DVLww.generateWaveform = async (audioFile) => {
        try {
            const audioData = await audioFile.arrayBuffer();
            const audioContext = new AudioContext();
            const audioBuffer = await audioContext.decodeAudioData(audioData);

            const rawData = audioBuffer.getChannelData(0);
            const samples = 64;
            const blockSize = Math.floor(rawData.length / samples);
            const filteredData = [];
            for (let i = 0; i < samples; i++) {
                const blockStart = blockSize * i;
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum = sum + Math.abs(rawData[blockStart + j]);
                }
                filteredData.push(sum / blockSize);
            }

            const multiplier = Math.pow(Math.max(...filteredData), -1);
            const normalizedData = filteredData.map((n) => n * multiplier);

            const waveform = new Uint8Array(
                normalizedData.map((n) => Math.floor(100 * n))
            );

            return waveform;
        } catch (e) {
            return undefined;
        }
    };

    window.DVLww.sendClearChat = async (chatId) => {
        let chat = await window.DVLww.getChat(chatId, { getAsModel: false });
        if (chat !== undefined) {
            await window.Store.SendClear.sendClear(chat, false);
            return true;
        }
        return false;
    };

    window.DVLww.sendDeleteChat = async (chatId) => {
        let chat = await window.DVLww.getChat(chatId, { getAsModel: false });
        if (chat !== undefined) {
            await window.Store.SendDelete.sendDelete(chat);
            return true;
        }
        return false;
    };

    window.DVLww.sendChatstate = async (state, chatId) => {
        chatId = window.Store.WidFactory.createWid(chatId);

        switch (state) {
        case 'typing':
            await window.Store.ChatState.sendChatStateComposing(chatId);
            break;
        case 'recording':
            await window.Store.ChatState.sendChatStateRecording(chatId);
            break;
        case 'stop':
            await window.Store.ChatState.sendChatStatePaused(chatId);
            break;
        default:
            throw 'Invalid chatstate';
        }

        return true;
    };

    window.DVLww.getLabelModel = label => {
        let res = label.serialize();
        res.hexColor = label.hexColor;

        return res;
    };

    window.DVLww.getLabels = () => {
        const labels = window.Store.Label.getModelsArray();
        return labels.map(label => window.DVLww.getLabelModel(label));
    };

    window.DVLww.getLabel = (labelId) => {
        const label = window.Store.Label.get(labelId);
        return window.DVLww.getLabelModel(label);
    };

    window.DVLww.getChatLabels = async (chatId) => {
        const chat = await window.DVLww.getChat(chatId);
        return (chat.labels || []).map(id => window.DVLww.getLabel(id));
    };

    window.DVLww.getOrderDetail = async (orderId, token, chatId) => {
        const chatWid = window.Store.WidFactory.createWid(chatId);
        return window.Store.QueryOrder.queryOrder(chatWid, orderId, 80, 80, token);
    };

    window.DVLww.getProductMetadata = async (productId) => {
        let sellerId = window.Store.Conn.wid;
        let product = await window.Store.QueryProduct.queryProduct(sellerId, productId);
        if (product && product.data) {
            return product.data;
        }

        return undefined;
    };

    window.DVLww.rejectCall = async (peerJid, id) => {
        let userId = window.Store.User.getMaybeMePnUser()._serialized;

        const stanza = window.Store.SocketWap.wap('call', {
            id: window.Store.SocketWap.generateId(),
            from: userId,
            to: peerJid,
        }, [
            window.Store.SocketWap.wap('reject', {
                'call-id': id,
                'call-creator': peerJid,
                count: '0',
            })
        ]);
        await window.Store.Socket.deprecatedCastStanza(stanza);
    };
    
    window.DVLww.cropAndResizeImage = async (media, options = {}) => {
        if (!media.mimetype.includes('image'))
            throw new Error('Media is not an image');

        if (options.mimetype && !options.mimetype.includes('image'))
            delete options.mimetype;

        options = Object.assign({ size: 640, mimetype: media.mimetype, quality: .75, asDataUrl: false }, options);

        const img = await new Promise ((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = `data:${media.mimetype};base64,${media.data}`;
        });

        const sl = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - sl) / 2);
        const sy = Math.floor((img.height - sl) / 2);

        const canvas = document.createElement('canvas');
        canvas.width = options.size;
        canvas.height = options.size;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, sl, sl, 0, 0, options.size, options.size);

        const dataUrl = canvas.toDataURL(options.mimetype, options.quality);

        if (options.asDataUrl)
            return dataUrl;

        return Object.assign(media, {
            mimetype: options.mimetype,
            data: dataUrl.replace(`data:${options.mimetype};base64,`, '')
        });
    };

    window.DVLww.setPicture = async (chatId, media) => {
        const thumbnail = await window.DVLww.cropAndResizeImage(media, { asDataUrl: true, mimetype: 'image/jpeg', size: 96 });
        const profilePic = await window.DVLww.cropAndResizeImage(media, { asDataUrl: true, mimetype: 'image/jpeg', size: 640 });

        const chatWid = window.Store.WidFactory.createWid(chatId);
        try {
            const collection = window.Store.ProfilePicThumb.get(chatId) || await window.Store.ProfilePicThumb.find(chatId);
            if (!collection?.canSet()) return false;

            const res = await window.Store.GroupUtils.sendSetPicture(chatWid, thumbnail, profilePic);
            return res ? res.status === 200 : false;
        } catch (err) {
            if (err.name === 'ServerStatusCodeError') return false;
            throw err;
        }
    };

    window.DVLww.deletePicture = async (chatid) => {
        const chatWid = window.Store.WidFactory.createWid(chatid);
        try {
            const collection = window.Store.ProfilePicThumb.get(chatid);
            if (!collection.canDelete()) return;

            const res = await window.Store.GroupUtils.requestDeletePicture(chatWid);
            return res ? res.status === 200 : false;
        } catch (err) {
            if(err.name === 'ServerStatusCodeError') return false;
            throw err;
        }
    };
    
    window.DVLww.getProfilePicThumbToBase64 = async (chatWid) => {
        const profilePicCollection = await window.Store.ProfilePicThumb.find(chatWid);

        const _readImageAsBase64 = (imageBlob) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = function () {
                    const base64Image = reader.result;
                    if (base64Image == null) {
                        resolve(undefined);
                    } else {
                        const base64Data = base64Image.toString().split(',')[1];
                        resolve(base64Data);
                    }
                };
                reader.readAsDataURL(imageBlob);
            });
        };

        if (profilePicCollection?.img) {
            try {
                const response = await fetch(profilePicCollection.img);
                if (response.ok) {
                    const imageBlob = await response.blob();
                    if (imageBlob) {
                        const base64Image = await _readImageAsBase64(imageBlob);
                        return base64Image;
                    }
                }
            } catch (error) { /* empty */ }
        }
        return undefined;
    };

    window.DVLww.getAddParticipantsRpcResult = async (groupWid, participantWid) => {
        const iqTo = window.Store.WidToJid.widToGroupJid(groupWid);

        const participantArgs = [{
            participantJid: window.Store.WidToJid.widToUserJid(participantWid)
        }];

        let rpcResult, resultArgs;
        const data = {
            name: undefined,
            code: undefined,
            inviteV4Code: undefined,
            inviteV4CodeExp: undefined
        };

        try {
            rpcResult = await window.Store.GroupParticipants.sendAddParticipantsRPC({ participantArgs, iqTo });
            resultArgs = rpcResult.value.addParticipant[0]
                .addParticipantsParticipantAddedOrNonRegisteredWaUserParticipantErrorLidResponseMixinGroup
                .value
                .addParticipantsParticipantMixins;
        } catch (err) {
            data.code = 400;
            return data;
        }

        if (rpcResult.name === 'AddParticipantsResponseSuccess') {
            const code = resultArgs?.value.error || '200';
            data.name = resultArgs?.name;
            data.code = +code;
            data.inviteV4Code = resultArgs?.value.addRequestCode;
            data.inviteV4CodeExp = resultArgs?.value.addRequestExpiration?.toString();
        }

        else if (rpcResult.name === 'AddParticipantsResponseClientError') {
            const { code: code } = rpcResult.value.errorAddParticipantsClientErrors.value;
            data.code = +code;
        }

        else if (rpcResult.name === 'AddParticipantsResponseServerError') {
            const { code: code } = rpcResult.value.errorServerErrors.value;
            data.code = +code;
        }

        return data;
    };

    window.DVLww.membershipRequestAction = async (groupId, action, requesterIds, sleep) => {
        const groupWid = window.Store.WidFactory.createWid(groupId);
        const group = await window.Store.Chat.find(groupWid);
        const toApprove = action === 'Approve';
        let membershipRequests;
        let response;
        let result = [];

        await window.Store.GroupQueryAndUpdate({ id: groupId });

        if (!requesterIds?.length) {
            membershipRequests = group.groupMetadata.membershipApprovalRequests._models.map(({ id }) => id);
        } else {
            !Array.isArray(requesterIds) && (requesterIds = [requesterIds]);
            membershipRequests = requesterIds.map(r => window.Store.WidFactory.createWid(r));
        }

        if (!membershipRequests.length) return [];

        const participantArgs = membershipRequests.map(m => ({
            participantArgs: [
                {
                    participantJid: window.Store.WidToJid.widToUserJid(m)
                }
            ]
        }));

        const groupJid = window.Store.WidToJid.widToGroupJid(groupWid);
        
        const _getSleepTime = (sleep) => {
            if (!Array.isArray(sleep) || (sleep.length === 2 && sleep[0] === sleep[1])) {
                return sleep;
            }
            if (sleep.length === 1) {
                return sleep[0];
            }
            sleep[1] - sleep[0] < 100 && (sleep[0] = sleep[1]) && (sleep[1] += 100);
            return Math.floor(Math.random() * (sleep[1] - sleep[0] + 1)) + sleep[0];
        };

        const membReqResCodes = {
            default: `An unknown error occupied while ${toApprove ? 'approving' : 'rejecting'} the participant membership request`,
            400: 'ParticipantNotFoundError',
            401: 'ParticipantNotAuthorizedError',
            403: 'ParticipantForbiddenError',
            404: 'ParticipantRequestNotFoundError',
            408: 'ParticipantTemporarilyBlockedError',
            409: 'ParticipantConflictError',
            412: 'ParticipantParentLinkedGroupsResourceConstraintError',
            500: 'ParticipantResourceConstraintError'
        };

        try {
            for (const participant of participantArgs) {
                response = await window.Store.MembershipRequestUtils.sendMembershipRequestsActionRPC({
                    iqTo: groupJid,
                    [toApprove ? 'approveArgs' : 'rejectArgs']: participant
                });

                if (response.name === 'MembershipRequestsActionResponseSuccess') {
                    const value = toApprove
                        ? response.value.membershipRequestsActionApprove
                        : response.value.membershipRequestsActionReject;
                    if (value?.participant) {
                        const [_] = value.participant.map(p => {
                            const error = toApprove
                                ? value.participant[0].membershipRequestsActionAcceptParticipantMixins?.value.error
                                : value.participant[0].membershipRequestsActionRejectParticipantMixins?.value.error;
                            return {
                                requesterId: window.Store.WidFactory.createWid(p.jid)._serialized,
                                ...(error
                                    ? { error: +error, message: membReqResCodes[error] || membReqResCodes.default }
                                    : { message: `${toApprove ? 'Approved' : 'Rejected'} successfully` })
                            };
                        });
                        _ && result.push(_);
                    }
                } else {
                    result.push({
                        requesterId: window.Store.JidToWid.userJidToUserWid(participant.participantArgs[0].participantJid)._serialized,
                        message: 'ServerStatusCodeError'
                    });
                }

                sleep &&
                    participantArgs.length > 1 &&
                    participantArgs.indexOf(participant) !== participantArgs.length - 1 &&
                    (await new Promise((resolve) => setTimeout(resolve, _getSleepTime(sleep))));
            }
            return result;
        } catch (err) {
            return [];
        }
    };

    window.DVLww.subscribeToUnsubscribeFromChannel = async (channelId, action, options = {}) => {
        const channel = await window.DVLww.getChat(channelId, { getAsModel: false });

        if (!channel || channel.newsletterMetadata.membershipType === 'owner') return false;
        options = { eventSurface: 3, deleteLocalModels: options.deleteLocalModels ?? true };

        try {
            if (action === 'Subscribe') {
                await window.Store.ChannelUtils.subscribeToNewsletterAction(channel, options);
            } else if (action === 'Unsubscribe') {
                await window.Store.ChannelUtils.unsubscribeFromNewsletterAction(channel, options);
            } else return false;
            return true;
        } catch (err) {
            if (err.name === 'ServerStatusCodeError') return false;
            throw err;
        }
    };

    window.DVLww.pinUnpinMsgAction = async (msgId, action, duration) => {
        const message = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
        if (!message) return false;

        if (typeof duration !== 'number') return false;
        
        const originalFunction = window.require('WAWebPinMsgConstants').getPinExpiryDuration;
        window.require('WAWebPinMsgConstants').getPinExpiryDuration = () => duration;
        
        const response = await window.Store.PinnedMsgUtils.sendPinInChatMsg(message, action, duration);

        window.require('WAWebPinMsgConstants').getPinExpiryDuration = originalFunction;

        return response.messageSendResult === 'OK';
    };
    
    window.DVLww.getStatusModel = status => {
        const res = status.serialize();
        delete res._msgs;
        return res;
    };

    window.DVLww.getAllStatuses = () => {
        const statuses = window.Store.Status.getModelsArray();
        return statuses.map(status => window.DVLww.getStatusModel(status));
    };

    window.DVLww.enforceLidAndPnRetrieval = async (userId) => {
        const wid = window.Store.WidFactory.createWid(userId);
        const isLid = wid.server === 'lid';

        let lid = isLid ? wid : window.Store.LidUtils.getCurrentLid(wid);
        let phone = isLid ? window.Store.LidUtils.getPhoneNumber(wid) : wid;

        if (!isLid && !lid) {
            const queryResult = await window.Store.QueryExist(wid);
            if (!queryResult?.wid) return {};
            lid = window.Store.LidUtils.getCurrentLid(wid);
        }

        if (isLid && !phone) {
            const queryResult = await window.Store.QueryExist(wid);
            if (!queryResult?.wid) return {};
            phone = window.Store.LidUtils.getPhoneNumber(wid);
        }

        return { lid, phone };
    };
};

// Catálogo completo de wrappers expostos por LoadUtils (usado para o relatório).
const WRAPPER_CATALOG = [
    { name: 'forwardMessage', area: 'mensagens', description: 'Encaminha uma mensagem existente para outro chat.' },
    { name: 'sendSeen', area: 'mensagens', description: 'Marca um chat como lido.' },
    { name: 'sendMessage', area: 'mensagens', description: 'Envio genérico de texto/mídia, incluindo stickers e GIFs.' },
    { name: 'editMessage', area: 'mensagens', description: 'Edita uma mensagem previamente enviada.' },
    { name: 'toStickerData', area: 'mídia', description: 'Converte uma imagem em buffer WebP com metadados de sticker.' },
    { name: 'processStickerData', area: 'mídia', description: 'Prepara upload e metadados para enviar um sticker.' },
    { name: 'processMediaData', area: 'mídia', description: 'Prepara upload e metadados de mídia (imagem, vídeo, PTT, documento).' },
    { name: 'getMessageModel', area: 'mensagens', description: 'Serializa um modelo interno de mensagem para JSON consumível.' },
    { name: 'getChat', area: 'chat', description: 'Obtém um chat pelo ID (inclusive canais/newsletters).', args: 'chatId' },
    { name: 'getChannelMetadata', area: 'chat', description: 'Busca metadados de canal a partir de um código de convite.', args: 'inviteCode' },
    { name: 'getChats', area: 'chat', description: 'Lista todos os chats disponíveis em cache.' },
    { name: 'getChannels', area: 'chat', description: 'Lista canais/newsletters disponíveis em cache.' },
    { name: 'getChatModel', area: 'chat', description: 'Normaliza um chat em JSON amigável, incluindo grupos e canais.' },
    { name: 'getContactModel', area: 'contatos', description: 'Normaliza um contato em JSON amigável.' },
    { name: 'getContact', area: 'contatos', description: 'Busca um contato pelo ID.', args: 'contactId' },
    { name: 'getContacts', area: 'contatos', description: 'Lista todos os contatos em cache.' },
    { name: 'mediaInfoToFile', area: 'mídia', description: 'Converte um objeto de mídia (base64/Buffer) em File.' },
    { name: 'arrayBufferToBase64', area: 'util', description: 'Converte ArrayBuffer em base64 (sincrono).' },
    { name: 'arrayBufferToBase64Async', area: 'util', description: 'Converte ArrayBuffer em base64 (assíncrono).' },
    { name: 'getFileHash', area: 'util', description: 'Calcula hash SHA-256 de um arquivo.' },
    { name: 'generateHash', area: 'util', description: 'Gera bytes aleatórios (usado em mídias/segredos).' },
    { name: 'generateWaveform', area: 'mídia', description: 'Cria waveform de áudio para mensagens de voz.' },
    { name: 'sendClearChat', area: 'chat', description: 'Limpa todas as mensagens de um chat.', args: 'chatId' },
    { name: 'sendDeleteChat', area: 'chat', description: 'Remove um chat localmente.', args: 'chatId' },
    { name: 'sendChatstate', area: 'chat', description: 'Envia estados de digitação/gravação/presença para um chat.' },
    { name: 'getLabelModel', area: 'labels', description: 'Normaliza um label em JSON.' },
    { name: 'getLabels', area: 'labels', description: 'Lista todos os labels disponíveis.' },
    { name: 'getLabel', area: 'labels', description: 'Busca um label pelo ID.', args: 'labelId' },
    { name: 'getChatLabels', area: 'labels', description: 'Lista labels atribuídos a um chat.', args: 'chatId' },
    { name: 'getOrderDetail', area: 'commerce', description: 'Obtém detalhes de pedido no catálogo da loja.', args: 'orderId, token, chatId' },
    { name: 'getProductMetadata', area: 'commerce', description: 'Obtém metadados de produto no catálogo.', args: 'productId' },
    { name: 'rejectCall', area: 'chamadas', description: 'Recusa uma chamada recebida.', args: 'peerJid, id' },
    { name: 'cropAndResizeImage', area: 'mídia', description: 'Recorta/redimensiona imagem para thumbs.' },
    { name: 'setPicture', area: 'perfil/grupo', description: 'Define foto de perfil/grupo.', args: 'chatId, media' },
    { name: 'deletePicture', area: 'perfil/grupo', description: 'Remove foto de perfil/grupo.', args: 'chatId' },
    { name: 'getProfilePicThumbToBase64', area: 'perfil/grupo', description: 'Obtém thumbnail da foto de perfil em base64.', args: 'chatWid' },
    { name: 'getAddParticipantsRpcResult', area: 'grupos', description: 'Tenta adicionar participante e retorna código RPC.', args: 'groupWid, participantWid' },
    { name: 'membershipRequestAction', area: 'grupos', description: 'Aprova/rejeita solicitações pendentes de entrada em grupo.' },
    { name: 'subscribeToUnsubscribeFromChannel', area: 'canais', description: 'Inscreve ou desinscreve de um canal.', args: 'channelId, action' },
    { name: 'pinUnpinMsgAction', area: 'mensagens', description: 'Fixa ou desafixa mensagem, com duração personalizada.' },
    { name: 'getStatusModel', area: 'status', description: 'Normaliza um status em JSON.' },
    { name: 'getAllStatuses', area: 'status', description: 'Lista todos os status em cache.' },
    { name: 'enforceLidAndPnRetrieval', area: 'contas', description: 'Resolve mapeamento LID/phone number para um usuário.', args: 'userId' },
];

const SHOULD_SEND_SEEN = process.env.DVLWW_SEND_SEEN === '1';
const SESSION_PATH = path.join(__dirname, 'dvlww-session');

/**
 * Entrada principal.
 */
(async () => {
    console.log('[dvlww] Abrindo navegador (perfil dedicado em ./dvlww-session)...');
    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: SESSION_PATH,
        args: ['--no-sandbox'],
    });

    const [page] = await browser.pages();
    console.log('[dvlww] Carregando https://web.whatsapp.com ...');
    await page.goto('https://web.whatsapp.com');

    // Orienta o usuário durante a autenticação manual.
    console.log('[dvlww] Se ainda não estiver autenticado, escaneie o QR exibido no navegador.');
    console.log('[dvlww] Aguardando o WhatsApp Web ficar pronto (window.Debug.VERSION disponível)...');
    await page.waitForFunction('window.Debug?.VERSION !== undefined', { timeout: 0 });

    const version = await page.evaluate(() => window.Debug?.VERSION ?? 'desconhecida');
    console.log(`[dvlww] WhatsApp Web carregado. Versão detectada: ${version}`);

    await exposeDependencies(page, version);
    await inspectInjectedWrappers(page);
    await listChatsAndMessages(page);

    console.log('[dvlww] Trabalho concluído. Fechando navegador.');
    await browser.close();
    process.exit(0);
})().catch(async (error) => {
    console.error('[dvlww] Erro inesperado:', error);
    process.exit(1);
});

/**
 * Injeta Store/Auth/Utils diretamente na página e cria o namespace window.dvlww.
 */
async function exposeDependencies(page, version) {
    const [, minor = '0'] = `${version}`.split('.');
    const isCometOrAbove = parseInt(minor, 10) >= 3000;

    if (isCometOrAbove) {
        console.log('[dvlww] Injetando ExposeAuthStore (autenticação moderna).');
        await page.evaluate(ExposeAuthStore);
    } else {
        console.log('[dvlww] Injetando ExposeLegacyAuthStore com moduleRaid (autenticação legada).');
        await page.evaluate(ExposeLegacyAuthStore, moduleRaid.toString());
    }

    console.log('[dvlww] Injetando ExposeStore e LoadUtils diretamente na página.');
    await page.evaluate(ExposeStore);
    await page.evaluate(LoadUtils);

    await page.evaluate(() => {
        // Replica todos os utilitários em um namespace neutro para evitar dependência de window.DVLww.
        window.dvlww = Object.assign({}, window.DVLww);
        window.dvlww.store = window.Store;
    });

    console.log('[dvlww] Wrappers injetados e copiados para window.dvlww.');
}

/**
 * Relatório de cobertura dos wrappers disponíveis em window.dvlww.
 */
async function inspectInjectedWrappers(page) {
    const exposure = await page.evaluate((catalog) => ({
        debugVersion: window.Debug?.VERSION ?? null,
        hasStore: typeof window.Store !== 'undefined',
        hasDvlww: typeof window.dvlww !== 'undefined',
        storeKeys: Object.keys(window.Store || {}),
        dvlwwKeys: Object.keys(window.dvlww || {}),
        capabilities: {
            widFactory: typeof window.Store?.WidFactory?.createWid === 'function',
            sendSeen: typeof window.dvlww?.sendSeen === 'function',
            forwardMessage: typeof window.dvlww?.forwardMessage === 'function',
            sendMessage: typeof window.dvlww?.sendMessage === 'function',
        },
        wrapperCoverage: catalog.map(({ name, area, description, args }) => ({
            name,
            area,
            description,
            args,
            type: typeof window.dvlww?.[name],
            present: typeof window.dvlww?.[name] === 'function',
        })),
        caches: {
            chats: window.Store?.Chat?.models?.length ?? 0,
            messages: window.Store?.Msg?.models?.length ?? 0,
        },
    }), WRAPPER_CATALOG);

    console.log('[dvlww] window.Store presente?', exposure.hasStore);
    console.log('[dvlww] window.dvlww presente?', exposure.hasDvlww);
    console.log('[dvlww] Chaves principais de window.Store:', exposure.storeKeys);
    console.log('[dvlww] Chaves principais de window.dvlww:', exposure.dvlwwKeys);
    console.log('[dvlww] Capacidades detectadas:', exposure.capabilities);
    console.log('[dvlww] Itens em cache (chats/mensagens):', exposure.caches);

    const present = exposure.wrapperCoverage.filter(w => w.present);
    const missing = exposure.wrapperCoverage.filter(w => !w.present);

    console.log(`\n[dvlww] Cobertura de wrappers (${present.length}/${exposure.wrapperCoverage.length} disponíveis):`);
    present.forEach((w) => {
        console.log(`  ✔ ${w.name} [${w.area}]${w.args ? `(${w.args})` : ''} - ${w.description}`);
    });

    if (missing.length > 0) {
        console.log('\n[dvlww] Wrappers ausentes (não expostos ou não funções):');
        missing.forEach((w) => {
            console.log(`  ✖ ${w.name} [${w.area}] - retornou tipo "${w.type}"`);
        });
    }
}

/**
 * Demonstra chamadas dos wrappers no contexto do navegador.
 */
async function listChatsAndMessages(page) {
    const result = await page.evaluate(async (shouldSendSeen) => {
        const chats = await window.dvlww.getChats();
        const summary = { chatCount: chats.length, firstChat: null, lastMessage: null, sentSeen: false };

        if (chats.length === 0) {
            return summary;
        }

        const firstChat = chats[0];
        summary.firstChat = {
            id: firstChat.id?._serialized,
            name: firstChat.name,
            isGroup: firstChat.isGroup,
        };

        const recentMessages = await firstChat.fetchMessages({ limit: 1 });
        if (recentMessages.length > 0) {
            summary.lastMessage = {
                id: recentMessages[0].id?._serialized,
                fromMe: recentMessages[0].fromMe,
                timestamp: recentMessages[0].timestamp,
                bodyPreview: recentMessages[0].body?.slice(0, 100) || '<sem texto>',
            };
        }

        if (shouldSendSeen) {
            await firstChat.sendSeen();
            summary.sentSeen = true;
        }

        return summary;
    }, SHOULD_SEND_SEEN);

    console.log(`[dvlww] Total de chats carregados: ${result.chatCount}`);

    if (!result.firstChat) {
        console.log('[dvlww] Nenhum chat disponível para inspecionar.');
        return;
    }

    console.log('[dvlww] Primeiro chat:', result.firstChat);
    if (result.lastMessage) {
        console.log('[dvlww] Última mensagem do chat:', result.lastMessage);
    } else {
        console.log('[dvlww] Nenhuma mensagem encontrada no chat.');
    }

    if (result.sentSeen) {
        console.log('[dvlww] Sinal de leitura enviado para o primeiro chat (sendSeen).');
    } else {
        console.log('[dvlww] Envios desabilitados (defina DVLWW_SEND_SEEN=1 para testar sendSeen).');
    }
}
