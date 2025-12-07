# Referência das funções do `window.dvlww`

Todas as funções abaixo ficam disponíveis no navegador depois que o `dvlww.js` injeta o `LoadUtils`. Cada item lista assinatura básica, parâmetros esperados e o que é retornado. Os exemplos assumem que você está chamando direto no contexto da página (devtools do navegador) via `window.dvlww`.

## Mensagens
- `dvlww.forwardMessage(chatId, msgId)`
  - **Parâmetros:** `chatId` (WID do destino), `msgId` (ID da mensagem a encaminhar).
  - **Retorno:** `Promise` com o resultado de `ForwardUtils.forwardMessages`, disparando o reenvio do conteúdo original.
- `dvlww.sendSeen(chatId)`
  - **Parâmetros:** `chatId` (WID do chat).
  - **Retorno:** `Promise<boolean>` indicando se o visto foi enviado com sucesso.
- `dvlww.sendMessage(chat, content, options = {})`
  - **Parâmetros:** `chat` (modelo de chat ou WID), `content` (texto ou pré‑visualização de mídia), `options` (mídia, citações, localização, enquetes, botões, listas, eventos, bots, etc.).
  - **Retorno:** `Promise` que resolve para o modelo da mensagem recém‑criada no `Store.Msg` (ou o modelo de newsletter, no caso de canais).
- `dvlww.editMessage(msg, content, options = {})`
  - **Parâmetros:** `msg` (modelo `Msg` existente), `content` (novo texto/caption), `options` (menções, link preview, extras internos).
  - **Retorno:** `Promise` com o modelo da mensagem atualizado após `EditMessage.sendMessageEdit`.
- `dvlww.pinUnpinMsgAction(msgId, action, duration)`
  - **Parâmetros:** `msgId` (ID completo), `action` (`'pin'` ou `'unpin'`), `duration` (ms para expiração de pin).
  - **Retorno:** `Promise<boolean>` indicando se a operação retornou `messageSendResult === 'OK'`.
- `dvlww.getMessageModel(message)`
  - **Parâmetros:** `message` (instância de `Msg`).
  - **Retorno:** Objeto serializado com campos amigáveis (links, botões e ID já normalizados).

## Mídia
- `dvlww.toStickerData(mediaInfo)`
  - **Parâmetros:** `mediaInfo` (objeto `{ mimetype, data, filename? }`).
  - **Retorno:** Objeto `{ mimetype: 'image/webp', data }` pronto para envio como sticker.
- `dvlww.processStickerData(mediaInfo)`
  - **Parâmetros:** `mediaInfo` (sticker WebP). Gera hash, chave e faz upload criptografado.
  - **Retorno:** Metadados do sticker (URL, hashes, tamanho, tipo) para inclusão na mensagem.
- `dvlww.processMediaData(mediaInfo, options)`
  - **Parâmetros:** `mediaInfo` (dados de mídia), `options` (forçar sticker/GIF/voz/documento/HD ou envio para canais).
  - **Retorno:** Estrutura de mídia preparada pelo `MediaPrep`/`MediaUpload`, incluindo URLs, chaves e handles.
- `dvlww.generateWaveform(audioFile)`
  - **Parâmetros:** `audioFile` (`File`/`Blob`).
  - **Retorno:** `Promise<Uint8Array>` com a waveform calculada.
- `dvlww.mediaInfoToFile({ data, mimetype, filename })`
  - **Parâmetros:** Buffer/base64 de mídia, mimetype e nome opcional.
  - **Retorno:** Instância de `File` criada via `Store.util.blobToFile`.
- `dvlww.arrayBufferToBase64(arrayBuffer)` / `dvlww.arrayBufferToBase64Async(arrayBuffer)`
  - **Parâmetros:** `arrayBuffer` com os bytes da mídia.
  - **Retorno:** String base64 (sincronamente ou via `Promise`).
- `dvlww.getFileHash(data)`
  - **Parâmetros:** `data` (`File`/`Blob`).
  - **Retorno:** `Promise<string>` com o hash SHA‑256 hexadecimal.
- `dvlww.generateHash(length)`
  - **Parâmetros:** `length` (número de bytes aleatórios).
  - **Retorno:** `Promise<Uint8Array>` gerado por `window.crypto.getRandomValues`.
- `dvlww.cropAndResizeImage(media, options = {})`
  - **Parâmetros:** `media` (imagem em base64), `options` (`size`, `mimetype`, `quality`, `asDataUrl`).
  - **Retorno:** Dados redimensionados (como `Blob` ou data URL, conforme `asDataUrl`).

## Chats e canais
- `dvlww.getChat(chatId, { getAsModel = true } = {})`
  - **Parâmetros:** `chatId` (WID) e flag para serializar ou retornar o modelo interno.
  - **Retorno:** `Promise` com JSON amigável do chat (ou modelo `Chat`/`Newsletter` bruto).
- `dvlww.getChannelMetadata(inviteCode)`
  - **Parâmetros:** `inviteCode` (código de convite de canal/newsletter).
  - **Retorno:** Objeto com metadados (jid, nome, descrição, foto, contagem de inscritos, verificação e timestamps).
