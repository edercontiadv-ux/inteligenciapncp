# README — Implementação de Autenticação JWT

## Objetivo

Implementar um sistema completo de autenticação baseado em:

- Cadastro de usuários
- Login com e-mail e senha
- JWT Authentication
- Middleware de proteção de rotas
- Hash seguro de senhas
- Controle de sessão stateless

A autenticação deverá ser integrada ao projeto já existente sem alterar a arquitetura principal da aplicação.

---

# Requisitos Técnicos

## Stack Esperada

- Backend REST API
- JWT para autenticação
- bcrypt para hash de senha
- PostgreSQL como banco principal
- Redis opcional para rate limiting/sessões
- Middleware de autenticação
- Arquitetura modular

---

# Funcionalidades Obrigatórias

## 1. Cadastro de Usuário

### Endpoint

```http
POST /auth/register
```

### Payload

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "123456"
}
```

### Regras

- E-mail deve ser único
- Senha deve ser armazenada com hash bcrypt
- Nunca armazenar senha em texto puro
- Validar campos obrigatórios
- Retornar erro adequado em caso de duplicidade

---

# 2. Login

### Endpoint

```http
POST /auth/login
```

### Payload

```json
{
  "email": "joao@email.com",
  "password": "123456"
}
```

### Fluxo

- Buscar usuário pelo e-mail
- Comparar senha usando bcrypt
- Gerar JWT válido
- Retornar token para o frontend

---

# 3. JWT

## Estrutura Esperada

```json
{
  "sub": "user_id",
  "email": "joao@email.com",
  "role": "user",
  "exp": 9999999999
}
```

---

# 4. Middleware de Autenticação

Criar middleware responsável por:

- Ler header Authorization
- Validar JWT
- Verificar expiração
- Extrair dados do usuário
- Bloquear acessos inválidos

### Header esperado

```http
Authorization: Bearer TOKEN
```

---

# 5. Rotas Protegidas

Exemplo:

```http
GET /profile
GET /dashboard
POST /projects
```

Essas rotas devem exigir autenticação válida.

---

# Estrutura Recomendada

```txt
/src
 ├── auth
 │    ├── controller
 │    ├── service
 │    ├── middleware
 │    ├── repository
 │    ├── dto
 │    └── utils
 │
 ├── users
 ├── database
 ├── config
 └── main
```

---

# Banco de Dados

## Tabela users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

# Segurança Obrigatória

## Utilizar

- bcrypt
- JWT com expiração
- Variáveis de ambiente
- Validação de entrada
- Sanitização básica

---

## Não utilizar

- MD5
- SHA1 para senha
- Senha sem hash
- JWT sem expiração

---

# Variáveis de Ambiente

```env
JWT_SECRET=super_secret_key
JWT_EXPIRES_IN=15m

DATABASE_URL=postgresql://user:password@localhost:5432/app
```

---

# Fluxo Completo Esperado

```txt
Cadastro
 ↓
Senha criptografada
 ↓
Login
 ↓
JWT gerado
 ↓
Frontend armazena token
 ↓
Requests autenticadas
 ↓
Middleware valida token
 ↓
Acesso liberado
```

---

# Melhorias Desejáveis

## Opcional

Implementar futuramente:

- Refresh Token
- Recuperação de senha
- Verificação de e-mail
- OAuth Google
- Controle de permissões (RBAC)
- Rate limiting com Redis
- Logs de autenticação
- Auditoria de login

---

# Padrões Esperados

- Código limpo
- Separação de responsabilidades
- Arquitetura escalável
- Tratamento adequado de erros
- Responses padronizadas
- Fácil manutenção

---

# Respostas Esperadas

## Sucesso

```json
{
  "success": true,
  "token": "JWT_TOKEN"
}
```

---

## Erro

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

# Objetivo Final

O sistema deverá permitir:

- cadastro seguro de usuários,
- autenticação via JWT,
- proteção de rotas privadas,
- integração simples com frontend,
- escalabilidade futura para microsserviços e API Gateway.

