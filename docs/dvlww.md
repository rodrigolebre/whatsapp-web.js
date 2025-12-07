# dvlww: Wrapper do WhatsApp Web

Este documento explica como os wrappers internos do WhatsApp Web são expostos e traz um roteiro para verificá-los **sem depender da classe `Client` ou do namespace `DVLww`**: o arquivo `dvlww.js` recria a injeção diretamente via Puppeteer e coloca tudo em `window.dvlww`.

## Linha do tempo de injeção

1. **`Client.initialize()`** cria a sessão do Puppeteer e navega até o WhatsApp Web.
2. **`initWebVersion()`** define metadados do dispositivo e resolve se a sessão usará `ExposeAuthStore` ou `ExposeLegacyAuthStore` para inicializar o armazenamento de autenticação.
3. **`inject()`** aguarda o carregamento de `window.Debug.VERSION`, injeta o script de exposição e chama `ExposeStore` e `LoadUtils` dentro do `page.evaluate`.
4. **`ExposeStore()`** cria `window.Store` chamando `window.require` para reunir módulos internos (ações de chat, modelos de mensagem, utilitários de mídia, fábricas de WID etc.).
5. **`LoadUtils()`** cria `window.DVLww` e monta os wrappers de alto nível (`sendSeen`, `forwardMessage`, variantes de `sendMessage`, builders de mídia/sticker, coleta de mensagens em cache e afins).
6. **Utilização na API pública**: as chamadas como `client.sendMessage`, `client.sendSeen`, `client.forwardMessages` e `client.getChats` invocam os utilitários de `window.DVLww`, mantendo os detalhes internos encapsulados.

## Script de validação (`node dvlww`)

O arquivo `dvlww.js` na raiz do projeto consolida todo o passo a passo em um único lugar, sem TypeScript, e com comentários para cada etapa. Ele:

- abre o WhatsApp Web com um perfil dedicado (`./dvlww-session`) em modo não-headless, permitindo que você escaneie o QR diretamente no navegador;
- aguarda `window.Debug.VERSION` e injeta `moduleRaid`, `ExposeStore`, `ExposeAuthStore`/`ExposeLegacyAuthStore` e `LoadUtils` **diretamente no contexto da página**; todo o código dos injetores está embutido no próprio `dvlww.js`, sem `require` adicionais;
- copia todos os wrappers para `window.dvlww`, removendo a dependência do namespace `window.DVLww`;
- lista as chaves principais de `window.Store` e `window.dvlww`, checa capacidades como `sendSeen`, `forwardMessage` e `sendMessage` e informa quantos chats/mensagens estão em cache;
- relata **todos** os wrappers injetados, indicando quantos foram encontrados e quais faltam;
- chama `getChats` e `fetchMessages` diretamente no navegador e, opcionalmente, envia `sendSeen` se `DVLWW_SEND_SEEN=1` estiver definida.

Para executar:

```bash
node dvlww.js
# ou, se quiser testar o envio de "visto":
DVLWW_SEND_SEEN=1 node dvlww.js
```

A saída exibirá a versão do WhatsApp Web, a confirmação de que `window.Store` e `window.dvlww` existem, as chaves expostas e um resumo do primeiro chat encontrado (incluindo a última mensagem). Caso `DVLWW_SEND_SEEN=1` seja usado, o script também marcará o primeiro chat como lido.

### Catálogo completo de wrappers

O `LoadUtils` injeta diversas funções no `window.DVLww`. O `dvlww.js` agora lista cada uma delas, agrupando por área e marcando se estão presentes:

- Mensagens: `forwardMessage`, `sendSeen`, `sendMessage`, `editMessage`, `getMessageModel`, `pinUnpinMsgAction`
- Mídia: `toStickerData`, `processStickerData`, `processMediaData`, `generateWaveform`, `mediaInfoToFile`, `cropAndResizeImage`
- Chats e canais: `getChat`, `getChats`, `getChatModel`, `getChannels`, `getChannelMetadata`, `sendClearChat`, `sendDeleteChat`, `sendChatstate`, `subscribeToUnsubscribeFromChannel`
- Contatos e contas: `getContact`, `getContacts`, `getContactModel`, `enforceLidAndPnRetrieval`
- Labels: `getLabelModel`, `getLabels`, `getLabel`, `getChatLabels`
- Commerce: `getOrderDetail`, `getProductMetadata`
- Chamadas: `rejectCall`
- Perfil/Grupo: `setPicture`, `deletePicture`, `getProfilePicThumbToBase64`, `getAddParticipantsRpcResult`, `membershipRequestAction`
- Status: `getStatusModel`, `getAllStatuses`
- Utilidades: `arrayBufferToBase64`, `arrayBufferToBase64Async`, `getFileHash`, `generateHash`

## Pontos de atenção

- O script requer um ambiente capaz de abrir o WhatsApp Web (internet habilitada e sessão não bloqueada por firewall). Se estiver em CI, desabilite o modo headless ou use configurações adicionais de Puppeteer conforme necessário.
- Caso queira inspecionar módulos específicos, adicione novas chaves ao objeto retornado em `page.evaluate`, por exemplo `window.Store.Wap` ou `window.Store.WidFactory`.
- A estrutura interna do WhatsApp Web pode mudar; mantenha o pacote atualizado para garantir que `ExposeStore` e `LoadUtils` acompanhem alterações de módulos.

## Resumo rápido

- `window.Store`: módulo agregado via `ExposeStore`, contendo loaders, fábricas e modelos internos do WhatsApp Web.
- `window.DVLww`: namespace de utilidades criado por `LoadUtils`, usado pela API pública para enviar mensagens, marcar visualizações, encaminhar e montar mídias.
- O arquivo `dvlww.js` permite observar em tempo de execução se esses wrappers estão disponíveis e quais funções foram expostas.
