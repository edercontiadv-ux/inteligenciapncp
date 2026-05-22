# README — Implementação de Chat em Tempo Real

## Objetivo

Implementar um sistema de chat em tempo real integrado ao projeto existente, permitindo comunicação instantânea entre usuários utilizando WebSocket.

O sistema deverá suportar:

- Mensagens em tempo real
- Usuários online
- Indicador de digitação
- Salas/conversas
- Persistência de mensagens
- Escalabilidade futura

---

# Tecnologias Esperadas

## Backend

- Node.js
- WebSocket (Socket.IO ou ws)
- Redis
- PostgreSQL

## Frontend

- React/Vue/Next.js (compatível com projeto existente)
- Cliente WebSocket

---

# Funcionalidades Obrigatórias

# 1. Conexão em Tempo Real

O cliente deverá se conectar ao servidor via WebSocket.

## Fluxo

```txt
Frontend
   ↓
WebSocket Connection
   ↓
Chat Server
```

---

# 2. Autenticação da Conexão

A conexão WebSocket deve exigir autenticação JWT.

## Exemplo

```txt
Authorization: Bearer TOKEN
```

## Regras

- Validar JWT na conexão
- Desconectar usuários inválidos
- Associar socket ao usuário autenticado

---

# 3. Envio de Mensagens

## Evento esperado

```json
{
  "event": "send_message",
  "data": {
    "conversationId": "123",
    "message": "Olá mundo"
  }
}
```

---

# 4. Recebimento de Mensagens

## Evento esperado

```json
{
  "event": "new_message",
  "data": {
    "id": "msg_001",
    "conversationId": "123",
    "senderId": "user_10",
    "message": "Olá mundo",
    "createdAt": "2026-01-01T10:00:00"
  }
}
```

---

# 5. Usuários Online

Implementar sistema de presença online.

## Requisitos

- Detectar conexões ativas
- Mostrar status online/offline
- Atualizar em tempo real
- Permitir múltiplas abas/dispositivos

---

# 6. Indicador de Digitação

## Evento

```json
{
  "event": "typing",
  "data": {
    "conversationId": "123"
  }
}
```

## Requisitos

- Emitir evento ao começar digitação
- Parar automaticamente após timeout
- Mostrar indicador para outros usuários

---

# 7. Persistência de Mensagens

Todas as mensagens devem ser armazenadas no banco.

## Tabela messages

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 8. Conversas

## Tabela conversations

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 9. Participantes

## Tabela conversation_participants

```sql
CREATE TABLE conversation_participants (
    conversation_id UUID,
    user_id UUID
);
```

---

# Estrutura Recomendada

```txt
/src
 ├── chat
 │    ├── gateway
 │    ├── events
 │    ├── services
 │    ├── repositories
 │    ├── websocket
 │    └── utils
 │
 ├── auth
 ├── users
 ├── database
 └── main
```

---

# Redis

Redis deverá ser utilizado para:

- gerenciamento de sessões,
- presença online,
- pub/sub,
- escalabilidade horizontal,
- cache de conexões.

---

# Escalabilidade

O sistema deverá suportar múltiplas instâncias do servidor.

## Requisitos

- Redis Pub/Sub
- Compartilhamento de eventos
- Broadcast distribuído
- Sincronização de presença

---

# Segurança

## Obrigatório

- Autenticação JWT
- Validação de payloads
- Sanitização de mensagens
- Rate limiting
- Controle de acesso às conversas

---

# Fluxo Esperado

```txt
Usuário faz login
        ↓
Recebe JWT
        ↓
Conecta via WebSocket
        ↓
Servidor valida token
        ↓
Usuário entra online
        ↓
Envia mensagem
        ↓
Mensagem é salva
        ↓
Evento distribuído em tempo real
        ↓
Outros usuários recebem instantaneamente
```

---

# Eventos Esperados

## Cliente → Servidor

```txt
connect
send_message
typing
stop_typing
join_conversation
leave_conversation
```

---

## Servidor → Cliente

```txt
connected
new_message
user_online
user_offline
user_typing
message_delivered
message_read
```

---

# Melhorias Futuras

## Opcional

Implementar futuramente:

- Mensagens lidas
- Reações
- Upload de arquivos
- Chamadas de áudio
- Chamadas de vídeo
- Criptografia ponta a ponta
- Notificações push
- Mensagens temporárias
- Moderação automática

---

# Padrões Esperados

- Código modular
- Eventos organizados
- Separação de responsabilidades
- Arquitetura escalável
- Tratamento robusto de erros
- Reconexão automática
- Logs estruturados

---

# Objetivo Final

O sistema deverá permitir:

- comunicação instantânea,
- escalabilidade para múltiplos usuários,
- persistência segura de mensagens,
- autenticação integrada,
- baixa latência,
- arquitetura pronta para produção.