- `dvlww.getChats()` / `dvlww.getChannels()`
  - **Parâmetros:** nenhum.
  - **Retorno:** `Promise<array>` com todos os chats ou canais serializados.
- `dvlww.getChatModel(chat, { isChannel = false } = {})`
  - **Parâmetros:** modelo `Chat`/`Newsletter` e flag de canal.
  - **Retorno:** Serialização com `groupMetadata` (se grupo), `channelMetadata` (se canal) e última mensagem normalizada.
- `dvlww.sendClearChat(chatId)`
  - **Parâmetros:** `chatId` (WID).
  - **Retorno:** `Promise<boolean>` indicando se o `WapDelete` foi aceito pelo servidor.
- `dvlww.sendDeleteChat(chatId)`
  - **Parâmetros:** `chatId` (WID).
  - **Retorno:** `Promise` que resolve após `Chat.sendDelete` concluir.
- `dvlww.sendChatstate(state, chatId)`
  - **Parâmetros:** `state` (`'composing'`, `'recording'`, `'paused'`, `'available'` ou `null`), `chatId` (WID).
  - **Retorno:** `Promise<boolean>` informando se o estado foi enviado.
- `dvlww.subscribeToUnsubscribeFromChannel(channelId, action, options = {})`
  - **Parâmetros:** `channelId` (WID), `action` (`'Subscribe'` ou `'Unsubscribe'`), `options.deleteLocalModels` (booleano).
  - **Retorno:** `Promise<boolean>` com sucesso da operação de inscrição/remoção.

## Contatos e contas
- `dvlww.getContactModel(contact)`
  - **Parâmetros:** modelo `Contact`.
  - **Retorno:** Serialização com flags de negócio, verificação, nome/pushname e dados do usuário.
- `dvlww.getContact(contactId)` / `dvlww.getContacts()`
  - **Parâmetros:** `contactId` (WID) ou nenhum.
  - **Retorno:** `Promise` com contato único ou lista completa já normalizada.
- `dvlww.enforceLidAndPnRetrieval(userId)`
  - **Parâmetros:** `userId` (WID ou LID).
  - **Retorno:** Objeto `{ lid, phone }` resolvendo o mapeamento LID/phone, ou `{}` se não existir.

## Labels
- `dvlww.getLabelModel(label)`
  - **Parâmetros:** modelo `Label`.
  - **Retorno:** Serialização simples do label.
- `dvlww.getLabels()` / `dvlww.getLabel(labelId)` / `dvlww.getChatLabels(chatId)`
  - **Parâmetros:** `labelId` ou `chatId` quando aplicável.
  - **Retorno:** Lista de labels ou coleção aplicada a um chat.

## Comércio
- `dvlww.getOrderDetail(orderId, token, chatId)`
  - **Parâmetros:** ID do pedido, token de autenticação e `chatId` do vendedor/cliente.
  - **Retorno:** `Promise` com o objeto retornado por `QueryOrder.queryOrder` (inclui thumbs e itens do pedido).
- `dvlww.getProductMetadata(productId)`
  - **Parâmetros:** ID do produto.
  - **Retorno:** `Promise` com metadados do item (ou `undefined` se não encontrado).

## Chamadas
- `dvlww.rejectCall(peerJid, id)`
  - **Parâmetros:** `peerJid` (JID do originador) e `id` (identificador da chamada).
  - **Retorno:** `Promise<void>` após enviar o stanza `<reject>` via socket WAP.

## Perfil/Grupo
- `dvlww.setPicture(chatId, media)` / `dvlww.deletePicture(chatId)`
  - **Parâmetros:** `chatId` (grupo ou usuário), `media` (imagem base64 para `setPicture`).
  - **Retorno:** `Promise` resolvida após upload/redimensionamento ou remoção.
- `dvlww.getProfilePicThumbToBase64(chatWid)`
  - **Parâmetros:** `chatWid` (WID completo).
  - **Retorno:** `Promise<string>` com a thumbnail em base64.
- `dvlww.getAddParticipantsRpcResult(groupWid, participantWid)`
  - **Parâmetros:** `groupWid` (WID do grupo), `participantWid` (WID do convidado).
  - **Retorno:** `Promise` com o resultado de `GroupUtils.sendAddParticipantsRPC` (inclui códigos de erro/sucesso).
- `dvlww.membershipRequestAction(groupId, action, requesterIds, sleep)`
  - **Parâmetros:** `groupId` (WID do grupo), `action` (`'Approve'` ou `'Reject'`), `requesterIds` (array de WIDs), `sleep` (intervalo opcional entre chamadas).
  - **Retorno:** `Promise<Array>` com o resultado individual de cada requisição (mensagem ou código de erro).

## Status
- `dvlww.getStatusModel(status)`
  - **Parâmetros:** modelo `Status`.
  - **Retorno:** Serialização do status sem mensagens embutidas.
- `dvlww.getAllStatuses()`
  - **Parâmetros:** nenhum.
  - **Retorno:** Lista serializada de todos os status carregados.

